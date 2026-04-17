"use client";

import { BackButton } from "@/components/BackButton";
import { CreateTaskModal } from "@/components/tasks";
import { FilterableTaskList } from "@/components/tasks/FilterableTaskList";
import type { TaskFilters } from "@/components/tasks/TaskFilterBar";
import { EmptyState, PageContainer } from "@/components/ui";
import { projectsApi, useAuth, useQuery } from "@trackdev/api-client";
import type { Task, TaskStatus, TaskType } from "@trackdev/types";
import { ClipboardList, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSessionState } from "@/utils/useSessionState";
import { useCallback, useMemo } from "react";

const BACKLOG_FILTER_VALUE = "backlog";
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("projects");
  const tTasks = useTranslations("tasks");

  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo<TaskFilters>(
    () => ({
      type: (searchParams.get("type") as TaskType | "") || "",
      status: (searchParams.get("status") as TaskStatus | "") || "",
      assigneeId: searchParams.get("assigneeId") || "",
      projectId: String(projectId),
      sprintId: searchParams.get("sprintId") || "",
      search: searchParams.get("search") || "",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    }),
    [searchParams, projectId],
  );

  const currentPage = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = parseInt(
    searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE),
    10,
  );

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

  const [showCreateModal, setShowCreateModal] = useSessionState(`createTaskModal-project-${projectId}`, false);

  const { data: project } = useQuery(
    () => projectsApi.getById(projectId),
    [projectId],
    { enabled: isAuthenticated && !isNaN(projectId) },
  );

  const {
    data: tasksResponse,
    isLoading: dataLoading,
    error,
    refetch: refetchTasks,
  } = useQuery(() => projectsApi.getTasks(projectId), [projectId], {
    enabled: isAuthenticated && !isNaN(projectId),
  });

  const { data: sprintsResponse } = useQuery(
    () => projectsApi.getSprints(projectId),
    [projectId],
    {
      enabled: isAuthenticated && !isNaN(projectId),
    },
  );

  const isLoading = authLoading || dataLoading;

  // Project dropdown with only the current project
  const projectOptions = useMemo(() => {
    if (!project) return [];
    return [{ value: String(projectId), label: project.name }];
  }, [project, projectId]);

  // Sprint options for filter dropdown (includes "Backlog" option for unassigned tasks)
  const sprintOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: BACKLOG_FILTER_VALUE, label: tTasks("backlog") },
    ];
    if (sprintsResponse?.sprints) {
      [...sprintsResponse.sprints]
        .sort((a, b) => {
          if (!a.startDate) return 1;
          if (!b.startDate) return -1;
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        })
        .forEach((sprint) => {
          options.push({
            value: String(sprint.id),
            label: sprint.label,
          });
        });
    }
    return options;
  }, [sprintsResponse?.sprints, tTasks]);

  // Client-side filter and sort
  const filteredTasks = useMemo(() => {
    if (!tasksResponse?.tasks) return [];

    let tasks = [...tasksResponse.tasks];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.name.toLowerCase().includes(searchLower) ||
          task.taskKey?.toLowerCase().includes(searchLower),
      );
    }
    if (filters.type) {
      tasks = tasks.filter((task) => task.type === filters.type);
    }
    if (filters.status) {
      tasks = tasks.filter((task) => task.status === filters.status);
    }
    if (filters.assigneeId) {
      tasks = tasks.filter((task) => task.assignee?.id === filters.assigneeId);
    }
    if (filters.sprintId) {
      if (filters.sprintId === BACKLOG_FILTER_VALUE) {
        tasks = tasks.filter(
          (task) => !task.activeSprints || task.activeSprints.length === 0,
        );
      } else {
        tasks = tasks.filter((task) =>
          task.activeSprints?.some(
            (sprint) => String(sprint.id) === filters.sprintId,
          ),
        );
      }
    }

    tasks.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return tasks;
  }, [tasksResponse?.tasks, filters]);

  const totalPoints = useMemo(
    () => filteredTasks.reduce((sum, task) => sum + (task.estimationPoints || 0), 0),
    [filteredTasks],
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredTasks.length / pageSize);
  const paginatedTasks = useMemo(() => {
    const startIndex = currentPage * pageSize;
    return filteredTasks.slice(startIndex, startIndex + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  // Extract unique assignees from all tasks for the filter dropdown
  const assigneeOptions = useMemo(() => {
    if (!tasksResponse?.tasks) return [];

    const assignees = new Map<string, string>();
    tasksResponse.tasks.forEach((task: Task) => {
      if (task.assignee) {
        assignees.set(
          task.assignee.id,
          task.assignee.fullName || task.assignee.username,
        );
      }
    });
    return Array.from(assignees.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [tasksResponse?.tasks]);

  const handleFilterChange = (key: string, value: string) => {
    // Don't allow changing the project filter on this page
    if (key === "projectId") return;
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

  if (error) {
    return (
      <PageContainer>
        <BackButton />
        <EmptyState
          icon={ClipboardList}
          title={tTasks("noTasks")}
          description={tTasks("noTasksDescription")}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton
        className="mb-4"
      />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {tTasks("title")}
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            {filteredTasks.length} {tTasks("title").toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {tTasks("createTask")}
        </button>
      </div>

      <FilterableTaskList
        tasks={paginatedTasks}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onSortToggle={toggleSortOrder}
        onClearFilters={clearFilters}
        assigneeOptions={assigneeOptions}
        projectOptions={projectOptions}
        sprintOptions={sprintOptions}
        totalPoints={totalPoints}
        pagination={{
          currentPage,
          totalPages,
          totalItems: filteredTasks.length,
          pageSize,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
        }}
        emptyTitle={t("noTasksCreated")}
        emptyDescription={t("createTasksInBacklog")}
        bulkActions={{
          getAllFilteredTasks: () => filteredTasks,
          onRefresh: refetchTasks,
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refetchTasks}
      />
    </PageContainer>
  );
}
