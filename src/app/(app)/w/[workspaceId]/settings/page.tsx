import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsTabs } from "@/features/workspaces/components/settings-tabs";
import { getWorkspaceContext } from "@/server/workspace-context";

export const metadata: Metadata = { title: "Settings" };

type SettingsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = await params;
  const { user, workspace, role } = await getWorkspaceContext(workspaceId);

  return (
    <>
      <PageHeader title="Settings" description="Manage your workspace, members, and labels." />
      <SettingsTabs
        workspace={{ id: workspace.id, name: workspace.name, type: workspace.type }}
        role={role}
        currentUserId={user.id}
      />
    </>
  );
}
