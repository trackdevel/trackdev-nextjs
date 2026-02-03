"use client";

import { BackButton } from "@/components/BackButton";
import {
  CardSection,
  LoadingContainer,
  PageContainer,
  PageHeader,
  StatusBadge,
} from "@/components/ui";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  ApiClientError,
  projectAnalysisApi,
  projectsApi,
  SprintSummary,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  AnalysisAuthorSummary,
  AnalysisFile,
  ProjectAnalysis,
} from "@trackdev/types";
import {
  BarChart3,
  ChevronDown,
  Eye,
  FileCode,
  GitPullRequest,
  Play,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectAnalysisPage() {
  const { user } = useAuth();
  const t = useTranslations("projectAnalysis");
  const tCommon = useTranslations("common");
  const params = useParams();
  const projectId = Number(params.id);
  const toast = useToast();
  const { formatDateTime } = useDateFormat();

  // Check if user is professor or admin
  const userRoles = user?.roles || [];
  const isProfessor = userRoles.includes("PROFESSOR");
  const isAdmin = userRoles.includes("ADMIN");
  const canStartAnalysis = isProfessor || isAdmin;

  // State for filters
  const [selectedSprintId, setSelectedSprintId] = useState<number | undefined>(
    undefined,
  );
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | undefined>(
    undefined,
  );

  // Fetch project data (not used directly but triggers loading state)
  const { isLoading: projectLoading } = useQuery(
    () => projectsApi.getById(projectId),
    [projectId],
    { enabled: !!projectId },
  );

  // Fetch sprints for filter
  const { data: sprintsResponse } = useQuery(
    () => projectsApi.getSprints(projectId),
    [projectId],
    { enabled: !!projectId },
  );

  // Fetch latest analysis
  const {
    data: latestAnalysis,
    isLoading: analysisLoading,
    refetch: refetchAnalysis,
  } = useQuery(
    () => projectAnalysisApi.getLatestAnalysis(projectId),
    [projectId],
    { enabled: !!projectId },
  );

  // Fetch analysis results when analysis is done
  const { data: results, refetch: refetchResults } = useQuery(
    () => {
      if (!latestAnalysis?.id || latestAnalysis.status !== "DONE") {
        return Promise.resolve(null);
      }
      return projectAnalysisApi.getResults(
        latestAnalysis.id,
        selectedSprintId,
        selectedAuthorId,
      );
    },
    [
      latestAnalysis?.id,
      latestAnalysis?.status,
      selectedSprintId,
      selectedAuthorId,
    ],
    { enabled: !!latestAnalysis?.id && latestAnalysis?.status === "DONE" },
  );

  // Extract sprints from response
  const sprints = sprintsResponse?.sprints || [];

  // When analysis completes, fetch results
  useEffect(() => {
    if (latestAnalysis?.status === "DONE") {
      refetchResults();
    }
  }, [latestAnalysis?.status, refetchResults]);

  // Start analysis mutation
  const startAnalysisMutation = useMutation(
    () => projectAnalysisApi.startAnalysis(projectId),
    {
      onSuccess: () => {
        toast.success(t("analysisStarted"));
        refetchAnalysis();
      },
      onError: (err: unknown) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("startError");
        toast.error(errorMessage);
      },
    },
  );

  const handleStartAnalysis = () => {
    startAnalysisMutation.mutate(undefined);
  };

  // Format survival rate as percentage (backend returns 0-100)
  const formatSurvivalRate = (rate?: number) => {
    if (rate === undefined || rate === null) return "—";
    return `${rate.toFixed(1)}%`;
  };

  const isLoading = projectLoading || analysisLoading;

  if (!user) {
    return (
      <PageContainer>
        <LoadingContainer />
      </PageContainer>
    );
  }

  if (!canStartAnalysis) {
    return (
      <PageContainer>
        <BackButton
          fallbackHref={`/dashboard/projects/${projectId}`}
          label={tCommon("back")}
          className="mb-4"
        />
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {t("professorOnly")}
          </p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingContainer />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton
        fallbackHref={`/dashboard/projects/${projectId}`}
        label={tCommon("back")}
        className="mb-4"
      />

      <div className="flex items-center justify-between mb-6">
        <PageHeader title={t("title")} description={t("description")} />

        {/* Start/Refresh Analysis Button */}
        {latestAnalysis?.status !== "IN_PROGRESS" && (
          <button
            onClick={handleStartAnalysis}
            disabled={startAnalysisMutation.isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {latestAnalysis ? (
              <>
                <RefreshCw className="h-4 w-4" />
                {t("refreshAnalysis")}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {t("startAnalysis")}
              </>
            )}
          </button>
        )}
      </div>

      {/* Analysis Status Section */}
      {latestAnalysis && (
        <div className="mb-8">
          <AnalysisStatusCard
            analysis={latestAnalysis}
            formatDateTime={formatDateTime}
            t={t}
          />
        </div>
      )}

      {/* Results Section - only show when done */}
      {latestAnalysis?.status === "DONE" && results && (
        <div className="space-y-8">
          {/* Filters */}
          <FiltersSection
            sprints={sprints || []}
            authorSummaries={results.authorSummaries || []}
            selectedSprintId={selectedSprintId}
            selectedAuthorId={selectedAuthorId}
            onSprintChange={setSelectedSprintId}
            onAuthorChange={setSelectedAuthorId}
            t={t}
          />

          {/* PR List */}
          <PRListSection
            files={results.files || []}
            analysisId={latestAnalysis?.id}
            formatSurvivalRate={formatSurvivalRate}
            t={t}
          />
        </div>
      )}

      {/* No analysis yet message */}
      {!latestAnalysis && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("noAnalysisYet")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t("noAnalysisYetDescription")}
          </p>
          <button
            onClick={handleStartAnalysis}
            disabled={startAnalysisMutation.isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {t("startAnalysis")}
          </button>
        </div>
      )}
    </PageContainer>
  );
}

// Analysis Status Card Component
function AnalysisStatusCard({
  analysis,
  formatDateTime,
  t,
}: {
  analysis: ProjectAnalysis;
  formatDateTime: (date: string) => string;
  t: (key: string) => string;
}) {
  const statusVariant = {
    IN_PROGRESS: "warning",
    DONE: "success",
    FAILED: "error",
  }[analysis.status] as "warning" | "success" | "error";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <StatusBadge
            label={t(`status.${analysis.status}`)}
            variant={statusVariant}
          />
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {analysis.startedAt && (
            <span>
              {t("startedAt")}: {formatDateTime(analysis.startedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar for in-progress analysis */}
      {analysis.status === "IN_PROGRESS" && (
        <div className="mb-4">
          {!analysis.totalPrs || analysis.totalPrs === 0 ? (
            // Phase 1: Initializing - collecting PR information
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>{t("initializing")}</span>
            </div>
          ) : (
            // Phase 2: Processing PRs
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">
                  {t("processing")}
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  {analysis.processedPrs || 0} / {analysis.totalPrs} PRs
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.progressPercent || 0}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Summary stats for completed analysis */}
      {analysis.status === "DONE" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analysis.totalFiles || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("totalFiles")}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analysis.totalSurvivingLines || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("survivingLines")}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {analysis.totalDeletedLines || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("deletedLines")}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {analysis.survivalRate !== undefined
                ? `${analysis.survivalRate.toFixed(1)}%`
                : "—"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("survivalRate")}
            </div>
          </div>
        </div>
      )}

      {/* Error message for failed analysis */}
      {analysis.status === "FAILED" && analysis.errorMessage && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md text-red-700 dark:text-red-300 text-sm">
          {analysis.errorMessage}
        </div>
      )}
    </div>
  );
}

// Filters Section Component
function FiltersSection({
  sprints,
  authorSummaries,
  selectedSprintId,
  selectedAuthorId,
  onSprintChange,
  onAuthorChange,
  t,
}: {
  sprints: SprintSummary[];
  authorSummaries: AnalysisAuthorSummary[];
  selectedSprintId?: number;
  selectedAuthorId?: string;
  onSprintChange: (id: number | undefined) => void;
  onAuthorChange: (id: string | undefined) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap gap-4">
        {/* Sprint Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("filterBySprint")}
          </label>
          <Select
            value={selectedSprintId?.toString() || ""}
            onChange={(value) =>
              onSprintChange(value ? Number(value) : undefined)
            }
            options={[
              { value: "", label: t("allSprints") },
              ...sprints.map((sprint) => ({
                value: sprint.id.toString(),
                label: sprint.label,
              })),
            ]}
            placeholder={t("allSprints")}
          />
        </div>

        {/* Author Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("filterByAuthor")}
          </label>
          <Select
            value={selectedAuthorId || ""}
            onChange={(value) => onAuthorChange(value || undefined)}
            options={[
              { value: "", label: t("allAuthors") },
              ...authorSummaries.map((author) => ({
                value: author.authorId,
                label:
                  author.authorName || author.authorUsername || author.authorId,
              })),
            ]}
            placeholder={t("allAuthors")}
          />
        </div>
      </div>
    </div>
  );
}

// PR List Section Component - Groups files by PR and shows in chronological order
function PRListSection({
  files,
  analysisId,
  formatSurvivalRate,
  t,
}: {
  files: AnalysisFile[];
  analysisId?: string;
  formatSurvivalRate: (rate?: number) => string;
  t: (key: string) => string;
}) {
  const [expandedPRs, setExpandedPRs] = useState<Set<string>>(new Set());

  // Group files by PR and calculate PR-level stats
  const prGroups = files.reduce(
    (acc, file) => {
      const prKey = file.prId || `unknown-${file.taskId}`;
      if (!acc[prKey]) {
        acc[prKey] = {
          prId: file.prId,
          prNumber: file.prNumber,
          prTitle: file.prTitle,
          taskId: file.taskId,
          taskName: file.taskName,
          sprintName: file.sprintName,
          authorName: file.authorName,
          files: [],
          totalAdditions: 0,
          totalDeletions: 0,
          totalSurviving: 0,
          totalDeleted: 0,
        };
      }
      acc[prKey].files.push(file);
      acc[prKey].totalAdditions += file.additions || 0;
      acc[prKey].totalDeletions += file.deletions || 0;
      acc[prKey].totalSurviving += file.survivingLines || 0;
      acc[prKey].totalDeleted += file.deletedLines || 0;
      return acc;
    },
    {} as Record<
      string,
      {
        prId?: string;
        prNumber?: number;
        prTitle?: string;
        taskId: number;
        taskName?: string;
        sprintName?: string;
        authorName?: string;
        files: AnalysisFile[];
        totalAdditions: number;
        totalDeletions: number;
        totalSurviving: number;
        totalDeleted: number;
      }
    >,
  );

  // Sort PRs by PR number (chronological order)
  const sortedPRs = Object.values(prGroups).sort((a, b) => {
    const aNum = a.prNumber || 0;
    const bNum = b.prNumber || 0;
    return aNum - bNum;
  });

  const toggleExpand = (prId: string) => {
    setExpandedPRs((prev) => {
      const next = new Set(prev);
      if (next.has(prId)) {
        next.delete(prId);
      } else {
        next.add(prId);
      }
      return next;
    });
  };

  if (sortedPRs.length === 0) return null;

  return (
    <CardSection
      title={t("analyzedPRs")}
      icon={GitPullRequest}
      count={sortedPRs.length}
    >
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedPRs.map((pr) => {
          const prKey = pr.prId || `unknown-${pr.taskId}`;
          const isExpanded = expandedPRs.has(prKey);
          const total = pr.totalSurviving + pr.totalDeleted;
          const survivalRate =
            total > 0 ? (pr.totalSurviving / total) * 100 : 100;

          return (
            <div key={prKey} className="px-4 py-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(prKey)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                  <GitPullRequest className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        #{pr.prNumber}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {pr.prTitle || "—"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {pr.taskName && (
                        <span>
                          {t("task")}: {pr.taskName}
                        </span>
                      )}
                      {pr.authorName && (
                        <span className="ml-3">
                          {t("author")}: {pr.authorName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm flex-shrink-0">
                  <span className="text-gray-500 dark:text-gray-400">
                    {pr.files.length} {t("files")}
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    +{pr.totalAdditions}
                  </span>
                  <span className="text-red-600 dark:text-red-400">
                    -{pr.totalDeletions}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium min-w-[60px] text-right">
                    {formatSurvivalRate(survivalRate)}
                  </span>
                </div>
              </div>

              {/* Expanded file list */}
              {isExpanded && (
                <div className="mt-3 ml-7 space-y-2">
                  {pr.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileCode className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-gray-900 dark:text-white truncate">
                          {file.filePath}
                        </span>
                        <StatusBadge
                          label={file.status}
                          variant={
                            file.status === "added"
                              ? "success"
                              : file.status === "deleted"
                                ? "error"
                                : "neutral"
                          }
                        />
                      </div>
                      <div className="flex items-center gap-4 text-sm flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400">
                          +{file.additions}
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                          -{file.deletions}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium min-w-[60px] text-right">
                          {formatSurvivalRate(file.survivalRate)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* PR summary row */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/dashboard/tasks/${pr.taskId}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                      >
                        {t("viewTask")}
                      </Link>
                      {pr.prId && (
                        <Link
                          href={`/dashboard/analytics/pr/${pr.prId}${analysisId ? `?analysisId=${analysisId}` : ""}`}
                          className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline text-sm"
                        >
                          <Eye className="h-3 w-3" />
                          {t("viewPRDetails")}
                        </Link>
                      )}
                      {pr.sprintName && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          • {pr.sprintName}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t("survivingLines")}: {pr.totalSurviving} |{" "}
                      {t("deletedLines")}: {pr.totalDeleted}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CardSection>
  );
}
