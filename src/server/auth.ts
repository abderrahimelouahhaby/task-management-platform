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
