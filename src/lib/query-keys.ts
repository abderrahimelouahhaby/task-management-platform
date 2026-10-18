/** One place for all TanStack Query cache keys, so they never get mistyped. */
export const queryKeys = {
  members: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  projects: (workspaceId: string) => ["workspaces", workspaceId, "projects"] as const,
};
