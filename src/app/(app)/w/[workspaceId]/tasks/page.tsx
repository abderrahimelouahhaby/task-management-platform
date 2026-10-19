import type { Metadata } from "next";
import { TasksView } from "@/features/tasks/components/tasks-view";
import { getWorkspaceContext } from "@/server/workspace-context";

export const metadata: Metadata = { title: "Tasks" };

type TasksPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const { workspaceId } = await params;
  const { user, role } = await getWorkspaceContext(workspaceId);

  return <TasksView workspaceId={workspaceId} role={role} currentUserId={user.id} />;
}
