import { z } from "zod";
import { daysBetween, isCalendarDay } from "@/lib/dates";

/** A month grid shows at most 6 weeks (42 days). We allow a little more. */
export const MAX_CALENDAR_DAYS = 62;

export const calendarRangeSchema = z
  .object({
    from: z.string().refine(isCalendarDay, "from must be a valid date (YYYY-MM-DD)"),
    to: z.string().refine(isCalendarDay, "to must be a valid date (YYYY-MM-DD)"),
  })
  .refine((range) => range.from <= range.to, {
    message: "from must not be after to",
    path: ["to"],
  })
  .refine((range) => daysBetween(range.from, range.to) <= MAX_CALENDAR_DAYS, {
    message: `The range can be at most ${MAX_CALENDAR_DAYS} days`,
    path: ["to"],
  });

export type CalendarRange = z.infer<typeof calendarRangeSchema>;
