"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { ColorPicker } from "@/components/shared/color-picker";
import { FieldError } from "@/components/shared/field-error";
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
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_COLORS } from "../constants";
import { useCreateProject, useUpdateProject } from "../hooks";
import { createProjectSchema, type CreateProjectInput } from "../schemas";
import type { ProjectDto } from "../types";

type ProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  /** Pass a project to edit it, or nothing to create a new one */
  project?: ProjectDto | null;
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  workspaceId,
  project,
}: ProjectFormDialogProps) {
  const isEditing = Boolean(project);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Change the name, description or color of this project."
              : "Projects help you group related tasks."}
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          workspaceId={workspaceId}
          project={project ?? null}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

type ProjectFormProps = {
  workspaceId: string;
  project: ProjectDto | null;
  onDone: () => void;
};

function ProjectForm({ workspaceId, project, onDone }: ProjectFormProps) {
  const createProject = useCreateProject(workspaceId);
  const updateProject = useUpdateProject(workspaceId);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      color: project?.color ?? PROJECT_COLORS[0],
    },
  });

  const isPending = createProject.isPending || updateProject.isPending;

  function onSubmit(values: CreateProjectInput) {
    if (project) {
      updateProject.mutate({ projectId: project.id, input: values }, { onSuccess: onDone });
    } else {
      createProject.mutate(values, { onSuccess: onDone });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Description (optional)</Label>
        <Textarea
          id="project-description"
          rows={3}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorPicker
              value={field.value}
              onChange={field.onChange}
              colors={PROJECT_COLORS}
              label="Project color"
            />
          )}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {project ? "Save changes" : "Create project"}
        </Button>
      </DialogFooter>
    </form>
  );
}
