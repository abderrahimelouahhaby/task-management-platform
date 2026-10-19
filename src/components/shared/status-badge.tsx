import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type TaskStatus } from "@/features/tasks/constants";
import { cn } from "@/lib/utils";

const STATUS_CLASSES: Record<TaskStatus, string> = {
  TODO: "bg-secondary text-secondary-foreground",
  IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  DONE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
