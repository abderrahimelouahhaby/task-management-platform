import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { apiPost, getPersonalWorkspaceId, signUp } from "./helpers";

/** Fails if axe finds a serious or critical problem. The message lists what and how many. */
async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const serious = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );

  expect(
    serious.map(
      (violation) =>
        `${violation.id}: ${violation.help}\n${violation.nodes
          .map((node) => `   - ${node.html}`)
          .join("\n")}`,
    ),
  ).toEqual([]);
}

/** Waits until the page title is there and the loading skeletons are gone. */
async function waitUntilLoaded(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`accessibility scan (${scheme} mode)`, () => {
    test.use({ colorScheme: scheme, bypassCSP: true });

    test("the login page has no serious problems", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();

      await expectNoSeriousViolations(page);
    });

    test("the main app pages have no serious problems", async ({ page, context }) => {
      await signUp(context, "Axe Tester");

      const workspaceId = await getPersonalWorkspaceId(context);
      const base = `/api/workspaces/${workspaceId}`;
      const project = await apiPost<{ id: string }>(context, `${base}/projects`, { name: "Work" });
      await apiPost(context, `${base}/labels`, { name: "Bug", color: "#ef4444" });
      await apiPost(context, `${base}/tasks`, {
        title: "Write the report",
        projectId: project.id,
        priority: "HIGH",
        dueDate: "2020-01-01", // overdue, so the red state is on the page too
      });

      for (const path of ["dashboard", "tasks", "calendar", "projects", "settings"]) {
        await page.goto(`/w/${workspaceId}/${path}`);
        await waitUntilLoaded(page);
        await expectNoSeriousViolations(page);
      }
    });
  });
}
