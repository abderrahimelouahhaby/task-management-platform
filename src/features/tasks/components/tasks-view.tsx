"use client";

import { useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { can, type Role } from "@/lib/permissions";
import { useDeleteTask, useTasks, useUpdateTaskStatus } from "../hooks";
import type { TaskDto } from "../types";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskRow } from "./task-row";

type TasksViewProps = {
  workspaceId: string;
  role: Role;
  currentUserId: string;
};

export function TasksView({ workspaceId, role, currentUserId }: TasksViewProps) {
  const { data: tasks, isPending, isError, error, refetch } = useTasks(workspaceId);
  const updateStatus = useUpdateTaskStatus(workspaceId);
  const deleteTask = useDeleteTask(workspaceId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDto | null>(null);
  const [deleting, setDeleting] = useState<TaskDto | null>(null);

  const canCreate = can(role, "task:create");

  // The same permission function as the server. Here it only decides which buttons to show.
  function permissionsFor(task: TaskDto) {
    const context = {
      userId: currentUserId,
      createdById: task.createdById,
      assigneeId: task.assignee?.id ?? null,
    };

    return {
      canEdit: can(role, "task:update", context),
      canDelete: can(role, "task:delete", context),
    };
  }

  // Finished tasks go to the bottom. The sort is stable, so the server order is kept inside each group.
  const sortedTasks = tasks
    ? [...tasks].sort((a, b) => Number(a.status === "DONE") - Number(b.status === "DONE"))
    : [];

  const newTaskButton = canCreate ? (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="size-4" />
      New task
    </Button>
  ) : null;

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Create, filter, and complete your tasks."
        actions={newTaskButton}
      />

      {isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
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
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description={
            canCreate
              ? "Create your first task to get started."
              : "There are no tasks in this workspace yet."
          }
          action={newTaskButton ?? undefined}
        />
      ) : (
        <ul className="divide-y rounded-lg border px-4">
          {sortedTasks.map((task) => {
            const { canEdit, canDelete } = permissionsFor(task);

            return (
              <TaskRow
                key={task.id}
                task={task}
                canEdit={canEdit}
                canDelete={canDelete}
                onToggleDone={(done) =>
                  updateStatus.mutate({ taskId: task.id, status: done ? "DONE" : "TODO" })
                }
                onEdit={() => setEditing(task)}
                onDelete={() => setDeleting(task)}
              />
            );
          })}
        </ul>
      )}

      <TaskFormDialog open={createOpen} onOpenChange={setCreateOpen} workspaceId={workspaceId} />

      <TaskFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        workspaceId={workspaceId}
        task={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title="Delete this task?"
        description={`"${deleting?.title ?? "This task"}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete task"
        isPending={deleteTask.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteTask.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </>
  );
}
