"use client";

import type { WorkspaceSummary } from "@/features/workspaces/types";
import { useUiStore } from "@/stores/ui-store";
import { Sidebar } from "./sidebar";

type DesktopSidebarProps = {
  workspaces: WorkspaceSummary[];
  currentWorkspaceId: string;
};

export function DesktopSidebar({ workspaces, currentWorkspaceId }: DesktopSidebarProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  if (collapsed) {
    return null;
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r md:block">
      <Sidebar workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
    </aside>
  );
}
