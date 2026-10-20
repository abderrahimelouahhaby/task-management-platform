import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { createProject } from "./projects.service";
import { createTask, deleteTask, updateTask } from "./tasks.service";
import { createTeamWorkspace } from "./workspaces.service";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let owner: TestUser;
let member: TestUser;
let otherMember: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let workspaceId: string;
let projectId: string;

beforeAll(async () => {
  owner = await createTestUser("owner");
  member = await createTestUser("member");
  otherMember = await createTestUser("othermember");
  viewer = await createTestUser("viewer");
  outsider = await createTestUser("outsider");

  const workspace = await createTeamWorkspace(owner.id, { name: "Assignment Test Team" });
  workspaceId = workspace.id;

  await db.membership.createMany({
    data: [
      { userId: member.id, workspaceId, role: "MEMBER" },
      { userId: otherMember.id, workspaceId, role: "MEMBER" },
      { userId: viewer.id, workspaceId, role: "VIEWER" },
    ],
  });

  projectId = (await createProject(owner.id, workspaceId, { name: "Main project" })).id;
});

afterAll(async () => {
  await cleanupUsers([owner.id, member.id, otherMember.id, viewer.id, outsider.id]);
  await db.$disconnect();
});

describe("assigning tasks", () => {
  it("assigns a workspace member when the task is created", async () => {
    const task = await createTask(owner.id, workspaceId, {
      title: "Assigned at creation",
      projectId,
      assigneeId: member.id,
    });

    expect(task.assignee?.id).toBe(member.id);
  });

  it("refuses an assignee who is not a member of the workspace", async () => {
    await expectAppError(
      createTask(owner.id, workspaceId, {
        title: "Wrong assignee",
        projectId,
        assigneeId: outsider.id,
      }),
      "VALIDATION_ERROR",
    );
  });

  it("refuses to assign a non-member when updating a task", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Update test", projectId });

    await expectAppError(
      updateTask(owner.id, task.id, { assigneeId: outsider.id }),
      "VALIDATION_ERROR",
    );
  });

  it("can reassign and unassign a task", async () => {
    const task = await createTask(owner.id, workspaceId, {
      title: "Reassign me",
      projectId,
      assigneeId: member.id,
    });

    const reassigned = await updateTask(owner.id, task.id, { assigneeId: otherMember.id });
    expect(reassigned.assignee?.id).toBe(otherMember.id);

    const unassigned = await updateTask(owner.id, task.id, { assigneeId: null });
    expect(unassigned.assignee).toBeNull();
  });

  it("keeps the assignee when the update does not mention it", async () => {
    const task = await createTask(owner.id, workspaceId, {
      title: "Keep my assignee",
      projectId,
      assigneeId: member.id,
    });

    const updated = await updateTask(owner.id, task.id, { title: "Renamed" });

    expect(updated.assignee?.id).toBe(member.id);
  });

  it("gives an assigned member the right to edit the task, but not to delete it", async () => {
    const task = await createTask(owner.id, workspaceId, {
      title: "Owner's task",
      projectId,
    });

    // Before the assignment the member cannot touch it
    await expectAppError(updateTask(member.id, task.id, { title: "Nope" }), "FORBIDDEN");

    await updateTask(owner.id, task.id, { assigneeId: member.id });

    const updated = await updateTask(member.id, task.id, { status: "IN_PROGRESS" });
    expect(updated.status).toBe("IN_PROGRESS");

    await expectAppError(deleteTask(member.id, task.id), "FORBIDDEN");
  });

  it("stops a viewer from assigning tasks", async () => {
    const task = await createTask(owner.id, workspaceId, { title: "Viewer test", projectId });

    await expectAppError(updateTask(viewer.id, task.id, { assigneeId: viewer.id }), "FORBIDDEN");
  });
});
