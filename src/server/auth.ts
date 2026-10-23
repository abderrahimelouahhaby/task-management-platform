import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "@/lib/env";
import { db } from "@/server/db";
import { ensurePersonalWorkspace } from "@/server/services/workspaces.service";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(db, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // sessions last 7 days
    updateAge: 60 * 60 * 24, // refresh the expiry once per day when the user is active
  },

  rateLimit: {
    // Only in production. In development and in the E2E tests, many accounts are created from one address.
    enabled: env.NODE_ENV === "production",
    // The default storage is the server's memory. On Vercel, many short-lived servers each have their
    // own memory, so counting there is weak. The database is shared by all of them.
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      // Stricter limits for the endpoints that guessers attack: 5 attempts per minute
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensurePersonalWorkspace(user.id);
        },
      },
    },
  },
});
