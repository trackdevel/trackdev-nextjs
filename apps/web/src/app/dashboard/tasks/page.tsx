"use client";

import { BackButton } from "@/components/BackButton";
import { FilterableTaskList } from "@/components/tasks/FilterableTaskList";
import type { TaskFilters } from "@/components/tasks/TaskFilterBar";
import { PageContainer } from "@/components/ui";
import {
  projectsApi,
  tasksApi,
  useAuth,
  useQuery,
  type TasksFilterParams,
} from "@trackdev/api-client";
import type { TaskStatus, TaskType } from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function TasksListPage() {
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("tasks");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filter state from URL searchParams for shareable/bookmarkable URLs
  const filters = useMemo<TaskFilters>(
    () => ({
      type: (searchParams.get("type") as TaskType | "") || "",
      status: (searchParams.get("status") as TaskStatus | "") || "",
      assigneeId: searchParams.get("assigneeId") || "",
      projectId: searchParams.get("projectId") || "",
      search: searchParams.get("search") || "",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    }),
    [searchParams],
  );

  const currentPage = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10);

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

  // Fetch user's projects for the project filter dropdown
  const { data: projectsResponse } = useQuery(
    () => projectsApi.getAll(),
    [],
    { enabled: isAuthenticated },
  );

  const projectOptions = useMemo(() => {
    if (!projectsResponse?.projects) return [];
    return projectsResponse.projects.map((p) => ({
      value: String(p.id),
      label: p.name,
    }));
  }, [projectsResponse?.projects]);

  // Build filter params for API
  const filterParams = useMemo<TasksFilterParams>(() => {
    const params: TasksFilterParams = {
      sortOrder: filters.sortOrder,
    };
    if (filters.type) params.type = filters.type;
    if (filters.status) params.status = filters.status;
    if (filters.assigneeId) params.assigneeId = filters.assigneeId;
    if (filters.projectId) params.projectId = Number(filters.projectId);
    if (filters.search) params.search = filters.search;
    return params;
  }, [filters]);

  const { data: tasksResponse, isLoading } = useQuery(
    () => tasksApi.getMy(currentPage, pageSize, filterParams),
    [currentPage, pageSize, filterParams],
    { enabled: isAuthenticated },
  );

  const tasks = tasksResponse?.tasks || [];
  const totalPages = tasksResponse?.totalPages || 0;
  const totalElements = tasksResponse?.totalElements || 0;

  // Extract unique assignees from current page tasks for the filter dropdown
  const assigneeOptions = useMemo(() => {
    const assignees = new Map<string, string>();
    (tasksResponse?.tasks || []).forEach((task) => {
      if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee.username);
      }
    });
    return Array.from(assignees.entries()).map(([id, username]) => ({
      value: id,
      label: username,
    }));
  }, [tasksResponse?.tasks]);

  const handleFilterChange = (key: string, value: string) => {
    updateSearchParams({ [key]: value, page: "0" });
  };

  const toggleSortOrder = () => {
    updateSearchParams({
      sortOrder: filters.sortOrder === "desc" ? "asc" : "desc",
      page: "0",
    });
  };

  const clearFilters = () => {
    router.push("?", { scroll: false });
  };

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() });
  };

  const handlePageSizeChange = (size: number) => {
    updateSearchParams({ pageSize: size.toString(), page: "0" });
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6">
        <BackButton
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

      <FilterableTaskList
        tasks={tasks}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSortToggle={toggleSortOrder}
        onClearFilters={clearFilters}
        assigneeOptions={assigneeOptions}
        currentUserId={user?.id}
        projectOptions={projectOptions}
        pagination={{
          currentPage,
          totalPages,
          totalItems: totalElements,
          pageSize,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
      />
    </PageContainer>
  );
}
