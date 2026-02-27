"use client";

import { ProjectList } from "@/components/ProjectList";
import { PageContainer, PageHeader, Select } from "@/components/ui";
import {
  coursesApi,
  projectsApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const PAGE_SIZE = 15;

export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("projects");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");

  const { data: coursesResponse } = useQuery(
    () => coursesApi.getAll(),
    [],
    { enabled: isAuthenticated && isProfessor },
  );

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCourseId]);

  const {
    data: projectsResponse,
    isLoading,
    error,
  } = useQuery(
    () =>
      projectsApi.getPaginated({
        page: currentPage,
        size: PAGE_SIZE,
        courseId: selectedCourseId
          ? parseInt(selectedCourseId)
          : undefined,
      }),
    [currentPage, selectedCourseId],
    { enabled: isAuthenticated },
  );

  const courseOptions = [
    { value: "", label: t("allCourses") },
    ...(coursesResponse?.courses?.map((c) => ({
      value: c.id.toString(),
      label: `${c.subject?.name || t("noCourse")} - ${c.startYear}`,
    })) || []),
  ];

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={
          isProfessor || isAdmin
            ? t("adminProfessorSubtitle")
            : t("studentSubtitle")
        }
      />

      {/* Course Filter - Professor only */}
      {isProfessor && (
        <div className="flex items-end gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("filterCourse")}
            </label>
            <Select
              value={selectedCourseId}
              onChange={setSelectedCourseId}
              options={courseOptions}
              placeholder={t("allCourses")}
              className="min-w-80"
            />
          </div>
        </div>
      )}

      <ProjectList
        projects={projectsResponse?.projects || []}
        totalElements={projectsResponse?.totalElements ?? 0}
        totalPages={projectsResponse?.totalPages ?? 0}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        error={error}
        emptyTitle={t("noProjects")}
        emptyDescription={
          isProfessor || isAdmin
            ? t("noProjectsAdminProfessor")
            : t("noProjectsStudent")
        }
      />
    </PageContainer>
  );
}
