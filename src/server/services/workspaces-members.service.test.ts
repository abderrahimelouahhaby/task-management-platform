import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { addMember, listMembers, removeMember, updateMemberRole } from "./members.service";
import {
  createTeamWorkspace,
  deleteWorkspace,
  ensurePersonalWorkspace,
  renameWorkspace,
} from "./workspaces.service";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let owner: TestUser;
let admin: TestUser;
let member: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let invitee: TestUser;
let workspaceId: string;

async function membershipIdOf(userId: string, inWorkspaceId: string) {
  const membership = await db.membership.findUniqueOrThrow({
    where: { userId_workspaceId: { userId, workspaceId: inWorkspaceId } },
  });

  return membership.id;
}

beforeAll(async () => {
  owner = await createTestUser("owner");
  admin = await createTestUser("admin");
  member = await createTestUser("member");
  viewer = await createTestUser("viewer");
  outsider = await createTestUser("outsider");
  invitee = await createTestUser("invitee");

  const workspace = await createTeamWorkspace(owner.id, { name: "Test Team" });
  workspaceId = workspace.id;

  await addMember(owner.id, workspaceId, { email: admin.email, role: "ADMIN" });
  await addMember(owner.id, workspaceId, { email: member.email, role: "MEMBER" });
  await addMember(owner.id, workspaceId, { email: viewer.email, role: "VIEWER" });
  await ensurePersonalWorkspace(outsider.id);
});

afterAll(async () => {
  await cleanupUsers([owner.id, admin.id, member.id, viewer.id, outsider.id, invitee.id]);
  await db.$disconnect();
});

describe("workspaces", () => {
  it("lets the owner rename a team workspace", async () => {
    const renamed = await renameWorkspace(owner.id, workspaceId, { name: "Renamed Team" });

    expect(renamed.name).toBe("Renamed Team");
  });

  it("stops an admin from renaming or deleting the workspace", async () => {
    await expectAppError(renameWorkspace(admin.id, workspaceId, { name: "Hacked" }), "FORBIDDEN");
    await expectAppError(deleteWorkspace(admin.id, workspaceId), "FORBIDDEN");
  });

  it("answers 'not found' when an outsider tries to delete someone else's workspace", async () => {
    await expectAppError(deleteWorkspace(outsider.id, workspaceId), "NOT_FOUND");
  });

  it("never renames or deletes a personal workspace", async () => {
    const personal = await ensurePersonalWorkspace(outsider.id);

    await expectAppError(renameWorkspace(outsider.id, personal.id, { name: "Nope" }), "FORBIDDEN");
    await expectAppError(deleteWorkspace(outsider.id, personal.id), "FORBIDDEN");
  });

  it("lets the owner delete a workspace they own", async () => {
    const temporary = await createTeamWorkspace(owner.id, { name: "Temporary" });

    await deleteWorkspace(owner.id, temporary.id);

    const count = await db.workspace.count({ where: { id: temporary.id } });
    expect(count).toBe(0);
  });
});

describe("members", () => {
  it("lets every member see the member list, owner first", async () => {
    const list = await listMembers(viewer.id, workspaceId);

    expect(list).toHaveLength(4);
    expect(list[0]?.role).toBe("OWNER");
  });

  it("answers 'not found' when an outsider asks for the member list", async () => {
    await expectAppError(listMembers(outsider.id, workspaceId), "NOT_FOUND");
  });

  it("stops members and viewers from adding people", async () => {
    await expectAppError(
      addMember(member.id, workspaceId, { email: invitee.email, role: "VIEWER" }),
      "FORBIDDEN",
    );
    await expectAppError(
      addMember(viewer.id, workspaceId, { email: invitee.email, role: "VIEWER" }),
      "FORBIDDEN",
    );
  });

  it("stops an admin from adding another admin", async () => {
    await expectAppError(
      addMember(admin.id, workspaceId, { email: invitee.email, role: "ADMIN" }),
      "FORBIDDEN",
    );
  });

  it("lets an admin add a member, refuses duplicates, and lets the admin remove them", async () => {
    const added = await addMember(admin.id, workspaceId, { email: invitee.email, role: "MEMBER" });

    expect(added.role).toBe("MEMBER");

    await expectAppError(
      addMember(admin.id, workspaceId, { email: invitee.email, role: "MEMBER" }),
      "CONFLICT",
    );

    await removeMember(admin.id, workspaceId, added.id);

    const list = await listMembers(owner.id, workspaceId);
    expect(list.some((entry) => entry.userId === invitee.id)).toBe(false);
  });

  it("answers 'not found' for an email without an account", async () => {
    await expectAppError(
      addMember(owner.id, workspaceId, { email: "nobody@example.com", role: "MEMBER" }),
      "NOT_FOUND",
    );
  });

  it("does not allow members in a personal workspace", async () => {
    const personal = await ensurePersonalWorkspace(outsider.id);

    await expectAppError(
      addMember(outsider.id, personal.id, { email: invitee.email, role: "MEMBER" }),
      "FORBIDDEN",
    );
  });

  it("lets only the owner change roles", async () => {
    const memberMembershipId = await membershipIdOf(member.id, workspaceId);

    await expectAppError(
      updateMemberRole(admin.id, workspaceId, memberMembershipId, { role: "VIEWER" }),
      "FORBIDDEN",
    );

    const promoted = await updateMemberRole(owner.id, workspaceId, memberMembershipId, {
      role: "ADMIN",
    });
    expect(promoted.role).toBe("ADMIN");

    const demoted = await updateMemberRole(owner.id, workspaceId, memberMembershipId, {
      role: "MEMBER",
    });
    expect(demoted.role).toBe("MEMBER");
  });

  it("protects the owner: nobody can remove or demote them", async () => {
    const ownerMembershipId = await membershipIdOf(owner.id, workspaceId);

    await expectAppError(removeMember(admin.id, workspaceId, ownerMembershipId), "FORBIDDEN");
    await expectAppError(removeMember(owner.id, workspaceId, ownerMembershipId), "FORBIDDEN");
    await expectAppError(
      updateMemberRole(owner.id, workspaceId, ownerMembershipId, { role: "ADMIN" }),
      "FORBIDDEN",
    );
  });

  it("scopes member ids to the workspace (IDOR protection)", async () => {
    const personal = await ensurePersonalWorkspace(outsider.id);
    const foreignMembershipId = await membershipIdOf(outsider.id, personal.id);

    // The owner uses THEIR workspace id with a membership id that belongs to ANOTHER workspace
    await expectAppError(removeMember(owner.id, workspaceId, foreignMembershipId), "NOT_FOUND");
    await expectAppError(
      updateMemberRole(owner.id, workspaceId, foreignMembershipId, { role: "VIEWER" }),
      "NOT_FOUND",
    );
  });
});
