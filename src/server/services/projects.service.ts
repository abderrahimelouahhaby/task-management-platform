import type { CreateProjectInput, UpdateProjectInput } from "@/features/projects/schemas";
import type { ProjectDto } from "@/features/projects/types";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { assertCan, requireMembership } from "@/server/policies/access";

const projectSelect = {
  id: true,
  name: true,
  description: true,
  color: true,
  archivedAt: true,
  createdAt: true,
  _count: { select: { tasks: true } },
} as const;

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  _count: { tasks: number };
};

function toDto(project: ProjectRow): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color,
    archived: project.archivedAt !== null,
    taskCount: project._count.tasks,
    createdAt: project.createdAt.toISOString(),
  };
}

/** Loads a project, then checks that the user belongs to its workspace and may do the action. */
async function requireProjectAccess(
  actorId: string,
  projectId: string,
  action: "project:update" | "project:delete",
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, workspaceId: true },
  });

  if (!project) {
    throw notFound();
  }

  // Not a member of the project's workspace? Same 404 as a project that does not exist.
  const actor = await requireMembership(actorId, project.workspaceId);

  assertCan(actor.role, action);

  return project;
}

export async function listProjects(actorId: string, workspaceId: string): Promise<ProjectDto[]> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "project:view");

  const projects = await db.project.findMany({
    where: { workspaceId },
    select: projectSelect,
    orderBy: { createdAt: "asc" },
  });

  return projects.map(toDto);
}

export async function createProject(
  actorId: string,
  workspaceId: string,
  input: CreateProjectInput,
): Promise<ProjectDto> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "project:create");

  const project = await db.project.create({
    data: {
      workspaceId,
      name: input.name,
      description: input.description || null,
      color: input.color ?? null,
    },
    select: projectSelect,
  });

  return toDto(project);
}

export async function updateProject(
  actorId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<ProjectDto> {
  await requireProjectAccess(actorId, projectId, "project:update");

  const project = await db.project.update({
    where: { id: projectId },
    data: {
      name: input.name,
      description: input.description === undefined ? undefined : input.description || null,
      color: input.color,
      archivedAt: input.archived === undefined ? undefined : input.archived ? new Date() : null,
    },
    select: projectSelect,
  });

  return toDto(project);
}

export async function deleteProject(actorId: string, projectId: string) {
  await requireProjectAccess(actorId, projectId, "project:delete");

  // The project's tasks are deleted too (onDelete: Cascade in the schema)
  await db.project.delete({ where: { id: projectId } });

  return { id: projectId };
}
