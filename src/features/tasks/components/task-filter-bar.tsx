"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLabels } from "@/features/labels/hooks";
import { useMembers } from "@/features/members/hooks";
import { useProjects } from "@/features/projects/hooks";
import { PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES } from "../constants";
import type { TaskFilters } from "../filters";
import { FilterSelect } from "./filter-select";

type TaskFilterBarProps = {
  workspaceId: string;
  filters: TaskFilters;
  setFilters: (changes: Partial<TaskFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
};

const DUE_OPTIONS = [
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Next 7 days" },
  { value: "none", label: "No due date" },
];

const SORT_OPTIONS = [
  { value: "due", label: "Sort: Due date" },
  { value: "created", label: "Sort: Newest" },
  { value: "priority", label: "Sort: Priority" },
  { value: "title", label: "Sort: Title (A to Z)" },
];

export function TaskFilterBar({
  workspaceId,
  filters,
  setFilters,
  clearFilters,
  hasActiveFilters,
}: TaskFilterBarProps) {
  const members = useMembers(workspaceId);
  const labels = useLabels(workspaceId);
  const projects = useProjects(workspaceId);

  // The search box keeps its own text, and updates the URL 300 ms after you stop typing
  const [search, setSearch] = useState(filters.q ?? "");

  useEffect(() => {
    const trimmed = search.trim();

    if (trimmed === (filters.q ?? "")) {
      return;
    }

    const timer = setTimeout(() => {
      setFilters({ q: trimmed === "" ? undefined : trimmed });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, filters.q, setFilters]);

  const statusOptions = [
    { value: "open", label: "Open" },
    ...TASK_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
  ];

  const priorityOptions = TASK_PRIORITIES.map((value) => ({
    value,
    label: PRIORITY_LABELS[value],
  }));

  const assigneeOptions = [
    { value: "me", label: "Assigned to me" },
    { value: "unassigned", label: "Unassigned" },
    ...(members.data ?? []).map((member) => ({ value: member.userId, label: member.name })),
  ];

  const labelOptions = (labels.data ?? []).map((label) => ({ value: label.id, label: label.name }));

  const projectOptions = (projects.data ?? []).map((project) => ({
    value: project.id,
    label: project.archived ? `${project.name} (archived)` : project.name,
  }));

  function handleClear() {
    setSearch("");
    clearFilters();
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search
            className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks..."
            className="pl-8"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Button
          type="button"
          variant={filters.assignee === "me" ? "default" : "outline"}
          aria-pressed={filters.assignee === "me"}
          onClick={() => setFilters({ assignee: filters.assignee === "me" ? undefined : "me" })}
        >
          My tasks
        </Button>

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" onClick={handleClear}>
            <X className="size-4" />
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <FilterSelect
          label="Filter by status"
          allLabel="All statuses"
          value={filters.status}
          options={statusOptions}
          onChange={(value) => setFilters({ status: value as TaskFilters["status"] })}
        />
        <FilterSelect
          label="Filter by priority"
          allLabel="All priorities"
          value={filters.priority}
          options={priorityOptions}
          onChange={(value) => setFilters({ priority: value as TaskFilters["priority"] })}
        />
        <FilterSelect
          label="Filter by assignee"
          allLabel="Anyone"
          value={filters.assignee}
          options={assigneeOptions}
          onChange={(value) => setFilters({ assignee: value })}
        />
        <FilterSelect
          label="Filter by label"
          allLabel="All labels"
          value={filters.label}
          options={labelOptions}
          onChange={(value) => setFilters({ label: value })}
        />
        <FilterSelect
          label="Filter by project"
          allLabel="All projects"
          value={filters.project}
          options={projectOptions}
          onChange={(value) => setFilters({ project: value })}
        />
        <FilterSelect
          label="Filter by due date"
          allLabel="Any due date"
          value={filters.due}
          options={DUE_OPTIONS}
          onChange={(value) => setFilters({ due: value as TaskFilters["due"] })}
        />

        <Select
          value={filters.sort}
          onValueChange={(value) => setFilters({ sort: value as TaskFilters["sort"] })}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Sort tasks">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
