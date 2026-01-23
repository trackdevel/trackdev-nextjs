"use client";

import { BackButton } from "@/components/BackButton";
import { CreateTaskModal, TaskList } from "@/components/tasks";
import {
  EmptyState,
  LoadingContainer,
  PageContainer,
  Select,
} from "@/components/ui";
import { projectsApi, useAuth, useQuery } from "@trackdev/api-client";
import type { Task, TaskStatus, TaskType } from "@trackdev/types";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Plus,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

interface FilterState {
  type: TaskType | "";
  status: TaskStatus | "";
  assigneeId: string;
  sprintId: string;
  sortOrder: "asc" | "desc";
}

const BACKLOG_FILTER_VALUE = "backlog";

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("projects");
  const tTasks = useTranslations("tasks");

  const [filters, setFilters] = useState<FilterState>({
    type: "",
    status: "",
    assigneeId: "",
    sprintId: "",
    sortOrder: "desc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const ITEMS_PER_PAGE_OPTIONS = [
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
  ];

  // Task type options with translations
  const TASK_TYPES: { value: TaskType | ""; label: string }[] = [
    { value: "", label: tTasks("allTypes") },
    { value: "USER_STORY", label: tTasks("typeUserStory") },
    { value: "TASK", label: tTasks("typeTask") },
    { value: "BUG", label: tTasks("typeBug") },
  ];

  // Task status options with translations
  const TASK_STATUSES: { value: TaskStatus | ""; label: string }[] = [
    { value: "", label: tTasks("allStatuses") },
    { value: "BACKLOG", label: tTasks("statusBacklog") },
    { value: "TODO", label: tTasks("statusTodo") },
    { value: "INPROGRESS", label: tTasks("statusInProgress") },
    { value: "VERIFY", label: tTasks("statusVerify") },
    { value: "DONE", label: tTasks("statusDone") },
  ];

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

  // Sprint options for filter dropdown (includes "Backlog" option for unassigned tasks)
  const sprintOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: BACKLOG_FILTER_VALUE, label: tTasks("backlog") },
    ];
    if (sprintsResponse?.sprints) {
      // Sort sprints by start date ascending
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

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    if (!tasksResponse?.tasks) return [];

    let tasks = [...tasksResponse.tasks];

    // Apply filters
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
        // Filter tasks with no sprints assigned
        tasks = tasks.filter(
          (task) => !task.activeSprints || task.activeSprints.length === 0,
        );
      } else {
        // Filter tasks belonging to the selected sprint
        tasks = tasks.filter((task) =>
          task.activeSprints?.some(
            (sprint) => String(sprint.id) === filters.sprintId,
          ),
        );
      }
    }

    // Sort by creation date (id as proxy for creation order)
    tasks.sort((a, b) => {
      if (filters.sortOrder === "asc") {
        return a.id - b.id;
      }
      return b.id - a.id;
    });

    return tasks;
  }, [tasksResponse?.tasks, filters]);

  // Paginate filtered tasks
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Extract unique assignees from tasks for the filter dropdown
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

  const toggleSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      status: "",
      assigneeId: "",
      sprintId: "",
      sortOrder: "desc",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.type !== "" ||
    filters.status !== "" ||
    filters.assigneeId !== "" ||
    filters.sprintId !== "";

  if (error) {
    return (
      <PageContainer>
        <BackButton fallbackHref={`/dashboard/projects/${projectId}`} />
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
      <BackButton fallbackHref={`/dashboard/projects/${projectId}`} />

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {tTasks("title")}
            </h1>
            <p className="mt-1 text-gray-600">
              {filteredTasks.length} {tTasks("title").toLowerCase()}
              {filteredTasks.length > 0 && (
                <span className="ml-2 text-gray-400">
                  ({tTasks("page")} {currentPage} {tTasks("of")} {totalPages})
                </span>
              )}
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

        {/* Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">{tTasks("filters")}:</span>
            </div>

            <Select
              value={filters.type}
              onChange={(value) => handleFilterChange("type", value)}
              options={TASK_TYPES}
              className="w-auto"
            />

            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
              options={TASK_STATUSES}
              className="w-auto"
            />

            {assigneeOptions.length > 0 && (
              <Select
                value={filters.assigneeId}
                onChange={(value) => handleFilterChange("assigneeId", value)}
                options={[
                  { value: "", label: tTasks("allAssignees") },
                  ...assigneeOptions,
                ]}
                className="w-auto"
              />
            )}

            <Select
              value={filters.sprintId}
              onChange={(value) => handleFilterChange("sprintId", value)}
              options={[
                { value: "", label: tTasks("allSprints") },
                ...sprintOptions,
              ]}
              className="w-auto"
            />

            <button
              onClick={toggleSortOrder}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              title={
                filters.sortOrder === "asc"
                  ? tTasks("sortNewestFirst")
                  : tTasks("sortOldestFirst")
              }
            >
              {filters.sortOrder === "asc" ? (
                <>
                  <ArrowUpAZ className="h-4 w-4" />
                  <span>{tTasks("oldest")}</span>
                </>
              ) : (
                <>
                  <ArrowDownAZ className="h-4 w-4" />
                  <span>{tTasks("newest")}</span>
                </>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
                {tTasks("clearFilters")}
              </button>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="card">
          {isLoading ? (
            <LoadingContainer />
          ) : filteredTasks.length > 0 ? (
            <TaskList tasks={paginatedTasks} />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title={
                hasActiveFilters
                  ? tTasks("noMatchingTasks")
                  : t("noTasksCreated")
              }
              description={
                hasActiveFilters
                  ? tTasks("tryAdjustingFilters")
                  : t("createTasksInBacklog")
              }
            />
          )}
        </div>

        {/* Pagination Controls */}
        {filteredTasks.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {tTasks("itemsPerPage")}:
              </span>
              <Select
                value={String(itemsPerPage)}
                onChange={handleItemsPerPageChange}
                options={ITEMS_PER_PAGE_OPTIONS}
                className="w-auto"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, filteredTasks.length)}{" "}
                {tTasks("of")} {filteredTasks.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  aria-label={tTasks("previousPage")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                  aria-label={tTasks("nextPage")}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
