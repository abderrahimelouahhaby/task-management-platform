import { expect, test } from "@playwright/test";
import { apiPost, getPersonalWorkspaceId, signUp } from "./helpers";

test("a user can search, filter and complete tasks", async ({ page, context }) => {
  await signUp(context, "Task Tester");

  // Set the data up through the API (fast), then test the screen
  const workspaceId = await getPersonalWorkspaceId(context);
  const project = await apiPost<{ id: string }>(
    context,
    `/api/workspaces/${workspaceId}/projects`,
    {
      name: "Work",
    },
  );

  for (const [title, priority] of [
    ["Write report", "HIGH"],
    ["Send invoice", "MEDIUM"],
    ["Buy domain", "LOW"],
  ]) {
    await apiPost(context, `/api/workspaces/${workspaceId}/tasks`, {
      title,
      priority,
      projectId: project.id,
    });
  }

  await page.goto(`/w/${workspaceId}/tasks`);
  await expect(page.getByRole("checkbox")).toHaveCount(3);

  // 1. Search. The address changes after a short pause (the debounce).
  await page.getByLabel("Search tasks").fill("invoice");
  await expect(page).toHaveURL(/q=invoice/);
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByText("Send invoice")).toBeVisible();

  // 2. The filter lives in the URL, so it survives a refresh
  await page.reload();
  await expect(page.getByLabel("Search tasks")).toHaveValue("invoice");
  await expect(page.getByRole("checkbox")).toHaveCount(1);

  // 3. Clear the filters
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(page.getByRole("checkbox")).toHaveCount(3);

  // 4. Complete a task (wait until the server has answered)
  const saved = page.waitForResponse(
    (response) => response.url().includes("/api/tasks/") && response.request().method() === "PATCH",
  );
  await page.getByRole("checkbox", { name: /Send invoice/ }).click();
  await saved;
  await expect(page.getByRole("checkbox", { name: /Send invoice/ })).toBeChecked();

  // 5. "Open" tasks do not include the finished one
  await page.getByRole("combobox", { name: "Filter by status" }).click();
  await page.getByRole("option", { name: "Open" }).click();
  await expect(page).toHaveURL(/status=open/);
  await expect(page.getByRole("checkbox")).toHaveCount(2);
  await expect(page.getByText("Send invoice")).toHaveCount(0);
});
