import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" description="Organize your tasks into projects." />
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </>
  );
}
