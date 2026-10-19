"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { FieldError } from "@/components/shared/field-error";
import { LabelPicker } from "@/components/shared/label-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useLabels } from "@/features/labels/hooks";
import type { LabelDto } from "@/features/labels/types";
import { useProjects } from "@/features/projects/hooks";
import type { ProjectDto } from "@/features/projects/types";
import { toDateInputValue } from "@/lib/dates";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from "../constants";
import { useCreateTask, useUpdateTask } from "../hooks";
import { createTaskSchema, type CreateTaskInput } from "../schemas";
import type { TaskDto } from "../types";

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  /** Pass a task to edit it, or nothing to create a new one */
  task?: TaskDto | null;
};

export function TaskFormDialog({ open, onOpenChange, workspaceId, task }: TaskFormDialogProps) {
  const isEditing = Boolean(task);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Change the details of this task." : "Add a task to one of your projects."}
          </DialogDescription>
        </DialogHeader>
        <TaskFormLoader
          workspaceId={workspaceId}
          task={task ?? null}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type FormProps = {
  workspaceId: string;
  task: TaskDto | null;
  onDone: () => void;
};

/** Loads the projects and labels first, so the form can start with the right default values. */
function TaskFormLoader({ workspaceId, task, onDone }: FormProps) {
  const projects = useProjects(workspaceId);
  const labels = useLabels(workspaceId);

  if (projects.isPending || labels.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (projects.isError || labels.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Could not load the projects and labels. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TaskFormFields
      workspaceId={workspaceId}
      task={task}
      projects={projects.data}
      labels={labels.data}
      onDone={onDone}
    />
  );
}

type TaskFormFieldsProps = FormProps & {
  projects: ProjectDto[];
  labels: LabelDto[];
};

function TaskFormFields({ workspaceId, task, projects, labels, onDone }: TaskFormFieldsProps) {
  const createTask = useCreateTask(workspaceId);
  const updateTask = useUpdateTask(workspaceId);

  // New tasks go into active projects. When editing, the task's own project stays selectable.
  const availableProjects = projects.filter(
    (project) => !project.archived || project.id === task?.projectId,
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId ?? availableProjects[0]?.id ?? "",
      status: task?.status ?? "TODO",
      priority: task?.priority ?? "MEDIUM",
      dueDate: toDateInputValue(task?.dueDate ?? null),
      labelIds: task?.labels.map((label) => label.id) ?? [],
    },
  });

  const isPending = createTask.isPending || updateTask.isPending;

  function onSubmit(values: CreateTaskInput) {
    if (task) {
      updateTask.mutate({ taskId: task.id, input: values }, { onSuccess: onDone });
    } else {
      createTask.mutate(values, { onSuccess: onDone });
    }
  }

  if (availableProjects.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            You need a project before you can add tasks. Ask an owner or admin to create one on the
            Projects page.
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Close
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Title</Label>
        <Input
          id="task-title"
          autoComplete="off"
          aria-invalid={Boolean(errors.title)}
          {...register("title")}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-description">Description (optional)</Label>
        <Textarea
          id="task-description"
          rows={3}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-project">Project</Label>
        <Controller
          control={control}
          name="projectId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="task-project" className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {availableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                    {project.archived ? " (archived)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.projectId?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task-status">Status</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {PRIORITY_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-due">Due date (optional)</Label>
        <Input
          id="task-due"
          type="date"
          aria-invalid={Boolean(errors.dueDate)}
          {...register("dueDate")}
        />
        <FieldError message={errors.dueDate?.message} />
      </div>

      <div className="space-y-2">
        <Label>Labels</Label>
        <Controller
          control={control}
          name="labelIds"
          render={({ field }) => (
            <LabelPicker labels={labels} value={field.value ?? []} onChange={field.onChange} />
          )}
        />
        <FieldError message={errors.labelIds?.message} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {task ? "Save changes" : "Create task"}
        </Button>
      </DialogFooter>
    </form>
  );
}
