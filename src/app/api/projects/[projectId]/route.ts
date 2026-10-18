import { updateProjectSchema } from "@/features/projects/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { deleteProject, updateProject } from "@/server/services/projects.service";

type Params = { projectId: string };

export const PATCH = withAuth<Params>(async (request, { user, params }) => {
  const input = updateProjectSchema.parse(await readJson(request));
  const project = await updateProject(user.id, params.projectId, input);

  return ok(project);
});

export const DELETE = withAuth<Params>(async (_request, { user, params }) => {
  const result = await deleteProject(user.id, params.projectId);

  return ok(result);
});
