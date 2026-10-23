import { describe, expect, it, vi } from "vitest";
import { logSecurityEvent } from "./security-log";

describe("logSecurityEvent", () => {
  it("writes one JSON line with the details of the event", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent({
      event: "access_denied",
      code: "FORBIDDEN",
      method: "POST",
      path: "/api/workspaces/abc/tasks",
      userId: "user-1",
    });

    expect(spy).toHaveBeenCalledTimes(1);

    const line = JSON.parse(String(spy.mock.calls[0]?.[0]));

    expect(line).toMatchObject({
      level: "warn",
      event: "access_denied",
      code: "FORBIDDEN",
      method: "POST",
      path: "/api/workspaces/abc/tasks",
      userId: "user-1",
    });
    expect(typeof line.at).toBe("string");

    spy.mockRestore();
  });

  it("works without a user (a visitor who is not logged in)", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logSecurityEvent({
      event: "unauthenticated",
      code: "UNAUTHORIZED",
      method: "GET",
      path: "/api/workspaces",
    });

    const line = JSON.parse(String(spy.mock.calls[0]?.[0]));

    expect(line.userId).toBeUndefined();

    spy.mockRestore();
  });
});
