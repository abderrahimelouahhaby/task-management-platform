import { ensurePersonalWorkspace } from "@/server/services/workspaces.service";
import { requireSession } from "@/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  await ensurePersonalWorkspace(session.user.id);

  return <>{children}</>;
}
