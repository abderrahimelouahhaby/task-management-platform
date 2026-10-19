"use client";

import { useState } from "react";
import { Pencil, Tag, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { LabelChip } from "@/components/shared/label-chip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { can, type Role } from "@/lib/permissions";
import { useDeleteLabel, useLabels } from "../hooks";
import type { LabelDto } from "../types";
import { LabelForm } from "./label-form";

type LabelsSettingsProps = {
  workspaceId: string;
  role: Role;
};

export function LabelsSettings({ workspaceId, role }: LabelsSettingsProps) {
  const { data: labels, isPending, isError, error, refetch } = useLabels(workspaceId);
  const deleteLabel = useDeleteLabel(workspaceId);
  const [editing, setEditing] = useState<LabelDto | null>(null);
  const [deleting, setDeleting] = useState<LabelDto | null>(null);

  const canManage = can(role, "label:manage");

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create a label</CardTitle>
            <CardDescription>
              Labels help you sort and find tasks. The color is shown as a small dot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LabelForm workspaceId={workspaceId} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Labels</CardTitle>
          <CardDescription>
            {canManage
              ? "Edit or delete the labels of this workspace."
              : "Only owners and admins can manage labels."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
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
          ) : labels.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No labels yet"
              description="Labels let you group tasks, for example Bug, Design or Client."
            />
          ) : (
            <ul className="divide-y">
              {labels.map((label) => (
                <li key={label.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <LabelChip name={label.name} color={label.color} />
                  </div>
                  <Badge variant="secondary">
                    {label.taskCount} {label.taskCount === 1 ? "task" : "tasks"}
                  </Badge>
                  {canManage ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${label.name}`}
                        onClick={() => setEditing(label)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${label.name}`}
                        onClick={() => setDeleting(label)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit label</DialogTitle>
            <DialogDescription>Change the name or the color of this label.</DialogDescription>
          </DialogHeader>
          {editing ? (
            <LabelForm
              key={editing.id}
              workspaceId={workspaceId}
              label={editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title="Delete this label?"
        description={`"${deleting?.name ?? "This label"}" will be removed from its ${deleting?.taskCount ?? 0} task(s). The tasks are kept.`}
        confirmLabel="Delete label"
        isPending={deleteLabel.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteLabel.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </div>
  );
}
