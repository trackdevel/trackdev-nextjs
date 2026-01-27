"use client";

import {
  AccessDenied,
  ConfirmDialog,
  EmptyState,
  LoadingContainer,
  Modal,
  PageContainer,
  PageHeader,
} from "@/components/ui";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  reportsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { Report } from "@trackdev/types";
import { Edit, FileText, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReportsPage() {
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { formatDateOnly } = useDateFormat();

  // Check if user is professor
  const isProfessor = user?.roles?.includes("PROFESSOR") ?? false;

  // Modal states
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [reportName, setReportName] = useState("");

  // API queries
  const {
    data: reports,
    isLoading: isLoadingReports,
    error,
    refetch,
  } = useQuery(() => reportsApi.getAll(), [], {
    enabled: isAuthenticated && isProfessor,
  });

  // Mutations
  const createReportMutation = useMutation(
    (name: string) => reportsApi.create(name),
    {
      onSuccess: () => {
        setShowCreateReport(false);
        setReportName("");
        refetch();
      },
    },
  );

  const deleteReportMutation = useMutation(
    (id: number) => reportsApi.delete(id),
    {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setReportToDelete(null);
        refetch();
      },
    },
  );

  const handleCreateReport = () => {
    if (!reportName.trim()) {
      return;
    }
    createReportMutation.mutate(reportName);
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (reportToDelete) {
      deleteReportMutation.mutate(reportToDelete.id);
    }
  };

  const handleEditClick = (reportId: number) => {
    router.push(`/dashboard/reports/${reportId}`);
  };

  // Show loading while user is being fetched
  if (!user) {
    return (
      <PageContainer>
        <LoadingContainer />
      </PageContainer>
    );
  }

  // Access denied for non-professors
  if (!isProfessor) {
    return (
      <AccessDenied title={t("accessDenied")} message={t("professorsOnly")} />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("professorSubtitle")}
        action={
          <button
            onClick={() => setShowCreateReport(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("createReport")}
          </button>
        }
      />

      {/* Content */}
      {isLoadingReports ? (
        <LoadingContainer />
      ) : error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-6 py-12 text-center text-red-600 dark:text-red-400">
          {t("failedToLoad")}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="card">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("allReports")} ({reports.length})
              </h2>
            </div>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {reports.map((report) => (
              <li key={report.id}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          {t("createdAt")}: {formatDateOnly(report.createdAt)}
                        </span>
                        {report.owner && (
                          <span>
                            {t("owner")}:{" "}
                            {report.owner.fullName || report.owner.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(report.id)}
                      className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={t("editReport")}
                    >
                      <Edit className="h-4 w-4" />
                      {tCommon("edit")}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(report)}
                      className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                      title={t("deleteReport")}
                    >
                      <Trash2 className="h-4 w-4" />
                      {tCommon("delete")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title={t("noReports")}
          description={t("noReportsDescription")}
          action={{
            label: t("createReport"),
            onClick: () => setShowCreateReport(true),
          }}
        />
      )}

      {/* Create Report Modal */}
      <Modal
        isOpen={showCreateReport}
        onClose={() => {
          setShowCreateReport(false);
          setReportName("");
        }}
        title={t("createReport")}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateReport();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="reportName" className="label">
              {t("reportName")}
            </label>
            <input
              id="reportName"
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="input"
              placeholder={t("reportName")}
              maxLength={200}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCreateReport(false);
                setReportName("");
              }}
              className="btn-secondary"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={createReportMutation.isLoading || !reportName.trim()}
              className="btn-primary"
            >
              {createReportMutation.isLoading
                ? t("creating")
                : tCommon("create")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setReportToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t("deleteReport")}
        message={t("deleteReportConfirmation", {
          name: reportToDelete?.name ?? "",
        })}
        isLoading={deleteReportMutation.isLoading}
      />
    </PageContainer>
  );
}
