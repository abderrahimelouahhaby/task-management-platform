import "dotenv/config";
import { auth } from "../src/server/auth";
import { db } from "../src/server/db";

// Development only
const DEMO_PASSWORD = "Password123!";

const SALMA = { name: "Salma Demo", email: "salma@mohima.dev" };
const YOUSSEF = { name: "Youssef Demo", email: "youssef@mohima.dev" };
const KHADIJA = { name: "Khadija Demo", email: "khadija@mohima.dev" };

type SeedTask = {
  title: string;
  description?: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueInDays?: number;
  assigneeId?: string;
  labelIds?: string[];
};

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

async function createTask(projectId: string, createdById: string, task: SeedTask) {
  return db.task.create({
    data: {
      title: task.title,
      description: task.description,
      status: task.status ?? "TODO",
      priority: task.priority ?? "MEDIUM",
      dueDate: task.dueInDays === undefined ? null : daysFromNow(task.dueInDays),
      completedAt: task.status === "DONE" ? new Date() : null,
      projectId,
      createdById,
      assigneeId: task.assigneeId ?? null,
      labels: task.labelIds ? { connect: task.labelIds.map((id) => ({ id })) } : undefined,
    },
  });
}

async function main() {
  const existing = await db.user.findUnique({ where: { email: SALMA.email } });
  if (existing) {
    console.log("Seed data already exists. Nothing to do.");
    return;
  }

  // 1. Create the three users through Better Auth (hashes the password, creates personal workspace)
  for (const user of [SALMA, YOUSSEF, KHADIJA]) {
    await auth.api.signUpEmail({
      body: { name: user.name, email: user.email, password: DEMO_PASSWORD },
    });
  }

  const salma = await db.user.findUniqueOrThrow({ where: { email: SALMA.email } });
  const youssef = await db.user.findUniqueOrThrow({ where: { email: YOUSSEF.email } });
  const khadija = await db.user.findUniqueOrThrow({ where: { email: KHADIJA.email } });

  // 2. Salma's personal workspace (created automatically at sign up)
  const personal = await db.workspace.findFirstOrThrow({
    where: { type: "PERSONAL", memberships: { some: { userId: salma.id } } },
  });

  const university = await db.project.create({
    data: { name: "University", color: "#6366f1", workspaceId: personal.id },
  });

  await createTask(university.id, salma.id, {
    title: "Finish database assignment",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueInDays: 2,
    assigneeId: salma.id,
  });
  await createTask(university.id, salma.id, {
    title: "Study for algorithms exam",
    priority: "URGENT",
    dueInDays: 5,
    assigneeId: salma.id,
  });
  await createTask(university.id, salma.id, {
    title: "Submit scholarship form",
    status: "DONE",
    priority: "MEDIUM",
    dueInDays: -3,
    assigneeId: salma.id,
  });

  // 3. A team workspace with 3 roles
  const team = await db.workspace.create({
    data: {
      name: "Atlas Studio",
      type: "TEAM",
      memberships: {
        create: [
          { userId: salma.id, role: "OWNER" },
          { userId: youssef.id, role: "ADMIN" },
          { userId: khadija.id, role: "VIEWER" },
        ],
      },
      labels: {
        create: [
          { name: "Bug", color: "#ef4444" },
          { name: "Design", color: "#8b5cf6" },
          { name: "Client", color: "#0ea5e9" },
        ],
      },
    },
    include: { labels: true },
  });

  const bug = team.labels.find((label) => label.name === "Bug");
  const design = team.labels.find((label) => label.name === "Design");
  const client = team.labels.find((label) => label.name === "Client");

  const website = await db.project.create({
    data: { name: "Website redesign", color: "#8b5cf6", workspaceId: team.id },
  });
  const clientWork = await db.project.create({
    data: { name: "Client work", color: "#0ea5e9", workspaceId: team.id },
  });

  await createTask(website.id, salma.id, {
    title: "Create the new homepage layout",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueInDays: 1,
    assigneeId: youssef.id,
    labelIds: design ? [design.id] : [],
  });
  await createTask(website.id, salma.id, {
    title: "Fix broken contact form on mobile",
    priority: "URGENT",
    dueInDays: -1,
    assigneeId: youssef.id,
    labelIds: bug ? [bug.id] : [],
  });
  await createTask(website.id, youssef.id, {
    title: "Choose the color palette",
    status: "DONE",
    priority: "LOW",
    dueInDays: -4,
    assigneeId: salma.id,
    labelIds: design ? [design.id] : [],
  });
  await createTask(website.id, youssef.id, {
    title: "Write the About page copy",
    priority: "MEDIUM",
    dueInDays: 7,
  });
  await createTask(clientWork.id, salma.id, {
    title: "Send invoice to the bakery client",
    priority: "HIGH",
    dueInDays: 0,
    assigneeId: salma.id,
    labelIds: client ? [client.id] : [],
  });
  await createTask(clientWork.id, salma.id, {
    title: "Prepare the project proposal",
    priority: "MEDIUM",
    dueInDays: 4,
    assigneeId: youssef.id,
    labelIds: client ? [client.id] : [],
  });

  console.log("Seed finished.");
  console.log(`Demo accounts (password: ${DEMO_PASSWORD}):`);
  console.log(`- ${SALMA.email} (Owner of Atlas Studio)`);
  console.log(`- ${YOUSSEF.email} (Admin)`);
  console.log(`- ${KHADIJA.email} (Viewer)`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
