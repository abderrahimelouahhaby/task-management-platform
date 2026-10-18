import { createProjectSchema } from "@/features/projects/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { createProject, listProjects } from "@/server/services/projects.service";

type Params = { workspaceId: string };

export const GET = withAuth<Params>(async (_request, { user, params }) => {
  const projects = await listProjects(user.id, params.workspaceId);

  return ok(projects);
});

export const POST = withAuth<Params>(async (request, { user, params }) => {
  const input = createProjectSchema.parse(await readJson(request));
  const project = await createProject(user.id, params.workspaceId, input);

  return ok(project, 201);
});
