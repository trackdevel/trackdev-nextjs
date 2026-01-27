"use client";

import { BackButton } from "@/components/BackButton";
import { LoadingContainer, PageContainer, PageHeader } from "@/components/ui";
import { projectReportsApi, useAuth, useQuery } from "@trackdev/api-client";
import type { ReportResult, TaskStatus } from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

const ALL_TASK_STATUSES: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "INPROGRESS",
  "VERIFY",
  "DONE",
];

export default function ReportViewPage() {
  const { user } = useAuth();
  const t = useTranslations("reports");
  const tTasks = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const params = useParams();
  const projectId = Number(params.id);
  const reportId = Number(params.reportId);

  // Status filter state - start with all selected
  const [selectedStatuses, setSelectedStatuses] =
    useState<TaskStatus[]>(ALL_TASK_STATUSES);

  // Build status filter query
  const statusFilterQuery = useMemo(() => {
    // If all are selected, don't filter
    if (selectedStatuses.length === ALL_TASK_STATUSES.length) {
      return undefined;
    }
    return selectedStatuses;
  }, [selectedStatuses]);

  // Fetch report data with status filter
  const {
    data: reportResult,
    isLoading,
    error,
  } = useQuery(
    () => projectReportsApi.compute(projectId, reportId, statusFilterQuery),
    [projectId, reportId, statusFilterQuery],
    { enabled: !!projectId && !!reportId },
  );

  // Toggle status filter
  const toggleStatus = (status: TaskStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        // Don't allow deselecting all
        if (prev.length === 1) return prev;
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Select/deselect all
  const toggleAll = () => {
    if (selectedStatuses.length === ALL_TASK_STATUSES.length) {
      // Deselect all except first one
      setSelectedStatuses([ALL_TASK_STATUSES[0]]);
    } else {
      setSelectedStatuses(ALL_TASK_STATUSES);
    }
  };

  if (!user) {
    return (
      <PageContainer>
        <LoadingContainer />
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <BackButton
          fallbackHref={`/dashboard/projects/${projectId}/reports`}
          label={tCommon("back")}
          className="mb-4"
        />
        <LoadingContainer />
      </PageContainer>
    );
  }

  if (error || !reportResult) {
    return (
      <PageContainer>
        <BackButton
          fallbackHref={`/dashboard/projects/${projectId}/reports`}
          label={tCommon("back")}
          className="mb-4"
        />
        <div className="py-8 text-center text-red-500">
          {t("failedToCompute")}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton
        fallbackHref={`/dashboard/projects/${projectId}/reports`}
        label={tCommon("back")}
        className="mb-4"
      />

      <PageHeader
        title={reportResult.reportName}
        description={`${reportResult.projectName} • ${t(
          reportResult.rowType.toLowerCase() as "students" | "sprints",
        )} × ${t(
          reportResult.columnType.toLowerCase() as "students" | "sprints",
        )} • ${
          reportResult.magnitude === "ESTIMATION_POINTS"
            ? t("estimationPoints")
            : t("pullRequests")
        }`}
      />

      {/* Status Filter - only show if element is TASK */}
      {reportResult.element === "TASK" && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("filterByStatus")}
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleAll}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedStatuses.length === ALL_TASK_STATUSES.length
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {t("allStatuses")}
            </button>
            {ALL_TASK_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedStatuses.includes(status)
                    ? getStatusColor(status)
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {tTasks(getStatusTranslationKey(status))}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Report Table */}
      <ReportTable result={reportResult} t={t} />
    </PageContainer>
  );
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case "BACKLOG":
      return "bg-gray-500 text-white";
    case "TODO":
      return "bg-yellow-500 text-white";
    case "INPROGRESS":
      return "bg-blue-500 text-white";
    case "VERIFY":
      return "bg-purple-500 text-white";
    case "DONE":
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

function getStatusTranslationKey(status: TaskStatus): string {
  switch (status) {
    case "BACKLOG":
      return "statusBacklog";
    case "TODO":
      return "statusTodo";
    case "INPROGRESS":
      return "statusInProgress";
    case "VERIFY":
      return "statusVerify";
    case "DONE":
      return "statusDone";
    default:
      return "statusBacklog";
  }
}

interface ReportTableProps {
  result: ReportResult;
  t: (key: string) => string;
}

function ReportTable({ result, t }: ReportTableProps) {
  if (result.rowHeaders.length === 0 || result.columnHeaders.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-12 text-center text-gray-500 dark:text-gray-400">
        {t("noDataAvailable")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
              {t(result.rowType.toLowerCase() as "students" | "sprints")} /{" "}
              {t(result.columnType.toLowerCase() as "students" | "sprints")}
            </th>
            {result.columnHeaders.map((col) => (
              <th
                key={col.id}
                className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {col.name}
              </th>
            ))}
            <th className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("total")}
            </th>
          </tr>
        </thead>
        <tbody>
          {result.rowHeaders.map((row) => (
            <tr key={row.id}>
              <td className="border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {row.name}
              </td>
              {result.columnHeaders.map((col) => {
                const key = `${row.id}:${col.id}`;
                const value = result.data[key] || 0;
                return (
                  <td
                    key={col.id}
                    className={`border-b border-r border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-sm ${
                      value > 0
                        ? "font-medium text-gray-900 dark:text-white"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {value}
                  </td>
                );
              })}
              <td className="border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-800 dark:text-gray-200">
                {result.rowTotals[row.id] || 0}
              </td>
            </tr>
          ))}
          {/* Totals row */}
          <tr>
            <td className="border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("total")}
            </td>
            {result.columnHeaders.map((col) => (
              <td
                key={col.id}
                className="border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 px-4 py-3 text-center text-sm font-semibold text-gray-800 dark:text-gray-200"
              >
                {result.columnTotals[col.id] || 0}
              </td>
            ))}
            <td className="bg-gray-200 dark:bg-gray-600 px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white">
              {result.grandTotal}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
