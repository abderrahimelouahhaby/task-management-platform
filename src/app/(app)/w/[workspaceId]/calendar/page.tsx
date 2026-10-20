import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarView } from "@/features/tasks/components/calendar-view";
import { getWorkspaceContext } from "@/server/workspace-context";

export const metadata: Metadata = { title: "Calendar" };

type CalendarPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { workspaceId } = await params;
  const { user, role } = await getWorkspaceContext(workspaceId);

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <CalendarView workspaceId={workspaceId} role={role} currentUserId={user.id} />
    </Suspense>
  );
}
