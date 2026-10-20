import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { taskListQuerySchema } from "@/features/tasks/filters";
import type { TaskPage } from "@/features/tasks/types";
import { cleanupUsers, createTestUser, expectAppError } from "@/test/helpers";
import { db } from "@/server/db";
import { createProject } from "./projects.service";
import { listTasks } from "./tasks.service";
import { createTeamWorkspace } from "./workspaces.service";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

// The tests pretend today is 15 June 2026, so they never depend on the real date
const TODAY = "2026-06-15";

let owner: TestUser;
let member: TestUser;
let outsider: TestUser;
let workspaceId: string;
let projectId: string;

function at(day: string) {
  return new Date(`${day}T00:00:00.000Z`);
}

async function list(actor: TestUser, overrides: Record<string, unknown> = {}) {
  const query = taskListQuerySchema.parse({ today: TODAY, ...overrides });

  return listTasks(actor.id, workspaceId, query);
}

function titles(page: TaskPage) {
  return page.items.map((task) => task.title).sort();
}

beforeAll(async () => {
  owner = await createTestUser("owner");
  member = await createTestUser("member");
  outsider = await createTestUser("outsider");

  const workspace = await createTeamWorkspace(owner.id, { name: "Filters Test Team" });
  workspaceId = workspace.id;

  await db.membership.create({ data: { userId: member.id, workspaceId, role: "MEMBER" } });

  projectId = (await createProject(owner.id, workspaceId, { name: "Main project" })).id;
  const otherProjectId = (await createProject(owner.id, workspaceId, { name: "Other" })).id;

  const bug = await db.label.create({ data: { name: "Bug", color: "#ef4444", workspaceId } });
  const design = await db.label.create({ data: { name: "Design", color: "#8b5cf6", workspaceId } });

  const base = { createdById: owner.id };

  await db.task.create({
    data: {
      ...base,
      projectId,
      title: "Write report",
      priority: "HIGH",
      status: "TODO",
      dueDate: at("2026-06-10"), // overdue
      assigneeId: member.id,
      labels: { connect: [{ id: bug.id }] },
    },
  });
  await db.task.create({
    data: {
      ...base,
      projectId,
      title: "Send invoice",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: at("2026-06-15"), // today
      assigneeId: owner.id,
    },
  });
  await db.task.create({
    data: {
      ...base,
      projectId: otherProjectId,
      title: "Plan sprint",
      priority: "LOW",
      status: "TODO",
      dueDate: at("2026-06-18"), // this week
      labels: { connect: [{ id: design.id }] },
    },
  });
  await db.task.create({
    data: {
      ...base,
      projectId,
      title: "Study for exam",
      priority: "URGENT",
      status: "TODO",
      dueDate: at("2026-06-25"), // later
      assigneeId: member.id,
    },
  });
  await db.task.create({
    data: {
      ...base,
      projectId,
      title: "Fix login bug",
      priority: "HIGH",
      status: "DONE", // done, in the past
      dueDate: at("2026-06-01"),
      assigneeId: owner.id,
      labels: { connect: [{ id: bug.id }] },
    },
  });
  await db.task.create({
    data: {
      ...base,
      projectId,
      title: "Buy domain",
      description: "Check Namecheap prices",
      priority: "MEDIUM",
      status: "TODO", // no due date, no assignee
    },
  });
});

afterAll(async () => {
  await cleanupUsers([owner.id, member.id, outsider.id]);
  await db.$disconnect();
});

describe("search", () => {
  it("finds tasks by title, ignoring upper and lower case", async () => {
    expect(titles(await list(owner, { q: "INVOICE" }))).toEqual(["Send invoice"]);
  });

  it("also searches the description", async () => {
    expect(titles(await list(owner, { q: "namecheap" }))).toEqual(["Buy domain"]);
  });

  it("returns nothing when nothing matches", async () => {
    const page = await list(owner, { q: "does not exist anywhere" });

    expect(page.total).toBe(0);
    expect(page.items).toEqual([]);
  });

  it("treats quotes and special characters as plain text", async () => {
    const page = await list(owner, { q: `'; DROP TABLE "Task"; --` });

    expect(page.total).toBe(0);
    // The table still works afterwards
    expect((await list(owner)).total).toBe(6);
  });
});

describe("filters", () => {
  it("filters by status, and 'open' means not done", async () => {
    expect(titles(await list(owner, { status: "DONE" }))).toEqual(["Fix login bug"]);
    expect((await list(owner, { status: "open" })).total).toBe(5);
    expect(titles(await list(owner, { status: "IN_PROGRESS" }))).toEqual(["Send invoice"]);
  });

  it("filters by priority", async () => {
    expect(titles(await list(owner, { priority: "HIGH" }))).toEqual([
      "Fix login bug",
      "Write report",
    ]);
  });

  it("filters by assignee: me, unassigned, or a specific person", async () => {
    expect(titles(await list(member, { assignee: "me" }))).toEqual([
      "Study for exam",
      "Write report",
    ]);
    expect(titles(await list(owner, { assignee: "unassigned" }))).toEqual([
      "Buy domain",
      "Plan sprint",
    ]);
    expect(titles(await list(owner, { assignee: owner.id }))).toEqual([
      "Fix login bug",
      "Send invoice",
    ]);
  });

  it("filters by label and by project", async () => {
    const labels = await db.label.findMany({ where: { workspaceId } });
    const bug = labels.find((label) => label.name === "Bug");

    expect(titles(await list(owner, { label: bug?.id }))).toEqual([
      "Fix login bug",
      "Write report",
    ]);
    expect((await list(owner, { project: projectId })).total).toBe(5);
  });

  it("combines several filters", async () => {
    const page = await list(owner, { status: "open", priority: "HIGH" });

    expect(titles(page)).toEqual(["Write report"]);
  });

  it("matches nothing for ids that belong to another workspace or do not exist", async () => {
    expect((await list(owner, { project: "foreign-project-id" })).total).toBe(0);
    expect((await list(owner, { label: "foreign-label-id" })).total).toBe(0);
    expect((await list(owner, { assignee: outsider.id })).total).toBe(0);
  });
});

describe("due date filters", () => {
  it("overdue means before today and not finished", async () => {
    // "Fix login bug" is in the past too, but it is DONE, so it is not overdue
    expect(titles(await list(owner, { due: "overdue" }))).toEqual(["Write report"]);
  });

  it("today means the current day only", async () => {
    expect(titles(await list(owner, { due: "today" }))).toEqual(["Send invoice"]);
  });

  it("week means today and the next 6 days", async () => {
    expect(titles(await list(owner, { due: "week" }))).toEqual(["Plan sprint", "Send invoice"]);
  });

  it("none means tasks without a due date", async () => {
    expect(titles(await list(owner, { due: "none" }))).toEqual(["Buy domain"]);
  });
});

describe("sorting and pagination", () => {
  it("sorts by priority with the most urgent first", async () => {
    const page = await list(owner, { sort: "priority" });

    expect(page.items[0]?.title).toBe("Study for exam");
    expect(page.items.at(-1)?.priority).toBe("LOW");
  });

  it("sorts by due date with tasks without a date last", async () => {
    const page = await list(owner, { sort: "due" });

    expect(page.items[0]?.title).toBe("Fix login bug");
    expect(page.items.at(-1)?.title).toBe("Buy domain");
  });

  it("splits the results into pages without repeating or skipping any task", async () => {
    const first = await list(owner, { pageSize: 2, page: 1 });
    const second = await list(owner, { pageSize: 2, page: 2 });
    const third = await list(owner, { pageSize: 2, page: 3 });

    expect(first.total).toBe(6);
    expect(first.totalPages).toBe(3);
    expect(first.items).toHaveLength(2);
    expect(third.items).toHaveLength(2);

    const allTitles = [...first.items, ...second.items, ...third.items]
      .map((task) => task.title)
      .sort();

    expect(new Set(allTitles).size).toBe(6);
  });

  it("returns an empty page when the page number is too high", async () => {
    const page = await list(owner, { pageSize: 2, page: 99 });

    expect(page.items).toEqual([]);
    expect(page.total).toBe(6);
  });
});

describe("access", () => {
  it("answers 'not found' when an outsider lists the tasks", async () => {
    await expectAppError(list(outsider), "NOT_FOUND");
  });
});
