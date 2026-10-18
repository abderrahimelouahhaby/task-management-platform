import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProjectDto } from "../types";

type ProjectCardProps = {
  project: ProjectDto;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
};

export function ProjectCard({
  project,
  canEdit,
  canDelete,
  onEdit,
  onToggleArchive,
  onDelete,
}: ProjectCardProps) {
  const showMenu = canEdit || canDelete;

  return (
    <Card className={cn(project.archived && "opacity-60")}>
      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-2 text-base">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: project.color ?? "#6366f1" }}
            aria-hidden="true"
          />
          <span className="truncate">{project.name}</span>
        </CardTitle>

        {showMenu ? (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={`Actions for ${project.name}`}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit ? (
                  <>
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onToggleArchive}>
                      {project.archived ? (
                        <ArchiveRestore className="size-4" />
                      ) : (
                        <Archive className="size-4" />
                      )}
                      {project.archived ? "Restore" : "Archive"}
                    </DropdownMenuItem>
                  </>
                ) : null}
                {canEdit && canDelete ? <DropdownMenuSeparator /> : null}
                {canDelete ? (
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
          {project.description ?? "No description"}
        </p>
      </CardContent>

      <CardFooter className="gap-2">
        <Badge variant="secondary">
          {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
        </Badge>
        {project.archived ? <Badge variant="outline">Archived</Badge> : null}
      </CardFooter>
    </Card>
  );
}
