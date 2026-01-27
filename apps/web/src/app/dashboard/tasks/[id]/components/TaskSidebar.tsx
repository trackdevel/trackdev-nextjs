"use client";

import { Select } from "@/components/ui";
import type { SprintSummary } from "@trackdev/api-client";
import type { TaskStatus, TaskType } from "@trackdev/types";
import { Check, Loader2, Pencil, UserMinus, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useMemo, useState } from "react";
import { STATUS_CONFIG, TYPE_CONFIG } from "../constants";
import type { EditField, EditState, TaskWithProject } from "../types";

interface TaskSidebarProps {
  task: TaskWithProject;
  editState: EditState;
  canEdit: boolean;
  availableStatuses: TaskStatus[];
  availableSprints: SprintSummary[];
  canSelfAssign: boolean;
  canUnassign: boolean;
  onStartEdit: (field: EditField) => void;
  onSave: () => void;
  onCancel: () => void;
  onEstimationChange: (value: string) => void;
  onStatusChange: (value: TaskStatus) => void;
  onTypeChange: (value: TaskType) => void;
  onSprintChange: (value: number | null) => void;
  onSelfAssign: () => Promise<void>;
  onUnassign: () => Promise<void>;
}

export const TaskSidebar = memo(function TaskSidebar({
  task,
  editState,
  canEdit,
  availableStatuses,
  availableSprints,
  canSelfAssign,
  canUnassign,
  onStartEdit,
  onSave,
  onCancel,
  onEstimationChange,
  onStatusChange,
  onTypeChange,
  onSprintChange,
  onSelfAssign,
  onUnassign,
}: TaskSidebarProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
  const typeConfig = TYPE_CONFIG[task.type] || TYPE_CONFIG.TASK;
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);

  // Determine which types are available based on entity constraints:
  // - USER_STORY with child tasks cannot change type
  // - Subtasks (tasks with parentTaskId) can only be TASK or BUG
  // - Top-level tasks can be USER_STORY, TASK, or BUG
  const availableTypes = useMemo<TaskType[]>(() => {
    // If this is a USER_STORY with child tasks, it cannot change type
    if (
      task.type === "USER_STORY" &&
      task.childTasks &&
      task.childTasks.length > 0
    ) {
      return []; // Cannot change type
    }

    // If this is a subtask (has parentTaskId), can only be TASK or BUG
    if (task.parentTaskId) {
      return ["TASK", "BUG"];
    }

    // Top-level task: can be any type
    return ["USER_STORY", "TASK", "BUG"];
  }, [task.type, task.childTasks, task.parentTaskId]);

  // Can edit type only if there are available types to choose from
  const canEditType = canEdit && availableTypes.length > 1;

  // USER_STORY can edit sprint only if ALL subtasks are unassigned from any sprint
  const userStoryCanEditSprint = useMemo(() => {
    if (task.type !== "USER_STORY") return false;
    if (!task.childTasks || task.childTasks.length === 0) return true; // No subtasks = can assign
    // Check if all subtasks have no sprint
    return task.childTasks.every(
      (subtask) => !subtask.activeSprints || subtask.activeSprints.length === 0,
    );
  }, [task.type, task.childTasks]);

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
    <div className="space-y-6">
      <div className="card">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">{t("details")}</h2>
        </div>
        <div className="divide-y">
          {/* Assignee */}
          <div className="px-6 py-3">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("assignee")}
            </p>
            {task.assignee ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
                    style={{
                      backgroundColor: task.assignee.color || "#6b7280",
                    }}
                  >
                    {task.assignee.capitalLetters ||
                      task.assignee.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-gray-900">
                    {task.assignee.fullName || task.assignee.username}
                  </span>
                </div>
                {canUnassign && (
                  <button
                    onClick={async () => {
                      setIsUnassigning(true);
                      try {
                        await onUnassign();
                      } finally {
                        setIsUnassigning(false);
                      }
                    }}
                    disabled={isUnassigning}
                    className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                    title={t("unassignFromMe")}
                  >
                    {isUnassigning ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserMinus className="h-3 w-3" />
                    )}
                    {t("unassignFromMe")}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{t("unassigned")}</span>
                {canSelfAssign && (
                  <button
                    onClick={async () => {
                      setIsAssigning(true);
                      try {
                        await onSelfAssign();
                      } finally {
                        setIsAssigning(false);
                      }
                    }}
                    disabled={isAssigning}
                    className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50"
                    title={t("assignToMe")}
                  >
                    {isAssigning ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <UserPlus className="h-3 w-3" />
                    )}
                    {t("assignToMe")}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reporter */}
          <div className="px-6 py-3">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("reporter")}
            </p>
            {task.reporter ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{
                    backgroundColor: task.reporter.color || "#6b7280",
                  }}
                >
                  {task.reporter.capitalLetters ||
                    task.reporter.username?.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-gray-900">
                  {task.reporter.fullName || task.reporter.username}
                </span>
              </div>
            ) : (
              <span className="text-gray-500">{t("unknown")}</span>
            )}
          </div>

          {/* Estimation Points */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">
                {t("estimation")}
              </p>
              {canEdit && editState.field !== "estimation" && (
                <button
                  onClick={() => onStartEdit("estimation")}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title={t("estimation")}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {editState.field === "estimation" ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={editState.estimation}
                  onChange={(e) => onEstimationChange(e.target.value)}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSave();
                    if (e.key === "Escape") onCancel();
                  }}
                />
                <span className="text-sm text-gray-500">{t("points")}</span>
                <button
                  onClick={onSave}
                  disabled={editState.isSaving}
                  className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                  title={tCommon("save")}
                >
                  {editState.isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={editState.isSaving}
                  className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                  title={tCommon("cancel")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <span className="text-gray-900">
                {task.estimationPoints != null
                  ? `${task.estimationPoints} ${t("points")}`
                  : t("notEstimated")}
              </span>
            )}
          </div>

          {/* Type */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">{t("type")}</p>
              {canEditType && editState.field !== "type" && (
                <button
                  onClick={() => onStartEdit("type")}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title={t("type")}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {editState.field === "type" ? (
              <div className="space-y-2">
                <Select
                  value={editState.taskType}
                  onChange={(value) => onTypeChange(value as TaskType)}
                  options={availableTypes.map((type) => ({
                    value: type,
                    label: getTypeLabel(type),
                  }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSave}
                    disabled={editState.isSaving}
                    className="flex-1 py-1 text-sm text-green-600 hover:bg-green-50 rounded border border-green-200 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {editState.isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {tCommon("save")}
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={editState.isSaving}
                    className="flex-1 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    {tCommon("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeConfig.color}`}
              >
                {getTypeLabel(task.type)}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="px-6 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-500">{t("status")}</p>
              {canEdit && editState.field !== "status" && (
                <button
                  onClick={() => onStartEdit("status")}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title={t("status")}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {editState.field === "status" ? (
              <div className="space-y-2">
                <Select
                  value={editState.status}
                  onChange={(value) => onStatusChange(value as TaskStatus)}
                  options={availableStatuses.map((status) => ({
                    value: status,
                    label: getStatusLabel(status),
                  }))}
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSave}
                    disabled={editState.isSaving}
                    className="flex-1 py-1 text-sm text-green-600 hover:bg-green-50 rounded border border-green-200 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {editState.isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {tCommon("save")}
                  </button>
                  <button
                    onClick={onCancel}
                    disabled={editState.isSaving}
                    className="flex-1 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    {tCommon("cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
              >
                {getStatusLabel(task.status)}
              </span>
            )}
          </div>

          {/* Project */}
          {task.project && (
            <div className="px-6 py-3">
              <p className="text-sm font-medium text-gray-500 mb-1">
                {t("project")}
              </p>
              <Link
                href={`/dashboard/projects/${task.project.id}`}
                className="text-primary-600 hover:underline"
              >
                {task.project.name}
              </Link>
            </div>
          )}

          {/* Parent Task (for subtasks) */}
          {task.parentTaskId && (
            <div className="px-6 py-3">
              <p className="text-sm font-medium text-gray-500 mb-1">
                {t("parentTask")}
              </p>
              <Link
                href={`/dashboard/tasks/${task.parentTaskId}`}
                className="text-primary-600 hover:underline"
              >
                {t("viewParentStory")}
              </Link>
            </div>
          )}

          {/* Sprint - Editable for TASK/BUG, or USER_STORY with all subtasks unassigned */}
          {(task.type !== "USER_STORY" || userStoryCanEditSprint) && (
            <div className="px-6 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-gray-500">
                  {t("sprint")}
                </p>
                {canEdit &&
                  task.status !== "DONE" &&
                  editState.field !== "sprint" && (
                    <button
                      onClick={() => onStartEdit("sprint")}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title={t("sprint")}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
              </div>
              {editState.field === "sprint" ? (
                <div className="space-y-2">
                  <Select
                    value={editState.sprintId?.toString() || ""}
                    onChange={(value) =>
                      onSprintChange(value ? Number(value) : null)
                    }
                    options={[
                      { value: "", label: t("noSprint") },
                      ...availableSprints.map((sprint) => ({
                        value: sprint.id.toString(),
                        label: sprint.label,
                      })),
                    ]}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onSave}
                      disabled={editState.isSaving}
                      className="flex-1 py-1 text-sm text-green-600 hover:bg-green-50 rounded border border-green-200 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {editState.isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      {tCommon("save")}
                    </button>
                    <button
                      onClick={onCancel}
                      disabled={editState.isSaving}
                      className="flex-1 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <X className="h-4 w-4" />
                      {tCommon("cancel")}
                    </button>
                  </div>
                </div>
              ) : task.activeSprints && task.activeSprints.length > 0 ? (
                <div className="space-y-1">
                  {task.activeSprints.map((sprint) => (
                    <Link
                      key={sprint.id}
                      href={`/dashboard/sprints/${sprint.id}`}
                      className="block text-primary-600 hover:underline"
                    >
                      {sprint.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500">{t("noSprint")}</span>
              )}
            </div>
          )}

          {/* Active Sprints - For USER_STORY (read-only, derived from subtasks when some have sprints) */}
          {task.type === "USER_STORY" &&
            !userStoryCanEditSprint &&
            task.activeSprints &&
            task.activeSprints.length > 0 && (
              <div className="px-6 py-3">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  {t("sprint")}
                </p>
                <div className="space-y-1">
                  {task.activeSprints.map((sprint) => (
                    <Link
                      key={sprint.id}
                      href={`/dashboard/sprints/${sprint.id}`}
                      className="block text-primary-600 hover:underline"
                    >
                      {sprint.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
});
