import { updateLabelSchema } from "@/features/labels/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { deleteLabel, updateLabel } from "@/server/services/labels.service";

type Params = { labelId: string };

export const PATCH = withAuth<Params>(async (request, { user, params }) => {
  const input = updateLabelSchema.parse(await readJson(request));
  const label = await updateLabel(user.id, params.labelId, input);

  return ok(label);
});

export const DELETE = withAuth<Params>(async (_request, { user, params }) => {
  const result = await deleteLabel(user.id, params.labelId);

  return ok(result);
});
