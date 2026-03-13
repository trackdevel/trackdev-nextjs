"use client";

import { EmptyState, LoadingContainer, Pagination } from "@/components/ui";
import type { Task } from "@trackdev/types";
import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { TaskFilterBar, type TaskFilters } from "./TaskFilterBar";
import { TaskList } from "./TaskListItem";

interface FilterableTaskListProps {
  /** Tasks to display on the current page (pre-filtered for server-side pagination) */
  tasks: Task[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Current filter state */
  filters: TaskFilters;
  /** Called when a filter value changes */
  onFilterChange: (key: string, value: string) => void;
  /** Called when sort order is toggled */
  onSortToggle: () => void;
  /** Called when all filters are cleared */
  onClearFilters: () => void;
  /** Available assignee options for the filter dropdown */
  assigneeOptions?: { value: string; label: string }[];
  /** Current user ID (to show "Assigned to me" option) */
  currentUserId?: string;
  /** Project options for the filter dropdown (only shown when provided) */
  projectOptions?: { value: string; label: string }[];
  /** Sprint options for the filter dropdown (only shown when provided) */
  sprintOptions?: { value: string; label: string }[];
  /** Pagination props (omit for no pagination) */
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
  };
  /** Empty state title when no filters are active */
  emptyTitle?: string;
  /** Empty state description when no filters are active */
  emptyDescription?: string;
  /** Empty state title when filters are active */
  emptyFilteredTitle?: string;
  /** Empty state description when filters are active */
  emptyFilteredDescription?: string;
  /** Whether to show assignee in task items */
  showAssignee?: boolean;
}

export function FilterableTaskList({
  tasks,
  isLoading = false,
  filters,
  onFilterChange,
  onSortToggle,
  onClearFilters,
  assigneeOptions,
  currentUserId,
  projectOptions,
  sprintOptions,
  pagination,
  emptyTitle,
  emptyDescription,
  emptyFilteredTitle,
  emptyFilteredDescription,
  showAssignee = true,
}: FilterableTaskListProps) {
  const t = useTranslations("tasks");

  const hasActiveFilters =
    filters.type !== "" ||
    filters.status !== "" ||
    filters.assigneeId !== "" ||
    filters.search !== "" ||
    (filters.projectId !== undefined && filters.projectId !== "") ||
    (filters.sprintId !== undefined && filters.sprintId !== "");

  return (
    <>
      <TaskFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        onSortToggle={onSortToggle}
        onClearFilters={onClearFilters}
        assigneeOptions={assigneeOptions}
        currentUserId={currentUserId}
        projectOptions={projectOptions}
        sprintOptions={sprintOptions}
      />

      <div className="card">
        {isLoading ? (
          <LoadingContainer />
        ) : tasks.length > 0 ? (
          <>
            <TaskList tasks={tasks} showAssignee={showAssignee} />
            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={pagination.onPageChange}
                onPageSizeChange={pagination.onPageSizeChange}
                pageSizeOptions={pagination.pageSizeOptions}
                itemLabel={t("title").toLowerCase()}
              />
            )}
          </>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={
              hasActiveFilters
                ? (emptyFilteredTitle ?? t("noMatchingTasks"))
                : (emptyTitle ?? t("noTasks"))
            }
            description={
              hasActiveFilters
                ? (emptyFilteredDescription ?? t("tryAdjustingFilters"))
                : (emptyDescription ?? t("tasksWillAppearHere"))
            }
          />
        )}
      </div>
    </>
  );
}
