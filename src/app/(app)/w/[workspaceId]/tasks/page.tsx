import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { TasksView } from "@/features/tasks/components/tasks-view";
import { getWorkspaceContext } from "@/server/workspace-context";

export const metadata: Metadata = { title: "Tasks" };

type TasksPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const { workspaceId } = await params;
  const { user, role } = await getWorkspaceContext(workspaceId);

  return (
    // useSearchParams (used for the filters) should be inside a Suspense boundary
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TasksView workspaceId={workspaceId} role={role} currentUserId={user.id} />
    </Suspense>
  );
}
