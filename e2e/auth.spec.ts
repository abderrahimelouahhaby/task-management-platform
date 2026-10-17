import { expect, test } from "@playwright/test";

const PASSWORD = "Str0ng-Passw0rd!";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

test("logged-out visitors are redirected to the login page", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login/);
});

test("a new user can sign up, stay logged in after a refresh, and log out", async ({ page }) => {
  await page.goto("/signup");

  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: "Welcome back, Test" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: "Open user menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();

  await expect(page).toHaveURL(/\/login/);
});

test("login with unknown credentials shows a generic error", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(uniqueEmail());
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
