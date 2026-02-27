"use client";

import { EmptyState } from "@/components/ui";
import type { LineDetail, PRFileDetail } from "@trackdev/types";
import {
  CheckCircle,
  ExternalLink,
  FileCode,
  Minus,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Modal to show the current file with PR line analysis.
 * Shows:
 * - All current file lines with line numbers
 * - PR lines that survived (blue) - content still exists in current file
 * - PR lines that didn't survive (red) - content no longer in current file
 */
export function FileLineModal({
  file,
  onClose,
}: {
  file: PRFileDetail;
  onClose: () => void;
}) {
  const t = useTranslations("analytics");

  const survivingLines =
    file.lines?.filter((l) => l.status === "SURVIVING") || [];
  const nonSurvivingLines =
    file.lines?.filter((l) => l.status === "DELETED") || [];
  const currentFileLines =
    file.lines?.filter((l) => l.lineNumber !== null) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileCode className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {file.filePath}
              </h3>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">
                  {file.currentLines || currentFileLines.length}{" "}
                  {t("currentLinesInFile")}
                </span>
                <span className="flex items-center gap-1 text-blue-600">
                  <CheckCircle className="h-3 w-3" />
                  {survivingLines.length} {t("surviving")}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <Minus className="h-3 w-3" />
                  {nonSurvivingLines.length} {t("nonSurviving")}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 border-b border-gray-200 px-6 py-2 text-xs dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-100 border border-blue-300 dark:bg-blue-900/40 dark:border-blue-700" />
            <span className="text-gray-600 dark:text-gray-400">
              {t("survivingFromPR")} - {t("stillInFile")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-100 border border-red-300 dark:bg-red-900/40 dark:border-red-700" />
            <span className="text-gray-600 dark:text-gray-400">
              {t("nonSurvivingFromPR")} - {t("noLongerInFile")}
            </span>
          </div>
        </div>

        {/* Content - File view with global horizontal scroll */}
        <div className="max-h-[calc(90vh-160px)] overflow-auto">
          {!file.lines || file.lines.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<FileCode className="h-12 w-12" />}
                title={t("noLinesFound")}
                description={t("noLinesFoundDesc")}
              />
            </div>
          ) : (
            <div className="font-mono text-sm min-w-max">
              {file.lines.map((line: LineDetail, index: number) => {
                const isSurviving = line.status === "SURVIVING";
                const isNonSurviving = line.status === "DELETED";
                const isFromPR = isSurviving || isNonSurviving;

                let rowClass = "border-gray-100 dark:border-gray-800";
                let lineNumClass =
                  "bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500";

                if (isSurviving) {
                  rowClass =
                    "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20";
                  lineNumClass =
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
                } else if (isNonSurviving) {
                  rowClass =
                    "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20";
                  lineNumClass =
                    "bg-red-100 text-red-500 dark:bg-red-900/40 dark:text-red-400";
                }

                return (
                  <div
                    key={index}
                    className={`flex border-b last:border-b-0 ${rowClass}`}
                  >
                    <div
                      className={`w-14 shrink-0 select-none px-2 py-1 text-right font-mono text-xs sticky left-0 ${lineNumClass}`}
                    >
                      {line.lineNumber !== null ? line.lineNumber : ""}
                    </div>

                    <div
                      className={`w-6 shrink-0 select-none py-1 text-center font-bold ${
                        isSurviving
                          ? "text-blue-600 dark:text-blue-400"
                          : isNonSurviving
                            ? "text-red-500 dark:text-red-400"
                            : "text-transparent"
                      }`}
                    >
                      {isSurviving ? "+" : isNonSurviving ? "−" : " "}
                    </div>

                    {isFromPR && line.prFileUrl && (
                      <a
                        href={line.prFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`shrink-0 px-1 py-1 ${
                          isSurviving
                            ? "text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
                            : "text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
                        }`}
                        title={t("viewInPR")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {(line.authorFullName || line.authorGithubUsername) && (
                      <div
                        className={`shrink-0 px-1 py-1 text-xs max-w-[100px] truncate ${
                          isSurviving
                            ? "text-blue-500 dark:text-blue-400"
                            : isNonSurviving
                              ? "text-red-500 dark:text-red-400"
                              : "text-gray-500 dark:text-gray-400"
                        }`}
                        title={
                          line.authorFullName
                            ? `${line.authorFullName} (@${line.authorGithubUsername})`
                            : `@${line.authorGithubUsername}`
                        }
                      >
                        {line.authorFullName || `@${line.authorGithubUsername}`}
                      </div>
                    )}

                    {line.commitSha && (
                      <div
                        className={`shrink-0 px-1 py-1 text-xs ${
                          isSurviving
                            ? "text-blue-400 dark:text-blue-500"
                            : isNonSurviving
                              ? "text-red-400 dark:text-red-500"
                              : "text-gray-400 dark:text-gray-500"
                        }`}
                        title={line.commitSha}
                      >
                        {line.commitUrl ? (
                          <a
                            href={line.commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {line.commitSha.substring(0, 7)}
                          </a>
                        ) : (
                          line.commitSha.substring(0, 7)
                        )}
                      </div>
                    )}

                    {!isFromPR && line.originPrUrl && (
                      <a
                        href={line.originPrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-1 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title={`PR #${line.originPrNumber}`}
                      >
                        #{line.originPrNumber}
                      </a>
                    )}

                    <div
                      className={`whitespace-pre px-2 py-1 ${
                        isNonSurviving
                          ? "text-red-700 line-through dark:text-red-300"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {line.content || (
                        <span className="text-gray-400 select-none">
                          &nbsp;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
