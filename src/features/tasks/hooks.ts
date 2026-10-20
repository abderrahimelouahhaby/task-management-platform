"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { todayDateString } from "@/lib/dates";
import { queryKeys } from "@/lib/query-keys";
import type { TaskStatus } from "./constants";
import { buildTaskQueryString, type TaskFilters } from "./filters";
import type { CreateTaskInput, UpdateTaskInput } from "./schemas";
import type { TaskDto, TaskPage } from "./types";

export function useTasks(workspaceId: string, filters: TaskFilters) {
  const queryString = buildTaskQueryString(filters);

  // The browser tells the server which day "today" is (the server does not know our time zone)
  const apiParams = new URLSearchParams(queryString);
  apiParams.set("today", todayDateString());

  return useQuery({
    queryKey: queryKeys.taskList(workspaceId, queryString),
    queryFn: () => api<TaskPage>(`/api/workspaces/${workspaceId}/tasks?${apiParams.toString()}`),
    // Keep showing the previous results while the new ones load (no flicker)
    placeholderData: keepPreviousData,
  });
}

export function useCalendarTasks(workspaceId: string, from: string, to: string) {
  return useQuery({
    queryKey: queryKeys.taskCalendar(workspaceId, from, to),
    queryFn: () => api<TaskDto[]>(`/api/workspaces/${workspaceId}/calendar?from=${from}&to=${to}`),
    placeholderData: keepPreviousData,
  });
}

/** After a change in tasks, reload the tasks, the projects (task counts) and the labels (task counts). */
function useRefreshTasks(workspaceId: string) {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.labels(workspaceId) }),
    ]);
}

export function useCreateTask(workspaceId: string) {
  const refresh = useRefreshTasks(workspaceId);

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      api<TaskDto>(`/api/workspaces/${workspaceId}/tasks`, { method: "POST", body: input }),
    onSuccess: () => {
      toast.success("Task created");
      return refresh();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTask(workspaceId: string) {
  const refresh = useRefreshTasks(workspaceId);

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      api<TaskDto>(`/api/tasks/${taskId}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      toast.success("Task updated");
      return refresh();
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteTask(workspaceId: string) {
  const refresh = useRefreshTasks(workspaceId);

  return useMutation({
    mutationFn: (taskId: string) =>
      api<{ id: string }>(`/api/tasks/${taskId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Task deleted");
      return refresh();
    },
    onError: (error) => toast.error(error.message),
  });
}

// A cached task query is either a page (list) or an array (calendar)
type TaskCache = TaskPage | TaskDto[];

function patchTask(
  data: TaskCache | undefined,
  taskId: string,
  patch: (task: TaskDto) => TaskDto,
): TaskCache | undefined {
  if (!data) {
    return data;
  }

  const apply = (tasks: TaskDto[]) =>
    tasks.map((task) => (task.id === taskId ? patch(task) : task));

  return Array.isArray(data) ? apply(data) : { ...data, items: apply(data.items) };
}

/**
 * Changes only the status (the checkbox). It is OPTIMISTIC:
 * every cached list and calendar changes immediately, and goes back if the server says no.
 */
export function useUpdateTaskStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshTasks(workspaceId);
  const key = queryKeys.tasks(workspaceId);

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api<TaskDto>(`/api/tasks/${taskId}`, { method: "PATCH", body: { status } }),

    onMutate: async ({ taskId, status }) => {
      // 1. Stop running reloads, so they cannot overwrite our change
      await queryClient.cancelQueries({ queryKey: key });

      // 2. Remember every cached task query, in case we must go back
      const previous = queryClient.getQueriesData<TaskCache>({ queryKey: key });

      // 3. Change all of them right now
      queryClient.setQueriesData<TaskCache>({ queryKey: key }, (data) =>
        patchTask(data, taskId, (task) => ({
          ...task,
          status,
          completedAt: status === "DONE" ? new Date().toISOString() : null,
        })),
      );

      return { previous };
    },

    onError: (error, _variables, context) => {
      // The server said no: put every cached query back and explain
      for (const [queryKey, data] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      toast.error(error.message);
    },

    // Success or failure: reload the real data from the server
    onSettled: () => refresh(),
  });
}
