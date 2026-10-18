import { redirect } from "next/navigation";
import { ensurePersonalWorkspace } from "@/server/services/workspaces.service";
import { requireSession } from "@/server/session";

/** /dashboard sends you to the dashboard of your personal workspace. */
export default async function DashboardRedirectPage() {
  const session = await requireSession();
  const workspace = await ensurePersonalWorkspace(session.user.id);

  redirect(`/w/${workspace.id}/dashboard`);
}
