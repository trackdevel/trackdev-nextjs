"use client";

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
import { useState } from "react";

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("analytics");

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
    setSelectedSprintId(""); // Reset sprint selection when project changes
    setSelectedMemberId(""); // Reset member selection when project changes
    setExpandedTasks(new Set());
  };

  const handleSprintChange = (value: string) => {
    setSelectedSprintId(value);
    setExpandedTasks(new Set());
  };

  const handleMemberChange = (value: string) => {
    setSelectedMemberId(value);
    setExpandedTasks(new Set());
  };

  const handleRefresh = () => {
    if (selectedProjectId) {
      const sprintId = selectedSprintId ? Number(selectedSprintId) : undefined;
      const assigneeId = selectedMemberId || undefined;
      fetchStats({
        projectId: Number(selectedProjectId),
        sprintId,
        assigneeId,
      });
    }
  };

  const toggleTaskExpanded = (taskId: number) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getPRStatusIcon = (pr: PullRequest) => {
    if (pr.merged) {
      return <GitMerge className="h-4 w-4 text-purple-600" />;
    }
    if (pr.state === "closed") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <GitPullRequest className="h-4 w-4 text-green-600" />;
  };

  const getPRStatusLabel = (pr: PullRequest) => {
    if (pr.merged) return t("merged");
    if (pr.state === "closed") return t("closed");
    return t("open");
  };

  const getPRStatusBadgeClass = (pr: PullRequest) => {
    if (pr.merged) {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
    if (pr.state === "closed") {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  };

  // Calculate totals
  const totalPRs = tasksWithPRs.reduce(
    (sum: number, task) => sum + task.pullRequests.length,
    0,
  );
  const mergedPRs = tasksWithPRs.reduce(
    (sum: number, task) =>
      sum + task.pullRequests.filter((pr: PullRequest) => pr.merged).length,
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
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* Analysis Type Card */}
      <div className="card mb-6">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("prCodeAnalysis")}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("prCodeAnalysisDesc")}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Project and Sprint Selection */}
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
                onClick={handleRefresh}
                disabled={isFetchingStats}
                className="flex h-10 items-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {isFetchingStats ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t("analyze")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {selectedProjectId && (
        <div className="card">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("results")}
            </h2>
          </div>

          {isFetchingStats ? (
            <div className="p-6">
              <LoadingContainer />
            </div>
          ) : tasksWithPRs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<GitPullRequest className="h-12 w-12" />}
                title={t("noCompletedTasks")}
              />
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 border-b border-gray-200 p-6 sm:grid-cols-4 lg:grid-cols-7 dark:border-gray-700">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("task")}s
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tasksWithPRs.length}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("pullRequests")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalPRs}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {t("merged")}
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {mergedPRs}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {t("linesAdded")}
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    +{totalAdditions.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t("linesDeleted")}
                  </p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    -{totalDeletions.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t("total")}
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {(totalAdditions - totalDeletions).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-cyan-50 p-4 dark:bg-cyan-900/20">
                  <p className="text-sm text-cyan-600 dark:text-cyan-400">
                    {t("survivingLines")}
                  </p>
                  <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                    {totalSurvivingLines.toLocaleString()}
                  </p>
                  {totalAdditions > 0 && (
                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                      {Math.round((totalSurvivingLines / totalAdditions) * 100)}
                      %
                    </p>
                  )}
                </div>
              </div>

              {/* Tasks List */}
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
                  const taskSurvivingLines = task.pullRequests.reduce(
                    (sum: number, pr: PullRequest) =>
                      sum + (pr.survivingLines || 0),
                    0,
                  );

                  return (
                    <div key={task.taskId}>
                      {/* Task Row */}
                      <button
                        onClick={() => toggleTaskExpanded(task.taskId)}
                        className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              {task.taskKey && (
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                  {task.taskKey}
                                </span>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {task.taskName}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>
                                {t("assignee")}:{" "}
                                {task.assigneeFullName ||
                                  task.assigneeUsername ||
                                  t("unassigned")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Plus className="h-3 w-3" />
                              {taskAdditions.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                              <Minus className="h-3 w-3" />
                              {taskDeletions.toLocaleString()}
                            </span>
                            <span
                              className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400"
                              title={t("survivingLines")}
                            >
                              ✓ {taskSurvivingLines.toLocaleString()}
                              {taskAdditions > 0 && (
                                <span className="text-xs">
                                  (
                                  {Math.round(
                                    (taskSurvivingLines / taskAdditions) * 100,
                                  )}
                                  %)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {task.pullRequests.length} PRs
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Expanded PR Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
                          <div className="space-y-3 pl-7">
                            {task.pullRequests.map((pr: PullRequest) => (
                              <div
                                key={pr.id}
                                className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800"
                              >
                                <div className="flex items-center gap-3">
                                  {getPRStatusIcon(pr)}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        #{pr.prNumber}
                                      </span>
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {pr.title || "Pull Request"}
                                      </span>
                                    </div>
                                    {pr.repoFullName && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {pr.repoFullName}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  {/* Line stats */}
                                  <div className="flex items-center gap-3 text-sm">
                                    {pr.additions !== undefined && (
                                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <Plus className="h-3 w-3" />
                                        {pr.additions.toLocaleString()}
                                      </span>
                                    )}
                                    {pr.deletions !== undefined && (
                                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                        <Minus className="h-3 w-3" />
                                        {pr.deletions.toLocaleString()}
                                      </span>
                                    )}
                                    {pr.survivingLines !== undefined && (
                                      <span
                                        className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400"
                                        title={t("survivingLines")}
                                      >
                                        ✓ {pr.survivingLines.toLocaleString()}
                                        {pr.additions !== undefined &&
                                          pr.additions > 0 && (
                                            <span className="text-xs">
                                              (
                                              {Math.round(
                                                (pr.survivingLines /
                                                  pr.additions) *
                                                  100,
                                              )}
                                              %)
                                            </span>
                                          )}
                                      </span>
                                    )}
                                    {pr.changedFiles !== undefined && (
                                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                        <FileCode className="h-3 w-3" />
                                        {pr.changedFiles}
                                      </span>
                                    )}
                                  </div>
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
            </>
          )}
        </div>
      )}
    </PageContainer>
  );
}
