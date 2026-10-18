import type { CreateWorkspaceInput, RenameWorkspaceInput } from "@/features/workspaces/schemas";
import type { WorkspaceSummary } from "@/features/workspaces/types";
import { db } from "@/server/db";
import { forbidden } from "@/server/errors";
import { assertCan, requireMembership } from "@/server/policies/access";

export async function ensurePersonalWorkspace(userId: string) {
  const existing = await db.workspace.findFirst({
    where: {
      type: "PERSONAL",
      memberships: { some: { userId, role: "OWNER" } },
    },
  });

  if (existing) {
    return existing;
  }

  return db.workspace.create({
    data: {
      name: "Personal",
      type: "PERSONAL",
      memberships: { create: { userId, role: "OWNER" } },
    },
  });
}

export async function listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]> {
  const memberships = await db.membership.findMany({
    where: { userId },
    include: { workspace: true },
  });

  return memberships
    .map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      type: membership.workspace.type,
      role: membership.role,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "PERSONAL" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
}

export async function createTeamWorkspace(
  userId: string,
  input: CreateWorkspaceInput,
): Promise<WorkspaceSummary> {
  const workspace = await db.workspace.create({
    data: {
      name: input.name,
      type: "TEAM",
      memberships: { create: { userId, role: "OWNER" } },
    },
  });

  return { id: workspace.id, name: workspace.name, type: workspace.type, role: "OWNER" };
}

export async function renameWorkspace(
  actorId: string,
  workspaceId: string,
  input: RenameWorkspaceInput,
): Promise<WorkspaceSummary> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "workspace:rename");

  if (actor.workspace.type === "PERSONAL") {
    throw forbidden("A personal workspace cannot be renamed.");
  }

  const workspace = await db.workspace.update({
    where: { id: workspaceId },
    data: { name: input.name },
  });

  return { id: workspace.id, name: workspace.name, type: workspace.type, role: actor.role };
}

export async function deleteWorkspace(actorId: string, workspaceId: string) {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "workspace:delete");

  if (actor.workspace.type === "PERSONAL") {
    throw forbidden("A personal workspace cannot be deleted.");
  }

  // Projects, tasks, labels and memberships are removed too (onDelete: Cascade in the schema)
  await db.workspace.delete({ where: { id: workspaceId } });

  return { id: workspaceId };
}
