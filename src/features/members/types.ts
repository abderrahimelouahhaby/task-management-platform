import type { Role } from "@/lib/permissions";

export type MemberDto = {
  /** The membership id (not the user id) */
  id: string;
  userId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
};
