"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { CreateWorkspaceInput, RenameWorkspaceInput } from "./schemas";
import type { WorkspaceSummary } from "./types";

export function useCreateWorkspace() {
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) =>
      api<WorkspaceSummary>("/api/workspaces", { method: "POST", body: input }),
    onError: (error) => toast.error(error.message),
  });
}

export function useRenameWorkspace(workspaceId: string) {
  return useMutation({
    mutationFn: (input: RenameWorkspaceInput) =>
      api<WorkspaceSummary>(`/api/workspaces/${workspaceId}`, { method: "PATCH", body: input }),
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteWorkspace(workspaceId: string) {
  return useMutation({
    mutationFn: () => api<{ id: string }>(`/api/workspaces/${workspaceId}`, { method: "DELETE" }),
    onError: (error) => toast.error(error.message),
  });
}
