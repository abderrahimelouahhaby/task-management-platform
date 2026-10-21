import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { dashboardQuerySchema } from "@/features/dashboard/schemas";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { createProject } from "./projects.service";
import { getDashboardStats } from "./stats.service";
import { createTeamWorkspace } from "./workspaces.service";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

// The tests pretend today is Monday 15 June 2026, for a user in a UTC+1 time zone.
// That user's week started at 00:00 their time, which is 23:00 UTC on Sunday 14 June.
const TODAY = "2026-06-15";
const WEEK_START = "2026-06-14T23:00:00.000Z";

let owner: TestUser;
let viewer: TestUser;
let outsider: TestUser;
let workspaceId: string;

function at(value: string) {
  return new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
}

async function stats(actor: TestUser, overrides: Record<string, unknown> = {}, id = workspaceId) {
  const query = dashboardQuerySchema.parse({ today: TODAY, weekStart: WEEK_START, ...overrides });

  return getDashboardStats(actor.id, id, query);
}

beforeAll(async () => {
  owner = await createTestUser("owner");
  viewer = await createTestUser("viewer");
  outsider = await createTestUser("outsider");

  const workspace = await createTeamWorkspace(owner.id, { name: "Stats Test Team" });
  workspaceId = workspace.id;
  await db.membership.create({ data: { userId: viewer.id, workspaceId, role: "VIEWER" } });

  const projectId = (await createProject(owner.id, workspaceId, { name: "Main" })).id;
  const base = { projectId, createdById: owner.id };

  await db.task.createMany({
    data: [
      // Open tasks
      { ...base, title: "A overdue", status: "TODO", priority: "HIGH", dueDate: at("2026-06-10") },
      {
        ...base,
        title: "B due today",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: at("2026-06-15"),
      },
      { ...base, title: "C later", status: "TODO", priority: "LOW", dueDate: at("2026-06-18") },
      { ...base, title: "D no date", status: "TODO", priority: "URGENT" },
      // Done tasks (a finished task is never overdue, even with a past due date)
      {
        ...base,
        title: "E done this week",
        status: "DONE",
        priority: "HIGH",
        dueDate: at("2026-06-01"),
        completedAt: at("2026-06-15T08:00:00.000Z"),
      },
      {
        ...base,
        title: "F done before the week",
        status: "DONE",
        priority: "LOW",
        completedAt: at("2026-06-14T22:00:00.000Z"), // one hour BEFORE the week started
      },
      {
        ...base,
        title: "G done exactly at the start",
        status: "DONE",
        priority: "LOW",
        completedAt: at(WEEK_START), // exactly at the start: included
      },
    ],
  });

  // A task in another workspace that must never be counted
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

describe("numbers", () => {
  it("counts open, due today and overdue tasks", async () => {
    const result = await stats(owner);

    expect(result.open).toBe(4); // A, B, C, D
    expect(result.dueToday).toBe(1); // B
    expect(result.overdue).toBe(1); // A (E is in the past too, but it is done)
    expect(result.totalTasks).toBe(7);
  });

  it("counts the tasks finished since the start of the week, boundary included", async () => {
    const result = await stats(owner);

    // E (08:00 on Monday) and G (exactly at the start) count. F (one hour before) does not.
    expect(result.doneThisWeek).toBe(2);
  });

  it("depends on the week start sent by the browser (time zones)", async () => {
    // A user whose week started later (Monday 02:00 UTC): only E counts
    const result = await stats(owner, { weekStart: "2026-06-15T02:00:00.000Z" });

    expect(result.doneThisWeek).toBe(1);
  });

  it("never counts tasks of another workspace", async () => {
    const result = await stats(owner);

    expect(result.dueToday).toBe(1); // the foreign task is also due today, but it is not ours
    expect(result.totalTasks).toBe(7);
  });
});

describe("breakdowns", () => {
  it("counts all tasks per status", async () => {
    const result = await stats(owner);

    expect(result.byStatus).toEqual([
      { status: "TODO", count: 3 },
      { status: "IN_PROGRESS", count: 1 },
      { status: "DONE", count: 3 },
    ]);
  });

  it("counts only open tasks per priority", async () => {
    const result = await stats(owner);

    expect(result.byPriority).toEqual([
      { priority: "LOW", count: 1 }, // C (F and G are done, so they are not counted)
      { priority: "MEDIUM", count: 1 }, // B
      { priority: "HIGH", count: 1 }, // A (E is done)
      { priority: "URGENT", count: 1 }, // D
    ]);
  });

  it("lists every status and priority with zeros when the workspace is empty", async () => {
    const empty = await createTeamWorkspace(owner.id, { name: "Empty Team" });
    const result = await stats(owner, {}, empty.id);

    expect(result.totalTasks).toBe(0);
    expect(result.byStatus).toHaveLength(3);
    expect(result.byStatus.every((entry) => entry.count === 0)).toBe(true);
    expect(result.byPriority).toHaveLength(4);
    expect(result.upcoming).toEqual([]);
  });
});

describe("upcoming deadlines", () => {
  it("lists open tasks due from today on, soonest first", async () => {
    const result = await stats(owner);

    // A is overdue and D has no date, so neither is "upcoming". E, F and G are done.
    expect(result.upcoming.map((task) => task.title)).toEqual(["B due today", "C later"]);
  });

  it("shows at most 5 tasks", async () => {
    const busy = await createTeamWorkspace(owner.id, { name: "Busy Team" });
    const project = await createProject(owner.id, busy.id, { name: "Busy" });

    await db.task.createMany({
      data: Array.from({ length: 7 }, (_, index) => ({
        title: `Task ${index + 1}`,
        projectId: project.id,
        createdById: owner.id,
        dueDate: at(`2026-06-${String(16 + index).padStart(2, "0")}`),
      })),
    });

    const result = await stats(owner, {}, busy.id);

    expect(result.upcoming).toHaveLength(5);
    expect(result.upcoming[0]?.title).toBe("Task 1");
    expect(result.upcoming[4]?.title).toBe("Task 5");
  });
});

describe("access", () => {
  it("lets a viewer read the dashboard numbers", async () => {
    const result = await stats(viewer);

    expect(result.open).toBe(4);
  });

  it("answers 'not found' when an outsider asks for the numbers", async () => {
    await expectAppError(stats(outsider), "NOT_FOUND");
  });
});

describe("dashboardQuerySchema", () => {
  it("needs both today and weekStart", () => {
    expect(dashboardQuerySchema.safeParse({}).success).toBe(false);
    expect(dashboardQuerySchema.safeParse({ today: TODAY }).success).toBe(false);
    expect(dashboardQuerySchema.safeParse({ weekStart: WEEK_START }).success).toBe(false);
    expect(dashboardQuerySchema.safeParse({ today: TODAY, weekStart: WEEK_START }).success).toBe(
      true,
    );
  });

  it("refuses a date that is not real and a timestamp that is not valid", () => {
    expect(
      dashboardQuerySchema.safeParse({ today: "2026-13-45", weekStart: WEEK_START }).success,
    ).toBe(false);
    expect(dashboardQuerySchema.safeParse({ today: TODAY, weekStart: "yesterday" }).success).toBe(
      false,
    );
    expect(dashboardQuerySchema.safeParse({ today: TODAY, weekStart: "2026-06-15" }).success).toBe(
      false,
    );
  });
});
