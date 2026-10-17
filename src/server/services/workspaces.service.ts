import { db } from "@/server/db";

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
