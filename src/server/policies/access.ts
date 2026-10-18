import { can, type Action, type Role, type TaskContext } from "@/lib/permissions";
import { db } from "@/server/db";
import { forbidden, notFound } from "@/server/errors";

/**
 * Finds the membership of a user in a workspace.
 * Not a member? We answer "not found" (404), so we never reveal that the workspace exists.
 */
export async function requireMembership(userId: string, workspaceId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: { workspace: true },
  });

  if (!membership) {
    throw notFound();
  }

  return membership;
}

/** Throws a 403 error if the role is not allowed to do the action. */
export function assertCan(role: Role, action: Action, task?: TaskContext) {
  if (!can(role, action, task)) {
    throw forbidden();
  }
}
