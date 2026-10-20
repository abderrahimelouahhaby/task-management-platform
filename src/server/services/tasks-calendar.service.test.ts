import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { calendarRangeSchema } from "@/features/tasks/calendar";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { createProject } from "./projects.service";
import { listTasksInRange } from "./tasks.service";
import { createTeamWorkspace } from "./workspaces.service";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

let owner: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let workspaceId: string;

function at(day: string, time = "00:00:00.000") {
  return new Date(`${day}T${time}Z`);
}

beforeAll(async () => {
  owner = await createTestUser("owner");
  viewer = await createTestUser("viewer");
  outsider = await createTestUser("outsider");

  const workspace = await createTeamWorkspace(owner.id, { name: "Calendar Test Team" });
  workspaceId = workspace.id;
  await db.membership.create({ data: { userId: viewer.id, workspaceId, role: "VIEWER" } });

  const projectId = (await createProject(owner.id, workspaceId, { name: "Main" })).id;
  const base = { projectId, createdById: owner.id };

  await db.task.createMany({
    data: [
      { ...base, title: "Before the range", dueDate: at("2026-06-09") },
      { ...base, title: "First day", dueDate: at("2026-06-10") },
      { ...base, title: "Middle", dueDate: at("2026-06-15", "12:00:00.000") },
      { ...base, title: "Last day, late", dueDate: at("2026-06-20", "23:30:00.000") },
      { ...base, title: "After the range", dueDate: at("2026-06-21") },
      { ...base, title: "No due date" },
    ],
  });

  // A task in another workspace, in the same date range
  const foreign = await createTeamWorkspace(outsider.id, { name: "Foreign Team" });
  const foreignProject = await createProject(outsider.id, foreign.id, { name: "Foreign" });
  await db.task.create({
    data: {
      title: "Foreign task",
      projectId: foreignProject.id,
      createdById: outsider.id,
      dueDate: at("2026-06-15"),
    },
  });
});

afterAll(async () => {
  await cleanupUsers([owner.id, viewer.id, outsider.id]);
  await db.$disconnect();
});

describe("listTasksInRange", () => {
  const range = { from: "2026-06-10", to: "2026-06-20" };

  it("returns the tasks due between the two days, both days included", async () => {
    const tasks = await listTasksInRange(owner.id, workspaceId, range);

    expect(tasks.map((task) => task.title)).toEqual(["First day", "Middle", "Last day, late"]);
  });

  it("skips tasks without a due date and tasks of other workspaces", async () => {
    const tasks = await listTasksInRange(owner.id, workspaceId, range);
    const titles = tasks.map((task) => task.title);

    expect(titles).not.toContain("No due date");
    expect(titles).not.toContain("Foreign task");
  });

  it("lets a viewer read the calendar", async () => {
    const tasks = await listTasksInRange(viewer.id, workspaceId, range);

    expect(tasks).toHaveLength(3);
  });

  it("answers 'not found' when an outsider asks for the calendar", async () => {
    await expectAppError(listTasksInRange(outsider.id, workspaceId, range), "NOT_FOUND");
  });
});

describe("calendarRangeSchema", () => {
  it("accepts a normal month range", () => {
    expect(calendarRangeSchema.safeParse({ from: "2026-09-28", to: "2026-11-08" }).success).toBe(
      true,
    );
  });

  it("refuses a range that goes backwards", () => {
    expect(calendarRangeSchema.safeParse({ from: "2026-06-20", to: "2026-06-10" }).success).toBe(
      false,
    );
  });

  it("refuses a range longer than 62 days", () => {
    expect(calendarRangeSchema.safeParse({ from: "2026-01-01", to: "2026-03-05" }).success).toBe(
      false,
    );
    expect(calendarRangeSchema.safeParse({ from: "2026-01-01", to: "2026-03-04" }).success).toBe(
      true,
    );
  });

  it("refuses dates that are not real days", () => {
    expect(calendarRangeSchema.safeParse({ from: "2026-13-01", to: "2026-13-10" }).success).toBe(
      false,
    );
    expect(calendarRangeSchema.safeParse({ from: "tomorrow", to: "2026-06-10" }).success).toBe(
      false,
    );
    expect(calendarRangeSchema.safeParse({}).success).toBe(false);
  });
});
