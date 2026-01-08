"use client";

import { tasksApi, useQuery } from "@trackdev/api-client";
import type { PullRequest, PullRequestChange } from "@trackdev/types";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
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
  t: (key: string) => string
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
}: TaskPullRequestsProps) {
  const t = useTranslations("tasks");
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch PR history
  const { data: prHistoryData } = useQuery(
    () => tasksApi.getPrHistory(taskId),
    [taskId],
    { enabled: pullRequests.length > 0 && isExpanded }
  );

  // Sort PR history by date ascending (oldest first for timeline)
  const sortedHistory = useMemo(() => {
    if (!prHistoryData?.history) return [];
    return [...prHistoryData.history].sort(
      (a, b) =>
        new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
    );
  }, [prHistoryData]);

  // Group history by PR ID for display
  const prMap = useMemo(() => {
    const map = new Map<string, PullRequest>();
    pullRequests.forEach((pr) => map.set(pr.id, pr));
    return map;
  }, [pullRequests]);

  if (!pullRequests || pullRequests.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <GitPullRequest size={20} className="text-gray-500" />
          {t("pullRequests")}
          <span className="ml-1 text-sm font-normal text-gray-500">(0)</span>
        </h3>
        <p className="text-sm text-gray-500 italic mt-3">
          {t("noPullRequestsLinked")}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {t("mentionTaskKey", { taskKey: "task-key" })}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left flex items-center gap-2 group"
      >
        {isExpanded ? (
          <ChevronDown
            size={20}
            className="text-gray-400 group-hover:text-gray-600"
          />
        ) : (
          <ChevronRight
            size={20}
            className="text-gray-400 group-hover:text-gray-600"
          />
        )}
        <GitPullRequest size={20} className="text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {t("pullRequests")}
          <span className="text-sm font-normal text-gray-500">
            ({pullRequests.length})
          </span>
        </h3>
      </button>

      {isExpanded && (
        <>
          {/* Current PR Status Summary */}
          <div className="space-y-3 mt-4 mb-6">
            {pullRequests.map((pr) => {
              const stateColor = getPRStateColor(
                pr.merged ? "merged" : pr.state
              );
              const stateBadge = getPRStateBadge(
                pr.merged ? "merged" : pr.state,
                t
              );

              return (
                <div
                  key={pr.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
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

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {pr.repoFullName && (
                        <span className="font-mono">{pr.repoFullName}</span>
                      )}
                      {pr.prNumber && <span>#{pr.prNumber}</span>}
                      {pr.author?.username && (
                        <span>by {pr.author.username}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PR History Timeline */}
          {sortedHistory.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <History size={16} className="text-gray-500" />
                {t("activityTimeline")}
              </h4>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                <div className="space-y-3">
                  {sortedHistory.map((event) => {
                    const pr = prMap.get(event.pullRequestId);
                    return (
                      <PRHistoryEvent
                        key={event.id}
                        event={event}
                        pr={pr}
                        t={t}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Format date for display
 */
function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get event icon and styling based on event type
 */
function getEventStyle(
  event: PullRequestChange,
  t: (key: string) => string
): {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
} {
  switch (event.type) {
    case "pr_opened":
      return {
        icon: <GitPullRequest size={14} className="text-green-600" />,
        bgColor: "bg-green-100",
        label: t("prEventOpened"),
      };
    case "pr_merged":
      return {
        icon: <GitMerge size={14} className="text-purple-600" />,
        bgColor: "bg-purple-100",
        label: t("prEventMerged"),
      };
    case "pr_closed":
      return {
        icon: <GitPullRequestClosed size={14} className="text-red-600" />,
        bgColor: "bg-red-100",
        label: t("prEventClosed"),
      };
    case "pr_reopened":
      return {
        icon: <RefreshCw size={14} className="text-blue-600" />,
        bgColor: "bg-blue-100",
        label: t("prEventReopened"),
      };
    default:
      return {
        icon: <History size={14} className="text-gray-500" />,
        bgColor: "bg-gray-100",
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
}: {
  event: PullRequestChange;
  pr?: PullRequest;
  t: (key: string) => string;
}) {
  const style = getEventStyle(event, t);
  const prTitle =
    event.type === "pr_opened"
      ? event.prTitle
      : pr?.title || `PR #${pr?.prNumber || "?"}`;
  const prNumber = event.type === "pr_opened" ? event.prNumber : pr?.prNumber;

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
          <span className="font-medium text-gray-900">{event.githubUser}</span>
          <span className="text-gray-500">{style.label}</span>
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
            <span className="text-gray-700 truncate max-w-[200px]">
              #{prNumber} {prTitle}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-400 mt-0.5">
          {formatEventDate(event.changedAt)}
        </div>

        {/* Additional info for merged events */}
        {event.type === "pr_merged" && event.mergedBy && (
          <div className="text-xs text-purple-600 mt-0.5">
            {t("mergedBy")} {event.mergedBy}
          </div>
        )}
      </div>
    </div>
  );
}
