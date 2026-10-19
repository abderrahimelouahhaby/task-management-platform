import { z } from "zod";

export const createLabelSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(30, "Name must be at most 30 characters"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color"),
});

export const updateLabelSchema = createLabelSchema.partial();

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
