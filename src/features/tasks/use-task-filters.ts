"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildTaskQueryString, taskFiltersSchema, type TaskFilters } from "./filters";

export function useTaskFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read the filters from the URL. A broken URL (for example ?page=abc) falls back to the defaults.
  const filters = useMemo<TaskFilters>(() => {
    const parsed = taskFiltersSchema.safeParse(Object.fromEntries(searchParams));

    return parsed.success ? parsed.data : taskFiltersSchema.parse({});
  }, [searchParams]);

  const setFilters = useCallback(
    (changes: Partial<TaskFilters>) => {
      const next = { ...filters, ...changes };

      // Changing a filter (not the page) goes back to page 1
      if (!("page" in changes)) {
        next.page = 1;
      }

      const query = buildTaskQueryString(next);

      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = Boolean(
    filters.q ||
    filters.status ||
    filters.priority ||
    filters.assignee ||
    filters.label ||
    filters.project ||
    filters.due,
  );

  return { filters, setFilters, clearFilters, hasActiveFilters };
}
