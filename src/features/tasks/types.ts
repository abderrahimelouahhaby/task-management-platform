import type { TaskPriority, TaskStatus } from "./constants";

export type TaskDto = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** ISO text at midnight UTC, or null */
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  projectId: string;
  projectName: string;
  projectColor: string | null;
  createdById: string;
  assignee: { id: string; name: string } | null;
  labels: { id: string; name: string; color: string }[];
};
