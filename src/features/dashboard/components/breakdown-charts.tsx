"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/features/tasks/constants";
import type { DashboardStats } from "../types";

// The colors come from the CSS variables of our theme, so they follow light and dark mode
const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "var(--muted-foreground)",
  IN_PROGRESS: "var(--chart-3)",
  DONE: "var(--chart-2)",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "var(--muted-foreground)",
  MEDIUM: "var(--chart-5)",
  HIGH: "var(--chart-3)",
  URGENT: "var(--chart-4)",
};

const chartConfig = { count: { label: "Tasks" } } satisfies ChartConfig;

type ChartPoint = { label: string; count: number; fill: string };

type BreakdownChartProps = {
  title: string;
  description: string;
  data: ChartPoint[];
};

function BreakdownChart({ title, description, data }: BreakdownChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-56 w-full">
          <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={4} />
          </BarChart>
        </ChartContainer>

        {/* The same numbers as text, for people who cannot see the chart */}
        <ul className="sr-only">
          {data.map((point) => (
            <li key={point.label}>
              {point.label}: {point.count}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function StatusChart({ stats }: { stats: DashboardStats }) {
  const data = stats.byStatus.map((entry) => ({
    label: STATUS_LABELS[entry.status],
    count: entry.count,
    fill: STATUS_COLORS[entry.status],
  }));

  return (
    <BreakdownChart title="Tasks by status" description="All tasks of this workspace" data={data} />
  );
}

export function PriorityChart({ stats }: { stats: DashboardStats }) {
  const data = stats.byPriority.map((entry) => ({
    label: PRIORITY_LABELS[entry.priority],
    count: entry.count,
    fill: PRIORITY_COLORS[entry.priority],
  }));

  return (
    <BreakdownChart
      title="Open tasks by priority"
      description="Tasks that are not done yet"
      data={data}
    />
  );
}
