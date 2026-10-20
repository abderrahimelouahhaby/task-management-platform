import type { TaskPriority, TaskStatus } from "@/features/tasks/constants";
import type { TaskListQuery } from "@/features/tasks/filters";
import type { CreateTaskInput, UpdateTaskInput } from "@/features/tasks/schemas";
import type { TaskDto, TaskPage } from "@/features/tasks/types";
import type { Prisma } from "@/generated/prisma/client";
import { addDaysToCalendarDay } from "@/lib/dates";
import { db } from "@/server/db";
import { notFound, validationError } from "@/server/errors";
import { assertCan, requireMembership } from "@/server/policies/access";
import type { CalendarRange } from "@/features/tasks/calendar";

// ---------------------------------------------------------------
// Shape of the data we read and send
// ---------------------------------------------------------------

const taskInclude = {
  project: { select: { id: true, name: true, color: true } },
  assignee: { select: { id: true, name: true } },
  labels: { select: { id: true, name: true, color: true }, orderBy: { name: "asc" } },
} as const;

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  createdById: string;
  project: { id: string; name: string; color: string | null };
  assignee: { id: string; name: string } | null;
  labels: { id: string; name: string; color: string }[];
};

function toDto(task: TaskRow): TaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    projectId: task.project.id,
    projectName: task.project.name,
    projectColor: task.project.color,
    createdById: task.createdById,
    assignee: task.assignee,
    labels: task.labels,
  };
}

// ---------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------

/** "2026-10-23" becomes midnight UTC. "" or null clears the date. undefined means "do not change". */
function toDueDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

/** Moving a task to DONE stamps completedAt. Moving it away from DONE clears it. */
function statusChanges(current: TaskStatus, next: TaskStatus | undefined) {
  if (next === undefined) {
    return {};
  }

  if (next === "DONE") {
    return current === "DONE" ? {} : { status: next, completedAt: new Date() };
  }

  return { status: next, completedAt: null };
}

/** The project must exist in THIS workspace and must not be archived. */
async function requireActiveProject(projectId: string, workspaceId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, workspaceId },
    select: { id: true, archivedAt: true },
  });

  if (!project) {
    throw validationError("That project does not exist in this workspace.");
  }

  if (project.archivedAt) {
    throw validationError("This project is archived. Restore it to add tasks.");
  }
}

/** Every label must belong to THIS workspace (blocks ids from other workspaces). */
async function requireLabelsInWorkspace(labelIds: string[], workspaceId: string) {
  const uniqueIds = [...new Set(labelIds)];

  if (uniqueIds.length === 0) {
    return uniqueIds;
  }

  const count = await db.label.count({ where: { id: { in: uniqueIds }, workspaceId } });

  if (count !== uniqueIds.length) {
    throw validationError("One or more labels do not exist in this workspace.");
  }

  return uniqueIds;
}

// the assignee must be a member of THIS workspace
async function requireAssigneeInWorkspace(assigneeId: string, workspaceId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: assigneeId, workspaceId } },
    select: { id: true },
  });

  if (!membership) {
    throw validationError("That person is not a member of this workspace.");
  }
}

/** Loads a task, then checks that the user belongs to its workspace. Non-members get a 404. */
async function loadTaskForActor(actorId: string, taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      status: true,
      createdById: true,
      assigneeId: true,
      project: { select: { id: true, workspaceId: true } },
    },
  });

  if (!task) {
    throw notFound();
  }

  const actor = await requireMembership(actorId, task.project.workspaceId);

  return { task, actor, workspaceId: task.project.workspaceId };
}

// ---------------------------------------------------------------
// The service functions
// ---------------------------------------------------------------

/** "2026-06-15" becomes midnight UTC of that day. */
function dayStart(day: string) {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Builds the database filter from the query. Every task must belong to THIS workspace. */
function buildWhere(
  actorId: string,
  workspaceId: string,
  query: TaskListQuery,
): Prisma.TaskWhereInput {
  const and: Prisma.TaskWhereInput[] = [];

  if (query.q) {
    // Case-insensitive search in the title and the description (the text is sent as a parameter)
    and.push({
      OR: [
        { title: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ],
    });
  }

  if (query.status === "open") {
    and.push({ status: { not: "DONE" } });
  } else if (query.status) {
    and.push({ status: query.status });
  }

  if (query.priority) {
    and.push({ priority: query.priority });
  }

  if (query.project) {
    and.push({ projectId: query.project });
  }

  if (query.label) {
    and.push({ labels: { some: { id: query.label } } });
  }

  if (query.assignee === "me") {
    and.push({ assigneeId: actorId });
  } else if (query.assignee === "unassigned") {
    and.push({ assigneeId: null });
  } else if (query.assignee) {
    and.push({ assigneeId: query.assignee });
  }

  if (query.due === "none") {
    and.push({ dueDate: null });
  } else if (query.due) {
    const today = query.today;

    if (!today) {
      throw validationError("today is required for this due filter.");
    }

    const start = dayStart(today);

    if (query.due === "overdue") {
      // Before today, and not finished
      and.push({ dueDate: { lt: start }, status: { not: "DONE" } });
    } else if (query.due === "today") {
      and.push({ dueDate: { gte: start, lt: dayStart(addDaysToCalendarDay(today, 1)) } });
    } else {
      // "week": today and the next 6 days
      and.push({ dueDate: { gte: start, lt: dayStart(addDaysToCalendarDay(today, 7)) } });
    }
  }

  // project: { workspaceId } is ALWAYS part of the filter, so ids from other workspaces match nothing
  return { project: { workspaceId }, AND: and };
}

/** Every sort ends with the id, so the order is stable and pages never repeat or skip tasks. */
function buildOrderBy(sort: TaskListQuery["sort"]): Prisma.TaskOrderByWithRelationInput[] {
  switch (sort) {
    case "created":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "priority":
      return [
        { priority: "desc" },
        { dueDate: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "asc" },
      ];
    case "title":
      return [{ title: "asc" }, { id: "asc" }];
    default:
      return [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }, { id: "asc" }];
  }
}

export async function listTasks(
  actorId: string,
  workspaceId: string,
  query: TaskListQuery,
): Promise<TaskPage> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "workspace:view");

  const where = buildWhere(actorId, workspaceId, query);

  // One transaction: the count and the page come from the same moment
  const [total, tasks] = await db.$transaction([
    db.task.count({ where }),
    db.task.findMany({
      where,
      include: taskInclude,
      orderBy: buildOrderBy(query.sort),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    items: tasks.map(toDto),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function createTask(
  actorId: string,
  workspaceId: string,
  input: CreateTaskInput,
): Promise<TaskDto> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "task:create");

  await requireActiveProject(input.projectId, workspaceId);
  const labelIds = await requireLabelsInWorkspace(input.labelIds ?? [], workspaceId);

  if (input.assigneeId) {
    await requireAssigneeInWorkspace(input.assigneeId, workspaceId);
  }

  const status = input.status ?? "TODO";

  const task = await db.task.create({
    data: {
      title: input.title,
      description: input.description || null,
      status,
      priority: input.priority ?? "MEDIUM",
      dueDate: toDueDate(input.dueDate) ?? null,
      completedAt: status === "DONE" ? new Date() : null,
      projectId: input.projectId,
      createdById: actorId,
      assigneeId: input.assigneeId ?? null,
      labels: { connect: labelIds.map((id) => ({ id })) },
    },
    include: taskInclude,
  });

  return toDto(task);
}

export async function updateTask(
  actorId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<TaskDto> {
  const { task, actor, workspaceId } = await loadTaskForActor(actorId, taskId);

  // The Member rule lives in permissions.ts: members only edit tasks they created or are assigned to
  assertCan(actor.role, "task:update", {
    userId: actorId,
    createdById: task.createdById,
    assigneeId: task.assigneeId,
  });

  if (input.projectId !== undefined && input.projectId !== task.project.id) {
    await requireActiveProject(input.projectId, workspaceId);
  }

  const labelIds =
    input.labelIds === undefined
      ? undefined
      : await requireLabelsInWorkspace(input.labelIds, workspaceId);

  //null clears the assignee (no check needed), a user id must be a member
  if (input.assigneeId) {
    await requireAssigneeInWorkspace(input.assigneeId, workspaceId);
  }

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null,
      priority: input.priority,
      dueDate: toDueDate(input.dueDate),
      projectId: input.projectId,
      assigneeId: input.assigneeId, // (undefined = unchanged, null = unassign)
      ...statusChanges(task.status, input.status),
      ...(labelIds ? { labels: { set: labelIds.map((id) => ({ id })) } } : {}),
    },
    include: taskInclude,
  });

  return toDto(updated);
}

export async function deleteTask(actorId: string, taskId: string) {
  const { task, actor } = await loadTaskForActor(actorId, taskId);

  assertCan(actor.role, "task:delete", {
    userId: actorId,
    createdById: task.createdById,
    assigneeId: task.assigneeId,
  });

  await db.task.delete({ where: { id: taskId } });

  return { id: taskId };
}
const MAX_CALENDAR_TASKS = 500;

/** Tasks whose due date falls between two days (both included). Used by the calendar. */
export async function listTasksInRange(
  actorId: string,
  workspaceId: string,
  range: CalendarRange,
): Promise<TaskDto[]> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "workspace:view");

  const tasks = await db.task.findMany({
    where: {
      project: { workspaceId },
      dueDate: {
        gte: dayStart(range.from),
        lt: dayStart(addDaysToCalendarDay(range.to, 1)),
      },
    },
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }, { id: "asc" }],
    take: MAX_CALENDAR_TASKS,
  });

  return tasks.map(toDto);
}
