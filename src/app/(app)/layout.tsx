import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { requireSession } from "@/server/session";
import { ensurePersonalWorkspace } from "@/server/services/workspaces.service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  await ensurePersonalWorkspace(session.user.id);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <Sidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={{ name: session.user.name, email: session.user.email }} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
