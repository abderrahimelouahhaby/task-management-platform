import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { ensurePersonalWorkspace } from "./workspaces.service";

const userId = `test-user-${Date.now()}`;

describe("ensurePersonalWorkspace", () => {
  beforeAll(async () => {
    await db.user.create({
      data: {
        id: userId,
        name: "Test User",
        email: `${userId}@example.com`,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  });

  afterAll(async () => {
    await db.workspace.deleteMany({ where: { memberships: { some: { userId } } } });
    await db.user.delete({ where: { id: userId } });
    await db.$disconnect();
  });

  it("creates a personal workspace and makes the user its OWNER", async () => {
    const workspace = await ensurePersonalWorkspace(userId);

    expect(workspace.type).toBe("PERSONAL");

    const membership = await db.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
    });

    expect(membership?.role).toBe("OWNER");
  });

  it("does not create a second workspace when called again", async () => {
    const first = await ensurePersonalWorkspace(userId);
    const second = await ensurePersonalWorkspace(userId);

    expect(second.id).toBe(first.id);

    const count = await db.workspace.count({
      where: { type: "PERSONAL", memberships: { some: { userId } } },
    });

    expect(count).toBe(1);
  });
});
