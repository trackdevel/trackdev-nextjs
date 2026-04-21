"use client";

import { EmptyState, LoadingContainer, Pagination } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { ApiClientError, tasksApi, useAuth } from "@trackdev/api-client";
import type { Task, TaskStatus } from "@trackdev/types";
import { ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { BulkActionToolbar, type BulkAction } from "./BulkActionToolbar";
import { BulkChangeStatusDialog } from "./BulkChangeStatusDialog";
import { TaskFilterBar, type TaskFilters } from "./TaskFilterBar";
import { TaskList } from "./TaskListItem";

export interface BulkActionsConfig {
  /** Returns all tasks matching current filters (across all pages). Can be sync or async. */
  getAllFilteredTasks: () => Task[] | Promise<Task[]>;
  /** Called after a bulk action completes to refresh the underlying data. */
  onRefresh: () => void;
}

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
  /** Sum of estimation points across all filtered tasks (not just current page). Hidden when undefined. */
  totalPoints?: number;
  /** When true, tasks render as selectable rows instead of navigation links */
  selectionMode?: boolean;
  /** Currently selected task IDs (for selection mode) */
  selectedTaskIds?: Set<number>;
  /** Called when a task is toggled in selection mode */
  onTaskToggle?: (task: import("@trackdev/types").Task) => void;
  /** When provided, enables bulk action mode (checkboxes + action dropdown). */
  bulkActions?: BulkActionsConfig;
}

function isTaskSelectableFor(
  task: Task,
  userId: string | undefined,
  isProfessor: boolean,
): boolean {
  if (isProfessor) return true;
  if (!task.assignee) return true;
  return task.assignee.id === userId;
}

function computeAvailableActions(isProfessor: boolean): BulkAction[] {
  if (isProfessor) {
    return ["CHANGE_STATUS", "UNASSIGN", "FREEZE", "UNFREEZE"];
  }
  return ["ASSIGN_TO_ME", "UNASSIGN"];
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
  totalPoints,
  selectionMode = false,
  selectedTaskIds,
  onTaskToggle,
  bulkActions,
}: FilterableTaskListProps) {
  const t = useTranslations("tasks");
  const toast = useToast();
  const { user } = useAuth();

  const isProfessor = useMemo(
    () => user?.roles.includes("PROFESSOR") ?? false,
    [user?.roles],
  );

  const bulkEnabled = bulkActions !== undefined && !selectionMode;

  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<number>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [changeStatusDialogOpen, setChangeStatusDialogOpen] = useState(false);

  const isTaskSelectable = useCallback(
    (task: Task) => isTaskSelectableFor(task, user?.id, isProfessor),
    [user?.id, isProfessor],
  );

  const toggleBulkSelection = useCallback(
    (task: Task) => {
      if (!isTaskSelectable(task)) return;
      setBulkSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(task.id)) {
          next.delete(task.id);
        } else {
          next.add(task.id);
        }
        return next;
      });
    },
    [isTaskSelectable],
  );

  const clearBulkSelection = useCallback(() => {
    setBulkSelectedIds(new Set());
  }, []);

  const handleToggleSelectAll = useCallback(async () => {
    if (!bulkActions) return;
    if (bulkSelectedIds.size > 0) {
      clearBulkSelection();
      return;
    }
    try {
      setIsSelectingAll(true);
      const all = await Promise.resolve(bulkActions.getAllFilteredTasks());
      const selectableIds = all
        .filter((task) => isTaskSelectable(task))
        .map((task) => task.id);
      setBulkSelectedIds(new Set(selectableIds));
    } catch (err) {
      const message =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : t("bulkActionFailed");
      toast.error(message);
    } finally {
      setIsSelectingAll(false);
    }
  }, [bulkActions, bulkSelectedIds.size, clearBulkSelection, isTaskSelectable, t, toast]);

  const runSimpleActionForIds = useCallback(
    async (
      action: Exclude<BulkAction, "CHANGE_STATUS">,
      ids: number[],
    ) => {
      const results = await Promise.allSettled(
        ids.map((id) => {
          switch (action) {
            case "ASSIGN_TO_ME":
              return tasksApi.selfAssign(id);
            case "UNASSIGN":
              return tasksApi.unassign(id);
            case "FREEZE":
              return tasksApi.freeze(id);
            case "UNFREEZE":
              return tasksApi.unfreeze(id);
          }
        }),
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      return { succeeded, failed };
    },
    [],
  );

  const handleBulkAction = useCallback(
    async (action: BulkAction) => {
      if (!bulkActions || bulkSelectedIds.size === 0) return;

      if (action === "CHANGE_STATUS") {
        setChangeStatusDialogOpen(true);
        return;
      }

      const selectedTasks = (await Promise.resolve(
        bulkActions.getAllFilteredTasks(),
      )).filter((task) => bulkSelectedIds.has(task.id));

      const targetTasks = selectedTasks.filter((task) => {
        if (action === "ASSIGN_TO_ME") return !task.assignee;
        if (action === "UNASSIGN") return !!task.assignee;
        if (action === "FREEZE") return !task.frozen;
        if (action === "UNFREEZE") return !!task.frozen;
        return false;
      });

      if (targetTasks.length === 0) {
        toast.info(t("noActionableTasks"));
        return;
      }

      setIsExecuting(true);
      try {
        const { succeeded, failed } = await runSimpleActionForIds(
          action,
          targetTasks.map((task) => task.id),
        );

        if (failed === 0) {
          toast.success(t("bulkActionSuccess", { count: succeeded }));
        } else if (succeeded === 0) {
          toast.error(t("bulkActionFailed"));
        } else {
          toast.warning(t("bulkActionPartial", { succeeded, failed }));
        }

        bulkActions.onRefresh();
        clearBulkSelection();
      } catch (err) {
        const message =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("bulkActionFailed");
        toast.error(message);
      } finally {
        setIsExecuting(false);
      }
    },
    [bulkActions, bulkSelectedIds, clearBulkSelection, runSimpleActionForIds, t, toast],
  );

  const handleConfirmChangeStatus = useCallback(
    async (status: TaskStatus) => {
      if (!bulkActions || bulkSelectedIds.size === 0) return;

      const ids = Array.from(bulkSelectedIds);
      setIsExecuting(true);
      try {
        const results = await Promise.allSettled(
          ids.map((id) => tasksApi.update(id, { status })),
        );
        const succeeded = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - succeeded;

        if (failed === 0) {
          toast.success(t("bulkActionSuccess", { count: succeeded }));
        } else if (succeeded === 0) {
          toast.error(t("bulkActionFailed"));
        } else {
          toast.warning(t("bulkActionPartial", { succeeded, failed }));
        }

        bulkActions.onRefresh();
        clearBulkSelection();
        setChangeStatusDialogOpen(false);
      } catch (err) {
        const message =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("bulkActionFailed");
        toast.error(message);
      } finally {
        setIsExecuting(false);
      }
    },
    [bulkActions, bulkSelectedIds, clearBulkSelection, t, toast],
  );

  const visibleSelectableCount = useMemo(
    () => (bulkEnabled ? tasks.filter((task) => isTaskSelectable(task)).length : 0),
    [bulkEnabled, tasks, isTaskSelectable],
  );

  const selectionState: "none" | "some" | "all" = useMemo(() => {
    if (bulkSelectedIds.size === 0) return "none";
    const allVisibleSelected =
      visibleSelectableCount > 0 &&
      tasks
        .filter(isTaskSelectable)
        .every((task) => bulkSelectedIds.has(task.id));
    return allVisibleSelected ? "all" : "some";
  }, [bulkSelectedIds, tasks, isTaskSelectable, visibleSelectableCount]);

  const hasActiveFilters =
    filters.type !== "" ||
    filters.status !== "" ||
    filters.assigneeId !== "" ||
    filters.search !== "" ||
    (filters.projectId !== undefined && filters.projectId !== "") ||
    (filters.sprintId !== undefined && filters.sprintId !== "");

  const effectiveSelectionMode = selectionMode || bulkEnabled;
  const effectiveSelectedIds = selectionMode ? selectedTaskIds : bulkSelectedIds;
  const effectiveOnToggle = selectionMode ? onTaskToggle : toggleBulkSelection;
  const effectiveIsSelectable = bulkEnabled ? isTaskSelectable : undefined;

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

      {totalPoints !== undefined && (
        <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          {t("totalPoints")}:{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {totalPoints}
          </span>{" "}
          {t("points")}
        </div>
      )}

      {bulkEnabled && (
        <BulkActionToolbar
          selectedCount={bulkSelectedIds.size}
          totalSelectable={visibleSelectableCount}
          selectionState={selectionState}
          onToggleSelectAll={handleToggleSelectAll}
          onClearSelection={clearBulkSelection}
          availableActions={computeAvailableActions(isProfessor)}
          onAction={handleBulkAction}
          isExecuting={isExecuting}
          isSelectingAll={isSelectingAll}
        />
      )}

      <div className="card">
        {isLoading ? (
          <LoadingContainer />
        ) : tasks.length > 0 ? (
          <>
            <TaskList
              tasks={tasks}
              showAssignee={showAssignee}
              onTaskToggle={effectiveSelectionMode ? effectiveOnToggle : undefined}
              selectedTaskIds={effectiveSelectionMode ? effectiveSelectedIds : undefined}
              isSelectable={effectiveIsSelectable}
              bulkMode={bulkEnabled}
            />
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

      {bulkEnabled && (
        <BulkChangeStatusDialog
          isOpen={changeStatusDialogOpen}
          selectedCount={bulkSelectedIds.size}
          onClose={() => setChangeStatusDialogOpen(false)}
          onConfirm={handleConfirmChangeStatus}
          isExecuting={isExecuting}
        />
      )}
    </>
  );
}
