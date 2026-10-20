import { describe, expect, it } from "vitest";
import { buildTaskQueryString, taskFiltersSchema, taskListQuerySchema } from "./filters";

describe("taskFiltersSchema", () => {
  it("fills in the defaults", () => {
    const filters = taskFiltersSchema.parse({});

    expect(filters.sort).toBe("due");
    expect(filters.page).toBe(1);
    expect(filters.pageSize).toBe(20);
    expect(filters.q).toBeUndefined();
  });

  it("turns the page text from a URL into numbers", () => {
    const filters = taskFiltersSchema.parse({ page: "3", pageSize: "10" });

    expect(filters.page).toBe(3);
    expect(filters.pageSize).toBe(10);
  });

  it("caps the page size at 50", () => {
    expect(taskFiltersSchema.safeParse({ pageSize: "50" }).success).toBe(true);
    expect(taskFiltersSchema.safeParse({ pageSize: "51" }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ pageSize: "1000" }).success).toBe(false);
  });

  it("refuses a page that is not a positive whole number", () => {
    expect(taskFiltersSchema.safeParse({ page: "0" }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ page: "-2" }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ page: "1.5" }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ page: "abc" }).success).toBe(false);
  });

  it("only accepts known values for status, priority, due and sort", () => {
    expect(taskFiltersSchema.safeParse({ status: "open" }).success).toBe(true);
    expect(taskFiltersSchema.safeParse({ status: "HACKED" }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ priority: "SUPER-URGENT" }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ due: "tomorrow" }).success).toBe(false);
    expect(taskFiltersSchema.safeParse({ sort: "random" }).success).toBe(false);
  });

  it("limits the length of the search text", () => {
    expect(taskFiltersSchema.safeParse({ q: "x".repeat(100) }).success).toBe(true);
    expect(taskFiltersSchema.safeParse({ q: "x".repeat(101) }).success).toBe(false);
  });
});

describe("taskListQuerySchema", () => {
  it("needs today for the overdue, today and week filters", () => {
    for (const due of ["overdue", "today", "week"]) {
      expect(taskListQuerySchema.safeParse({ due }).success).toBe(false);
      expect(taskListQuerySchema.safeParse({ due, today: "2026-06-15" }).success).toBe(true);
    }
  });

  it("does not need today for the no-date filter or when there is no due filter", () => {
    expect(taskListQuerySchema.safeParse({ due: "none" }).success).toBe(true);
    expect(taskListQuerySchema.safeParse({}).success).toBe(true);
  });

  it("refuses a today that is not a real day", () => {
    expect(taskListQuerySchema.safeParse({ due: "today", today: "2026-13-45" }).success).toBe(
      false,
    );
    expect(taskListQuerySchema.safeParse({ due: "today", today: "yesterday" }).success).toBe(false);
  });

  it("removes fields it does not know", () => {
    const query = taskListQuerySchema.parse({ workspaceId: "hack", status: "TODO" });

    expect("workspaceId" in query).toBe(false);
    expect(query.status).toBe("TODO");
  });
});

describe("buildTaskQueryString", () => {
  it("is empty when everything has its default value", () => {
    expect(buildTaskQueryString(taskFiltersSchema.parse({}))).toBe("");
  });

  it("includes only the filters that are set", () => {
    const query = buildTaskQueryString({ status: "open", priority: "HIGH" });

    expect(query).toBe("status=open&priority=HIGH");
  });

  it("always writes the keys in the same order", () => {
    const a = buildTaskQueryString({ priority: "HIGH", q: "report", status: "open" });
    const b = buildTaskQueryString({ status: "open", q: "report", priority: "HIGH" });

    expect(a).toBe("q=report&status=open&priority=HIGH");
    expect(b).toBe(a);
  });

  it("includes the page and sort only when they are not the defaults", () => {
    expect(buildTaskQueryString({ page: 1, sort: "due", pageSize: 20 })).toBe("");
    expect(buildTaskQueryString({ page: 3, sort: "priority" })).toBe("sort=priority&page=3");
  });

  it("encodes special characters safely", () => {
    expect(buildTaskQueryString({ q: "a&b c" })).toBe("q=a%26b+c");
  });
});
