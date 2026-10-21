"use client";

import Link from "next/link";
import { AlarmClock, CalendarClock, CircleCheck, ListTodo, ListChecks } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "../hooks";
import { PriorityChart, StatusChart } from "./breakdown-charts";
import { StatCard } from "./stat-card";
import { UpcomingDeadlines } from "./upcoming-deadlines";

export function DashboardView({ workspaceId }: { workspaceId: string }) {
  const { data, isPending, isError, error, refetch } = useDashboardStats(workspaceId);
  const tasksHref = `/w/${workspaceId}/tasks`;

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-4">
          {error.message}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (data.totalTasks === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No tasks yet"
        description="Your dashboard fills up as you add tasks."
        action={
          <Button asChild>
            <Link href={tasksHref}>Go to tasks</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Open"
          value={data.open}
          href={`${tasksHref}?status=open`}
          icon={ListTodo}
        />
        <StatCard
          label="Due today"
          value={data.dueToday}
          href={`${tasksHref}?due=today`}
          icon={CalendarClock}
        />
        <StatCard
          label="Overdue"
          value={data.overdue}
          href={`${tasksHref}?due=overdue`}
          icon={AlarmClock}
          tone="danger"
        />
        <StatCard
          label="Done this week"
          value={data.doneThisWeek}
          href={`${tasksHref}?status=DONE`}
          icon={CircleCheck}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusChart stats={data} />
        <PriorityChart stats={data} />
      </div>

      <UpcomingDeadlines workspaceId={workspaceId} tasks={data.upcoming} />
    </div>
  );
}
