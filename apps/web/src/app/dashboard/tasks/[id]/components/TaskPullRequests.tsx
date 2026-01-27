"use client";

import { useDateFormat } from "@/utils/useDateFormat";
import { tasksApi, useQuery } from "@trackdev/api-client";
import type { PullRequest, PullRequestChange } from "@trackdev/types";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  ExternalLink,
  GitCommit,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  History,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface TaskPullRequestsProps {
  pullRequests: PullRequest[];
  taskId: number;
  projectMembers?: Array<{
    id: string;
    username: string;
    fullName?: string;
    color?: string;
    githubInfo?: { login?: string };
  }>;
}

/**
 * Get the appropriate icon color based on PR state
 */
function getPRStateColor(state?: string): string {
  switch (state) {
    case "open":
      return "text-green-600";
    case "closed":
      return "text-red-600";
    case "merged":
      return "text-purple-600";
    default:
      return "text-gray-500";
  }
}

/**
 * Get the appropriate badge style based on PR state
 */
function getPRStateBadge(
  state: string | undefined,
  t: (key: string) => string,
): {
  bg: string;
  text: string;
  label: string;
} {
  switch (state) {
    case "open":
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        label: t("prStateOpen"),
      };
    case "closed":
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        label: t("prStateClosed"),
      };
    case "merged":
      return {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: t("prStateMerged"),
      };
    default:
      return {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: t("prStateUnknown"),
      };
  }
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

/**
 * Get event icon and styling based on event type
 */
function getEventStyle(
  event: PullRequestChange,
  t: (key: string) => string,
): {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
} {
  switch (event.type) {
    case "pr_opened":
      return {
        icon: (
          <GitPullRequest
            size={14}
            className="text-green-600 dark:text-green-400"
          />
        ),
        bgColor: "bg-green-100 dark:bg-green-900/30",
        label: t("prEventOpened"),
      };
    case "pr_merged":
      return {
        icon: (
          <GitMerge
            size={14}
            className="text-purple-600 dark:text-purple-400"
          />
        ),
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        label: t("prEventMerged"),
      };
    case "pr_closed":
      return {
        icon: (
          <GitPullRequestClosed
            size={14}
            className="text-red-600 dark:text-red-400"
          />
        ),
        bgColor: "bg-red-100 dark:bg-red-900/30",
        label: t("prEventClosed"),
      };
    case "pr_reopened":
      return {
        icon: (
          <RefreshCw size={14} className="text-blue-600 dark:text-blue-400" />
        ),
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        label: t("prEventReopened"),
      };
    case "pr_synchronize":
      return {
        icon: (
          <GitCommit
            size={14}
            className="text-yellow-600 dark:text-yellow-400"
          />
        ),
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        label: t("prEventSynchronize"),
      };
    case "pr_edited":
      return {
        icon: (
          <Edit size={14} className="text-orange-600 dark:text-orange-400" />
        ),
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        label: t("prEventEdited"),
      };
    default:
      return {
        icon: (
          <History size={14} className="text-gray-500 dark:text-gray-400" />
        ),
        bgColor: "bg-gray-100 dark:bg-gray-700",
        label: t("prEventUpdated"),
      };
  }
}

/**
 * Individual PR history event component
 */
function PRHistoryEvent({
  event,
  pr,
  t,
  formatDateTime,
  resolveGithubUser,
}: {
  event: PullRequestChange;
  pr?: PullRequest;
  t: (key: string) => string;
  formatDateTime: (dateInput: string | Date | undefined | null) => string;
  resolveGithubUser: (githubUsername: string | undefined) => string;
}) {
  const style = getEventStyle(event, t);
  const prTitle =
    event.type === "pr_opened"
      ? event.prTitle
      : pr?.title || `PR #${pr?.prNumber || "?"}`;
  const prNumber = event.type === "pr_opened" ? event.prNumber : pr?.prNumber;

  // Action performer: who performed this action (opened, merged, closed, reopened)
  // Priority: backend-resolved fullName > project member lookup > raw GitHub username
  const actionPerformer =
    event.authorFullName ||
    resolveGithubUser(event.githubUser) ||
    event.githubUser ||
    t("unknownUser");

  // PR author: who originally created the PR (from the PR entity)
  const prAuthor = pr?.author
    ? pr.author.fullName ||
      resolveGithubUser(pr.author.githubInfo?.login) ||
      pr.author.username
    : null;

  // For merge events, show who merged (same as action performer in most cases)
  const mergedBy =
    event.type === "pr_merged" && event.mergedBy
      ? (event as { mergedByFullName?: string }).mergedByFullName ||
        resolveGithubUser(event.mergedBy) ||
        event.mergedBy
      : null;

  // Determine if we should show "by author" - only for non-open events where author differs from action performer
  const showPrAuthor =
    event.type !== "pr_opened" && prAuthor && prAuthor !== actionPerformer;

  return (
    <div className="relative flex items-start gap-3 pl-1">
      {/* Icon */}
      <div
        className={`z-10 flex h-6 w-6 items-center justify-center rounded-full ${style.bgColor}`}
      >
        {style.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-medium text-gray-900 dark:text-white">
            {actionPerformer}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {style.label}
          </span>
          {pr?.url ? (
            <a
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate max-w-[200px]"
              title={prTitle}
            >
              #{prNumber} {prTitle}
            </a>
          ) : (
            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
              #{prNumber} {prTitle}
            </span>
          )}
          {/* Show PR author if different from action performer */}
          {showPrAuthor && (
            <span className="text-gray-500 dark:text-gray-400">
              ({t("prAuthor")}:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {prAuthor}
              </span>
              )
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 mt-0.5">
          {formatDateTime(event.changedAt)}
        </div>

        {/* Additional info for merged events - show merger if different from action performer */}
        {event.type === "pr_merged" &&
          mergedBy &&
          mergedBy !== actionPerformer && (
            <div className="text-xs text-purple-600 mt-0.5">
              {t("mergedBy")} {mergedBy}
            </div>
          )}
      </div>
    </div>
  );
}
