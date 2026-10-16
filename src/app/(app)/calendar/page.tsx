import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" description="See your deadlines by date." />
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </>
  );
}
