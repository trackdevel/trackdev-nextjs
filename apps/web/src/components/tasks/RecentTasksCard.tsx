"use client";

import { ContentCard, EmptyState, LoadingContainer } from "@/components/ui";
import type { Task } from "@trackdev/types";
import { ClipboardList } from "lucide-react";
import { TaskList } from "./TaskListItem";

interface RecentTasksCardProps {
  /** Array of tasks to display */
  tasks: Task[];
  /** Whether the tasks are currently loading */
  isLoading?: boolean;
  /** Maximum number of tasks to display (default: 5) */
  maxTasks?: number;
  /** Title for the card (default: "Recent Tasks") */
  title?: string;
  /** Show total count in title */
  showCount?: boolean;
  /** Link to view all tasks */
  viewAllHref?: string;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Additional CSS classes */
  className?: string;
}

export function RecentTasksCard({
  tasks,
  isLoading = false,
  maxTasks = 5,
  title = "Recent Tasks",
  showCount = false,
  viewAllHref = "/dashboard/tasks",
  emptyTitle = "No recent tasks",
  emptyDescription = "Tasks you create or are assigned to will appear here",
  className = "",
}: RecentTasksCardProps) {
  const displayTasks = tasks.slice(0, maxTasks);
  const cardTitle = showCount ? `${title} (${tasks.length})` : title;

  return (
    <ContentCard
      title={cardTitle}
      viewAllHref={viewAllHref}
      className={className}
    >
      {isLoading ? (
        <LoadingContainer />
      ) : displayTasks.length > 0 ? (
        <TaskList tasks={displayTasks} />
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={emptyTitle}
          description={emptyDescription}
        />
      )}
    </ContentCard>
  );
}
