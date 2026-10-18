"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FieldError } from "@/components/shared/field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { can, type Role } from "@/lib/permissions";
import { useDeleteWorkspace, useRenameWorkspace } from "../hooks";
import { renameWorkspaceSchema, type RenameWorkspaceInput } from "../schemas";
import type { WorkspaceType } from "../types";

type GeneralSettingsProps = {
  workspace: { id: string; name: string; type: WorkspaceType };
  role: Role;
};

export function GeneralSettings({ workspace, role }: GeneralSettingsProps) {
  const router = useRouter();
  const renameWorkspace = useRenameWorkspace(workspace.id);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isTeam = workspace.type === "TEAM";
  const canRename = isTeam && can(role, "workspace:rename");
  const canDelete = isTeam && can(role, "workspace:delete");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<RenameWorkspaceInput>({
    resolver: zodResolver(renameWorkspaceSchema),
    defaultValues: { name: workspace.name },
  });

  function onSubmit(values: RenameWorkspaceInput) {
    renameWorkspace.mutate(values, {
      onSuccess: (updated) => {
        toast.success("Workspace renamed");
        reset({ name: updated.name });
        router.refresh();
      },
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace name</CardTitle>
          <CardDescription>
            {canRename
              ? "This name is shown to everyone in the workspace."
              : isTeam
                ? "Only the workspace owner can rename it."
                : "Your personal workspace cannot be renamed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {canRename ? (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="rename-workspace" className="sr-only">
                  Workspace name
                </Label>
                <Input
                  id="rename-workspace"
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                  {...register("name")}
                />
                <FieldError message={errors.name?.message} />
              </div>
              <Button type="submit" disabled={!isDirty || renameWorkspace.isPending}>
                {renameWorkspace.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
            </form>
          ) : (
            <p className="text-sm font-medium">{workspace.name}</p>
          )}
        </CardContent>
      </Card>

      {canDelete ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Deleting a workspace removes all its projects, tasks, labels and memberships. This
              cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Delete workspace
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <DeleteWorkspaceDialog workspace={workspace} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </div>
  );
}

type DeleteWorkspaceDialogProps = {
  workspace: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function DeleteWorkspaceDialog({ workspace, open, onOpenChange }: DeleteWorkspaceDialogProps) {
  const router = useRouter();
  const deleteWorkspace = useDeleteWorkspace(workspace.id);
  const [confirmation, setConfirmation] = useState("");

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmation("");
    }
    onOpenChange(nextOpen);
  }

  function handleDelete() {
    deleteWorkspace.mutate(undefined, {
      onSuccess: () => {
        toast.success("Workspace deleted");
        router.push("/dashboard");
        router.refresh();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this workspace?</DialogTitle>
          <DialogDescription>
            This permanently deletes <strong>{workspace.name}</strong> and everything in it. Type
            the workspace name to confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-workspace-name">Workspace name</Label>
          <Input
            id="confirm-workspace-name"
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmation !== workspace.name || deleteWorkspace.isPending}
          >
            {deleteWorkspace.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Delete workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
