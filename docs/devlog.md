# Devlog

---

## 📅 Day 1: Setup, tooling, CI, and deployment

- **Core Deliverables:**
  - Initialized project architecture with App Shell, dark mode support, and CI/CD pipelines.
  - Configured code quality and git hooks: Prettier, ESLint, Husky, and commitlint (Conventional Commits).
  - Set up local infrastructure with Docker Postgres and Prisma 7.
  - Deployed staging environment to Vercel connected to Neon Serverless Postgres.
- **Technical Challenges & Solutions:**
  - _Prisma Versioning:_ Encountered breaking changes in early Prisma v8 alphas; pinned dependency to stable `prisma@7` to ensure predictable builds. Tooling stability was prioritized over bleeding-edge instability.
- **Key Architectural Takeaways:**
  - **Professional Git Workflow:** Established protected `main` branch enforcement, mandatory PR reviews, squash-and-merge strategies, and automated CI checks via Husky.
  - **Fail-Fast Environment Validation:** Implemented strict startup validation of environment variables using Zod so configuration errors surface immediately with descriptive messages.

---

## 📅 Day 2: Database schema and authentication

- **Core Deliverables:**
  - Designed full Prisma database schema, executed initial migrations, and created seed scripts.
  - Implemented Better Auth (email/password) with automated personal workspace creation on sign-up.
  - Built login/sign-up flows and route protection layers (lightweight proxy check + rigorous server-side database validation).
  - Configured integration tests (Vitest) and end-to-end auth flows (Playwright) running against a Postgres service in CI.
- **Technical Challenges & Solutions:**
  - _Next.js 16 Caching:_ Resolved "uncached data during prerendering" errors by explicitly tuning Cache Component settings.
  - _Design System Tokens:_ Fixed unstyled form error states by defining missing CSS variables (`--destructive`).
  - _Production OAuth/Auth URLs:_ Resolved production 403 errors by strictly configuring `BETTER_AUTH_URL` to origin-only format (`https://...`, no paths or trailing slashes).
- **Key Architectural Takeaways:**
  - **Defense-in-Depth Security:** The middleware proxy performs fast checks for cookie existence, but true security is enforced server-side by querying the database for valid active sessions.
  - **Information Dissemination Defense:** Standardized authentication error messages ("Invalid email or password") to prevent user enumeration attacks.

---

## 📅 Day 3: Workspaces, roles, permissions, and projects

- **Core Deliverables:**
  - Implemented granular Role-Based Access Control (Owner, Admin, Member, Viewer) with an exhaustive test matrix.
  - Developed standardized API helpers (`withAuth`, typed `{ data }` / `{ error }` response wrappers, safe error handling).
  - Built workspace, member, and project services enforcing embedded permission checks, dynamic workspace routing (`/w/[workspaceId]`), workspace switcher, Settings (General & Members tabs), and Projects screen.
  - Wrote integration tests verifying IDOR (Insecure Direct Object Reference) prevention.
- **Technical Challenges & Solutions:**
  - Maintained smooth feature velocity with zero major blockers by leveraging comprehensive permission test suites as a regression safety net.
- **Key Architectural Takeaways:**
  - **Authentication vs. Authorization:** Authentication verifies _who_ you are; authorization dictates _what_ you can do. Implemented a centralized `can()` rules engine evaluated on both client and server; anything not explicitly permitted is denied by default.
  - **IDOR & Resource Protection:** Enforced workspace scoping on all database queries. Unauthorized access attempts yield a `404 Not Found` instead of a `403 Forbidden` to prevent leaking the existence of private workspaces.

---

## 📅 Day 4: Tasks CRUD and labels

- **Core Deliverables:**
  - Built complete Labels CRUD system (service, API, integration tests, Settings UI).
  - Implemented robust date utilities with comprehensive unit testing.
  - Developed task schemas, services, and APIs enforcing Member ownership rules, alongside the main task list view, create/edit dialogs, status/priority badges, due date color coding, and label pickers.
  - Implemented optimistic status updates with automatic rollback on server error.
- **Technical Challenges & Solutions:**
  - Addressed complex state reconciliation for optimistic UI mutations and standardized timezone-agnostic date storage.
- **Key Architectural Takeaways:**
  - **Strict Request Whitelisting:** Treated all request body IDs (project/label IDs) with the same suspicion as URL parameters. Implemented field whitelisting to prevent clients from tampering with protected system fields like `createdById` or `completedAt`.
  - **Optimistic Mutation Lifecycle:** Handled optimistic updates safely by: (1) cancelling active queries, (2) snapshotting current cache state, (3) applying optimistic cache updates, (4) rolling back on failure with user toast notifications, and (5) triggering background refetches.
  - **Timezone Resilience:** Stored due dates as calendar-day strings (`YYYY-MM-DD` at midnight UTC) to prevent date-shifting anomalies across global timezones.

---

## 📅 Day 5: Assignment, search, filters, and calendar

- **Core Deliverables:**
  - Added task assignment restrictions (restricted to workspace members) and fixed due date validation edge cases.
  - Implemented search, multi-criteria filtering, sorting, and pagination powered by Zod-validated query parameters synchronized directly with the URL.
  - Built a Monday-first calendar view with a dedicated calendar API and range limits (62 days).
  - Created a shared task list component and a collapsible application sidebar using Zustand.
- **Technical Challenges & Solutions:**
  - _Pagination Stability:_ Added the task `id` as a secondary tie-breaker sort parameter to prevent duplicate or skipped items during pagination when timestamps match.
  - _Timezone-Aware Filtering:_ Solved server-side date filtering by having the client pass the current date context (`today`) to calculate relative filters ("overdue", "due today").
  - _Debounce Cleanup:_ Prevented network flooding by ensuring search input effects properly return `clearTimeout` cleanup functions.
  - _Hydration Warnings:_ Resolved server/client date mismatches in the calendar by utilizing `useSyncExternalStore` to defer rendering until client mount.
- **Key Architectural Takeaways:**
  - **URL as the Single Source of Truth:** Maintained filter states in URL query parameters so filtered views support browser history, page refreshes, and direct link sharing, protected end-to-end by Zod schemas with fallback defaults.
  - **Input Sanitization & SQL Injection Defense:** Capped page sizes (max 50), bounded calendar ranges, validated all search inputs, and parameterized database queries to ensure robust defense against injection attacks.

---

## 📅 Day 6: Dashboard, responsive polish, and E2E tests

- **Core Deliverables:**
  - Developed a high-performance analytics API leveraging database aggregation (`count`, `groupBy`).
  - Built the main dashboard with statistics cards, data visualization bar charts, and upcoming deadline widgets.
  - Completed comprehensive responsive design, dark mode tuning, and accessibility passes (skip links, reduced motion, contrast ratios).
  - Implemented end-to-end test suites (Playwright) covering search/filters, task completion, permission boundary blocks (Viewers/Strangers), and automated accessibility scans (`axe-core`) running in CI.
- **Technical Challenges & Solutions:**
  - _Accessibility Contrast & Tokens:_ Resolved color contrast failures in dark mode (e.g., white text on indigo-500 falling below 4.5:1 ratio) by splitting theme tokens into distinct `--primary` (backgrounds) and `--primary-text` (typography) variables.
  - _Accessible Naming:_ Fixed `label-content-name-mismatch` accessibility violations in icon buttons and avatars by pairing visible elements with hidden accessible labels (`aria-label`).
- **Key Architectural Takeaways:**
  - **Database-Level Aggregation:** Delegated calculation logic (`count`, `groupBy`) directly to the database layer rather than processing raw row arrays in application memory.
  - **Multi-Context E2E Security Verification:** Utilized multi-browser context testing in Playwright to prove security guarantees end-to-end (verifying UI constraints, API `403` responses, and stranger `404` isolation).
  - **Automated Accessibility Testing:** Integrated automated accessibility audits into CI pipelines to catch contrast, labeling, and structural issues that visual inspection misses.

---

## 📅 Day 7: Security hardening, production readiness, and release

- **Core Deliverables:**
  - Performed complete OWASP checklist security review, configured security headers, and implemented Content Security Policy (CSP).
  - Enabled security logging, Dependabot integration, and end-to-end security test suites verifying session enforcement, header presence, cookie flags, and CSP compliance.
  - Implemented database-backed rate limiting for sign-in and sign-up endpoints.
  - Created a safe, resettable demo seed script with three role accounts (Owner, Admin, Viewer).
  - Completed production verification checks on Vercel and Neon, finalized the README with screenshots and a demo GIF, and published the v1.0.0 release.
- **Technical Challenges & Solutions:**
  - _Database Migrations in Production:_ Resolved initial confusion regarding running `prisma migrate deploy` against Neon with existing migration files. Learned that migration history lives in Git (`prisma/migrations`) while the state is tracked per-database via the `_prisma_migrations` table, verifiable via `prisma migrate status`.
  - _Zero-Downtime Deployments:_ Practiced "expand, then switch" migration patterns, ensuring new required tables (like `rateLimit`) exist in production prior to releasing code that queries them.
  - _CSP & Next.js Trade-offs:_ Identified that Next.js currently requires `'unsafe-inline'` for scripts under standard configurations, marking nonce-based CSP improvements as a future enhancement.
  - _Shell History Hygiene:_ Discovered that leading-space commands still get logged in zsh by default; cleared shell history and enabled `HIST_IGNORE_SPACE`.
- **Key Architectural Takeaways:**
  - **Turn Claims into Tests:** Verified every security guarantee with an automated test (listing every route to confirm 401s without a session, testing header configuration, and listening for CSP violations). Defense-in-depth ensures a single missed layer doesn't compromise data.
  - **Distributed Rate Limiting:** Recognized that in-memory counters fail on serverless architectures like Vercel due to instance isolation; stored rate limit counters in the database instead, enforcing stricter thresholds on high-risk endpoints (e.g., 5 attempts/minute for sign-in/sign-up).
  - **Resettable Demo Architecture:** Designed demos to be fully repeatable by isolating credentials to environment variables, scoping demo accounts strictly by role, and using scripts to generate dates relative to `today`.
