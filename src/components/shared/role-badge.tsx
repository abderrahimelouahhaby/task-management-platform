import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={role === "OWNER" ? "default" : "secondary"}>{ROLE_LABELS[role]}</Badge>;
}
