import { updateMemberRoleSchema } from "@/features/members/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { removeMember, updateMemberRole } from "@/server/services/members.service";

type Params = { workspaceId: string; membershipId: string };

export const PATCH = withAuth<Params>(async (request, { user, params }) => {
  const input = updateMemberRoleSchema.parse(await readJson(request));
  const member = await updateMemberRole(user.id, params.workspaceId, params.membershipId, input);

  return ok(member);
});

export const DELETE = withAuth<Params>(async (_request, { user, params }) => {
  const result = await removeMember(user.id, params.workspaceId, params.membershipId);

  return ok(result);
});
