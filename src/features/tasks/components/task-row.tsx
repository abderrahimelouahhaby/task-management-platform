import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DueDate } from "@/components/shared/due-date";
import { LabelChip } from "@/components/shared/label-chip";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TaskDto } from "../types";

type TaskRowProps = {
  task: TaskDto;
  canEdit: boolean;
  canDelete: boolean;
  onToggleDone: (done: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TaskRow({
  task,
  canEdit,
  canDelete,
  onToggleDone,
  onEdit,
  onDelete,
}: TaskRowProps) {
  const done = task.status === "DONE";
  const showMenu = canEdit || canDelete;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <Checkbox
        checked={done}
        disabled={!canEdit}
        onCheckedChange={(checked) => onToggleDone(checked === true)}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
      />

      <div className="min-w-0 flex-1 basis-56">
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              "max-w-full truncate rounded-sm text-left text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </button>
        ) : (
          <span
            className={cn(
              "block truncate text-sm font-medium",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </span>
        )}

        {task.labels.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {task.labels.map((label) => (
              <LabelChip key={label.id} name={label.name} color={label.color} />
            ))}
          </div>
        ) : null}
      </div>

      <div className={cn("flex flex-wrap items-center gap-3", done && "opacity-60")}>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: task.projectColor ?? "#6366f1" }}
            aria-hidden="true"
          />
          {task.projectName}
        </span>

        {task.dueDate ? <DueDate dueDate={task.dueDate} done={done} /> : null}

        <PriorityBadge priority={task.priority} />

        {task.status === "IN_PROGRESS" ? <StatusBadge status={task.status} /> : null}

        {task.assignee ? (
          <span title={task.assignee.name}>
            <UserAvatar name={task.assignee.name} className="size-6" />
            <span className="sr-only">Assigned to {task.assignee.name}</span>
          </span>
        ) : null}
      </div>

      {showMenu ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${task.title}`}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit ? (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
            ) : null}
            {canEdit && canDelete ? <DropdownMenuSeparator /> : null}
            {canDelete ? (
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}
