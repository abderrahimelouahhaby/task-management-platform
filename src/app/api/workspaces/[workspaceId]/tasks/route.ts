import { createTaskSchema } from "@/features/tasks/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { createTask, listTasks } from "@/server/services/tasks.service";

type Params = { workspaceId: string };

export const GET = withAuth<Params>(async (_request, { user, params }) => {
  const tasks = await listTasks(user.id, params.workspaceId);

  return ok(tasks);
});

export const POST = withAuth<Params>(async (request, { user, params }) => {
  const input = createTaskSchema.parse(await readJson(request));
  const task = await createTask(user.id, params.workspaceId, input);

  return ok(task, 201);
});
