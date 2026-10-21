import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: number;
  href: string;
  icon: LucideIcon;
  /** "danger" turns the number red, but only when it is above 0 */
  tone?: "default" | "danger";
};

export function StatCard({ label, value, href, icon: Icon, tone = "default" }: StatCardProps) {
  const danger = tone === "danger" && value > 0;

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Card className="gap-2 py-4 transition-colors hover:bg-accent/50">
        <CardContent className="space-y-2 px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className={cn("size-4", danger && "text-destructive")} aria-hidden="true" />
            {label}
          </div>
          <p className={cn("text-3xl font-semibold tracking-tight", danger && "text-destructive")}>
            {value}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
