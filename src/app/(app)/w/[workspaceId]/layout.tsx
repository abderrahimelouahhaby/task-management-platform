import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { QueryProvider } from "@/components/layout/query-provider";
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
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>

      <div className="flex min-h-screen">
        <DesktopSidebar workspaces={workspaces} currentWorkspaceId={workspaceId} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            user={{ name: user.name, email: user.email }}
            workspaces={workspaces}
            currentWorkspaceId={workspaceId}
          />
          <main id="main-content" tabIndex={-1} className="flex-1 p-4 outline-none md:p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
