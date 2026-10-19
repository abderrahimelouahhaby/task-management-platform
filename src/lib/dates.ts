export type DueState = "overdue" | "today" | "later";

/** "2026-10-23T00:00:00.000Z" becomes "2026-10-23" (the format of <input type="date">). */
export function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

/** Today's date in the user's own time zone, as "YYYY-MM-DD". */
export function todayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Compares the due day with today. Text comparison works because the format is year-month-day. */
export function getDueState(dueIso: string, now: Date = new Date()): DueState {
  const due = dueIso.slice(0, 10);
  const today = todayDateString(now);

  if (due < today) {
    return "overdue";
  }

  return due === today ? "today" : "later";
}

/** "2026-10-23T00:00:00.000Z" becomes "23 Oct". Uses UTC so the day never shifts. */
export function formatDueDate(dueIso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(dueIso));
}
