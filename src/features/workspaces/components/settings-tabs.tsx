"use client";

import { Tag } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembersSettings } from "@/features/members/components/members-settings";
import type { Role } from "@/lib/permissions";
import type { WorkspaceType } from "../types";
import { GeneralSettings } from "./general-settings";

type SettingsTabsProps = {
  workspace: { id: string; name: string; type: WorkspaceType };
  role: Role;
  currentUserId: string;
};

export function SettingsTabs({ workspace, role, currentUserId }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="labels">Labels</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-6">
        <GeneralSettings workspace={workspace} role={role} />
      </TabsContent>

      <TabsContent value="members" className="mt-6">
        <MembersSettings
          workspaceId={workspace.id}
          workspaceType={workspace.type}
          role={role}
          currentUserId={currentUserId}
        />
      </TabsContent>

      <TabsContent value="labels" className="mt-6">
        <EmptyState
          icon={Tag}
          title="Labels are coming soon"
          description="You will be able to create colored labels for your tasks on Day 4."
        />
      </TabsContent>
    </Tabs>
  );
}
