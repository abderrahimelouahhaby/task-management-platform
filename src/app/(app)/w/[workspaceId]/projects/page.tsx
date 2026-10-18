import type { Metadata } from "next";
import { ProjectsView } from "@/features/projects/components/projects-view";
import { getWorkspaceContext } from "@/server/workspace-context";

export const metadata: Metadata = { title: "Projects" };

type ProjectsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspaceId } = await params;
  const { role } = await getWorkspaceContext(workspaceId);

  return <ProjectsView workspaceId={workspaceId} role={role} />;
}
