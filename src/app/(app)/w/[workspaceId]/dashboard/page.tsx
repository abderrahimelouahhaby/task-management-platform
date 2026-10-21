import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getWorkspaceContext } from "@/server/workspace-context";

export const metadata: Metadata = { title: "Dashboard" };

type DashboardPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceId } = await params;
  const { user, workspace } = await getWorkspaceContext(workspaceId);
  const firstName = user.name.trim().split(/\s+/)[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`Overview of ${workspace.name}.`}
      />
      <DashboardView workspaceId={workspaceId} />
    </>
  );
}
