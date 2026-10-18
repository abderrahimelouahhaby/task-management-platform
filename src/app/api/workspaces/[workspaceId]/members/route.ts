import { addMemberSchema } from "@/features/members/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { addMember, listMembers } from "@/server/services/members.service";

type Params = { workspaceId: string };

export const GET = withAuth<Params>(async (_request, { user, params }) => {
  const members = await listMembers(user.id, params.workspaceId);

  return ok(members);
});

export const POST = withAuth<Params>(async (request, { user, params }) => {
  const input = addMemberSchema.parse(await readJson(request));
  const member = await addMember(user.id, params.workspaceId, input);

  return ok(member, 201);
});
