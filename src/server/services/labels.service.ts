import type { CreateLabelInput, UpdateLabelInput } from "@/features/labels/schemas";
import type { LabelDto } from "@/features/labels/types";
import { db } from "@/server/db";
import { conflict, notFound } from "@/server/errors";
import { assertCan, requireMembership } from "@/server/policies/access";
import { isUniqueConstraintError } from "@/server/prisma-errors";

const labelSelect = {
  id: true,
  name: true,
  color: true,
  _count: { select: { tasks: true } },
} as const;

type LabelRow = {
  id: string;
  name: string;
  color: string;
  _count: { tasks: number };
};

function toDto(label: LabelRow): LabelDto {
  return { id: label.id, name: label.name, color: label.color, taskCount: label._count.tasks };
}

const DUPLICATE_MESSAGE = "A label with this name already exists in this workspace.";

async function requireLabelAccess(actorId: string, labelId: string) {
  const label = await db.label.findUnique({
    where: { id: labelId },
    select: { id: true, name: true, workspaceId: true },
  });

  if (!label) {
    throw notFound();
  }

  const actor = await requireMembership(actorId, label.workspaceId);

  assertCan(actor.role, "label:manage");

  return label;
}

export async function listLabels(actorId: string, workspaceId: string): Promise<LabelDto[]> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "workspace:view");

  const labels = await db.label.findMany({
    where: { workspaceId },
    select: labelSelect,
    orderBy: { name: "asc" },
  });

  return labels.map(toDto);
}

export async function createLabel(
  actorId: string,
  workspaceId: string,
  input: CreateLabelInput,
): Promise<LabelDto> {
  const actor = await requireMembership(actorId, workspaceId);

  assertCan(actor.role, "label:manage");

  const existing = await db.label.findUnique({
    where: { workspaceId_name: { workspaceId, name: input.name } },
    select: { id: true },
  });

  if (existing) {
    throw conflict(DUPLICATE_MESSAGE);
  }

  try {
    const label = await db.label.create({
      data: { workspaceId, name: input.name, color: input.color },
      select: labelSelect,
    });

    return toDto(label);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw conflict(DUPLICATE_MESSAGE);
    }
    throw error;
  }
}

export async function updateLabel(
  actorId: string,
  labelId: string,
  input: UpdateLabelInput,
): Promise<LabelDto> {
  const label = await requireLabelAccess(actorId, labelId);

  if (input.name !== undefined && input.name !== label.name) {
    const existing = await db.label.findUnique({
      where: { workspaceId_name: { workspaceId: label.workspaceId, name: input.name } },
      select: { id: true },
    });

    if (existing) {
      throw conflict(DUPLICATE_MESSAGE);
    }
  }

  try {
    const updated = await db.label.update({
      where: { id: labelId },
      data: { name: input.name, color: input.color },
      select: labelSelect,
    });

    return toDto(updated);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw conflict(DUPLICATE_MESSAGE);
    }
    throw error;
  }
}

export async function deleteLabel(actorId: string, labelId: string) {
  await requireLabelAccess(actorId, labelId);

  await db.label.delete({ where: { id: labelId } });

  return { id: labelId };
}
