import { expect } from "vitest";
import { db } from "@/server/db";

let counter = 0;

/** Creates a throwaway user in the test database. */
export async function createTestUser(label: string) {
  counter += 1;
  const id = `test-${label}-${Date.now()}-${counter}`;

  return db.user.create({
    data: {
      id,
      name: `${label} user`,
      email: `${id}@example.com`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/** Deletes the users and every workspace they belong to (projects, tasks, labels go with it). */
export async function cleanupUsers(userIds: string[]) {
  await db.workspace.deleteMany({ where: { memberships: { some: { userId: { in: userIds } } } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
}

/** Expects a promise to fail with an AppError that has the given code. */
export async function expectAppError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ code });
}
