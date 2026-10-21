import { expect, type Browser, type BrowserContext } from "@playwright/test";

// Must match the port in playwright.config.ts
export const BASE_URL = "http://localhost:3100";
export const PASSWORD = "Str0ng-Passw0rd!";

export function uniqueEmail(label: string) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return `e2e-${slug}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@example.com`;
}

/** Creates an account through the API. The context stays logged in (the cookie is saved in it). */
export async function signUp(context: BrowserContext, name: string) {
  const email = uniqueEmail(name);

  const response = await context.request.post("/api/auth/sign-up/email", {
    headers: { Origin: BASE_URL },
    data: { name, email, password: PASSWORD },
  });

  expect(response.ok(), "sign up through the API should work").toBeTruthy();

  return { name, email };
}

/** A brand new browser with its own account. Use it when a test needs several users at once. */
export async function createUser(browser: Browser, name: string) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const user = await signUp(context, name);
  const page = await context.newPage();

  return { ...user, context, page };
}

/** Calls our API with a POST and returns the "data" part of the answer. */
export async function apiPost<T>(context: BrowserContext, path: string, data: unknown) {
  const response = await context.request.post(path, { data });

  expect(response.status(), `POST ${path} should succeed`).toBeLessThan(300);

  const body = (await response.json()) as { data: T };

  return body.data;
}

/** The id of the user's personal workspace (every new account has one). */
export async function getPersonalWorkspaceId(context: BrowserContext) {
  const response = await context.request.get("/api/workspaces");

  expect(response.ok()).toBeTruthy();

  const body = (await response.json()) as {
    data: { id: string; type: "PERSONAL" | "TEAM" }[];
  };
  const personal = body.data.find((workspace) => workspace.type === "PERSONAL");

  expect(personal, "the account should have a personal workspace").toBeDefined();

  return personal!.id;
}
