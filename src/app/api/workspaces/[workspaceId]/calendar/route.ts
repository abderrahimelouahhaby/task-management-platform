import { calendarRangeSchema } from "@/features/tasks/calendar";
import { ok, withAuth } from "@/server/http";
import { listTasksInRange } from "@/server/services/tasks.service";

type Params = { workspaceId: string };

export const GET = withAuth<Params>(async (request, { user, params }) => {
  const url = new URL(request.url);
  const range = calendarRangeSchema.parse(Object.fromEntries(url.searchParams));
  const tasks = await listTasksInRange(user.id, params.workspaceId, range);

  return ok(tasks);
});
