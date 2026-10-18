"use client";

import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { can, type Role } from "@/lib/permissions";
import { useDeleteProject, useProjects, useUpdateProject } from "../hooks";
import type { ProjectDto } from "../types";
import { ProjectCard } from "./project-card";
import { ProjectFormDialog } from "./project-form-dialog";

type ProjectsViewProps = {
  workspaceId: string;
  role: Role;
};

export function ProjectsView({ workspaceId, role }: ProjectsViewProps) {
  const { data: projects, isPending, isError, error, refetch } = useProjects(workspaceId);
  const updateProject = useUpdateProject(workspaceId);
  const deleteProject = useDeleteProject(workspaceId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectDto | null>(null);
  const [deleting, setDeleting] = useState<ProjectDto | null>(null);

  const canCreate = can(role, "project:create");
  const canEdit = can(role, "project:update");
  const canDelete = can(role, "project:delete");

  const active = projects?.filter((project) => !project.archived) ?? [];
  const archived = projects?.filter((project) => project.archived) ?? [];

  function renderCard(project: ProjectDto) {
    return (
      <ProjectCard
        key={project.id}
        project={project}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={() => setEditing(project)}
        onToggleArchive={() =>
          updateProject.mutate({ projectId: project.id, input: { archived: !project.archived } })
        }
        onDelete={() => setDeleting(project)}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Projects"
        description="Organize your tasks into projects."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New project
            </Button>
          ) : null
        }
      />

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
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
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Projects help you group related tasks."
          action={
            canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{active.map(renderCard)}</div>
          ) : (
            <p className="text-sm text-muted-foreground">All your projects are archived.</p>
          )}

          {archived.length > 0 ? (
            <section aria-labelledby="archived-heading" className="space-y-4">
              <h2 id="archived-heading" className="text-lg font-medium">
                Archived
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archived.map(renderCard)}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} workspaceId={workspaceId} />

      <ProjectFormDialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        workspaceId={workspaceId}
        project={editing}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title="Delete this project?"
        description={`"${deleting?.name ?? "This project"}" and its ${deleting?.taskCount ?? 0} task(s) will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete project"
        isPending={deleteProject.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteProject.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </>
  );
}
