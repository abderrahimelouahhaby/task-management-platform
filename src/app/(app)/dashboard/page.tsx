import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your tasks and deadlines at a glance." />
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </>
  );
}
