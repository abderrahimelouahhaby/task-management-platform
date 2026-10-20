import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { createLabel } from "./labels.service";
import { createProject, updateProject } from "./projects.service";
import { createTask, deleteTask, listTasks, updateTask } from "./tasks.service";
import { createTeamWorkspace } from "./workspaces.service";
import { taskListQuerySchema } from "@/features/tasks/filters";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let owner: TestUser;
let admin: TestUser;
let member: TestUser;
let otherMember: TestUser;
let viewer: TestUser;
let outsider: TestUser;

let workspaceId: string;
let projectId: string;
let archivedProjectId: string;
let labelId: string;

// Things that belong to ANOTHER workspace (owned by the outsider)
let foreignWorkspaceId: string;
let foreignProjectId: string;
let foreignLabelId: string;

beforeAll(async () => {
  owner = await createTestUser("owner");
  admin = await createTestUser("admin");
  member = await createTestUser("member");
  otherMember = await createTestUser("othermember");
  viewer = await createTestUser("viewer");
  outsider = await createTestUser("outsider");

  const workspace = await createTeamWorkspace(owner.id, { name: "Tasks Test Team" });
  workspaceId = workspace.id;

  await db.membership.createMany({
    data: [
      { userId: admin.id, workspaceId, role: "ADMIN" },
      { userId: member.id, workspaceId, role: "MEMBER" },
      { userId: otherMember.id, workspaceId, role: "MEMBER" },
      { userId: viewer.id, workspaceId, role: "VIEWER" },
    ],
  });

  projectId = (await createProject(owner.id, workspaceId, { name: "Main project" })).id;

  archivedProjectId = (await createProject(owner.id, workspaceId, { name: "Old project" })).id;
  await updateProject(owner.id, archivedProjectId, { archived: true });

  labelId = (await createLabel(owner.id, workspaceId, { name: "Bug", color: "#ef4444" })).id;

  const foreignWorkspace = await createTeamWorkspace(outsider.id, { name: "Foreign Team" });
  foreignWorkspaceId = foreignWorkspace.id;
  foreignProjectId = (await createProject(outsider.id, foreignWorkspaceId, { name: "Foreign" })).id;
  foreignLabelId = (
    await createLabel(outsider.id, foreignWorkspaceId, { name: "Foreign label", color: "#0ea5e9" })
  ).id;
});

afterAll(async () => {
  await cleanupUsers([owner.id, admin.id, member.id, otherMember.id, viewer.id, outsider.id]);
  await db.$disconnect();
});

describe("creating tasks", () => {
  it("lets owners, admins and members create tasks", async () => {
    const byOwner = await createTask(owner.id, workspaceId, { title: "By owner", projectId });
    const byAdmin = await createTask(admin.id, workspaceId, { title: "By admin", projectId });
    const byMember = await createTask(member.id, workspaceId, {
      title: "By member",
      projectId,
      priority: "HIGH",
      labelIds: [labelId],
    });

    expect(byOwner.status).toBe("TODO");
    expect(byOwner.priority).toBe("MEDIUM");
    expect(byAdmin.createdById).toBe(admin.id);
    expect(byMember.priority).toBe("HIGH");
    expect(byMember.labels.map((label) => label.id)).toEqual([labelId]);
  });

  it("stops viewers from creating tasks", async () => {
    await expectAppError(
      createTask(viewer.id, workspaceId, { title: "Nope", projectId }),
      "FORBIDDEN",
    );
  });

  it("answers 'not found' when an outsider tries to create a task", async () => {
    await expectAppError(
      createTask(outsider.id, workspaceId, { title: "Nope", projectId }),
      "NOT_FOUND",
    );
  });

  it("refuses a project from another workspace", async () => {
    await expectAppError(
      createTask(owner.id, workspaceId, { title: "Sneaky", projectId: foreignProjectId }),
      "VALIDATION_ERROR",
    );
  });

  it("refuses an archived project", async () => {
    await expectAppError(
      createTask(owner.id, workspaceId, { title: "Late", projectId: archivedProjectId }),
      "VALIDATION_ERROR",
    );
  });

  it("refuses a label from another workspace", async () => {
    await expectAppError(
      createTask(owner.id, workspaceId, {
        title: "Sneaky label",
        projectId,
        labelIds: [foreignLabelId],
      }),
      "VALIDATION_ERROR",
    );
  });

  it("stores the due date as a calendar day and clears it with an empty text", async () => {
    const task = await createTask(owner.id, workspaceId, {
      title: "With a date",
      projectId,
      dueDate: "2026-12-31",
    });

    expect(task.dueDate).toBe("2026-12-31T00:00:00.000Z");

    const cleared = await updateTask(owner.id, task.id, { dueDate: "" });

    expect(cleared.dueDate).toBeNull();
  });

  it("stamps completedAt when a task is done and clears it when it is reopened", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Finish me", projectId });

    const done = await updateTask(owner.id, task.id, { status: "DONE" });
    expect(done.status).toBe("DONE");
    expect(done.completedAt).not.toBeNull();

    const reopened = await updateTask(owner.id, task.id, { status: "TODO" });
    expect(reopened.completedAt).toBeNull();
  });
});

describe("listing tasks", () => {
  const defaultQuery = taskListQuerySchema.parse({});

  it("lets a viewer read the tasks of the workspace", async () => {
    const page = await listTasks(viewer.id, workspaceId, defaultQuery);

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.total).toBeGreaterThan(0);
  });

  it("answers 'not found' when an outsider lists the tasks", async () => {
    await expectAppError(listTasks(outsider.id, workspaceId, defaultQuery), "NOT_FOUND");
  });

  it("never mixes in tasks from another workspace", async () => {
    await createTask(outsider.id, foreignWorkspaceId, {
      title: "Foreign task",
      projectId: foreignProjectId,
    });

    const search = taskListQuerySchema.parse({ q: "Foreign task" });
    const mine = await listTasks(owner.id, workspaceId, search);
    const theirs = await listTasks(outsider.id, foreignWorkspaceId, search);

    expect(mine.total).toBe(0);
    expect(theirs.total).toBe(1);
  });
});

describe("updating tasks (the Member rule)", () => {
  it("lets a member update a task they created", async () => {
    const task = await createTask(member.id, workspaceId, { title: "Mine", projectId });

    const updated = await updateTask(member.id, task.id, { title: "Mine, renamed" });

    expect(updated.title).toBe("Mine, renamed");
  });

  it("stops a member from updating someone else's task", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Owner's task", projectId });

    await expectAppError(updateTask(member.id, task.id, { title: "Hacked" }), "FORBIDDEN");
  });

  it("lets a member update a task that is assigned to them", async () => {
    const task = await createTask(owner.id, workspaceId, {
      title: "Assigned to member",
      projectId,
    });

    // Assigning people comes on Day 5, so we set it directly in the database here
    await db.task.update({ where: { id: task.id }, data: { assigneeId: member.id } });

    const updated = await updateTask(member.id, task.id, { status: "IN_PROGRESS" });

    expect(updated.status).toBe("IN_PROGRESS");
  });

  it("stops a viewer from updating tasks", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Read only", projectId });

    await expectAppError(updateTask(viewer.id, task.id, { title: "Nope" }), "FORBIDDEN");
  });

  it("lets an admin update any task", async () => {
    const task = await createTask(member.id, workspaceId, { title: "Member's task", projectId });

    const updated = await updateTask(admin.id, task.id, { priority: "URGENT" });

    expect(updated.priority).toBe("URGENT");
  });

  it("answers 'not found' when an outsider updates a task by its id (IDOR)", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Protected", projectId });

    await expectAppError(updateTask(outsider.id, task.id, { title: "Hacked" }), "NOT_FOUND");

    const stillThere = await db.task.findUnique({ where: { id: task.id } });
    expect(stillThere?.title).toBe("Protected");
  });

  it("refuses to attach a label from another workspace", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Label test", projectId });

    await expectAppError(
      updateTask(owner.id, task.id, { labelIds: [foreignLabelId] }),
      "VALIDATION_ERROR",
    );
  });

  it("refuses to move a task to a project of another workspace", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Move test", projectId });

    await expectAppError(
      updateTask(owner.id, task.id, { projectId: foreignProjectId }),
      "VALIDATION_ERROR",
    );
  });

  it("replaces the labels of a task", async () => {
    const task = await createTask(owner.id, workspaceId, {
      title: "Relabel",
      projectId,
      labelIds: [labelId],
    });

    const cleared = await updateTask(owner.id, task.id, { labelIds: [] });

    expect(cleared.labels).toHaveLength(0);
  });
});

describe("deleting tasks (the Member rule)", () => {
  it("lets a member delete a task they created", async () => {
    const task = await createTask(member.id, workspaceId, { title: "Delete me", projectId });

    await deleteTask(member.id, task.id);

    const count = await db.task.count({ where: { id: task.id } });
    expect(count).toBe(0);
  });

  it("stops a member from deleting a task that is only assigned to them", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Not yours", projectId });
    await db.task.update({ where: { id: task.id }, data: { assigneeId: member.id } });

    await expectAppError(deleteTask(member.id, task.id), "FORBIDDEN");
  });

  it("stops a member from deleting a task created by another member", async () => {
    const task = await createTask(otherMember.id, workspaceId, { title: "Other's", projectId });

    await expectAppError(deleteTask(member.id, task.id), "FORBIDDEN");
  });

  it("stops viewers from deleting tasks", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Keep", projectId });

    await expectAppError(deleteTask(viewer.id, task.id), "FORBIDDEN");
  });

  it("lets an admin delete any task", async () => {
    const task = await createTask(member.id, workspaceId, { title: "Admin deletes", projectId });

    await deleteTask(admin.id, task.id);

    const count = await db.task.count({ where: { id: task.id } });
    expect(count).toBe(0);
  });

  it("answers 'not found' when an outsider deletes a task by its id (IDOR)", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Safe", projectId });

    await expectAppError(deleteTask(outsider.id, task.id), "NOT_FOUND");

    const stillThere = await db.task.findUnique({ where: { id: task.id } });
    expect(stillThere).not.toBeNull();
  });
});
