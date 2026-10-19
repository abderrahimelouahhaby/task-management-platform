"use client";

import { LabelsSettings } from "@/features/labels/components/labels-settings";
import { MembersSettings } from "@/features/members/components/members-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <LabelsSettings workspaceId={workspace.id} role={role} />
      </TabsContent>
    </Tabs>
  );
}
