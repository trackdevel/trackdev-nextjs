"use client";

import { BackButton } from "@/components/BackButton";
import {
  CardSection,
  LoadingContainer,
  PageContainer,
  PageHeader,
} from "@/components/ui";
import {
  projectReportsApi,
  projectsApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { Report } from "@trackdev/types";
import { BarChart3, FileBarChart } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ProjectReportsPage() {
  const { user } = useAuth();
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const params = useParams();
  const projectId = Number(params.id);

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
                  <Link
                    href={`/dashboard/projects/${projectId}/reports/${report.id}`}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t("viewReport")}
                  </Link>
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
    </PageContainer>
  );
}
