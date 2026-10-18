"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { AddMemberInput, MemberRole } from "./schemas";
import type { MemberDto } from "./types";

export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: queryKeys.members(workspaceId),
    queryFn: () => api<MemberDto[]>(`/api/workspaces/${workspaceId}/members`),
  });
}

export function useAddMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddMemberInput) =>
      api<MemberDto>(`/api/workspaces/${workspaceId}/members`, { method: "POST", body: input }),
    onSuccess: () => {
      toast.success("Member added");
      return queryClient.invalidateQueries({ queryKey: queryKeys.members(workspaceId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: MemberRole }) =>
      api<MemberDto>(`/api/workspaces/${workspaceId}/members/${membershipId}`, {
        method: "PATCH",
        body: { role },
      }),
    onSuccess: () => {
      toast.success("Role updated");
      return queryClient.invalidateQueries({ queryKey: queryKeys.members(workspaceId) });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (membershipId: string) =>
      api<{ id: string }>(`/api/workspaces/${workspaceId}/members/${membershipId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Member removed");
      return queryClient.invalidateQueries({ queryKey: queryKeys.members(workspaceId) });
    },
    onError: (error) => toast.error(error.message),
  });
}
