import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your workspace, members, and labels." />
      <p className="text-sm text-muted-foreground">Coming soon.</p>
    </>
  );
}
