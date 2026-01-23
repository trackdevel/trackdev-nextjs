"use client";

import { useDateFormat } from "@/utils/useDateFormat";
import {
  Calendar,
  Check,
  Loader2,
  Pencil,
  Snowflake,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { STATUS_CONFIG, TYPE_CONFIG } from "../constants";
import type { EditState, TaskWithProject } from "../types";

interface TaskHeaderProps {
  task: TaskWithProject;
  editState: EditState;
  canEdit: boolean;
  isProfessor: boolean;
  onStartEdit: (field: "name") => void;
  onSave: () => void;
  onCancel: () => void;
  onNameChange: (value: string) => void;
  onFreeze: () => void;
  onUnfreeze: () => void;
}

export const TaskHeader = memo(function TaskHeader({
  task,
  editState,
  canEdit,
  isProfessor,
  onStartEdit,
  onSave,
  onCancel,
  onNameChange,
  onFreeze,
  onUnfreeze,
}: TaskHeaderProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const { formatDateTime } = useDateFormat();
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
  const typeConfig = TYPE_CONFIG[task.type] || TYPE_CONFIG.TASK;

  // Translation helpers for status and type labels
  const getStatusLabel = (status: string) => {
    const statusKeyMap: Record<string, string> = {
      BACKLOG: "statusBacklog",
      TODO: "statusTodo",
      INPROGRESS: "statusInProgress",
      VERIFY: "statusVerify",
      DONE: "statusDone",
      DEFINED: "statusDefined",
    };
    return t(statusKeyMap[status] || status);
  };

  const getTypeLabel = (type: string | null | undefined) => {
    if (!type) return t("typeTask"); // Default fallback
    const typeKeyMap: Record<string, string> = {
      USER_STORY: "typeUserStory",
      TASK: "typeTask",
      BUG: "typeBug",
    };
    return t(typeKeyMap[type] || type);
  };

  return (
    <div className="mb-8">
      {/* Frozen Warning Banner */}
      {task.frozen && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-blue-800">
            <Snowflake className="h-5 w-5" />
            <span className="font-semibold text-lg">{t("taskIsFrozen")}</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${statusConfig.bgColor}`}
        >
          {statusConfig.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeConfig.color}`}
            >
              {getTypeLabel(task.type)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {getStatusLabel(task.status)}
            </span>
            {task.estimationPoints !== undefined &&
              task.estimationPoints > 0 && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {task.estimationPoints} {t("points")}
                </span>
              )}
            {task.frozen && (
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 flex items-center gap-1">
                <Snowflake className="h-3 w-3" />
                {t("frozen")}
              </span>
            )}
          </div>

          {/* Editable Title */}
          {editState.field === "name" ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editState.name}
                onChange={(e) => onNameChange(e.target.value)}
                className="flex-1 text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSave();
                  if (e.key === "Escape") onCancel();
                }}
              />
              <button
                onClick={onSave}
                disabled={editState.isSaving}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                title={tCommon("save")}
              >
                {editState.isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={editState.isSaving}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                title={tCommon("cancel")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              {task.taskKey && (
                <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {task.taskKey}
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{task.name}</h1>
              {canEdit && (
                <button
                  onClick={() => onStartEdit("name")}
                  className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={tCommon("edit")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("createdAt")}{" "}
              {task.createdAt ? formatDateTime(task.createdAt) : t("unknown")}
            </span>
            {task.reporter && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {tCommon("by")} {task.reporter.fullName || task.reporter.username}
              </span>
            )}
          </div>
        </div>

        {/* Freeze/Unfreeze Button - Professor Only */}
        {isProfessor && (
          <button
            onClick={task.frozen ? onUnfreeze : onFreeze}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              task.frozen
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title={task.frozen ? t("unfreezeTask") : t("freezeTask")}
          >
            <Snowflake className="h-4 w-4" />
            {task.frozen ? t("unfreezeTask") : t("freezeTask")}
          </button>
        )}
      </div>
    </div>
  );
});
