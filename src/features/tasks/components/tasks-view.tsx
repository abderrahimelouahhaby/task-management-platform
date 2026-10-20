"use client";

import { useState } from "react";
import { ListChecks, Plus, SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { can, type Role } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useTasks } from "../hooks";
import { useTaskFilters } from "../use-task-filters";
import { TaskFilterBar } from "./task-filter-bar";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskList } from "./task-list";
import { TaskPagination } from "./task-pagination";
import { ViewSwitcher } from "./view-switcher";

type TasksViewProps = {
  workspaceId: string;
  role: Role;
  currentUserId: string;
};

export function TasksView({ workspaceId, role, currentUserId }: TasksViewProps) {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useTaskFilters();
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useTasks(
    workspaceId,
    filters,
  );
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = can(role, "task:create");

  const newTaskButton = canCreate ? (
    <Button onClick={() => setCreateOpen(true)}>
      <Plus className="size-4" />
      New task
    </Button>
  ) : null;

  function renderResults() {
    if (isPending) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      );
    }

    if (isError) {
      return (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-4">
            {error.message}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (data.total === 0) {
      return hasActiveFilters ? (
        <EmptyState
          icon={SearchX}
          title="No tasks match your filters"
          description="Try a different search or remove some filters."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description={
            canCreate
              ? "Create your first task to get started."
              : "There are no tasks in this workspace yet."
          }
          action={newTaskButton ?? undefined}
        />
      );
    }

    if (data.items.length === 0) {
      // The page number in the URL is higher than the last page
      return (
        <EmptyState
          icon={SearchX}
          title="This page is empty"
          description="There are no tasks on this page."
          action={
            <Button variant="outline" onClick={() => setFilters({ page: 1 })}>
              Go to the first page
            </Button>
          }
        />
      );
    }

    return (
      <>
        <div className={cn(isPlaceholderData && "opacity-60 transition-opacity")}>
          <TaskList
            tasks={data.items}
            workspaceId={workspaceId}
            role={role}
            currentUserId={currentUserId}
          />
        </div>
        <TaskPagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={data.pageSize}
          onPageChange={(page) => setFilters({ page })}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Create, filter, and complete your tasks."
        actions={
          <>
            <ViewSwitcher workspaceId={workspaceId} current="list" />
            {newTaskButton}
          </>
        }
      />

      <TaskFilterBar
        workspaceId={workspaceId}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {renderResults()}

      <TaskFormDialog open={createOpen} onOpenChange={setCreateOpen} workspaceId={workspaceId} />
    </>
  );
}
