"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { CreateProjectInput, UpdateProjectInput } from "./schemas";
import type { ProjectDto } from "./types";

export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.projects(workspaceId),
    queryFn: () => api<ProjectDto[]>(`/api/workspaces/${workspaceId}/projects`),
  });
}

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      api<ProjectDto>(`/api/workspaces/${workspaceId}/projects`, { method: "POST", body: input }),
    onSuccess: () => {
      toast.success("Project created");
      return queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) =>
      api<ProjectDto>(`/api/projects/${projectId}`, { method: "PATCH", body: input }),
    onSuccess: () => {
      toast.success("Project updated");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      api<{ id: string }>(`/api/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Project deleted");
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks(workspaceId) }),
      ]);
    },
    onError: (error) => toast.error(error.message),
  });
}
