# Devlog

## Day 1

- Done: project setup, Prettier, ESLint, Husky, commitlint, Docker Postgres, Prisma 7, Vitest, CI, app shell with dark mode, Vercel + Neon deploy.
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
