"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { can, type Role } from "@/lib/permissions";
import { useHasMounted } from "@/lib/use-has-mounted";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "../constants";
import { useCalendarTasks } from "../hooks";
import type { TaskDto } from "../types";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList } from "./task-list";
import { ViewSwitcher } from "./view-switcher";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FORMAT = "yyyy-MM-dd";
const MAX_CHIPS = 3;

// A colored bar on the left of each chip shows the priority
const PRIORITY_BAR: Record<TaskPriority, string> = {
  LOW: "border-l-slate-400",
  MEDIUM: "border-l-sky-500",
  HIGH: "border-l-orange-500",
  URGENT: "border-l-red-500",
};

/** "2026-10" becomes 1 October 2026. Anything else becomes the current month. */
function parseMonth(value: string | null): Date {
  const match = value ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value) : null;

  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, 1);
  }

  return startOfMonth(new Date());
}

type CalendarViewProps = {
  workspaceId: string;
  role: Role;
  currentUserId: string;
};

export function CalendarView(props: CalendarViewProps) {
  const mounted = useHasMounted();

  // Wait for the browser, because "today" depends on the user's clock and time zone
  if (!mounted) {
    return (
      <>
        <PageHeader title="Calendar" description="See your deadlines by date." />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  return <CalendarContent {...props} />;
}

function CalendarContent({ workspaceId, role, currentUserId }: CalendarViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // The month comes from the URL (?month=2026-10), so it survives a refresh and works with Back
  const month = parseMonth(searchParams.get("month"));

  // The grid always starts on a Monday and ends on a Sunday
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const gridKeys = gridDays.map((day) => format(day, DAY_FORMAT));

  const {
    data: tasks,
    isPending,
    isError,
    error,
    refetch,
  } = useCalendarTasks(workspaceId, format(gridStart, DAY_FORMAT), format(gridEnd, DAY_FORMAT));

  // Group the tasks by their due day ("2026-10-23")
  const tasksByDay = new Map<string, TaskDto[]>();

  for (const task of tasks ?? []) {
    if (!task.dueDate) {
      continue;
    }

    const key = task.dueDate.slice(0, 10);
    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task]);
  }

  // The selected day: your choice, or today (when it is in this grid), or the 1st of the month
  const todayKey = format(new Date(), DAY_FORMAT);
  const defaultDay =
    gridKeys.includes(todayKey) && isSameMonth(new Date(), month)
      ? todayKey
      : format(startOfMonth(month), DAY_FORMAT);
  const activeDay = selectedDay && gridKeys.includes(selectedDay) ? selectedDay : defaultDay;
  const activeTasks = tasksByDay.get(activeDay) ?? [];

  const canCreate = can(role, "task:create");

  function goToMonth(target: Date | null) {
    const query = target ? `?month=${format(target, "yyyy-MM")}` : "";

    router.replace(`${pathname}${query}`, { scroll: false });
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        description="See your deadlines by date."
        actions={
          <>
            <ViewSwitcher workspaceId={workspaceId} current="calendar" />
            {canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New task
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous month"
          onClick={() => goToMonth(subMonths(month, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next month"
          onClick={() => goToMonth(addMonths(month, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
        <h2 className="min-w-40 text-lg font-medium" aria-live="polite">
          {format(month, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedDay(null);
            goToMonth(null);
          }}
        >
          Today
        </Button>
      </div>

      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="flex items-center justify-between gap-4">
            {error.message}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map((weekday) => (
            <div key={weekday} className="px-1 py-2 text-center md:px-2 md:text-left">
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {gridDays.map((day) => {
            const key = format(day, DAY_FORMAT);
            const dayTasks = tasksByDay.get(key) ?? [];
            const inMonth = isSameMonth(day, month);
            const selected = key === activeDay;

            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                aria-label={`${format(day, "d MMMM")}, ${dayTasks.length} ${
                  dayTasks.length === 1 ? "task" : "tasks"
                }`}
                onClick={() => setSelectedDay(key)}
                className={cn(
                  "flex min-h-14 flex-col gap-1 border-r border-b p-1 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-28 md:p-2 [&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-muted/30 text-muted-foreground",
                  selected && "ring-2 ring-primary ring-inset",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday(day) && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>

                {/* Medium screens and up: small chips with the task titles */}
                {dayTasks.slice(0, MAX_CHIPS).map((task) => (
                  <span
                    key={task.id}
                    aria-hidden="true"
                    className={cn(
                      "hidden w-full truncate rounded border-l-2 bg-muted px-1.5 py-0.5 text-xs md:block",
                      PRIORITY_BAR[task.priority],
                      task.status === "DONE" && "line-through opacity-60",
                    )}
                  >
                    {task.title}
                  </span>
                ))}
                {dayTasks.length > MAX_CHIPS ? (
                  <span
                    aria-hidden="true"
                    className="hidden text-xs text-muted-foreground md:block"
                  >
                    +{dayTasks.length - MAX_CHIPS} more
                  </span>
                ) : null}

                {/* Phones: one dot per task (up to 3) */}
                {dayTasks.length > 0 ? (
                  <span className="flex gap-0.5 md:hidden" aria-hidden="true">
                    {dayTasks.slice(0, 3).map((task) => (
                      <span key={task.id} className="size-1.5 rounded-full bg-primary" />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <section aria-labelledby="selected-day-heading" className="mt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="selected-day-heading" className="text-lg font-medium">
            {format(parseISO(activeDay), "EEEE d MMMM")}
          </h2>
          {canCreate ? (
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add task
            </Button>
          ) : null}
        </div>

        {isPending ? (
          <Skeleton className="h-14 w-full" />
        ) : activeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks due on this day.</p>
        ) : (
          <TaskList
            tasks={activeTasks}
            workspaceId={workspaceId}
            role={role}
            currentUserId={currentUserId}
          />
        )}
      </section>

      <TaskFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        workspaceId={workspaceId}
        defaultDueDate={activeDay}
      />
    </>
  );
}
