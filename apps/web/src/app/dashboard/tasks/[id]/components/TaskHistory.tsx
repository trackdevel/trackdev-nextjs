"use client";

import { useDateFormat } from "@/utils/useDateFormat";
import { tasksApi, useAuth, useQuery } from "@trackdev/api-client";
import type { TaskLog } from "@trackdev/types";
import { Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface TaskHistoryProps {
  taskId: number;
}

export function TaskHistory({ taskId }: TaskHistoryProps) {
  const { user } = useAuth();
  const t = useTranslations("tasks");

  // Only show history for professors
  const isProfessor = user?.roles?.includes("PROFESSOR") ?? false;

  const {
    data: history,
    isLoading,
    error,
  } = useQuery(() => tasksApi.getHistory(taskId), [taskId], {
    enabled: isProfessor,
  });

  // Don't render anything if user is not a professor
  if (!isProfessor) {
    return null;
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-4">
        <Clock className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-medium text-gray-900">{t("history")}</h2>
      </div>

      <div className="px-6 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-sm text-gray-500">
            {t("loadingHistory")}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error.message || t("errorLoadingHistory")}
          </div>
        )}

        {!isLoading && !error && history && history.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            {t("noHistoryYet")}
          </div>
        )}

        {!isLoading && !error && history && history.length > 0 && (
          <div className="space-y-3">
            {history.map((log: TaskLog) => (
              <HistoryEntry key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface HistoryEntryProps {
  log: TaskLog;
}

function HistoryEntry({ log }: HistoryEntryProps) {
  const t = useTranslations("tasks");
  const { formatDateTime } = useDateFormat();

  // Format the change message
  const changeMessage = formatChange(log, t);

  // Format timestamp with user's timezone
  const timestamp = formatDateTime(log.timestamp);

  return (
    <div className="flex gap-3 border-l-2 border-gray-200 pl-4">
      <div className="flex-shrink-0 mt-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
          <User className="h-3.5 w-3.5 text-gray-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium text-gray-900">{log.username}</span>
          <span className="text-gray-600"> {changeMessage}</span>
        </div>
        <div className="mt-0.5 text-xs text-gray-500">{timestamp}</div>
      </div>
    </div>
  );
}

function formatChange(
  log: TaskLog,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const field = log.field.toLowerCase();

  // Handle different field types
  switch (field) {
    case "name":
      return t("changedName");
    case "description":
      return t("changedDescription");
    case "status":
      return t("changedStatus", {
        from: log.oldValue || t("none"),
        to: log.newValue || t("none"),
      });
    case "assignee":
      return t("changedAssignee", {
        from: log.oldValue || t("unassigned"),
        to: log.newValue || t("unassigned"),
      });
    case "estimation":
    case "estimationpoints":
      return t("changedEstimation", {
        from: log.oldValue || "0",
        to: log.newValue || "0",
      });
    case "type":
      return t("changedType", {
        from: log.oldValue || t("none"),
        to: log.newValue || t("none"),
      });
    case "reporter":
      return t("changedReporter", {
        from: log.oldValue || t("none"),
        to: log.newValue || t("none"),
      });
    case "rank":
      return t("changedRank");
    case "active_sprints":
      return t("changedSprint", {
        from: log.oldValue || t("noSprint"),
        to: log.newValue || t("noSprint"),
      });
    default:
      return t("changedField", { field: log.field });
  }
}
