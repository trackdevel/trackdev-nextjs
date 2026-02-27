"use client";

import { getPRStateBadge } from "@/components/PRTimeline";
import type { PRDetailedAnalysis } from "@trackdev/types";
import {
  ExternalLink,
  GitMerge,
  GitPullRequest,
  Minus,
  Plus,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface PRHeaderProps {
  pr: PRDetailedAnalysis;
}

export function PRHeader({ pr }: PRHeaderProps) {
  const t = useTranslations("pullRequestDetails");

  const getPRStatusIcon = () => {
    if (pr.merged) {
      return <GitMerge className="h-6 w-6 text-purple-600" />;
    }
    if (pr.state === "closed") {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    return <GitPullRequest className="h-6 w-6 text-green-600" />;
  };

  const stateBadge = getPRStateBadge(
    pr.merged ? "merged" : pr.state,
    t,
  );

  return (
    <div className="card mb-6">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {getPRStatusIcon()}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  #{pr.prNumber}
                </span>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {pr.title || "Pull Request"}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${stateBadge.bg} ${stateBadge.text}`}
                >
                  {stateBadge.label}
                </span>
              </div>
              {pr.repoFullName && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {pr.repoFullName}
                </p>
              )}
              {pr.author && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  by {pr.author.fullName || pr.author.username}
                </p>
              )}
            </div>
          </div>
          {pr.url && (
            <a
              href={pr.url}
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
              {pr.changedFiles || pr.files?.length || 0}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              <Plus className="inline h-3 w-3" /> {t("additions")}
            </p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              +{(pr.additions || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              <Minus className="inline h-3 w-3" /> {t("deletions")}
            </p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              -{(pr.deletions || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-cyan-50 p-4 dark:bg-cyan-900/20">
            <p className="text-sm text-cyan-600 dark:text-cyan-400">
              {t("survivingLines")}
            </p>
            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
              {(pr.survivingLines || 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
            <p className="text-sm text-purple-600 dark:text-purple-400">
              {t("survivalRate")}
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {pr.additions && pr.additions > 0
                ? Math.round(
                    ((pr.survivingLines || 0) / pr.additions) * 100,
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
