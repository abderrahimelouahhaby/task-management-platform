import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { createLabel, deleteLabel, listLabels, updateLabel } from "./labels.service";
import { createTeamWorkspace } from "./workspaces.service";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let owner: TestUser;
let admin: TestUser;
let member: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let workspaceId: string;

beforeAll(async () => {
  owner = await createTestUser("owner");
  admin = await createTestUser("admin");
  member = await createTestUser("member");
  viewer = await createTestUser("viewer");
  outsider = await createTestUser("outsider");

  const workspace = await createTeamWorkspace(owner.id, { name: "Labels Test Team" });
  workspaceId = workspace.id;

  await db.membership.createMany({
    data: [
      { userId: admin.id, workspaceId, role: "ADMIN" },
      { userId: member.id, workspaceId, role: "MEMBER" },
      { userId: viewer.id, workspaceId, role: "VIEWER" },
    ],
  });
});

afterAll(async () => {
  await cleanupUsers([owner.id, admin.id, member.id, viewer.id, outsider.id]);
  await db.$disconnect();
});

describe("labels", () => {
  it("lets owners and admins create labels", async () => {
    const byOwner = await createLabel(owner.id, workspaceId, { name: "Bug", color: "#ef4444" });
    const byAdmin = await createLabel(admin.id, workspaceId, { name: "Design", color: "#8b5cf6" });

    expect(byOwner.name).toBe("Bug");
    expect(byAdmin.taskCount).toBe(0);
  });

  it("stops members and viewers from creating labels", async () => {
    await expectAppError(
      createLabel(member.id, workspaceId, { name: "Nope", color: "#ef4444" }),
      "FORBIDDEN",
    );
    await expectAppError(
      createLabel(viewer.id, workspaceId, { name: "Nope", color: "#ef4444" }),
      "FORBIDDEN",
    );
  });

  it("refuses two labels with the same name in one workspace", async () => {
    await expectAppError(
      createLabel(owner.id, workspaceId, { name: "Bug", color: "#10b981" }),
      "CONFLICT",
    );
  });

  it("lets everybody in the workspace read the labels", async () => {
    const labels = await listLabels(viewer.id, workspaceId);

    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it("answers 'not found' when an outsider lists the labels", async () => {
    await expectAppError(listLabels(outsider.id, workspaceId), "NOT_FOUND");
  });

  it("answers 'not found' when an outsider edits or deletes a label by its id (IDOR)", async () => {
    const label = await createLabel(owner.id, workspaceId, { name: "Private", color: "#0ea5e9" });

    await expectAppError(updateLabel(outsider.id, label.id, { name: "Hacked" }), "NOT_FOUND");
    await expectAppError(deleteLabel(outsider.id, label.id), "NOT_FOUND");

    const stillThere = await db.label.findUnique({ where: { id: label.id } });
    expect(stillThere?.name).toBe("Private");
  });

  it("lets an admin rename a label but not use a name that already exists", async () => {
    const label = await createLabel(owner.id, workspaceId, { name: "Docs", color: "#eab308" });

    const renamed = await updateLabel(admin.id, label.id, { name: "Documentation" });
    expect(renamed.name).toBe("Documentation");

    await expectAppError(updateLabel(admin.id, label.id, { name: "Bug" }), "CONFLICT");
  });

  it("stops members from editing or deleting labels", async () => {
    const label = await createLabel(owner.id, workspaceId, { name: "Locked", color: "#ec4899" });

    await expectAppError(updateLabel(member.id, label.id, { name: "X2" }), "FORBIDDEN");
    await expectAppError(deleteLabel(viewer.id, label.id), "FORBIDDEN");
  });

  it("deletes a label and removes it from tasks, but keeps the tasks", async () => {
    const project = await db.project.create({ data: { name: "P", workspaceId } });
    const label = await createLabel(owner.id, workspaceId, { name: "Temporary", color: "#6366f1" });
    const task = await db.task.create({
      data: {
        title: "Tagged task",
        projectId: project.id,
        createdById: owner.id,
        labels: { connect: [{ id: label.id }] },
      },
    });

    await deleteLabel(owner.id, label.id);

    const taskAfter = await db.task.findUnique({
      where: { id: task.id },
      include: { labels: true },
    });

    expect(taskAfter).not.toBeNull();
    expect(taskAfter?.labels).toHaveLength(0);
  });
});
