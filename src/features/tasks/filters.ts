import { z } from "zod";
import { isCalendarDay } from "@/lib/dates";
import { TASK_PRIORITIES, TASK_STATUSES } from "./constants";

export const STATUS_FILTERS = [...TASK_STATUSES, "open"] as const;
export const DUE_FILTERS = ["overdue", "today", "week", "none"] as const;
export const TASK_SORTS = ["due", "created", "priority", "title"] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

const idSchema = z.string().min(1).max(100);

/**
 * The filters a person can choose on screen. They live in the URL.
 * "open" means "not done". assignee is "me", "unassigned" or a user id.
 */
export const taskFiltersSchema = z.object({
  q: z.string().trim().max(100, "Search text must be at most 100 characters").optional(),
  status: z.enum(STATUS_FILTERS).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assignee: idSchema.optional(),
  label: idSchema.optional(),
  project: idSchema.optional(),
  due: z.enum(DUE_FILTERS).optional(),
  sort: z.enum(TASK_SORTS).default("due"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/**
 * What the API accepts: the filters plus "today" (the browser's local date).
 * A due filter other than "none" needs "today", because only the browser knows the user's time zone.
 */
export const taskListQuerySchema = taskFiltersSchema
  .extend({
    today: z.string().refine(isCalendarDay, "today must be a valid date (YYYY-MM-DD)").optional(),
  })
  .refine((query) => !query.due || query.due === "none" || query.today !== undefined, {
    message: "today is required for this due filter",
    path: ["today"],
  });

export type TaskFilters = z.infer<typeof taskFiltersSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;

const FILTER_KEYS = [
  "q",
  "status",
  "priority",
  "assignee",
  "label",
  "project",
  "due",
  "sort",
  "page",
  "pageSize",
] as const;

/** Turns filters into a URL query string. Default values are left out to keep URLs short and stable. */
export function buildTaskQueryString(filters: Partial<TaskFilters>): string {
  const params = new URLSearchParams();

  for (const key of FILTER_KEYS) {
    const value = filters[key];

    if (value === undefined || value === "") {
      continue;
    }

    if (key === "sort" && value === "due") {
      continue;
    }

    if (key === "page" && value === 1) {
      continue;
    }

    if (key === "pageSize" && value === DEFAULT_PAGE_SIZE) {
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}
