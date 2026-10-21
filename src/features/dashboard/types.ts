import type { TaskPriority, TaskStatus } from "@/features/tasks/constants";
import type { TaskDto } from "@/features/tasks/types";

export type DashboardStats = {
  /** Tasks that are not done */
  open: number;
  /** Open tasks due today */
  dueToday: number;
  /** Open tasks due before today */
  overdue: number;
  /** Tasks finished since the start of the user's week */
  doneThisWeek: number;
  totalTasks: number;
  /** All tasks, one entry per status (zero when there are none) */
  byStatus: { status: TaskStatus; count: number }[];
  /** Open tasks only, one entry per priority (zero when there are none) */
  byPriority: { priority: TaskPriority; count: number }[];
  /** The next open tasks with a due date from today on */
  upcoming: TaskDto[];
};
