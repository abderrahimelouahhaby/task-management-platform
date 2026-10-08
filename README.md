# Mitodo

A lightweight, self-hosted **task management platform** built with Next.js. Create an account,
capture tasks with notes, and manage them from anywhere — with full control over your data.

> **Status:** In active development. Core features are functional; more are on the way.

## Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Framework  | [Next.js 16](https://nextjs.org) (App Router), React 19 |
| Language   | TypeScript                                              |
| Database   | PostgreSQL 17 (via Docker)                              |
| ORM        | Prisma 7 + `@prisma/adapter-pg` driver adapter          |
| Auth       | Better Auth (email & password)                          |
| Styling    | Tailwind CSS 4, dark/light theme via `next-themes`      |
| Validation | Zod                                                     |
| Icons      | lucide-react                                            |

## Features

- **Email & password authentication** — register, sign in, and session management powered by Better Auth
- **Task CRUD** — create, read, update, and delete your tasks from the dashboard
- **Per-user data isolation** — every task is scoped to its owner; API routes enforce authentication
- **Validated input** — all writes are checked with Zod schemas before hitting the database
- **Dark & light mode** — system-aware theme toggle
- **Responsive UI** — works across desktop and mobile

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Docker](https://docs.docker.com/get-docker/) (for the local PostgreSQL instance)

### Installation

```bash
# 1. Clone the repository
git clone git@github.com:abderrahimelouahhaby/mitodo-project.git
cd mitodo-project

# 2. Start PostgreSQL
docker compose up -d

# 3. Configure environment variables
cp .env.example .env
# then edit .env — generate a secret with: openssl rand -base64 32

# 4. Install dependencies
npm install

# 5. Generate the Prisma client and apply migrations
npx prisma generate
npx prisma migrate deploy

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

| Variable             | Description                       | Example                                                |
| -------------------- | --------------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string      | `postgresql://postgres:postgres@localhost:5432/mitodo` |
| `BETTER_AUTH_SECRET` | Secret used to sign auth sessions | `openssl rand -base64 32`                              |
| `BETTER_AUTH_URL`    | Base URL of the running app       | `http://localhost:3000`                                |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login and register pages
│   ├── api/
│   │   ├── auth/        # Better Auth catch-all route
│   │   └── notes/       # Task CRUD endpoints
│   ├── dashboard/       # Authenticated task list
│   ├── layout.tsx       # Root layout (providers, header, footer)
│   └── page.tsx         # Landing page
├── components/          # UI components (forms, items, theme toggle)
├── generated/prisma/    # Generated Prisma client (gitignored)
└── lib/
    ├── auth.ts          # Better Auth server config
    ├── auth-client.ts   # Better Auth React client
    ├── prisma.ts        # Prisma client singleton
    ├── require-auth.ts  # Session guard for API routes
    └── validations/     # Zod schemas
prisma/
├── schema.prisma        # Data models
└── migrations/          # SQL migrations
```

## Available Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start the development server     |
| `npm run build`        | Create a production build        |
| `npm run start`        | Serve the production build       |
| `npm run lint`         | Run ESLint                       |
| `npm run format`       | Format all files with Prettier   |
| `npm run format:check` | Check formatting without writing |

Useful Prisma commands: `npx prisma generate`, `npx prisma migrate dev`, `npx prisma studio`.

## API Reference

All endpoints under `/api/notes` require an authenticated session (HTTP-only cookie),
otherwise they return `401 Unauthorized`. Bodies must be `application/json`.

| Method   | Endpoint         | Description    | Body                                   |
| -------- | ---------------- | -------------- | -------------------------------------- |
| `GET`    | `/api/notes`     | List own tasks | —                                      |
| `POST`   | `/api/notes`     | Create a task  | `{ title: string, content?: string }`  |
| `PATCH`  | `/api/notes/:id` | Update a task  | `{ title?: string, content?: string }` |
| `DELETE` | `/api/notes/:id` | Delete a task  | —                                      |

Auth endpoints are served by Better Auth at `/api/auth/*`.
