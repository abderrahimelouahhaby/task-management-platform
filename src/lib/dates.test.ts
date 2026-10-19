import { describe, expect, it } from "vitest";
import { formatDueDate, getDueState, todayDateString, toDateInputValue } from "./dates";

describe("todayDateString", () => {
  it("formats the local date with leading zeros", () => {
    expect(todayDateString(new Date(2026, 0, 5, 10, 0))).toBe("2026-01-05");
    expect(todayDateString(new Date(2026, 9, 18, 23, 59))).toBe("2026-10-18");
  });
});

describe("getDueState", () => {
  const now = new Date(2026, 9, 18, 15, 30); // 18 October 2026, local time

  it("says overdue for a day in the past", () => {
    expect(getDueState("2026-10-17T00:00:00.000Z", now)).toBe("overdue");
  });

  it("says today for the same day", () => {
    expect(getDueState("2026-10-18T00:00:00.000Z", now)).toBe("today");
  });

  it("says later for a day in the future", () => {
    expect(getDueState("2026-10-19T00:00:00.000Z", now)).toBe("later");
  });

  it("works across month and year changes", () => {
    expect(getDueState("2026-09-30T00:00:00.000Z", now)).toBe("overdue");
    expect(getDueState("2027-01-01T00:00:00.000Z", now)).toBe("later");
  });
});

describe("toDateInputValue", () => {
  it("keeps only the date part", () => {
    expect(toDateInputValue("2026-10-23T00:00:00.000Z")).toBe("2026-10-23");
  });

  it("returns an empty string when there is no date", () => {
    expect(toDateInputValue(null)).toBe("");
  });
});

describe("formatDueDate", () => {
  it("formats the day and short month", () => {
    expect(formatDueDate("2026-10-23T00:00:00.000Z")).toBe("23 Oct");
    expect(formatDueDate("2026-01-05T00:00:00.000Z")).toBe("5 Jan");
  });
});
