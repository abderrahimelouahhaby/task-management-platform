import { describe, expect, it } from "vitest";
import {
  ROLES,
  assignableRoles,
  can,
  canAddMember,
  canChangeRole,
  canRemoveMember,
  type Action,
  type Role,
} from "./permissions";

const ALL_ROLES: Role[] = [...ROLES];

// Which roles may do each action (for a task nobody owns: no context given)
const allowedRoles: Record<Action, Role[]> = {
  "workspace:view": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "member:view": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "project:view": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "workspace:rename": ["OWNER"],
  "workspace:delete": ["OWNER"],
  "project:create": ["OWNER", "ADMIN"],
  "project:update": ["OWNER", "ADMIN"],
  "project:delete": ["OWNER", "ADMIN"],
  "label:manage": ["OWNER", "ADMIN"],
  "task:create": ["OWNER", "ADMIN", "MEMBER"],
  "task:update": ["OWNER", "ADMIN"], // members need ownership (tested below)
  "task:delete": ["OWNER", "ADMIN"], // members need ownership (tested below)
};

describe("can (role x action matrix)", () => {
  for (const [action, roles] of Object.entries(allowedRoles) as [Action, Role[]][]) {
    for (const role of ALL_ROLES) {
      const expected = roles.includes(role);

      it(`${role} ${expected ? "can" : "cannot"} ${action}`, () => {
        expect(can(role, action)).toBe(expected);
      });
    }
  }
});

describe("can (member task ownership rules)", () => {
  const me = "user-me";
  const other = "user-other";

  it("lets a member update a task they created", () => {
    expect(can("MEMBER", "task:update", { userId: me, createdById: me, assigneeId: null })).toBe(
      true,
    );
  });

  it("lets a member update a task assigned to them", () => {
    expect(can("MEMBER", "task:update", { userId: me, createdById: other, assigneeId: me })).toBe(
      true,
    );
  });

  it("stops a member from updating someone else's task", () => {
    expect(
      can("MEMBER", "task:update", { userId: me, createdById: other, assigneeId: other }),
    ).toBe(false);
  });

  it("lets a member delete a task they created", () => {
    expect(can("MEMBER", "task:delete", { userId: me, createdById: me, assigneeId: null })).toBe(
      true,
    );
  });

  it("stops a member from deleting a task that is only assigned to them", () => {
    expect(can("MEMBER", "task:delete", { userId: me, createdById: other, assigneeId: me })).toBe(
      false,
    );
  });

  it("never lets a viewer change tasks, even their own", () => {
    const context = { userId: me, createdById: me, assigneeId: me };

    expect(can("VIEWER", "task:update", context)).toBe(false);
    expect(can("VIEWER", "task:delete", context)).toBe(false);
  });

  it("lets admins and owners change any task", () => {
    const context = { userId: me, createdById: other, assigneeId: other };

    expect(can("ADMIN", "task:update", context)).toBe(true);
    expect(can("OWNER", "task:delete", context)).toBe(true);
  });
});

describe("member management rules", () => {
  it("lets the owner hand out admin, member and viewer, but never owner", () => {
    expect(assignableRoles("OWNER")).toEqual(["ADMIN", "MEMBER", "VIEWER"]);
    expect(canAddMember("OWNER", "OWNER")).toBe(false);
  });

  it("lets an admin add members and viewers, but not admins", () => {
    expect(canAddMember("ADMIN", "MEMBER")).toBe(true);
    expect(canAddMember("ADMIN", "VIEWER")).toBe(true);
    expect(canAddMember("ADMIN", "ADMIN")).toBe(false);
  });

  it("stops members and viewers from adding anyone", () => {
    for (const role of ["MEMBER", "VIEWER"] as const) {
      expect(assignableRoles(role)).toEqual([]);
      expect(canAddMember(role, "VIEWER")).toBe(false);
    }
  });

  it("never lets anyone remove the owner", () => {
    for (const role of ALL_ROLES) {
      expect(canRemoveMember(role, "OWNER")).toBe(false);
    }
  });

  it("lets an owner remove admins, and an admin remove only members and viewers", () => {
    expect(canRemoveMember("OWNER", "ADMIN")).toBe(true);
    expect(canRemoveMember("ADMIN", "ADMIN")).toBe(false);
    expect(canRemoveMember("ADMIN", "MEMBER")).toBe(true);
    expect(canRemoveMember("ADMIN", "VIEWER")).toBe(true);
    expect(canRemoveMember("MEMBER", "VIEWER")).toBe(false);
  });

  it("lets only the owner change roles, and never to or from owner", () => {
    expect(canChangeRole("OWNER", "MEMBER", "ADMIN")).toBe(true);
    expect(canChangeRole("OWNER", "OWNER", "ADMIN")).toBe(false);
    expect(canChangeRole("OWNER", "MEMBER", "OWNER")).toBe(false);
    expect(canChangeRole("ADMIN", "MEMBER", "VIEWER")).toBe(false);
    expect(canChangeRole("MEMBER", "VIEWER", "MEMBER")).toBe(false);
  });
});
