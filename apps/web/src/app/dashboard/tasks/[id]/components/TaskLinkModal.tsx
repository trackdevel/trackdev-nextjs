"use client";

import { FilterableTaskList } from "@/components/tasks/FilterableTaskList";
import type { TaskFilters } from "@/components/tasks/TaskFilterBar";
import { Modal } from "@/components/ui/Modal";
import {
  parseTaskTypes,
  UNASSIGNED_ASSIGNEE_VALUE,
} from "@/components/tasks/TaskFilterBar";
import {
  ApiClientError,
  projectsApi,
  tasksApi,
  useQuery,
} from "@trackdev/api-client";
import type { Task } from "@trackdev/types";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

interface TaskLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  projectId: number;
  excludeTaskIds: Set<number>;
  onSuccess: () => void;
}

const defaultFilters: TaskFilters = {
  type: "",
  status: "",
  assigneeId: "",
  search: "",
  sortOrder: "asc",
};

export function TaskLinkModal({
  isOpen,
  onClose,
  taskId,
  projectId,
  excludeTaskIds,
  onSuccess,
}: TaskLinkModalProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<TaskFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const { data: projectTasksResponse, isLoading } = useQuery(
    () => projectsApi.getTasks(projectId),
    [projectId],
    { enabled: isOpen && projectId > 0 },
  );

  // Filter out current task and already-linked tasks
  const candidateTasks = useMemo(() => {
    if (!projectTasksResponse?.tasks) return [];
    return projectTasksResponse.tasks.filter(
      (task) => !excludeTaskIds.has(task.id),
    );
  }, [projectTasksResponse?.tasks, excludeTaskIds]);

  // Apply client-side filters
  const filteredTasks = useMemo(() => {
    let tasks = candidateTasks;

    const typeFilter = parseTaskTypes(filters.type);
    if (typeFilter.length > 0) {
      tasks = tasks.filter((t) => typeFilter.includes(t.type));
    }
    if (filters.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }
    if (filters.assigneeId === UNASSIGNED_ASSIGNEE_VALUE) {
      tasks = tasks.filter((t) => !t.assignee);
    } else if (filters.assigneeId) {
      tasks = tasks.filter((t) => t.assignee?.id === filters.assigneeId);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          (t.taskKey && t.taskKey.toLowerCase().includes(search)),
      );
    }

    if (filters.sortOrder === "desc") {
      tasks = [...tasks].sort((a, b) => b.id - a.id);
    } else {
      tasks = [...tasks].sort((a, b) => a.id - b.id);
    }

    return tasks;
  }, [candidateTasks, filters]);

  // Reset to page 0 when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters]);

  const paginatedTasks = useMemo(
    () => filteredTasks.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE),
    [filteredTasks, currentPage],
  );

  const assigneeOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const task of candidateTasks) {
      if (task.assignee && !seen.has(task.assignee.id)) {
        seen.add(task.assignee.id);
        options.push({
          value: task.assignee.id,
          label: task.assignee.fullName || task.assignee.username,
        });
      }
    }
    return options;
  }, [candidateTasks]);

  const handleTaskToggle = (task: Task) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(task.id)) {
        next.delete(task.id);
      } else {
        next.add(task.id);
      }
      return next;
    });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handleSortToggle = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setCurrentPage(0);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) return;
    setIsAdding(true);
    setError(null);
    try {
      await Promise.all(
        Array.from(selectedIds).map((linkedId) =>
          tasksApi.addLinkedTask(taskId, linkedId),
        ),
      );
      setSelectedIds(new Set());
      setFilters(defaultFilters);
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : t("failedToAddLink");
      setError(msg);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setFilters(defaultFilters);
    setError(null);
    onClose();
  };

  const totalPages = Math.ceil(filteredTasks.length / PAGE_SIZE);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("selectTasksToLink")}
      maxWidth="xl"
    >
      {/* Constrain height: filter bar is above, footer is below, task list scrolls in middle */}
      <div className="flex flex-col gap-3" style={{ maxHeight: "60vh" }}>
        <div className="overflow-y-auto min-h-0 flex-1">
          <FilterableTaskList
            tasks={paginatedTasks}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            onSortToggle={handleSortToggle}
            onClearFilters={handleClearFilters}
            assigneeOptions={assigneeOptions}
            selectionMode
            selectedTaskIds={selectedIds}
            onTaskToggle={handleTaskToggle}
            showAssignee
            pagination={
              filteredTasks.length > PAGE_SIZE
                ? {
                    currentPage,
                    totalPages,
                    totalItems: filteredTasks.length,
                    pageSize: PAGE_SIZE,
                    onPageChange: setCurrentPage,
                  }
                : undefined
            }
          />
        </div>

        {error && (
          <p className="shrink-0 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="shrink-0 flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedIds.size > 0
              ? t("addLinksCount", { count: selectedIds.size })
              : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {tCommon("cancel")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0 || isAdding}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("addLinksCount", { count: selectedIds.size })}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
