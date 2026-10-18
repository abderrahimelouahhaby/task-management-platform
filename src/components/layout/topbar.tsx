import type { WorkspaceSummary } from "@/features/workspaces/types";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

type TopbarProps = {
  user: { name: string; email: string };
  workspaces: WorkspaceSummary[];
  currentWorkspaceId: string;
};

export function Topbar({ user, workspaces, currentWorkspaceId }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
      <MobileNav workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
      <div className="flex-1" />
      <ThemeToggle />
      <UserMenu user={user} />
    </header>
  );
}
