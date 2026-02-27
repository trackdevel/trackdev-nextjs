"use client";

import {
  getPRStateColor,
  getPRStateBadge,
  PRHistoryEvent,
} from "@/components/PRTimeline";
import { useDateFormat } from "@/utils/useDateFormat";
import { tasksApi, useQuery } from "@trackdev/api-client";
import type { PullRequest, PullRequestChange, UserPublic } from "@trackdev/types";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Eye,
  GitPullRequest,
  History,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

interface TaskPullRequestsProps {
  pullRequests: PullRequest[];
  taskId: number;
  projectMembers?: UserPublic[];
}

export function TaskPullRequests({
  pullRequests,
  taskId,
  projectMembers,
}: TaskPullRequestsProps) {
  const t = useTranslations("tasks");
  const { formatDateTime } = useDateFormat();
  // Track which PRs have their activity timeline expanded
  const [expandedPRs, setExpandedPRs] = useState<Set<string>>(new Set());

  const togglePRExpanded = (prId: string) => {
    setExpandedPRs((prev) => {
      const next = new Set(prev);
      if (next.has(prId)) {
        next.delete(prId);
      } else {
        next.add(prId);
      }
      return next;
    });
  };

  // Create a map of GitHub username to project member fullName
  const githubToMemberMap = useMemo(() => {
    const map = new Map<string, { fullName: string; username: string }>();
    if (projectMembers) {
      projectMembers.forEach((member) => {
        const githubLogin = member.githubInfo?.login;
        if (githubLogin) {
          map.set(githubLogin.toLowerCase(), {
            fullName: member.fullName || member.username,
            username: member.username,
          });
        }
      });
    }
    return map;
  }, [projectMembers]);

  // Helper function to resolve GitHub username to member fullName
  const resolveGithubUser = (githubUsername: string | undefined): string => {
    if (!githubUsername) return "";
    const member = githubToMemberMap.get(githubUsername.toLowerCase());
    return member?.fullName || githubUsername;
  };

  // Fetch PR history
  const { data: prHistoryData } = useQuery(
    () => tasksApi.getPrHistory(taskId),
    [taskId],
    { enabled: pullRequests.length > 0 },
  );

  // Sort PR history by date ascending (oldest first for timeline)
  const sortedHistory = useMemo(() => {
    if (!prHistoryData?.history) return [];
    return [...prHistoryData.history].sort(
      (a, b) =>
        new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
    );
  }, [prHistoryData]);

  // Group history by PR ID for display
  const historyByPR = useMemo(() => {
    const map = new Map<string, PullRequestChange[]>();
    sortedHistory.forEach((event) => {
      const list = map.get(event.pullRequestId) || [];
      list.push(event);
      map.set(event.pullRequestId, list);
    });
    return map;
  }, [sortedHistory]);

  if (!pullRequests || pullRequests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <GitPullRequest
            size={20}
            className="text-gray-500 dark:text-gray-400"
          />
          {t("pullRequests")}
          <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
            (0)
          </span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-3">
          {t("noPullRequestsLinked")}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {t("mentionTaskKey", { taskKey: "task-key" })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
        <GitPullRequest
          size={20}
          className="text-gray-500 dark:text-gray-400"
        />
        {t("pullRequests")}
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
          ({pullRequests.length})
        </span>
      </h3>

      {/* PR Cards - Always visible */}
      <div className="space-y-4">
        {pullRequests.map((pr) => {
          const stateColor = getPRStateColor(pr.merged ? "merged" : pr.state);
          const stateBadge = getPRStateBadge(
            pr.merged ? "merged" : pr.state,
            t,
          );
          const prHistory = historyByPR.get(pr.id) || [];
          const isExpanded = expandedPRs.has(pr.id);

          return (
            <div
              key={pr.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 overflow-hidden"
            >
              {/* PR Header - Always visible */}
              <div className="flex items-start gap-3 p-3">
                <GitPullRequest size={18} className={stateColor} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 truncate"
                      title={pr.title || `PR #${pr.prNumber}`}
                    >
                      {pr.title || `PR #${pr.prNumber}`}
                      <ExternalLink size={12} />
                    </a>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${stateBadge.bg} ${stateBadge.text}`}
                    >
                      {stateBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {pr.repoFullName && (
                      <span className="font-mono">{pr.repoFullName}</span>
                    )}
                    {pr.prNumber && <span>#{pr.prNumber}</span>}
                    {pr.author?.username && (
                      <span>
                        by{" "}
                        {pr.author.fullName ||
                          resolveGithubUser(pr.author.username) ||
                          pr.author.username}
                      </span>
                    )}
                  </div>
                </div>

                {/* View details button */}
                <Link
                  href={`/dashboard/pull-requests/${pr.id}?from=task&taskId=${taskId}`}
                  className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
                  title={t("viewPRDetails")}
                >
                  <Eye size={16} />
                </Link>
              </div>

              {/* Collapsible Activity Timeline for this PR */}
              {prHistory.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => togglePRExpanded(pr.id)}
                    className="w-full px-3 py-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="text-gray-400" />
                    )}
                    <History size={14} className="text-gray-400" />
                    <span>
                      {t("activityTimeline")} ({prHistory.length})
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <div className="relative pl-2">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />

                        <div className="space-y-2">
                          {prHistory.map((event) => (
                            <PRHistoryEvent
                              key={event.id}
                              event={event}
                              pr={pr}
                              t={t}
                              formatDateTime={formatDateTime}
                              resolveGithubUser={resolveGithubUser}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
