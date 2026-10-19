"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { TaskStatus } from "./constants";
import type { CreateTaskInput, UpdateTaskInput } from "./schemas";
import type { TaskDto } from "./types";

export function useTasks(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.tasks(workspaceId),
    queryFn: () => api<TaskDto[]>(`/api/workspaces/${workspaceId}/tasks`),
  });
}

/** After a change in tasks, reload the tasks and the projects (projects show a task count). */
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

/**
 * Changes only the status (the checkbox). It is OPTIMISTIC:
 * the screen changes immediately, and goes back if the server says no.
 */
export function useUpdateTaskStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshTasks(workspaceId);
  const key = queryKeys.tasks(workspaceId);

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      api<TaskDto>(`/api/tasks/${taskId}`, { method: "PATCH", body: { status } }),

    onMutate: async ({ taskId, status }) => {
      // 1. Stop any reload that is running, so it cannot overwrite our change
      await queryClient.cancelQueries({ queryKey: key });

      // 2. Remember the current list, in case we must go back
      const previous = queryClient.getQueryData<TaskDto[]>(key);

      // 3. Change the list in the cache right now
      queryClient.setQueryData<TaskDto[]>(key, (tasks) =>
        tasks?.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status,
                completedAt: status === "DONE" ? new Date().toISOString() : null,
              }
            : task,
        ),
      );

      return { previous };
    },

    onError: (error, _variables, context) => {
      // The server said no: put the old list back and explain
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error(error.message);
    },

    // Success or failure: reload the real data from the server
    onSettled: () => refresh(),
  });
}
