import { z } from "zod";
import { isCalendarDay } from "@/lib/dates";

/**
 * The browser sends two values, because only the browser knows the user's time zone:
 * - today: the local date, for example "2026-10-23"
 * - weekStart: the exact moment the user's week began, in UTC, for example "2026-10-18T23:00:00.000Z"
 */
export const dashboardQuerySchema = z.object({
  today: z.string().refine(isCalendarDay, "today must be a valid date (YYYY-MM-DD)"),
  weekStart: z.iso.datetime("weekStart must be a valid UTC date and time"),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
