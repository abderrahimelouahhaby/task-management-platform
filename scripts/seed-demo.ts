import "dotenv/config";
import { auth } from "../src/server/auth";
import { db } from "../src/server/db";

const DEMO_WORKSPACE_NAME = "Demo Team";

const OWNER = { name: "Salma Demo", email: "demo-owner@example.com" };
const ADMIN = { name: "Youssef Demo", email: "demo-admin@example.com" };
const VIEWER = { name: "Khadija Demo", email: "demo-viewer@example.com" };

type SeedTask = {
  title: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  /** Days from today (negative = in the past). Leave out for "no due date". */
  dueInDays?: number;
  /** For finished tasks: how many days ago it was completed */
  completedDaysAgo?: number;
  assigneeId?: string;
  labelIds?: (string | undefined)[];
};

/** Midnight UTC, like every due date in the app. */
function daysFromNow(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(0, 0, 0, 0);

  return date;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function ensureUser(user: { name: string; email: string }, password: string) {
  const existing = await db.user.findUnique({ where: { email: user.email } });

  if (existing) {
    return existing;
  }

  // The same function as the real sign up: it hashes the password and creates the personal workspace
  await auth.api.signUpEmail({ body: { name: user.name, email: user.email, password } });

  return db.user.findUniqueOrThrow({ where: { email: user.email } });
}

async function createTask(projectId: string, createdById: string, task: SeedTask) {
  const done = task.status === "DONE";

  return db.task.create({
    data: {
      title: task.title,
      description: task.description,
      status: task.status ?? "TODO",
      priority: task.priority ?? "MEDIUM",
      dueDate: task.dueInDays === undefined ? null : daysFromNow(task.dueInDays),
      completedAt: done ? daysAgo(task.completedDaysAgo ?? 0) : null,
      projectId,
      createdById,
      assigneeId: task.assigneeId ?? null,
      labels: {
        connect: (task.labelIds ?? [])
          .filter((id): id is string => Boolean(id))
          .map((id) => ({ id })),
      },
    },
  });
}

async function main() {
  const password = process.env.DEMO_PASSWORD;

  if (!password || password.length < 12) {
    console.error("Set DEMO_PASSWORD to a password of at least 12 characters.");
    process.exit(1);
  }

  const owner = await ensureUser(OWNER, password);
  const admin = await ensureUser(ADMIN, password);
  const viewer = await ensureUser(VIEWER, password);

  // Start fresh: remove the previous demo workspace (its projects, tasks, labels and memberships go too)
  await db.workspace.deleteMany({
    where: {
      name: DEMO_WORKSPACE_NAME,
      type: "TEAM",
      memberships: { some: { userId: owner.id, role: "OWNER" } },
    },
  });

  const workspace = await db.workspace.create({
    data: {
      name: DEMO_WORKSPACE_NAME,
      type: "TEAM",
      memberships: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: admin.id, role: "ADMIN" },
          { userId: viewer.id, role: "VIEWER" },
        ],
      },
      labels: {
        create: [
          { name: "Bug", color: "#ef4444" },
          { name: "Design", color: "#8b5cf6" },
          { name: "Client", color: "#0ea5e9" },
          { name: "Legal", color: "#f97316" },
          { name: "Marketing", color: "#ec4899" },
        ],
      },
    },
    include: { labels: true },
  });

  const label = (name: string) => workspace.labels.find((item) => item.name === name)?.id;

  const launch = await db.project.create({
    data: {
      name: "Startup launch",
      description: "Everything to open the company and ship the first version.",
      color: "#6366f1",
      workspaceId: workspace.id,
    },
  });
  const clients = await db.project.create({
    data: {
      name: "Freelance clients",
      description: "Quotes, invoices and deliveries for clients.",
      color: "#10b981",
      workspaceId: workspace.id,
    },
  });

  // Startup launch
  await createTask(launch.id, owner.id, {
    title: "Register the company (auto-entrepreneur or SARL)",
    description: "Check the documents needed and book the appointment.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueInDays: 2,
    assigneeId: owner.id,
    labelIds: [label("Legal")],
  });
  await createTask(launch.id, owner.id, {
    title: "Open a business bank account",
    priority: "MEDIUM",
    dueInDays: 6,
    assigneeId: admin.id,
    labelIds: [label("Legal")],
  });
  await createTask(launch.id, admin.id, {
    title: "Design the landing page",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueInDays: 0,
    assigneeId: admin.id,
    labelIds: [label("Design")],
  });
  await createTask(launch.id, owner.id, {
    title: "Fix the contact form on mobile",
    priority: "URGENT",
    dueInDays: -1,
    assigneeId: admin.id,
    labelIds: [label("Bug")],
  });
  await createTask(launch.id, owner.id, {
    title: "Write the launch announcement",
    priority: "MEDIUM",
    dueInDays: 9,
    assigneeId: owner.id,
    labelIds: [label("Marketing")],
  });
  await createTask(launch.id, admin.id, {
    title: "Choose the brand colors",
    status: "DONE",
    priority: "LOW",
    dueInDays: -3,
    completedDaysAgo: 1,
    assigneeId: owner.id,
    labelIds: [label("Design")],
  });
  await createTask(launch.id, owner.id, {
    title: "Set up the domain name",
    status: "DONE",
    priority: "MEDIUM",
    dueInDays: -14,
    completedDaysAgo: 12,
    assigneeId: owner.id,
  });

  // Freelance clients
  await createTask(clients.id, owner.id, {
    title: "Send the invoice to the Casablanca bakery",
    priority: "HIGH",
    dueInDays: 0,
    assigneeId: owner.id,
    labelIds: [label("Client")],
  });
  await createTask(clients.id, owner.id, {
    title: "Prepare the proposal for the Rabat agency",
    priority: "MEDIUM",
    dueInDays: 4,
    assigneeId: admin.id,
    labelIds: [label("Client")],
  });
  await createTask(clients.id, owner.id, {
    title: "Follow up with the Tangier client about the quote",
    priority: "HIGH",
    dueInDays: -2,
    assigneeId: owner.id,
    labelIds: [label("Client")],
  });
  await createTask(clients.id, admin.id, {
    title: "Update the portfolio website",
    priority: "LOW",
  });
  await createTask(clients.id, owner.id, {
    title: "Deliver the logo files to the client",
    status: "DONE",
    priority: "MEDIUM",
    dueInDays: -2,
    completedDaysAgo: 2,
    assigneeId: owner.id,
    labelIds: [label("Client")],
  });

  console.log("Demo data is ready.");
  console.log(`- ${OWNER.email}  (Owner of "${DEMO_WORKSPACE_NAME}")`);
  console.log(`- ${ADMIN.email}  (Admin)`);
  console.log(`- ${VIEWER.email}  (Viewer)`);
}

main()
  .catch((error) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
