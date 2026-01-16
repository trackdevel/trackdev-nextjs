"use client";

import { BackButton } from "@/components/BackButton";
import {
  CardSection,
  LoadingContainer,
  PageContainer,
  PageHeader,
  useToast,
} from "@/components/ui";
import {
  projectReportsApi,
  projectsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { Report, ReportResult } from "@trackdev/types";
import { BarChart3, FileBarChart, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function ProjectReportsPage() {
  const { user } = useAuth();
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const params = useParams();
  const projectId = Number(params.id);
  const toast = useToast();

  const [computedReport, setComputedReport] = useState<ReportResult | null>(
    null
  );

  // Fetch project data
  const { isLoading: projectLoading } = useQuery(
    () => projectsApi.getById(projectId),
    [projectId],
    { enabled: !!projectId }
  );

  // Fetch available reports for this project (from its course)
  const { data: reports, isLoading: reportsLoading } = useQuery(
    () => projectReportsApi.getAll(projectId),
    [projectId],
    { enabled: !!projectId }
  );

  // Compute report mutation
  const { mutate: computeReport, isLoading: isComputing } = useMutation(
    (reportId: number) => projectReportsApi.compute(projectId, reportId),
    {
      onSuccess: (result) => {
        setComputedReport(result);
      },
      onError: () => {
        toast.error(t("failedToCompute"));
      },
    }
  );

  const isLoading = projectLoading || reportsLoading;
  const availableReports = reports || [];

  // Check if report is fully configured
  const isReportConfigured = (report: Report) => {
    return (
      report.rowType && report.columnType && report.element && report.magnitude
    );
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

      <PageHeader
        title={t("projectReports")}
        description={t("projectReportsDescription")}
      />

      <div className="space-y-8">
        {/* Available Reports Section */}
        <CardSection
          title={t("availableReports")}
          icon={FileBarChart}
          count={availableReports.length}
          isEmpty={availableReports.length === 0}
          emptyMessage={t("noAvailableReportsDescription")}
        >
          <div className="divide-y">
            {availableReports.map((report: Report) => (
              <div
                key={report.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-500">
                    {report.rowType && report.columnType && (
                      <span>
                        {t(
                          report.rowType.toLowerCase() as "students" | "sprints"
                        )}{" "}
                        ×{" "}
                        {t(
                          report.columnType.toLowerCase() as
                            | "students"
                            | "sprints"
                        )}
                      </span>
                    )}
                    {report.magnitude && (
                      <span className="ml-2">
                        •{" "}
                        {report.magnitude === "ESTIMATION_POINTS"
                          ? t("estimationPoints")
                          : t("pullRequests")}
                      </span>
                    )}
                  </p>
                </div>
                {isReportConfigured(report) ? (
                  <button
                    onClick={() => computeReport(report.id)}
                    disabled={isComputing}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {isComputing ? tCommon("loading") : t("computeReport")}
                  </button>
                ) : (
                  <span className="text-sm text-gray-400">
                    {t("reportNotConfigured")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardSection>
      </div>

      {/* Report Result Modal */}
      {computedReport && (
        <ReportResultModal
          result={computedReport}
          onClose={() => setComputedReport(null)}
          t={t}
        />
      )}
    </PageContainer>
  );
}

interface ReportResultModalProps {
  result: ReportResult;
  onClose: () => void;
  t: (key: string) => string;
}

function ReportResultModal({ result, onClose, t }: ReportResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {result.reportName}
            </h2>
            <p className="text-sm text-gray-500">
              {result.projectName} •{" "}
              {t(result.rowType.toLowerCase() as "students" | "sprints")} ×{" "}
              {t(result.columnType.toLowerCase() as "students" | "sprints")} •{" "}
              {result.magnitude === "ESTIMATION_POINTS"
                ? t("estimationPoints")
                : t("pullRequests")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Table */}
        {result.rowHeaders.length === 0 || result.columnHeaders.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            {t("noDataAvailable")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-700">
                    {t(result.rowType.toLowerCase() as "students" | "sprints")}{" "}
                    /{" "}
                    {t(
                      result.columnType.toLowerCase() as "students" | "sprints"
                    )}
                  </th>
                  {result.columnHeaders.map((col) => (
                    <th
                      key={col.id}
                      className="border border-gray-200 bg-gray-50 px-4 py-2 text-center text-sm font-medium text-gray-700"
                    >
                      {col.name}
                    </th>
                  ))}
                  <th className="border border-gray-200 bg-gray-100 px-4 py-2 text-center text-sm font-semibold text-gray-800">
                    {t("total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.rowHeaders.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
                      {row.name}
                    </td>
                    {result.columnHeaders.map((col) => {
                      const key = `${row.id}:${col.id}`;
                      const value = result.data[key] || 0;
                      return (
                        <td
                          key={col.id}
                          className={`border border-gray-200 px-4 py-2 text-center text-sm ${
                            value > 0
                              ? "font-medium text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}
                    <td className="border border-gray-200 bg-gray-100 px-4 py-2 text-center text-sm font-semibold text-gray-800">
                      {result.rowTotals[row.id] || 0}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr>
                  <td className="border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800">
                    {t("total")}
                  </td>
                  {result.columnHeaders.map((col) => (
                    <td
                      key={col.id}
                      className="border border-gray-200 bg-gray-100 px-4 py-2 text-center text-sm font-semibold text-gray-800"
                    >
                      {result.columnTotals[col.id] || 0}
                    </td>
                  ))}
                  <td className="border border-gray-200 bg-gray-200 px-4 py-2 text-center text-sm font-bold text-gray-900">
                    {result.grandTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Close button */}
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
