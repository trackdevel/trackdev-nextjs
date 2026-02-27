"use client";

import { FileLineModal } from "@/components/FileLineModal";
import { EmptyState, LoadingContainer, Modal } from "@/components/ui";
import { pullRequestsApi, useAuth, useQuery } from "@trackdev/api-client";
import type { PRFileDetail } from "@trackdev/types";
import { FileCode, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface PRSummaryModalProps {
  prId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PRSummaryModal({ prId, isOpen, onClose }: PRSummaryModalProps) {
  const t = useTranslations("pullRequestDetails");
  const tAnalytics = useTranslations("analytics");
  const { isAuthenticated } = useAuth();
  const [selectedFile, setSelectedFile] = useState<PRFileDetail | null>(null);

  const { data: prDetails, isLoading } = useQuery(
    () => pullRequestsApi.getDetails(prId),
    [prId],
    { enabled: isAuthenticated && !!prId && isOpen },
  );

  const fileDetails = prDetails?.files;

  const getFileStatusBadgeClass = (status: string) => {
    switch (status) {
      case "added":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "deleted":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "renamed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={t("summary")}
        maxWidth="xl"
      >
        {isLoading ? (
          <LoadingContainer />
        ) : !prDetails ? (
          <EmptyState
            icon={<FileCode className="h-12 w-12" />}
            title={t("noData")}
          />
        ) : (
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("filesChanged")}
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {prDetails.changedFiles || prDetails.files?.length || 0}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <p className="text-xs text-green-600 dark:text-green-400">
                  {t("additions")}
                </p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  +{(prDetails.additions || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {t("deletions")}
                </p>
                <p className="text-lg font-bold text-red-700 dark:text-red-300">
                  -{(prDetails.deletions || 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-cyan-50 p-3 dark:bg-cyan-900/20">
                <p className="text-xs text-cyan-600 dark:text-cyan-400">
                  {t("survivingLines")}
                </p>
                <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">
                  {(prDetails.survivingLines || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* File list */}
            {!fileDetails || fileDetails.length === 0 ? (
              <EmptyState
                icon={<FileCode className="h-12 w-12" />}
                title={tAnalytics("noFilesFound")}
              />
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-auto">
                {fileDetails.map((file: PRFileDetail) => (
                  <button
                    key={file.filePath}
                    onClick={() => setSelectedFile(file)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileCode className="h-4 w-4 text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate block">
                          {file.filePath}
                        </span>
                        <span
                          className={`text-xs rounded px-1.5 py-0.5 ${getFileStatusBadgeClass(file.status)}`}
                        >
                          {file.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0 ml-2">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Plus className="h-3 w-3" />
                        {file.additions}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Minus className="h-3 w-3" />
                        {file.deletions}
                      </span>
                      {file.additions > 0 && (
                        <span className="text-cyan-600 dark:text-cyan-400">
                          {Math.round(
                            (file.survivingLines / file.additions) * 100,
                          )}
                          %
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* File Line Modal */}
      {selectedFile && (
        <FileLineModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </>
  );
}
