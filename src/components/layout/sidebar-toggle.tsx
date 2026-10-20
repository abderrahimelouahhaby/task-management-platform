"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";

export function SidebarToggle() {
  // Pick only what this component needs, so it re-renders only when that value changes
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden md:inline-flex"
      onClick={toggleSidebar}
      aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
      aria-pressed={collapsed}
    >
      {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
    </Button>
  );
}
