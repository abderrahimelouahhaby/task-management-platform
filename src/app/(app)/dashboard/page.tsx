import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  const firstName = session.user.name.trim().split(/\s+/)[0] ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your tasks and deadlines at a glance."
      />
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </>
  );
}
