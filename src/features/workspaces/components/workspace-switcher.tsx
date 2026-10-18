"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WorkspaceSummary } from "../types";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceSummary[];
  currentWorkspaceId: string;
  onNavigate?: () => void;
};

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
  onNavigate,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);

  const current = workspaces.find((workspace) => workspace.id === currentWorkspaceId);

  function switchTo(workspaceId: string) {
    // Stay on the same page (for example Projects) but in the other workspace
    const nextPath = pathname.replace(/^\/w\/[^/]+/, `/w/${workspaceId}`);

    onNavigate?.();
    router.push(nextPath);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            aria-label="Switch workspace"
          >
            <span className="truncate">{current?.name ?? "Select workspace"}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem key={workspace.id} onClick={() => switchTo(workspace.id)}>
              {workspace.type === "PERSONAL" ? (
                <User className="size-4" />
              ) : (
                <Users className="size-4" />
              )}
              <span className="truncate">{workspace.name}</span>
              {workspace.id === currentWorkspaceId ? <Check className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New team workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
