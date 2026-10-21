import { CalendarDays, Clock } from "lucide-react";
import { formatDueDate, getDueState } from "@/lib/dates";

type DueDateProps = {
  dueDate: string;
  /** A finished task is never shown as overdue */
  done?: boolean;
};

export function DueDate({ dueDate, done = false }: DueDateProps) {
  const state = done ? "later" : getDueState(dueDate);
  const formatted = formatDueDate(dueDate);

  if (state === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <Clock className="size-3.5" aria-hidden="true" />
        Overdue · {formatted}
      </span>
    );
  }

  if (state === "today") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
        <Clock className="size-3.5" aria-hidden="true" />
        Today
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CalendarDays className="size-3.5" aria-hidden="true" />
      {formatted}
    </span>
  );
}
