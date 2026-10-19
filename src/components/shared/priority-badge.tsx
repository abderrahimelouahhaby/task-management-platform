import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, type TaskPriority } from "@/features/tasks/constants";
import { cn } from "@/lib/utils";

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  LOW: "bg-secondary text-secondary-foreground",
  MEDIUM: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", PRIORITY_CLASSES[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
