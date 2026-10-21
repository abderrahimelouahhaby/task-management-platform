import type { DashboardQuery } from "@/features/dashboard/schemas";
import type { DashboardStats } from "@/features/dashboard/types";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/features/tasks/constants";
import { addDaysToCalendarDay } from "@/lib/dates";
import { db } from "@/server/db";
import { assertCan, requireMembership } from "@/server/policies/access";
import { dayStart, taskInclude, toDto } from "./tasks.service";

const UPCOMING_LIMIT = 5;

export async function getDashboardStats(
  actorId: string,
  workspaceId: string,
  query: DashboardQuery,
): Promise<DashboardStats> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "workspace:view");

  // Every question is limited to THIS workspace
  const inWorkspace = { project: { workspaceId } };
  const notDone = { status: { not: "DONE" } } as const;

  const today = dayStart(query.today);
  const tomorrow = dayStart(addDaysToCalendarDay(query.today, 1));
  const weekStart = new Date(query.weekStart);

  // The database does the counting. We receive a few numbers, not thousands of tasks.
  const [open, dueToday, overdue, doneThisWeek, statusGroups, priorityGroups, upcoming] =
    await Promise.all([
      db.task.count({ where: { ...inWorkspace, ...notDone } }),
      db.task.count({
        where: { ...inWorkspace, ...notDone, dueDate: { gte: today, lt: tomorrow } },
      }),
      db.task.count({ where: { ...inWorkspace, ...notDone, dueDate: { lt: today } } }),
      db.task.count({
        where: { ...inWorkspace, status: "DONE", completedAt: { gte: weekStart } },
      }),
      db.task.groupBy({ by: ["status"], where: inWorkspace, _count: { _all: true } }),
      db.task.groupBy({
        by: ["priority"],
        where: { ...inWorkspace, ...notDone },
        _count: { _all: true },
      }),
      db.task.findMany({
        where: { ...inWorkspace, ...notDone, dueDate: { gte: today } },
        include: taskInclude,
        orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { id: "asc" }],
        take: UPCOMING_LIMIT,
      }),
    ]);

  // Make sure every status and priority is present, even with a count of 0
  const statusCounts = new Map(statusGroups.map((group) => [group.status, group._count._all]));
  const priorityCounts = new Map(
    priorityGroups.map((group) => [group.priority, group._count._all]),
  );

  const byStatus = TASK_STATUSES.map((status) => ({
    status,
    count: statusCounts.get(status) ?? 0,
  }));

  const byPriority = TASK_PRIORITIES.map((priority) => ({
    priority,
    count: priorityCounts.get(priority) ?? 0,
  }));

  return {
    open,
    dueToday,
    overdue,
    doneThisWeek,
    totalTasks: byStatus.reduce((sum, entry) => sum + entry.count, 0),
    byStatus,
    byPriority,
    upcoming: upcoming.map(toDto),
  };
}
