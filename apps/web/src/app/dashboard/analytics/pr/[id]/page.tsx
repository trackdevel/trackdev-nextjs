"use client";

import { FileLineModal } from "@/components/FileLineModal";
import { EmptyState, LoadingContainer, PageContainer } from "@/components/ui";
import {
  projectAnalysisApi,
  pullRequestsApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { PRFileDetail } from "@trackdev/types";
import {
  ArrowLeft,
  ExternalLink,
  FileCode,
  GitMerge,
  GitPullRequest,
  Minus,
  Plus,
  XCircle,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function PRDetailPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("analytics");
  const params = useParams();
  const searchParams = useSearchParams();
  const prId = params.id as string;
  const analysisId = searchParams.get("analysisId");

  const [selectedFile, setSelectedFile] = useState<PRFileDetail | null>(null);

  // Fetch PR details
  const { data: prDetails, isLoading } = useQuery(
    () => pullRequestsApi.getDetails(prId),
    [prId],
    { enabled: isAuthenticated && !!prId },
  );

  // Fetch precomputed file details if analysisId is provided
  const { data: precomputedFiles, isLoading: isLoadingPrecomputed } = useQuery(
    () =>
      analysisId
        ? projectAnalysisApi.getPrecomputedFileDetails(analysisId, prId)
        : Promise.resolve(null),
    [analysisId, prId],
    { enabled: isAuthenticated && !!analysisId && !!prId },
  );

  // Use precomputed files if available, otherwise use live data from prDetails
  const fileDetails = precomputedFiles || prDetails?.files;
  const isUsingPrecomputed = !!precomputedFiles;

  const getPRStatusIcon = () => {
    if (prDetails?.merged) {
      return <GitMerge className="h-6 w-6 text-purple-600" />;
    }
    if (prDetails?.state === "closed") {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    return <GitPullRequest className="h-6 w-6 text-green-600" />;
  };

  const getStatusBadgeClass = () => {
    if (prDetails?.merged) {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
    if (prDetails?.state === "closed") {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  };

  const getStatusLabel = () => {
    if (prDetails?.merged) return t("merged");
    if (prDetails?.state === "closed") return t("closed");
    return t("open");
  };

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
    <PageContainer>
      {/* Back link */}
      <Link
        href="/dashboard/analytics"
        className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToAnalytics")}
      </Link>

      {isLoading ? (
        <LoadingContainer />
      ) : !prDetails ? (
        <EmptyState
          icon={<GitPullRequest className="h-12 w-12" />}
          title={t("prNotFound")}
        />
      ) : (
        <>
          {/* PR Header */}
          <div className="card mb-6">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {getPRStatusIcon()}
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                        #{prDetails.prNumber}
                      </span>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {prDetails.title || "Pull Request"}
                      </h1>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass()}`}
                      >
                        {getStatusLabel()}
                      </span>
                    </div>
                    {prDetails.repoFullName && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {prDetails.repoFullName}
                      </p>
                    )}
                    {prDetails.author && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        by{" "}
                        {prDetails.author.fullName || prDetails.author.username}
                      </p>
                    )}
                  </div>
                </div>
                {prDetails.url && (
                  <a
                    href={prDetails.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("viewOnGitHub")}
                  </a>
                )}
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("filesChanged")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {prDetails.changedFiles || prDetails.files?.length || 0}
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {t("additions")}
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    +{(prDetails.additions || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {t("deletions")}
                  </p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    -{(prDetails.deletions || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-cyan-50 p-4 dark:bg-cyan-900/20">
                  <p className="text-sm text-cyan-600 dark:text-cyan-400">
                    {t("survivingLines")}
                  </p>
                  <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                    {(prDetails.survivingLines || 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {t("survivalRate")}
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {prDetails.additions && prDetails.additions > 0
                      ? Math.round(
                          ((prDetails.survivingLines || 0) /
                            prDetails.additions) *
                            100,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Files List */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("changedFiles")} ({fileDetails?.length || 0})
              </h2>
              {isUsingPrecomputed && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Zap className="h-3 w-3" />
                  {t("precomputed")}
                </span>
              )}
            </div>

            {isLoadingPrecomputed ? (
              <div className="p-6">
                <LoadingContainer />
              </div>
            ) : !fileDetails || fileDetails.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<FileCode className="h-12 w-12" />}
                  title={t("noFilesFound")}
                  description={t("noFilesFoundDesc")}
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {fileDetails.map((file: PRFileDetail) => (
                  <button
                    key={file.filePath}
                    onClick={() => setSelectedFile(file)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <FileCode className="h-5 w-5 text-gray-400" />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {file.filePath}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span
                            className={`rounded px-1.5 py-0.5 ${getFileStatusBadgeClass(file.status)}`}
                          >
                            {file.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Plus className="h-3 w-3" />
                        {file.additions}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <Minus className="h-3 w-3" />
                        {file.deletions}
                      </span>
                      <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                        ✓ {file.survivingLines}
                        {file.additions > 0 && (
                          <span className="text-xs">
                            (
                            {Math.round(
                              (file.survivingLines / file.additions) * 100,
                            )}
                            %)
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* File Line Modal */}
      {selectedFile && (
        <FileLineModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </PageContainer>
  );
}
