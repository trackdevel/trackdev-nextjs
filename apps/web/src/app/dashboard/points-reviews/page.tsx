"use client";

import {
  EmptyState,
  ErrorMessage,
  LoadingContainer,
  PageHeader,
} from "@/components/ui";
import { useDateFormat } from "@/utils/useDateFormat";
import { pointsReviewsApi, useQuery } from "@trackdev/api-client";
import type { PointsReviewActiveConversation } from "@trackdev/types";
import { FolderKanban, MessageSquare, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";

interface ProjectGroup {
  projectId: number;
  projectName: string;
  projectSlug: string;
  subjectName: string | null;
  subjectAcronym: string | null;
  courseStartYear: number | null;
  conversations: PointsReviewActiveConversation[];
}

export default function ActivePointsReviewsPage() {
  const t = useTranslations("pointsReview");
  const { formatDateTime } = useDateFormat();

  const {
    data: conversations,
    isLoading,
    error,
    refetch,
  } = useQuery(() => pointsReviewsApi.listActive(), []);

  const groups = useMemo<ProjectGroup[]>(() => {
    if (!conversations) return [];
    const map = new Map<number, ProjectGroup>();
    for (const conv of conversations) {
      let group = map.get(conv.projectId);
      if (!group) {
        group = {
          projectId: conv.projectId,
          projectName: conv.projectName,
          projectSlug: conv.projectSlug,
          subjectName: conv.subjectName,
          subjectAcronym: conv.subjectAcronym,
          courseStartYear: conv.courseStartYear,
          conversations: [],
        };
        map.set(conv.projectId, group);
      }
      group.conversations.push(conv);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.projectName.localeCompare(b.projectName),
    );
  }, [conversations]);

  if (error && !isLoading) {
    return (
      <div className="p-8">
        <PageHeader
          title={t("activeReviewsTitle")}
          description={t("activeReviewsSubtitle")}
        />
        <ErrorMessage error={error} onRetry={refetch} variant="card" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        title={t("activeReviewsTitle")}
        description={t("activeReviewsSubtitle")}
      />

      {isLoading ? (
        <LoadingContainer />
      ) : groups.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Star}
            title={t("noActiveReviews")}
            description={t("noActiveReviewsDescription")}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <ProjectGroupCard
              key={group.projectId}
              group={group}
              t={t}
              formatDateTime={formatDateTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectGroupCardProps {
  group: ProjectGroup;
  t: ReturnType<typeof useTranslations>;
  formatDateTime: (date: string) => string;
}

function ProjectGroupCard({ group, t, formatDateTime }: ProjectGroupCardProps) {
  const courseLabel =
    group.subjectAcronym || group.subjectName
      ? `${group.subjectAcronym || group.subjectName}${
          group.courseStartYear
            ? ` ${group.courseStartYear}-${group.courseStartYear + 1}`
            : ""
        }`
      : null;

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/dashboard/projects/${group.projectId}`}
            className="flex items-center gap-2 min-w-0"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <FolderKanban className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  {group.projectSlug}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  {group.projectName}
                </span>
              </div>
              {courseLabel && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {courseLabel}
                </p>
              )}
            </div>
          </Link>
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
            {t("conversationsCount", { count: group.conversations.length })}
          </span>
        </div>
      </div>

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {group.conversations.map((conv) => (
          <ConversationRow
            key={conv.id}
            conversation={conv}
            t={t}
            formatDateTime={formatDateTime}
          />
        ))}
      </ul>
    </div>
  );
}

interface ConversationRowProps {
  conversation: PointsReviewActiveConversation;
  t: ReturnType<typeof useTranslations>;
  formatDateTime: (date: string) => string;
}

function ConversationRow({
  conversation,
  t,
  formatDateTime,
}: ConversationRowProps) {
  const initiatorName =
    conversation.initiator?.fullName ||
    conversation.initiator?.username ||
    "—";
  const initials = (
    conversation.initiator?.fullName ||
    conversation.initiator?.username ||
    "?"
  )
    .slice(0, 2)
    .toUpperCase();
  const activityDate =
    conversation.lastMessageAt || conversation.createdAt || null;

  return (
    <li>
      <Link
        href={`/dashboard/tasks/${conversation.taskId}?conversationId=${conversation.id}`}
        className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: conversation.initiator?.color || "#6b7280" }}
          title={initiatorName}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              {conversation.taskKey || `#${conversation.taskId}`}
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {conversation.taskName}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              {conversation.proposedPoints} {t("pts")}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {t("startedBy")} {initiatorName}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {conversation.messageCount}
            </span>
            {activityDate && (
              <span>
                {t("lastActivity")} · {formatDateTime(activityDate)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
