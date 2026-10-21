import Link from "next/link";
import { DueDate } from "@/components/shared/due-date";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TaskDto } from "@/features/tasks/types";

type UpcomingDeadlinesProps = {
  workspaceId: string;
  tasks: TaskDto[];
};

export function UpcomingDeadlines({ workspaceId, tasks }: UpcomingDeadlinesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming deadlines</CardTitle>
        <CardDescription>The next tasks that are due</CardDescription>
        <CardAction>
          <Link
            href={`/w/${workspaceId}/tasks`}
            className="rounded-sm text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            View all tasks
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming deadlines. Tasks with a due date appear here.
          </p>
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => (
              <li key={task.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                <span className="min-w-0 flex-1 basis-48 truncate text-sm font-medium">
                  {task.title}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: task.projectColor ?? "#6366f1" }}
                    aria-hidden="true"
                  />
                  {task.projectName}
                </span>

                {task.dueDate ? <DueDate dueDate={task.dueDate} /> : null}
                <PriorityBadge priority={task.priority} />

                {task.assignee ? (
                  <span title={task.assignee.name}>
                    <UserAvatar name={task.assignee.name} className="size-6" />
                    <span className="sr-only">Assigned to {task.assignee.name}</span>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
