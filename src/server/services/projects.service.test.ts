import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { createProject, deleteProject, listProjects, updateProject } from "./projects.service";
import { createTeamWorkspace } from "./workspaces.service";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let owner: TestUser;
let admin: TestUser;
let member: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let workspaceId: string;
let projectId: string;

beforeAll(async () => {
  owner = await createTestUser("owner");
  admin = await createTestUser("admin");
  member = await createTestUser("member");
  viewer = await createTestUser("viewer");
  outsider = await createTestUser("outsider");

  const workspace = await createTeamWorkspace(owner.id, { name: "Projects Test Team" });
  workspaceId = workspace.id;

  await db.membership.createMany({
    data: [
      { userId: admin.id, workspaceId, role: "ADMIN" },
      { userId: member.id, workspaceId, role: "MEMBER" },
      { userId: viewer.id, workspaceId, role: "VIEWER" },
    ],
  });

  const project = await createProject(owner.id, workspaceId, { name: "Existing project" });
  projectId = project.id;
});

afterAll(async () => {
  await cleanupUsers([owner.id, admin.id, member.id, viewer.id, outsider.id]);
  await db.$disconnect();
});

describe("projects", () => {
  it("lets owners and admins create projects", async () => {
    const byOwner = await createProject(owner.id, workspaceId, {
      name: "By the owner",
      color: "#6366f1",
    });
    const byAdmin = await createProject(admin.id, workspaceId, { name: "By the admin" });

    expect(byOwner.name).toBe("By the owner");
    expect(byAdmin.taskCount).toBe(0);
  });

  it("stops members and viewers from creating projects", async () => {
    await expectAppError(createProject(member.id, workspaceId, { name: "Nope" }), "FORBIDDEN");
    await expectAppError(createProject(viewer.id, workspaceId, { name: "Nope" }), "FORBIDDEN");
  });

  it("lets a viewer read the projects", async () => {
    const projects = await listProjects(viewer.id, workspaceId);

    expect(projects.length).toBeGreaterThan(0);
  });

  it("answers 'not found' when an outsider lists the projects", async () => {
    await expectAppError(listProjects(outsider.id, workspaceId), "NOT_FOUND");
  });

  it("answers 'not found' when an outsider updates or deletes a project by its id (IDOR)", async () => {
    await expectAppError(updateProject(outsider.id, projectId, { name: "Hacked" }), "NOT_FOUND");
    await expectAppError(deleteProject(outsider.id, projectId), "NOT_FOUND");

    const stillThere = await db.project.findUnique({ where: { id: projectId } });
    expect(stillThere?.name).toBe("Existing project");
  });

  it("answers 'not found' for a project id that does not exist", async () => {
    await expectAppError(updateProject(owner.id, "does-not-exist", { name: "X2" }), "NOT_FOUND");
  });

  it("stops members and viewers from updating or deleting projects", async () => {
    await expectAppError(updateProject(member.id, projectId, { name: "Nope" }), "FORBIDDEN");
    await expectAppError(deleteProject(viewer.id, projectId), "FORBIDDEN");
  });

  it("lets an admin update, archive and restore a project", async () => {
    const renamed = await updateProject(admin.id, projectId, {
      name: "Renamed project",
      description: "A description",
    });
    expect(renamed.name).toBe("Renamed project");
    expect(renamed.description).toBe("A description");

    const archived = await updateProject(admin.id, projectId, { archived: true });
    expect(archived.archived).toBe(true);

    const restored = await updateProject(admin.id, projectId, { archived: false });
    expect(restored.archived).toBe(false);
  });

  it("lets the owner delete a project", async () => {
    const temporary = await createProject(owner.id, workspaceId, { name: "Temporary" });

    await deleteProject(owner.id, temporary.id);

    const count = await db.project.count({ where: { id: temporary.id } });
    expect(count).toBe(0);
  });
});
