"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Trash2, Users } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FieldError } from "@/components/shared/field-error";
import { RoleBadge } from "@/components/shared/role-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkspaceType } from "@/features/workspaces/types";
import {
  ROLE_LABELS,
  assignableRoles,
  canChangeRole,
  canRemoveMember,
  type Role,
} from "@/lib/permissions";
import { useAddMember, useMembers, useRemoveMember, useUpdateMemberRole } from "../hooks";
import { addMemberSchema, type AddMemberInput, type MemberRole } from "../schemas";
import type { MemberDto } from "../types";

type MembersSettingsProps = {
  workspaceId: string;
  workspaceType: WorkspaceType;
  role: Role;
  currentUserId: string;
};

const CHANGEABLE_ROLES: MemberRole[] = ["ADMIN", "MEMBER", "VIEWER"];

export function MembersSettings({
  workspaceId,
  workspaceType,
  role,
  currentUserId,
}: MembersSettingsProps) {
  if (workspaceType === "PERSONAL") {
    return (
      <EmptyState
        icon={Users}
        title="This workspace is just for you"
        description="Personal workspaces are private. Create a team workspace to collaborate with other people."
      />
    );
  }

  return <TeamMembers workspaceId={workspaceId} role={role} currentUserId={currentUserId} />;
}

type TeamMembersProps = {
  workspaceId: string;
  role: Role;
  currentUserId: string;
};

function TeamMembers({ workspaceId, role, currentUserId }: TeamMembersProps) {
  const { data: members, isPending, isError, error, refetch } = useMembers(workspaceId);
  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const [removing, setRemoving] = useState<MemberDto | null>(null);

  const canAdd = assignableRoles(role).length > 0;

  return (
    <div className="space-y-6">
      {canAdd ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a member</CardTitle>
            <CardDescription>
              The person needs to have a Mohima account. Enter the email they signed up with.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddMemberForm workspaceId={workspaceId} role={role} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>
            {canAdd
              ? "Manage who can access this workspace."
              : "Only owners and admins can manage members."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between gap-4">
                {error.message}
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <ul className="divide-y">
              {members.map((member) => {
                const isYou = member.userId === currentUserId;
                // "MEMBER" is a sample role: this is true only if the actor is the owner and the target is not
                const canChange = canChangeRole(role, member.role, "MEMBER");
                const canRemove = canRemoveMember(role, member.role);

                return (
                  <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
                    <UserAvatar name={member.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name}
                        {isYou ? " (you)" : ""}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>

                    {canChange ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          updateRole.mutate({ membershipId: member.id, role: value as MemberRole })
                        }
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-32" aria-label={`Role of ${member.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANGEABLE_ROLES.map((value) => (
                            <SelectItem key={value} value={value}>
                              {ROLE_LABELS[value]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}

                    {canRemove ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => setRemoving(member)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoving(null);
          }
        }}
        title="Remove this member?"
        description={`${removing?.name ?? "This person"} will lose access to this workspace. You can add them again later.`}
        confirmLabel="Remove member"
        isPending={removeMember.isPending}
        onConfirm={() => {
          if (removing) {
            removeMember.mutate(removing.id, { onSuccess: () => setRemoving(null) });
          }
        }}
      />
    </div>
  );
}

function AddMemberForm({ workspaceId, role }: { workspaceId: string; role: Role }) {
  const addMember = useAddMember(workspaceId);
  const roles = assignableRoles(role);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  function onSubmit(values: AddMemberInput) {
    addMember.mutate(values, { onSuccess: () => reset() });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="flex-1 space-y-2">
        <Label htmlFor="member-email">Email</Label>
        <Input
          id="member-email"
          type="email"
          autoComplete="off"
          placeholder="colleague@example.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="space-y-2 sm:w-40">
        <Label htmlFor="member-role">Role</Label>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="member-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ROLE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button type="submit" className="sm:mt-7" disabled={addMember.isPending}>
        {addMember.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Add member
      </Button>
    </form>
  );
}
