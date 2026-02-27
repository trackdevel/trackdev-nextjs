"use client";

import { PRHistoryEvent } from "@/components/PRTimeline";
import { useDateFormat } from "@/utils/useDateFormat";
import type { PullRequest, PullRequestChange } from "@trackdev/types";
import { History } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface PRActivityProps {
  pr: PullRequest;
  history: PullRequestChange[];
}

export function PRActivity({ pr, history }: PRActivityProps) {
  const t = useTranslations("tasks");
  const tPR = useTranslations("pullRequestDetails");
  const { formatDateTime } = useDateFormat();

  // Sort by date ascending (oldest first for timeline)
  const sortedHistory = useMemo(() => {
    return [...history].sort(
      (a, b) =>
        new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
    );
  }, [history]);

  const resolveGithubUser = (githubUsername: string | undefined): string => {
    if (!githubUsername) return "";
    return githubUsername;
  };

  if (sortedHistory.length === 0) {
    return (
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History size={18} className="text-gray-500" />
            {tPR("activity")}
          </h2>
        </div>
        <div className="px-6 py-4 text-center text-sm italic text-gray-400 dark:text-gray-500">
          {tPR("noActivity")}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <History size={18} className="text-gray-500" />
          {tPR("activity")}
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({sortedHistory.length})
          </span>
        </h2>
      </div>
      <div className="px-6 py-4">
        <div className="relative pl-2">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />

          <div className="space-y-2">
            {sortedHistory.map((event) => (
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
    </div>
  );
}
