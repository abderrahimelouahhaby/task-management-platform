import { renameWorkspaceSchema } from "@/features/workspaces/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { deleteWorkspace, renameWorkspace } from "@/server/services/workspaces.service";

type Params = { workspaceId: string };

export const PATCH = withAuth<Params>(async (request, { user, params }) => {
  const input = renameWorkspaceSchema.parse(await readJson(request));
  const workspace = await renameWorkspace(user.id, params.workspaceId, input);

  return ok(workspace);
});

export const DELETE = withAuth<Params>(async (_request, { user, params }) => {
  const result = await deleteWorkspace(user.id, params.workspaceId);

  return ok(result);
});
