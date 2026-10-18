import { z } from "zod";

const workspaceNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be at most 50 characters");

export const createWorkspaceSchema = z.object({ name: workspaceNameSchema });
export const renameWorkspaceSchema = z.object({ name: workspaceNameSchema });

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type RenameWorkspaceInput = z.infer<typeof renameWorkspaceSchema>;
