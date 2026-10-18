import { createWorkspaceSchema } from "@/features/workspaces/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { createTeamWorkspace, listWorkspacesForUser } from "@/server/services/workspaces.service";

export const GET = withAuth(async (_request, { user }) => {
  const workspaces = await listWorkspacesForUser(user.id);

  return ok(workspaces);
});

export const POST = withAuth(async (request, { user }) => {
  const input = createWorkspaceSchema.parse(await readJson(request));
  const workspace = await createTeamWorkspace(user.id, input);

  return ok(workspace, 201);
});
