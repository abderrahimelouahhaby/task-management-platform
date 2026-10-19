import { updateTaskSchema } from "@/features/tasks/schemas";
import { ok, readJson, withAuth } from "@/server/http";
import { deleteTask, updateTask } from "@/server/services/tasks.service";

type Params = { taskId: string };

export const PATCH = withAuth<Params>(async (request, { user, params }) => {
  const input = updateTaskSchema.parse(await readJson(request));
  const task = await updateTask(user.id, params.taskId, input);

  return ok(task);
});

export const DELETE = withAuth<Params>(async (_request, { user, params }) => {
  const result = await deleteTask(user.id, params.taskId);

  return ok(result);
});
