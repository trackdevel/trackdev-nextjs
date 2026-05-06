import { TaskBadge } from "@/components/tasks/TaskBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { userProfileHref } from "@/components/ui/UserLink";
import { ApiClientError, tasksApi, useAuth } from "@trackdev/api-client";
import type { Task } from "@trackdev/types";
import { useDraggable } from "@dnd-kit/react";
import { Bug, Loader2, Settings2, Snowflake, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useState } from "react";

import { TaskAttributes } from "../../../tasks/[id]/components/TaskAttributes";
import type { DragItemData } from "../types";
import { TaskHoverPreview } from "./TaskHoverPreview";

interface TaskCardProps {
  task: Task;
  isBeingDragged: boolean;
  courseId?: number;
  onTaskUpdated?: (task: Task) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  isBeingDragged,
  courseId,
  onTaskUpdated,
}: TaskCardProps) {
  const data: DragItemData = { source: "sprint", task };
  // Intentionally not reading isDragSource — its Proxy tracking triggers
  // flushSync inside useLayoutEffect when drag ends, causing React errors.
  const { ref } = useDraggable({
    id: `sprint-${task.id}`,
    data,
  });

  const t = useTranslations("sprints");
  const tCommon = useTranslations("common");
  const tTasks = useTranslations("tasks");
  const toast = useToast();
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAttributesOpen, setIsAttributesOpen] = useState(false);
  const [isAssignConfirmOpen, setIsAssignConfirmOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const currentPoints = task.estimationPoints ?? 0;
  const hasPrs = (task.pullRequests?.length ?? 0) > 0;
  const hasOpenPr =
    task.pullRequests?.some((pr) => pr.state === "open" && !pr.merged) ?? false;
  const isProfessor = user?.roles?.includes("PROFESSOR") ?? false;
  const isAssignee = !!user?.id && task.assignee?.id === user.id;

  const openEditor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPointsInput(String(currentPoints));
    setIsEditing(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setIsEditing(false);
  };

  const handleConfirmSelfAssign = async () => {
    setIsAssigning(true);
    try {
      const updated = await tasksApi.selfAssign(task.id);
      onTaskUpdated?.(updated);
      toast.success(tTasks("selfAssignSuccess"));
      setIsAssignConfirmOpen(false);
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : tTasks("failedToSelfAssign");
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSave = async () => {
    const trimmed = pointsInput.trim();
    const parsed = trimmed === "" ? 0 : Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      toast.error(t("failedToUpdatePoints"));
      return;
    }
    if (parsed === currentPoints) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const updated = await tasksApi.update(task.id, {
        estimationPoints: parsed,
      });
      onTaskUpdated?.(updated);
      setIsEditing(false);
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : t("failedToUpdatePoints");
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <TaskHoverPreview task={task} disabled={isBeingDragged}>
        <div
          ref={ref}
          className={`cursor-grab rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-xs transition-all duration-300 ease-in-out hover:shadow-md active:cursor-grabbing ${
            isBeingDragged ? "opacity-50" : ""
          }`}
        >
          <div className="p-3">
            {task.taskKey && (
              <div className="mb-2">
                <TaskBadge taskKey={task.taskKey} taskId={task.id} />
              </div>
            )}
            <div className="flex items-start gap-2">
              {task.type === "BUG" && (
                <span title="Bug" className="mt-0.5 shrink-0">
                  <Bug className="h-4 w-4 text-red-500" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  draggable={false}
                  className="block truncate text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
                >
                  {task.name}
                </Link>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={openEditor}
                      onPointerDown={(e) => e.stopPropagation()}
                      title={t("editPoints")}
                      className="rounded-sm bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 cursor-pointer transition-colors hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/40 dark:hover:text-primary-300"
                    >
                      {currentPoints}p
                    </button>
                    {hasPrs && (
                      <span
                        title={hasOpenPr ? tTasks("hasOpenPr") : tTasks("noOpenPr")}
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ${
                          hasOpenPr ? "bg-red-600" : "bg-green-600"
                        }`}
                      >
                        PR
                      </span>
                    )}
                    {task.frozen && (
                      <span title="Frozen">
                        <Snowflake className="h-3 w-3 text-blue-400" />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAttributesOpen(true);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title={tTasks("profileAttributes")}
                    className="shrink-0 rounded-sm p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {task.assignee ? (
                courseId && task.assignee.id ? (
                  <Link
                    href={userProfileHref(task.assignee.id, courseId)}
                    draggable={false}
                    onClick={(e) => e.stopPropagation()}
                    title={task.assignee.fullName || task.assignee.username}
                  >
                    <MemberAvatar
                      size="xs"
                      username={task.assignee.fullName || task.assignee.username}
                      capitalLetters={task.assignee.capitalLetters}
                      color={task.assignee.color}
                    />
                  </Link>
                ) : (
                  <MemberAvatar
                    size="xs"
                    username={task.assignee.fullName || task.assignee.username}
                    capitalLetters={task.assignee.capitalLetters}
                    color={task.assignee.color}
                    title={task.assignee.fullName || task.assignee.username}
                  />
                )
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsAssignConfirmOpen(true);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  title={tTasks("assignToMe")}
                  className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </TaskHoverPreview>

      <Modal
        isOpen={isEditing}
        onClose={closeEditor}
        title={t("editPoints")}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("estimationPoints")}
            </span>
            <input
              type="number"
              min="0"
              step="1"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              autoFocus
              disabled={isSaving}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") closeEditor();
              }}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeEditor}
              disabled={isSaving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {tCommon("save")}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAttributesOpen}
        onClose={() => setIsAttributesOpen(false)}
        title={tTasks("profileAttributes")}
        maxWidth="2xl"
      >
        <div className="max-h-[70vh] overflow-y-auto -mx-2 px-2">
          <TaskAttributes
            taskId={task.id}
            isProfessor={isProfessor}
            isAssignee={isAssignee}
            isFrozen={task.frozen ?? false}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isAssignConfirmOpen}
        onClose={() => {
          if (!isAssigning) setIsAssignConfirmOpen(false);
        }}
        onConfirm={handleConfirmSelfAssign}
        title={tTasks("selfAssignConfirmTitle")}
        message={tTasks("selfAssignConfirmMessage", { name: task.name })}
        confirmLabel={tTasks("assignToMe")}
        isLoading={isAssigning}
        variant="warning"
      />
    </>
  );
});
