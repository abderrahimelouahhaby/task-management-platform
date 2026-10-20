import { taskListQuerySchema } from "@/features/tasks/filters";
import { createTaskSchema } from "@/features/tasks/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { createTask, listTasks } from "@/server/services/tasks.service";

type Params = { workspaceId: string };

export const GET = withAuth<Params>(async (request, { user, params }) => {
  const url = new URL(request.url);
  const query = taskListQuerySchema.parse(Object.fromEntries(url.searchParams));
  const page = await listTasks(user.id, params.workspaceId, query);

  return ok(page);
});

export const POST = withAuth<Params>(async (request, { user, params }) => {
  const input = createTaskSchema.parse(await readJson(request));
  const task = await createTask(user.id, params.workspaceId, input);

  return ok(task, 201);
});
