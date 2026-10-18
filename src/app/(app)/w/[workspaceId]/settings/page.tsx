import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { GeneralSettings } from "@/features/workspaces/components/general-settings";
import { getWorkspaceContext } from "@/server/workspace-context";

export const metadata: Metadata = { title: "Settings" };

type SettingsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = await params;
  const { workspace, role } = await getWorkspaceContext(workspaceId);

  return (
    <>
      <PageHeader title="Settings" description="Manage your workspace, members, and labels." />
      <GeneralSettings
        workspace={{ id: workspace.id, name: workspace.name, type: workspace.type }}
        role={role}
      />
    </>
  );
}
