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

/** True only for a real calendar day written as YYYY-MM-DD. Never throws. */
export function isCalendarDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  // An impossible day gives an Invalid Date (NaN). A rolled-over day (like 31 February) changes the text.
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Adds (or subtracts) days to a "YYYY-MM-DD" text. Expects a valid day. */
export function addDaysToCalendarDay(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/** Number of days from one "YYYY-MM-DD" to another (negative if the second is earlier). */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);

  return Math.round((end - start) / 86_400_000);
}
