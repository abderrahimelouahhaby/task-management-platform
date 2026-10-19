"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { CreateLabelInput, UpdateLabelInput } from "./schemas";
import type { LabelDto } from "./types";

export function useLabels(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.labels(workspaceId),
    queryFn: () => api<LabelDto[]>(`/api/workspaces/${workspaceId}/labels`),
  });
}

export function useCreateLabel(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLabelInput) =>
      api<LabelDto>(`/api/workspaces/${workspaceId}/labels`, { method: "POST", body: input }),
    onSuccess: () => {
      toast.success("Label created");
      return queryClient.invalidateQueries({ queryKey: queryKeys.labels(workspaceId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateLabel(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ labelId, input }: { labelId: string; input: UpdateLabelInput }) =>
      api<LabelDto>(`/api/labels/${labelId}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      toast.success("Label updated");
      // Labels are also shown on tasks, so the task list must reload too
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.labels(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteLabel(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) =>
      api<{ id: string }>(`/api/labels/${labelId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Label deleted");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.labels(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
}
