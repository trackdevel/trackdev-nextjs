"use client";

import { BackButton } from "@/components/BackButton";
import { EmptyState, LoadingContainer, PageContainer } from "@/components/ui";
import { useLanguage } from "@/i18n";
import { formatDateOnly } from "@/utils/dateFormat";
import { useDateFormat } from "@/utils/useDateFormat";
import { activitiesApi, useAuth, useQuery } from "@trackdev/api-client";
import type { Activity, ActivityType } from "@trackdev/types";
import {
  Activity as ActivityIcon,
  CheckCircle,
  GitPullRequest,
  MessageSquare,
  PlayCircle,
  PlusCircle,
  RefreshCw,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

// Translation function type for relative time
type TranslateFunc = (
  key: string,
  values?: Record<string, string | number>,
) => string;

// Helper to format relative time
function formatRelativeTime(
  dateString: string,
  timezone: string = "UTC",
  locale: string = "en",
  t?: TranslateFunc,
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return t ? t("justNow") : "just now";
  if (diffMinutes < 60)
    return t ? t("timeAgo", { time: `${diffMinutes}m` }) : `${diffMinutes}m`;
  if (diffHours < 24)
    return t ? t("timeAgo", { time: `${diffHours}h` }) : `${diffHours}h`;
  if (diffDays < 7)
    return t ? t("timeAgo", { time: `${diffDays}d` }) : `${diffDays}d`;
  return formatDateOnly(dateString, timezone, locale);
}

// Get icon for activity type
function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "TASK_CREATED":
      return <PlusCircle className="h-4 w-4 text-green-500" />;
    case "TASK_STATUS_CHANGED":
      return <PlayCircle className="h-4 w-4 text-blue-500" />;
    case "TASK_ASSIGNED":
      return <UserCheck className="h-4 w-4 text-purple-500" />;
    case "TASK_UNASSIGNED":
      return <UserMinus className="h-4 w-4 text-orange-500" />;
    case "TASK_ESTIMATION_CHANGED":
      return <RefreshCw className="h-4 w-4 text-cyan-500" />;
    case "COMMENT_ADDED":
      return <MessageSquare className="h-4 w-4 text-yellow-500" />;
    case "PR_LINKED":
    case "PR_MERGED":
    case "PR_STATE_CHANGED":
      return <GitPullRequest className="h-4 w-4 text-pink-500" />;
    case "TASK_ADDED_TO_SPRINT":
    case "TASK_REMOVED_FROM_SPRINT":
      return <CheckCircle className="h-4 w-4 text-indigo-500" />;
    default:
      return <ActivityIcon className="h-4 w-4 text-gray-500" />;
  }
}

// Get translation key for activity type
function getActivityTranslationKey(type: ActivityType): string {
  const mapping: Record<ActivityType, string> = {
    TASK_CREATED: "eventTaskCreated",
    TASK_UPDATED: "eventTaskUpdated",
    TASK_STATUS_CHANGED: "eventTaskStatusChanged",
    TASK_ASSIGNED: "eventTaskAssigned",
    TASK_UNASSIGNED: "eventTaskUnassigned",
    TASK_ESTIMATION_CHANGED: "eventTaskEstimationChanged",
    COMMENT_ADDED: "eventCommentAdded",
    PR_LINKED: "eventPrLinked",
    PR_UNLINKED: "eventPrUnlinked",
    PR_STATE_CHANGED: "eventPrStateChanged",
    PR_MERGED: "eventPrMerged",
    TASK_ADDED_TO_SPRINT: "eventTaskAddedToSprint",
    TASK_REMOVED_FROM_SPRINT: "eventTaskRemovedFromSprint",
  };
  return mapping[type] || "eventTaskUpdated";
}

interface ActivityItemProps {
  activity: Activity;
  t: ReturnType<typeof useTranslations<"activity">>;
}

function ActivityItem({ activity, t }: ActivityItemProps) {
  const translationKey = getActivityTranslationKey(activity.type);
  const { timezone } = useDateFormat();
  const { locale } = useLanguage();

  return (
    <div className="flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-gray-100">
          {t(translationKey, {
            actor: activity.actorUsername || "Unknown",
            taskKey: activity.taskKey || "task",
            oldValue: activity.oldValue || "",
            newValue: activity.newValue || "",
          })}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {activity.taskKey && (
            <Link
              href={`/dashboard/tasks/${activity.taskId}`}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              {activity.taskKey}
            </Link>
          )}
          <span className="text-xs text-gray-500">
            {activity.projectName && `${activity.projectName}`}
          </span>
          <span className="text-xs text-gray-400">
            {formatRelativeTime(activity.createdAt, timezone, locale, t)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("activity");
  const [currentPage, setCurrentPage] = useState(0);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const hasMarkedAsReadRef = useRef(false);

  const {
    data: activitiesResponse,
    isLoading,
    refetch,
  } = useQuery(
    () => activitiesApi.getActivities({ page: currentPage, size: PAGE_SIZE }),
    [currentPage],
    { enabled: isAuthenticated },
  );

  // Mark as read when page loads (only once per page visit)
  useEffect(() => {
    if (isAuthenticated && !hasMarkedAsReadRef.current) {
      hasMarkedAsReadRef.current = true;
      activitiesApi.markAsRead().catch(() => {
        // Ignore errors - reset flag so it can retry
        hasMarkedAsReadRef.current = false;
      });
    }
  }, [isAuthenticated]);

  // Accumulate activities for infinite scroll (deduplicate by ID)
  useEffect(() => {
    if (activitiesResponse?.activities) {
      if (currentPage === 0) {
        setAllActivities(activitiesResponse.activities);
      } else {
        setAllActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newActivities = activitiesResponse.activities.filter(
            (a) => !existingIds.has(a.id),
          );
          return [...prev, ...newActivities];
        });
      }
      setHasMore(activitiesResponse.hasNext);
    }
  }, [activitiesResponse, currentPage]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

  const handleRefresh = useCallback(() => {
    setCurrentPage(0);
    setAllActivities([]);
    refetch();
  }, [refetch]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PageContainer>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton fallbackHref="/dashboard" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t("title")}
              </h1>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("markAllRead")}
          </button>
        </div>

        {isLoading && allActivities.length === 0 ? (
          <LoadingContainer />
        ) : allActivities.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon className="h-12 w-12" />}
            title={t("noActivity")}
            description={t("noActivityDescription")}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            {allActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} t={t} />
            ))}

            {hasMore && (
              <div className="p-4 text-center border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? t("loading") : t("loadMore")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
