import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <>
      <PageHeader title="Tasks" description="Create, filter, and complete your tasks." />
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </>
  );
}
