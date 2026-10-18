import { QueryProvider } from "@/components/layout/query-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { listWorkspacesForUser } from "@/server/services/workspaces.service";
import { getWorkspaceContext } from "@/server/workspace-context";

type WorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  // The REAL permission check: not a member means the 404 page
  const { user } = await getWorkspaceContext(workspaceId);
  const workspaces = await listWorkspacesForUser(user.id);

  return (
    <QueryProvider>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r md:block">
          <Sidebar workspaces={workspaces} currentWorkspaceId={workspaceId} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            user={{ name: user.name, email: user.email }}
            workspaces={workspaces}
            currentWorkspaceId={workspaceId}
          />
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
