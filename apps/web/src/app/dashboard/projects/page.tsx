"use client";

import { ProjectBulkActionToolbar } from "@/components/ProjectBulkActionToolbar";
import type { ProjectBulkAction } from "@/components/ProjectBulkActionToolbar";
import { ProjectList } from "@/components/ProjectList";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageContainer, PageHeader, Select } from "@/components/ui";
import { useProjectBulkFreeze } from "@/hooks/useProjectBulkFreeze";
import {
  coursesApi,
  projectsApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 15;

export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("projects");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [pendingAction, setPendingAction] = useState<ProjectBulkAction | null>(
    null,
  );

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");

  const { data: coursesResponse } = useQuery(
    () => coursesApi.getAll(),
    [],
    { enabled: isAuthenticated && isProfessor },
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCourseId]);

  const {
    data: projectsResponse,
    isLoading,
    error,
    refetch: refetchProjects,
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

  const projects = projectsResponse?.projects || [];

  const bulk = useProjectBulkFreeze({
    projects,
    onSuccess: refetchProjects,
    t,
  });

  const courseOptions = [
    { value: "", label: t("allCourses") },
    ...(coursesResponse?.courses?.map((c) => ({
      value: c.id.toString(),
      label: `${c.subject?.name || t("noCourse")} - ${c.startYear}`,
    })) || []),
  ];

  const handleBulkAction = useCallback((action: ProjectBulkAction) => {
    setPendingAction(action);
  }, []);

  const handleConfirmBulkAction = useCallback(() => {
    if (!pendingAction) return;
    bulk.executeBulkAction(pendingAction);
    setPendingAction(null);
  }, [bulk, pendingAction]);

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

      {bulk.showBulkUi && (
        <ProjectBulkActionToolbar
          selectedCount={bulk.selectedCount}
          totalSelectable={bulk.selectableProjects.length}
          selectionState={bulk.selectionState}
          onToggleSelectAll={bulk.toggleSelectAll}
          onClearSelection={bulk.clearSelection}
          onAction={handleBulkAction}
          isExecuting={bulk.isExecuting}
        />
      )}

      <ProjectList
        projects={projects}
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
        selectable={bulk.showBulkUi}
        selectedIds={bulk.selectedIds}
        onToggleProject={bulk.toggleProject}
      />

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmBulkAction}
        title={
          pendingAction === "FREEZE"
            ? t("confirmBulkFreezeTitle")
            : t("confirmBulkUnfreezeTitle")
        }
        message={
          pendingAction === "FREEZE"
            ? t("confirmBulkFreezeMessage", { count: bulk.selectedCount })
            : t("confirmBulkUnfreezeMessage", { count: bulk.selectedCount })
        }
        confirmLabel={
          pendingAction === "FREEZE" ? t("bulkFreeze") : t("bulkUnfreeze")
        }
        isLoading={bulk.isExecuting}
        variant="warning"
      />
    </PageContainer>
  );
}
