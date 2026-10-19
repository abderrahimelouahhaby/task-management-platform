import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "./constants";

const dueDateSchema = z
  .string()
  .refine(
    (value) =>
      value === "" ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value),
    "Enter a valid date",
  );

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  projectId: z.string().min(1, "Choose a project"),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: dueDateSchema.nullable().optional(),
  labelIds: z.array(z.string().min(1)).max(10, "A task can have at most 10 labels").optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
