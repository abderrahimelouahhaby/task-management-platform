import { z } from "zod";

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color");

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be at most 60 characters"),
  description: z.string().trim().max(500, "Description must be at most 500 characters").optional(),
  color: colorSchema.optional(),
});

// Every field is optional on update. "archived" archives or restores the project.
export const updateProjectSchema = createProjectSchema
  .partial()
  .extend({ archived: z.boolean().optional() });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
