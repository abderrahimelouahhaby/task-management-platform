import type { Role } from "@/lib/permissions";

export type WorkspaceType = "PERSONAL" | "TEAM";

/** What the UI needs to know about a workspace the user belongs to. */
export type WorkspaceSummary = {
  id: string;
  name: string;
  type: WorkspaceType;
  role: Role;
};
