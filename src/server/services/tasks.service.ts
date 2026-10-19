import type { TaskPriority, TaskStatus } from "@/features/tasks/constants";
import type { CreateTaskInput, UpdateTaskInput } from "@/features/tasks/schemas";
import type { TaskDto } from "@/features/tasks/types";
import { db } from "@/server/db";
import { notFound, validationError } from "@/server/errors";
import { assertCan, requireMembership } from "@/server/policies/access";

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

const MAX_TASKS_PER_LIST = 200;

export async function listTasks(actorId: string, workspaceId: string): Promise<TaskDto[]> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "workspace:view");

  const tasks = await db.task.findMany({
    where: { project: { workspaceId } },
    include: taskInclude,
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: MAX_TASKS_PER_LIST,
  });

  return tasks.map(toDto);
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

  const updated = await db.task.update({
    where: { id: taskId },
    data: {
      title: input.title,
      description: input.description === undefined ? undefined : input.description || null,
      priority: input.priority,
      dueDate: toDueDate(input.dueDate),
      projectId: input.projectId,
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
