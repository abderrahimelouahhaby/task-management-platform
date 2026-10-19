export const queryKeys = {
  members: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  projects: (workspaceId: string) => ["workspaces", workspaceId, "projects"] as const,
  labels: (workspaceId: string) => ["workspaces", workspaceId, "labels"] as const,
  tasks: (workspaceId: string) => ["workspaces", workspaceId, "tasks"] as const,
};
