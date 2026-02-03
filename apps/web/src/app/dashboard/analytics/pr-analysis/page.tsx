"use client";

import { BackButton } from "@/components/BackButton";
import {
  EmptyState,
  LoadingContainer,
  PageContainer,
  PageHeader,
  Select,
} from "@/components/ui";
import {
  projectsApi,
  useAuth,
  useMutation,
  useQuery,
  type ProjectPRStatsResponse,
  type TaskWithPRStats,
} from "@trackdev/api-client";
import type { PullRequest } from "@trackdev/types";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  FileCode,
  GitMerge,
  GitPullRequest,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export default function PRAnalysisPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedSprintId, setSelectedSprintId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());

  // Fetch all projects
  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery(
    () => projectsApi.getAll(),
    [],
    { enabled: isAuthenticated },
  );

  const projects = projectsResponse?.projects || [];

  // Get project members from the selected project
  const selectedProject = projects.find(
    (p) => String(p.id) === selectedProjectId,
  );
  const projectMembers = selectedProject?.members || [];

  // Fetch sprints for selected project
  const { data: sprintsResponse, isLoading: isLoadingSprints } = useQuery(
    () => projectsApi.getSprints(Number(selectedProjectId)),
    [selectedProjectId],
    { enabled: isAuthenticated && !!selectedProjectId },
  );

  const sprints = sprintsResponse?.sprints || [];

  // Mutation to fetch PR stats (POST endpoint)
  const {
    mutate: fetchStats,
    data: prStatsResponse,
    isLoading: isFetchingStats,
  } = useMutation<
    ProjectPRStatsResponse,
    { projectId: number; sprintId?: number; assigneeId?: string }
  >(({ projectId, sprintId, assigneeId }) =>
    projectsApi.fetchPRStats(projectId, sprintId, assigneeId),
  );

  const tasksWithPRs: TaskWithPRStats[] = prStatsResponse?.tasks || [];

  // Project options for select
  const projectOptions = projects.map((project) => ({
    value: String(project.id),
    label: project.name,
  }));

  // Sprint options for select (including "All sprints" option)
  const sprintOptions = [
    { value: "", label: t("allSprints") },
    ...sprints.map((sprint) => ({
      value: String(sprint.id),
      label: sprint.label || sprint.value,
    })),
  ];

  // Member options for select (including "All members" option)
  const memberOptions = [
    { value: "", label: t("allMembers") },
    ...projectMembers.map((member) => ({
      value: member.id,
      label: member.fullName || member.username,
    })),
  ];

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    setSelectedSprintId("");
    setSelectedMemberId("");
  };

  const handleSprintChange = (value: string) => {
    setSelectedSprintId(value);
  };

  const handleMemberChange = (value: string) => {
    setSelectedMemberId(value);
  };

  const handleFetchStats = () => {
    if (!selectedProjectId) return;

    fetchStats({
      projectId: Number(selectedProjectId),
      sprintId: selectedSprintId ? Number(selectedSprintId) : undefined,
      assigneeId: selectedMemberId || undefined,
    });
  };

  const toggleTaskExpansion = (taskId: number) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Helper to get PR status badge class
  const getPRStatusBadgeClass = (pr: PullRequest) => {
    if (pr.merged)
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    if (pr.state === "open")
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  };

  // Helper to get PR status label
  const getPRStatusLabel = (pr: PullRequest) => {
    if (pr.merged) return t("merged");
    if (pr.state === "open") return t("open");
    return t("closed");
  };

  // Calculate totals
  const totalPRs = tasksWithPRs.reduce(
    (sum, task) => sum + task.pullRequests.length,
    0,
  );
  const totalAdditions = tasksWithPRs.reduce(
    (sum: number, task) =>
      sum +
      task.pullRequests.reduce(
        (prSum: number, pr: PullRequest) => prSum + (pr.additions || 0),
        0,
      ),
    0,
  );
  const totalDeletions = tasksWithPRs.reduce(
    (sum: number, task) =>
      sum +
      task.pullRequests.reduce(
        (prSum: number, pr: PullRequest) => prSum + (pr.deletions || 0),
        0,
      ),
    0,
  );
  const totalSurvivingLines = tasksWithPRs.reduce(
    (sum: number, task) =>
      sum +
      task.pullRequests.reduce(
        (prSum: number, pr: PullRequest) => prSum + (pr.survivingLines || 0),
        0,
      ),
    0,
  );

  return (
    <PageContainer>
      <BackButton
        fallbackHref="/dashboard/analytics"
        label={tCommon("back")}
        className="mb-4"
      />

      <PageHeader
        title={t("prCodeAnalysis")}
        description={t("prCodeAnalysisDesc")}
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="max-w-md flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("selectProject")}
              </label>
              {isLoadingProjects ? (
                <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
              ) : projects.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noProjects")}</p>
              ) : (
                <Select
                  value={selectedProjectId}
                  onChange={handleProjectChange}
                  options={projectOptions}
                  placeholder={t("selectProject")}
                />
              )}
            </div>
            {selectedProjectId && (
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("selectSprint")}
                </label>
                {isLoadingSprints ? (
                  <div className="h-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
                ) : (
                  <Select
                    value={selectedSprintId}
                    onChange={handleSprintChange}
                    options={sprintOptions}
                    placeholder={t("selectSprint")}
                  />
                )}
              </div>
            )}
            {selectedProjectId && (
              <div className="max-w-md flex-1">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("selectMember")}
                </label>
                <Select
                  value={selectedMemberId}
                  onChange={handleMemberChange}
                  options={memberOptions}
                  placeholder={t("selectMember")}
                />
              </div>
            )}
            {selectedProjectId && (
              <button
                onClick={handleFetchStats}
                disabled={isFetchingStats}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFetchingStats ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {t("fetchStats")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {isFetchingStats ? (
        <LoadingContainer />
      ) : tasksWithPRs.length === 0 ? (
        prStatsResponse ? (
          <EmptyState
            icon={GitPullRequest}
            title={t("noPRsFound")}
            description={t("noPRsFoundDesc")}
          />
        ) : null
      ) : (
        <div className="card">
          {/* Summary Stats */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("totalPRs")}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {totalPRs}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("linesAdded")}
                </p>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  +{totalAdditions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("linesDeleted")}
                </p>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  -{totalDeletions.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("survivingLines")}
                </p>
                <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                  {totalSurvivingLines.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasksWithPRs.map((task) => {
              const isExpanded = expandedTasks.has(task.taskId);
              const taskAdditions = task.pullRequests.reduce(
                (sum: number, pr: PullRequest) => sum + (pr.additions || 0),
                0,
              );
              const taskDeletions = task.pullRequests.reduce(
                (sum: number, pr: PullRequest) => sum + (pr.deletions || 0),
                0,
              );
              const taskSurviving = task.pullRequests.reduce(
                (sum: number, pr: PullRequest) =>
                  sum + (pr.survivingLines || 0),
                0,
              );

              return (
                <div key={task.taskId}>
                  <button
                    onClick={() => toggleTaskExpansion(task.taskId)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.taskKey} - {task.taskName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {task.pullRequests.length} PR
                          {task.pullRequests.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Plus className="h-3 w-3" />
                        {taskAdditions.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Minus className="h-3 w-3" />
                        {taskDeletions.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <BarChart3 className="h-3 w-3" />
                        {taskSurviving.toLocaleString()}
                      </span>
                    </div>
                  </button>

                  {/* Expanded PR details */}
                  {isExpanded && (
                    <div className="bg-gray-50 px-6 py-4 dark:bg-gray-800/50">
                      <div className="space-y-3">
                        {task.pullRequests.map((pr: PullRequest) => (
                          <div
                            key={pr.id}
                            className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3">
                              {pr.merged ? (
                                <GitMerge className="h-5 w-5 text-purple-500" />
                              ) : pr.state === "open" ? (
                                <GitPullRequest className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-400" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  #{pr.prNumber} {pr.title}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span className="flex items-center gap-1 text-green-600">
                                    <Plus className="h-3 w-3" />
                                    {pr.additions || 0}
                                  </span>
                                  <span className="flex items-center gap-1 text-red-600">
                                    <Minus className="h-3 w-3" />
                                    {pr.deletions || 0}
                                  </span>
                                  {pr.survivingLines !== undefined && (
                                    <span className="flex items-center gap-1 text-blue-600">
                                      <BarChart3 className="h-3 w-3" />
                                      {pr.survivingLines} {t("surviving")}
                                    </span>
                                  )}
                                  {pr.changedFiles !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <FileCode className="h-3 w-3" />
                                      {pr.changedFiles}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${getPRStatusBadgeClass(pr)}`}
                              >
                                {getPRStatusLabel(pr)}
                              </span>
                              {pr.url && (
                                <a
                                  href={pr.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    {t("viewOnGitHub")}
                                  </span>
                                </a>
                              )}
                              {pr.merged && (
                                <Link
                                  href={`/dashboard/analytics/pr/${pr.id}`}
                                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden sm:inline">
                                    {t("viewDetails")}
                                  </span>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
