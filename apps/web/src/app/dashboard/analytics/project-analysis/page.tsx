"use client";

import { BackButton } from "@/components/BackButton";
import {
  EmptyState,
  LoadingContainer,
  PageContainer,
  PageHeader,
} from "@/components/ui";
import { projectsApi, useAuth, useQuery } from "@trackdev/api-client";
import { FileSearch, FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function ProjectAnalysisSelectionPage() {
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("analytics");
  const tCommon = useTranslations("common");

  // Redirect if not professor/admin
  const userRoles = user?.roles || [];
  const canAccess =
    userRoles.includes("PROFESSOR") ||
    userRoles.includes("ADMIN") ||
    userRoles.includes("WORKSPACE_ADMIN");

  // Fetch all projects
  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery(
    () => projectsApi.getAll(),
    [],
    { enabled: isAuthenticated && canAccess },
  );

  const projects = projectsResponse?.projects || [];

  if (!canAccess) {
    return (
      <PageContainer>
        <EmptyState
          icon={FileSearch}
          title={t("accessDenied")}
          description={t("accessDeniedDesc")}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton
        fallbackHref="/dashboard/analytics"
        label={tCommon("back")}
        className="mb-4"
      />

      <PageHeader
        title={t("fullProjectAnalysis")}
        description={t("selectProjectForAnalysis")}
      />

      {isLoadingProjects ? (
        <LoadingContainer />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={t("noProjects")}
          description={t("noProjectsDesc")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}/analysis`}
              className="card group p-6 transition-all hover:shadow-md hover:ring-2 hover:ring-blue-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 truncate">
                    {project.name}
                  </h3>
                  {project.course?.subject && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                      {project.course.subject.name} - {project.course.startYear}
                    </p>
                  )}
                  {project.members && (
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {project.members.length} {t("members")}
                    </p>
                  )}
                </div>
                <div className="text-gray-400 transition-transform group-hover:translate-x-1">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
