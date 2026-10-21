"use client";

import { useQuery } from "@tanstack/react-query";
import { startOfWeek } from "date-fns";
import { api } from "@/lib/api-client";
import { todayDateString } from "@/lib/dates";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardStats } from "./types";

export function useDashboardStats(workspaceId: string) {
  // The browser tells the server what "today" and "this week" mean for this user
  const today = todayDateString();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

  return useQuery({
    queryKey: [...queryKeys.dashboard(workspaceId), today],
    queryFn: () =>
      api<DashboardStats>(
        `/api/workspaces/${workspaceId}/stats?today=${today}&weekStart=${encodeURIComponent(weekStart)}`,
      ),
  });
}
