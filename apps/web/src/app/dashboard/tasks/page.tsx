"use client";

import { BackButton } from "@/components/BackButton";
import { TaskList } from "@/components/tasks";
import {
  EmptyState,
  LoadingContainer,
  PageContainer,
  Pagination,
  Select,
} from "@/components/ui";
import {
  tasksApi,
  useAuth,
  useQuery,
  type TasksFilterParams,
} from "@trackdev/api-client";
import type { TaskStatus, TaskType } from "@trackdev/types";
import { ArrowDownAZ, ArrowUpAZ, ClipboardList, Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const PAGE_SIZE = 10;

export default function TasksListPage() {
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("tasks");
  const router = useRouter();
  const searchParams = useSearchParams();

  // React 19: Read filter state from URL searchParams for shareable/bookmarkable URLs
  const filters = useMemo(
    () => ({
      type: (searchParams.get("type") as TaskType | "") || "",
      status: (searchParams.get("status") as TaskStatus | "") || "",
      assigneeId: searchParams.get("assigneeId") || "",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    }),
    [searchParams],
  );

  const currentPage = parseInt(searchParams.get("page") || "0", 10);

  // Update URL when filters change
  const updateSearchParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === "0") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  // Task type options with translations
  const TASK_TYPES: { value: TaskType | ""; label: string }[] = [
    { value: "", label: t("allTypes") },
    { value: "USER_STORY", label: t("typeUserStory") },
    { value: "TASK", label: t("typeTask") },
    { value: "BUG", label: t("typeBug") },
  ];

  // Task status options with translations
  const TASK_STATUSES: { value: TaskStatus | ""; label: string }[] = [
    { value: "", label: t("allStatuses") },
    { value: "BACKLOG", label: t("statusBacklog") },
    { value: "TODO", label: t("statusTodo") },
    { value: "INPROGRESS", label: t("statusInProgress") },
    { value: "VERIFY", label: t("statusVerify") },
    { value: "DONE", label: t("statusDone") },
  ];

  // Build filter params for API
  const filterParams = useMemo<TasksFilterParams>(() => {
    const params: TasksFilterParams = {
      sortOrder: filters.sortOrder,
    };
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    if (filters.assigneeId) params.assigneeId = filters.assigneeId;
    return params;
  }, [filters]);

  const { data: tasksResponse, isLoading } = useQuery(
    () => tasksApi.getMy(currentPage, PAGE_SIZE, filterParams),
    [currentPage, filterParams],
    { enabled: isAuthenticated },
  );

  const tasks = tasksResponse?.tasks || [];
  const totalPages = tasksResponse?.totalPages || 0;
  const totalElements = tasksResponse?.totalElements || 0;

  // Extract unique assignees from tasks for the filter dropdown
  const assigneeOptions = useMemo(() => {
    const assignees = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee.username);
      }
    });
    return Array.from(assignees.entries()).map(([id, username]) => ({
      value: id,
      label: username,
    }));
  }, [tasks]);

  const handleFilterChange = (key: string, value: string) => {
    updateSearchParams({ [key]: value, page: "0" }); // Reset to first page when filters change
  };

  const toggleSortOrder = () => {
    updateSearchParams({
      sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
      page: "0",
    });
  };

  const clearFilters = () => {
    router.push("?", { scroll: false }); // Clear all params
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };

  const hasActiveFilters =
    filters.type !== "" || filters.status !== "" || filters.assigneeId !== "";

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6">
        <BackButton
          fallbackHref="/dashboard"
          label={t("backToDashboard")}
          className="mb-4"
        />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("allTasks")}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {t("allTasksFromProjects")}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter icon and label */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">{t("filters")}:</span>
          </div>

          {/* Type filter */}
          <Select
            value={filters.type}
            onChange={(value) => handleFilterChange("type", value)}
            options={TASK_TYPES.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            className="w-auto"
          />

          {/* Status filter */}
          <Select
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            options={TASK_STATUSES.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            className="w-auto"
          />

          {/* Assignee filter */}
          <Select
            value={filters.assigneeId}
            onChange={(value) => handleFilterChange("assigneeId", value)}
            options={[
              { value: "", label: t("allAssignees") },
              ...(user ? [{ value: user.id, label: t("assignedToMe") }] : []),
              ...assigneeOptions
                .filter((opt) => opt.value !== user?.id)
                .map((option) => ({
                  value: option.value,
                  label: option.label,
                })),
            ]}
            className="w-auto"
          />

          {/* Sort order toggle */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            title={
              filters.sortOrder === "desc"
                ? t("sortNewestFirst")
                : t("sortOldestFirst")
            }
          >
            {filters.sortOrder === "desc" ? (
              <>
                <ArrowDownAZ className="h-4 w-4" />
                <span>{t("newest")}</span>
              </>
            ) : (
              <>
                <ArrowUpAZ className="h-4 w-4" />
                <span>{t("oldest")}</span>
              </>
            )}
          </button>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        {isLoading ? (
          <LoadingContainer />
        ) : tasks.length > 0 ? (
          <>
            <TaskList tasks={tasks} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
              itemLabel={t("title").toLowerCase()}
            />
          </>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title={hasActiveFilters ? t("noMatchingTasks") : t("noTasks")}
            description={
              hasActiveFilters
                ? t("tryAdjustingFilters")
                : t("tasksWillAppearHere")
            }
          />
        )}
      </div>
    </PageContainer>
  );
}
