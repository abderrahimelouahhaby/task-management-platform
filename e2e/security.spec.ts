import { expect, test } from "@playwright/test";
import { apiPost, getPersonalWorkspaceId, signUp } from "./helpers";

const FAKE = "does-not-exist";

// Every API route of the app (except /api/auth, which is public by design)
const ROUTES: [method: string, path: string][] = [
  ["GET", "/api/workspaces"],
  ["POST", "/api/workspaces"],
  ["PATCH", `/api/workspaces/${FAKE}`],
  ["DELETE", `/api/workspaces/${FAKE}`],
  ["GET", `/api/workspaces/${FAKE}/members`],
  ["POST", `/api/workspaces/${FAKE}/members`],
  ["PATCH", `/api/workspaces/${FAKE}/members/${FAKE}`],
  ["DELETE", `/api/workspaces/${FAKE}/members/${FAKE}`],
  ["GET", `/api/workspaces/${FAKE}/projects`],
  ["POST", `/api/workspaces/${FAKE}/projects`],
  ["PATCH", `/api/projects/${FAKE}`],
  ["DELETE", `/api/projects/${FAKE}`],
  ["GET", `/api/workspaces/${FAKE}/labels`],
  ["POST", `/api/workspaces/${FAKE}/labels`],
  ["PATCH", `/api/labels/${FAKE}`],
  ["DELETE", `/api/labels/${FAKE}`],
  ["GET", `/api/workspaces/${FAKE}/tasks`],
  ["POST", `/api/workspaces/${FAKE}/tasks`],
  ["PATCH", `/api/tasks/${FAKE}`],
  ["DELETE", `/api/tasks/${FAKE}`],
  ["GET", `/api/workspaces/${FAKE}/calendar`],
  ["GET", `/api/workspaces/${FAKE}/stats`],
];

test("every API route refuses a visitor who is not logged in", async ({ request }) => {
  test.setTimeout(120_000);

  const failures: string[] = [];

  for (const [method, path] of ROUTES) {
    const response = await request.fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      data: method === "GET" || method === "DELETE" ? undefined : {},
    });

    if (response.status() !== 401) {
      failures.push(`${method} ${path} answered ${response.status()} instead of 401`);
    }
  }

  expect(failures).toEqual([]);
});

test("responses carry the security headers and hide the framework", async ({ page }) => {
  const response = await page.goto("/login");
  const headers = response?.headers() ?? {};

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("the session cookie cannot be read by JavaScript and is not sent cross-site", async ({
  context,
}) => {
  await signUp(context, "Cookie Tester");

  const cookies = await context.cookies();
  const session = cookies.find((cookie) => cookie.name.includes("session_token"));

  expect(session, "a session cookie should exist after sign up").toBeDefined();
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("Lax");
});

test("the app runs without any Content Security Policy violation", async ({ page, context }) => {
  test.setTimeout(120_000);

  // The browser reports every blocked script, style or request in the console
  const violations: string[] = [];

  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();

  await signUp(context, "Csp Tester");
  const workspaceId = await getPersonalWorkspaceId(context);
  const base = `/api/workspaces/${workspaceId}`;
  const project = await apiPost<{ id: string }>(context, `${base}/projects`, { name: "Work" });
  await apiPost(context, `${base}/tasks`, {
    title: "Write the report",
    projectId: project.id,
    dueDate: "2020-01-01",
  });

  // Visit every screen, so every kind of component is rendered at least once
  for (const path of ["dashboard", "tasks", "calendar", "projects", "settings"]) {
    await page.goto(`/w/${workspaceId}/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  }

  // Open a dialog (it uses portals, animations and dropdowns)
  await page.goto(`/w/${workspaceId}/tasks`);
  await page.getByRole("button", { name: "New task" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  expect(violations).toEqual([]);
});
