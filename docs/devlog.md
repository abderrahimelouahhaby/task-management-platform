# Devlog

## Day 1

- Done:
  project setup, Prettier, ESLint, Husky, commitlint, Docker Postgres, Prisma 7, Vitest, CI, app shell with dark mode, Vercel + Neon deploy.
- Blocked / confusing: Prisma had a new version 8 with a completely different setup, so I had to pin Prisma to version 7 (`prisma@7`). Tools move fast, so pinning versions matters.
- Learned:
  - A professional Git workflow: feature branches, pull requests, squash and merge, Conventional Commits checked automatically by Husky + commitlint, and a protected `main` branch that needs a green CI check.
  - Environment variables should be validated with Zod when the app starts, so a missing or wrong setting fails immediately with a clear message.
- Plan for tomorrow: database schema and authentication.

## Day 2

- Done: full Prisma schema, first migration, seed data, Better Auth (email and password), personal workspace on sign up, login and sign up pages, route protection (proxy + server check), Vitest integration test, Playwright auth flows, CI with Postgres service.
- Blocked / confusing: Next.js 16 showed a "uncached data during prerendering" error until I turned off Cache Components. My form errors were not red because my CSS color variables were incomplete (`--destructive` was missing). On production, sign up failed with a 403 because `BETTER_AUTH_URL` did not exactly match my site's address.
- Learned:
  - How login works: the password is stored as a one-way hash, a session row is saved in the database, and the browser gets an HttpOnly cookie. The proxy only checks that a cookie exists (fast but easy to fake), so the real protection is the server check that asks the database if the session is valid.
  - Security details matter: show the same generic message for a wrong email or wrong password (so attackers cannot find out which emails have accounts), and keep secrets out of Git.
  - Production needs its own setup: environment variables per environment on Vercel, a migration run on the Neon database, and `BETTER_AUTH_URL` set to only the site's origin (`https://...`, no path, no trailing slash).
- Plan for tomorrow: permissions, workspaces and members, projects.

## Day 3

- Done: role permission rules (Owner, Admin, Member, Viewer) with a full test matrix, API helpers (`withAuth`, standard `{ data }` / `{ error }` responses, safe error handling), workspace, members and projects services with the permission checks inside, workspace URLs (`/w/[workspaceId]`), workspace switcher, Settings (General and Members tabs), Projects screen, and integration tests that include IDOR checks.
- Blocked / confusing: No big blockers today. The permission tests made it easy to be confident when I changed things.
- Learned:
  - Authentication answers "who are you?" and authorization answers "what can you do?". Broken access control is the number one web security risk, so I wrote the permission rules first as plain functions and tested every role against every action. Anything not listed is denied by default.
  - The server must check everything, because the UI only hides buttons. A user who is not in a workspace gets a 404 instead of a 403, so the workspace's existence is never revealed. Lookups are scoped by workspace, so ids from another workspace never match (IDOR). I tested this by calling the API by hand as a Viewer and as an Admin.
  - Clean layers help a lot: thin routes (login check, Zod validation, then call a service), services that check membership and role before doing the work, and one shared `can()` function used by both the server and the UI. TanStack Query then handles loading, caching and refreshing the lists after every change.
- Plan for tomorrow: tasks CRUD, labels, and the task list view.

## Day 4

- Done: labels (service, API, tests, Settings screen), date helpers with unit tests, task schemas, task service and API with the Member ownership rule, integration tests for tasks, task list screen, task create/edit dialog, status/priority badges, due date colors, label picker, and an optimistic status change with rollback.
- Blocked / confusing:how optimistic updates work, why due dates are stored as midnight UTC.
- Learned:
  - Ids inside the request body are just as dangerous as ids in the URL. A project or label id sent by the browser must be checked to belong to the same workspace, otherwise a task could be linked to another workspace's data. I wrote tests that try exactly this attack. I also pick fields one by one when saving (a whitelist), so a client can never set fields like `createdById` or `completedAt`.
  - An optimistic update changes the screen first and asks the server afterwards. If the server refuses, the cache goes back to the saved copy and a toast explains why. The steps are: cancel running reloads, save a copy, change the cache, roll back on error, and always reload the real data at the end.
  - A due date is a calendar day, not a moment in time. I store it as midnight UTC, always format it in UTC, and decide overdue, today or later by comparing date text (`YYYY-MM-DD`). This stops dates from shifting by one day in different time zones.
- Plan for tomorrow: assigning tasks, search and filters in the URL, and the calendar view.

## Day 5

- Done: assigning tasks (only workspace members), a fix for the due date validation, search, filters, sorting and pagination with Zod-validated query parameters, a filter bar that lives in the URL (debounced search), a calendar API and a Monday-first calendar view, a shared task list component, and a collapsible sidebar with Zustand.
- Blocked / confusing: Four things took me a while to understand. First, why every sort must end with the task `id`: without a unique tie-breaker, two tasks with the same due date can switch places between page 1 and page 2, so a task can appear twice or never. Second, why the browser sends `today` to the API: the server does not know the user's time zone, so "overdue" and "due today" cannot be decided there. Third, the debounced search: the `useEffect` must return a `clearTimeout` cleanup, otherwise every keystroke still sends a request. Fourth, the calendar's hydration warning: the server and the browser disagree about today's date, so the calendar waits for the browser to mount (`useSyncExternalStore`) before drawing.
- Learned:
  - Filters belong in the URL, not in component state. The URL is then the single source of truth: filtered lists survive a refresh, can be shared as a link, and work with the Back button. Because anyone can edit the URL, the same Zod schema validates it in the browser and on the server, and a broken URL falls back to the defaults instead of crashing.
  - Every query parameter is user input. I validate known values only, cap the page size at 50, limit the search text and the calendar range (62 days), and always keep the workspace in the query, so a foreign project, label or assignee id matches nothing. Search text goes to the database as a parameter, and a test with an SQL injection string proves the table is untouched.
  - Found and fixed my own bug: `new Date("2026-13-45").toISOString()` throws, so a nonsense date made the API answer 500 instead of 400. A safe `isCalendarDay` helper that checks for an invalid date first (plus tests) fixed it. I also learned to keep dates as calendar-day text (`YYYY-MM-DD`) so time zones can never shift them.
- Plan for tomorrow: dashboard with stats and charts, responsive and dark mode polish, an accessibility pass, and Playwright tests for the main flows.
