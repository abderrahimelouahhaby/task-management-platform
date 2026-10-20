/** One place for all TanStack Query cache keys, so they never get mistyped. */
export const queryKeys = {
  members: (workspaceId: string) => ["workspaces", workspaceId, "members"] as const,
  projects: (workspaceId: string) => ["workspaces", workspaceId, "projects"] as const,
  labels: (workspaceId: string) => ["workspaces", workspaceId, "labels"] as const,
  // Every task query starts with this key, so one invalidation reloads lists and calendars together
  tasks: (workspaceId: string) => ["workspaces", workspaceId, "tasks"] as const,
  taskList: (workspaceId: string, queryString: string) =>
    ["workspaces", workspaceId, "tasks", "list", queryString] as const,
  taskCalendar: (workspaceId: string, from: string, to: string) =>
    ["workspaces", workspaceId, "tasks", "calendar", from, to] as const,
};
