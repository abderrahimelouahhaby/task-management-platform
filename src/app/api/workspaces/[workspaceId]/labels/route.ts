import { createLabelSchema } from "@/features/labels/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { createLabel, listLabels } from "@/server/services/labels.service";

type Params = { workspaceId: string };

export const GET = withAuth<Params>(async (_request, { user, params }) => {
  const labels = await listLabels(user.id, params.workspaceId);

  return ok(labels);
});

export const POST = withAuth<Params>(async (request, { user, params }) => {
  const input = createLabelSchema.parse(await readJson(request));
  const label = await createLabel(user.id, params.workspaceId, input);

  return ok(label, 201);
});
