import { canAddMember, canChangeRole, canRemoveMember, type Role } from "@/lib/permissions";
import type { AddMemberInput, UpdateMemberRoleInput } from "@/features/members/schemas";
import type { MemberDto } from "@/features/members/types";
import { db } from "@/server/db";
import { conflict, forbidden, notFound } from "@/server/errors";
import { assertCan, requireMembership } from "@/server/policies/access";

const ROLE_ORDER: Record<Role, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2, VIEWER: 3 };

type MembershipRow = {
  id: string;
  role: Role;
  createdAt: Date;
  user: { id: string; name: string; email: string };
};

function toDto(membership: MembershipRow): MemberDto {
  return {
    id: membership.id,
    userId: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    role: membership.role,
    joinedAt: membership.createdAt.toISOString(),
  };
}

// Only these user fields ever leave the database (never the password or other account data)
const userSelect = { select: { id: true, name: true, email: true } } as const;

export async function listMembers(actorId: string, workspaceId: string): Promise<MemberDto[]> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "member:view");

  const memberships = await db.membership.findMany({
    where: { workspaceId },
    include: { user: userSelect },
  });

  return memberships
    .map(toDto)
    .sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name));
}

export async function addMember(
  actorId: string,
  workspaceId: string,
  input: AddMemberInput,
): Promise<MemberDto> {
  const actor = await requireMembership(actorId, workspaceId);

  if (actor.workspace.type === "PERSONAL") {
    throw forbidden("Personal workspaces cannot have other members.");
  }

  // Permission is checked BEFORE looking up the email, so people without the
  // right cannot use this endpoint to find out which emails have accounts.
  if (!canAddMember(actor.role, input.role)) {
    throw forbidden();
  }

  const user = await db.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (!user) {
    throw notFound(
      "We could not find a user with that email. They need to create an account first.",
    );
  }

  const existing = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });

  if (existing) {
    throw conflict("This user is already a member of the workspace.");
  }

  const membership = await db.membership.create({
    data: { userId: user.id, workspaceId, role: input.role },
    include: { user: userSelect },
  });

  return toDto(membership);
}

export async function updateMemberRole(
  actorId: string,
  workspaceId: string,
  membershipId: string,
  input: UpdateMemberRoleInput,
): Promise<MemberDto> {
  const actor = await requireMembership(actorId, workspaceId);

  // The lookup is scoped to THIS workspace, so ids from other workspaces never match (IDOR protection)
  const target = await db.membership.findFirst({
    where: { id: membershipId, workspaceId },
    include: { user: userSelect },
  });

  if (!target) {
    throw notFound("Member not found.");
  }

  if (!canChangeRole(actor.role, target.role, input.role)) {
    throw forbidden();
  }

  const updated = await db.membership.update({
    where: { id: target.id },
    data: { role: input.role },
    include: { user: userSelect },
  });

  return toDto(updated);
}

export async function removeMember(actorId: string, workspaceId: string, membershipId: string) {
  const actor = await requireMembership(actorId, workspaceId);

  const target = await db.membership.findFirst({
    where: { id: membershipId, workspaceId },
  });

  if (!target) {
    throw notFound("Member not found.");
  }

  if (!canRemoveMember(actor.role, target.role)) {
    throw forbidden();
  }

  await db.membership.delete({ where: { id: target.id } });

  return { id: target.id };
}
