import { z } from "zod";

// OWNER is deliberately missing: nobody can create a second owner
const memberRoleSchema = z.enum(["ADMIN", "MEMBER", "VIEWER"]);

export const addMemberSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: memberRoleSchema,
});

export const updateMemberRoleSchema = z.object({ role: memberRoleSchema });

export type MemberRole = z.infer<typeof memberRoleSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
