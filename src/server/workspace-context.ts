import { cache } from "react";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireSession } from "@/server/session";

/**
 * For pages and layouts under /w/[workspaceId].
 * Returns the logged-in user, the workspace and the user's role.
 * If the user is not a member, it shows the 404 page.
 */
export const getWorkspaceContext = cache(async (workspaceId: string) => {
  const session = await requireSession();

  const membership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
    include: { workspace: true },
  });

  if (!membership) {
    notFound();
  }

  return { user: session.user, workspace: membership.workspace, role: membership.role };
});
