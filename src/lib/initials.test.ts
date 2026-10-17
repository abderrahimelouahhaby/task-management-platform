import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it("uses the first and last word", () => {
    expect(getInitials("Salma Demo")).toBe("SD");
  });

  it("works with one word", () => {
    expect(getInitials("madonna")).toBe("M");
  });

  it("handles extra spaces and empty names", () => {
    expect(getInitials("  Salma   Demo  ")).toBe("SD");
    expect(getInitials("")).toBe("?");
  });
});
