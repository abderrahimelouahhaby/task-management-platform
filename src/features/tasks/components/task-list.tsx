"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { can, type Role } from "@/lib/permissions";
import { useDeleteTask, useUpdateTaskStatus } from "../hooks";
import type { TaskDto } from "../types";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskRow } from "./task-row";

type TaskListProps = {
  tasks: TaskDto[];
  workspaceId: string;
  role: Role;
  currentUserId: string;
};

export function TaskList({ tasks, workspaceId, role, currentUserId }: TaskListProps) {
  const updateStatus = useUpdateTaskStatus(workspaceId);
  const deleteTask = useDeleteTask(workspaceId);

  const [editing, setEditing] = useState<TaskDto | null>(null);
  const [deleting, setDeleting] = useState<TaskDto | null>(null);

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

  return (
    <>
      <ul className="divide-y rounded-lg border px-4">
        {tasks.map((task) => {
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
