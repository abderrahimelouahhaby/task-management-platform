import { expect, test } from "@playwright/test";
import { apiPost, createUser } from "./helpers";

test("a viewer can read tasks, but is blocked in the screen and in the API", async ({
  browser,
}) => {
  const owner = await createUser(browser, "Olivia Owner");
  const viewer = await createUser(browser, "Victor Viewer");

  try {
    // The owner builds a team with one project and one task, and adds the viewer
    const workspace = await apiPost<{ id: string }>(owner.context, "/api/workspaces", {
      name: "E2E Team",
    });
    const base = `/api/workspaces/${workspace.id}`;
    const project = await apiPost<{ id: string }>(owner.context, `${base}/projects`, {
      name: "Website",
    });
    const task = await apiPost<{ id: string }>(owner.context, `${base}/tasks`, {
      title: "Read-only task",
      projectId: project.id,
    });
    await apiPost(owner.context, `${base}/members`, { email: viewer.email, role: "VIEWER" });

    // THE SCREEN: the viewer can read, but cannot change anything
    await viewer.page.goto(`/w/${workspace.id}/tasks`);
    await expect(viewer.page.getByText("Read-only task")).toBeVisible();
    await expect(viewer.page.getByRole("button", { name: "New task" })).toHaveCount(0);
    await expect(viewer.page.getByRole("checkbox", { name: /Read-only task/ })).toBeDisabled();

    // THE API: the same attempts, by hand, are refused by the server
    const create = await viewer.context.request.post(`${base}/tasks`, {
      data: { title: "Hacked", projectId: project.id },
    });
    expect(create.status()).toBe(403);

    const edit = await viewer.context.request.patch(`/api/tasks/${task.id}`, {
      data: { title: "Hacked" },
    });
    expect(edit.status()).toBe(403);

    const remove = await viewer.context.request.delete(`/api/tasks/${task.id}`);
    expect(remove.status()).toBe(403);

    // And the task is still untouched
    const list = await owner.context.request.get(`${base}/tasks`);
    const body = (await list.json()) as { data: { items: { title: string }[] } };
    expect(body.data.items.map((item) => item.title)).toEqual(["Read-only task"]);
  } finally {
    await owner.context.close();
    await viewer.context.close();
  }
});

test("a logged-in stranger gets a 404 for a workspace they do not belong to", async ({
  browser,
}) => {
  const owner = await createUser(browser, "Olivia Owner");
  const stranger = await createUser(browser, "Sam Stranger");

  try {
    const workspace = await apiPost<{ id: string }>(owner.context, "/api/workspaces", {
      name: "Private Team",
    });

    // THE SCREEN: the 404 page, not "forbidden", so the workspace's existence is not revealed
    await stranger.page.goto(`/w/${workspace.id}/tasks`);
    await expect(stranger.page.getByText("This page could not be found")).toBeVisible();

    // THE API: 404 as well
    const response = await stranger.context.request.get(`/api/workspaces/${workspace.id}/tasks`);
    expect(response.status()).toBe(404);
  } finally {
    await owner.context.close();
    await stranger.context.close();
  }
});
