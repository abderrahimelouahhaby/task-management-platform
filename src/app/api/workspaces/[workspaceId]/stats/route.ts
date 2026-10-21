import { dashboardQuerySchema } from "@/features/dashboard/schemas";
import { ok, withAuth } from "@/server/http";
import { getDashboardStats } from "@/server/services/stats.service";

type Params = { workspaceId: string };

export const GET = withAuth<Params>(async (request, { user, params }) => {
  const url = new URL(request.url);
  const query = dashboardQuerySchema.parse(Object.fromEntries(url.searchParams));
  const stats = await getDashboardStats(user.id, params.workspaceId, query);

  return ok(stats);
});
