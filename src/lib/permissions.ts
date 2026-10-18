export const ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export type Action =
  | "workspace:view"
  | "workspace:rename"
  | "workspace:delete"
  | "member:view"
  | "project:view"
  | "project:create"
  | "project:update"
  | "project:delete"
  | "label:manage"
  | "task:create"
  | "task:update"
  | "task:delete";

export type TaskContext = {
  userId: string;
  createdById: string;
  assigneeId: string | null;
};

const VIEW_ACTIONS: Action[] = ["workspace:view", "member:view", "project:view"];

const ROLE_ACTIONS: Record<Role, ReadonlySet<Action>> = {
  OWNER: new Set<Action>([
    ...VIEW_ACTIONS,
    "workspace:rename",
    "workspace:delete",
    "project:create",
    "project:update",
    "project:delete",
    "label:manage",
    "task:create",
    "task:update",
    "task:delete",
  ]),
  ADMIN: new Set<Action>([
    ...VIEW_ACTIONS,
    "project:create",
    "project:update",
    "project:delete",
    "label:manage",
    "task:create",
    "task:update",
    "task:delete",
  ]),
  MEMBER: new Set<Action>([...VIEW_ACTIONS, "task:create", "task:update", "task:delete"]),
  VIEWER: new Set<Action>(VIEW_ACTIONS),
};

export function can(role: Role, action: Action, task?: TaskContext): boolean {
  if (!ROLE_ACTIONS[role].has(action)) {
    return false;
  }

  if (role === "MEMBER" && (action === "task:update" || action === "task:delete")) {
    if (!task) {
      return false;
    }

    if (action === "task:update") {
      return task.createdById === task.userId || task.assigneeId === task.userId;
    }

    return task.createdById === task.userId;
  }

  return true;
}

const ASSIGNABLE_ROLES: Record<Role, readonly Role[]> = {
  OWNER: ["ADMIN", "MEMBER", "VIEWER"],
  ADMIN: ["MEMBER", "VIEWER"],
  MEMBER: [],
  VIEWER: [],
};

export function assignableRoles(actor: Role): readonly Role[] {
  return ASSIGNABLE_ROLES[actor];
}

export function canAddMember(actor: Role, newRole: Role): boolean {
  return ASSIGNABLE_ROLES[actor].includes(newRole);
}

export function canRemoveMember(actor: Role, target: Role): boolean {
  return target !== "OWNER" && ASSIGNABLE_ROLES[actor].includes(target);
}

export function canChangeRole(actor: Role, target: Role, newRole: Role): boolean {
  return actor === "OWNER" && target !== "OWNER" && newRole !== "OWNER";
}
