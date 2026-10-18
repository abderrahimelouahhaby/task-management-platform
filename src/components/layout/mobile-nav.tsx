"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import type { WorkspaceSummary } from "@/features/workspaces/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";

type MobileNavProps = {
  workspaces: WorkspaceSummary[];
  currentWorkspaceId: string;
};

export function MobileNav({ workspaces, currentWorkspaceId }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <Sidebar
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
