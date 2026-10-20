import Link from "next/link";
import { CalendarDays, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewSwitcherProps = {
  workspaceId: string;
  current: "list" | "calendar";
};

export function ViewSwitcher({ workspaceId, current }: ViewSwitcherProps) {
  const items = [
    { key: "list", label: "List", href: `/w/${workspaceId}/tasks`, icon: List },
    { key: "calendar", label: "Calendar", href: `/w/${workspaceId}/calendar`, icon: CalendarDays },
  ] as const;

  return (
    <nav aria-label="Task view" className="inline-flex rounded-md border p-0.5">
      {items.map(({ key, label, href, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={current === key ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            current === key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
