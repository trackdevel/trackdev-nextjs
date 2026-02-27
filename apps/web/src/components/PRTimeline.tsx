"use client";

import type { PullRequest, PullRequestChange } from "@trackdev/types";
import {
  Edit,
  GitCommit,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  History,
  RefreshCw,
} from "lucide-react";

/**
 * Get the appropriate icon color based on PR state
 */
export function getPRStateColor(state?: string): string {
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
export function getPRStateBadge(
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

/**
 * Get event icon and styling based on event type
 */
export function getEventStyle(
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
export function PRHistoryEvent({
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

  // Action performer: who performed this action
  const actionPerformer =
    event.authorFullName ||
    resolveGithubUser(event.githubUser) ||
    event.githubUser ||
    t("unknownUser");

  // PR author: who originally created the PR
  const prAuthor = pr?.author
    ? pr.author.fullName ||
      resolveGithubUser(pr.author.githubInfo?.login) ||
      pr.author.username
    : null;

  // For merge events, show who merged
  const mergedBy =
    event.type === "pr_merged" && event.mergedBy
      ? (event as { mergedByFullName?: string }).mergedByFullName ||
        resolveGithubUser(event.mergedBy) ||
        event.mergedBy
      : null;

  // Determine if we should show "by author"
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

        {/* Additional info for merged events */}
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
