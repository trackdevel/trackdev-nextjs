"use client";

import { CreateTaskModal } from "@/components/tasks";
import { TaskBadge } from "@/components/tasks/TaskBadge";
import { Loader2, Plus, UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSessionState } from "@/utils/useSessionState";
import { memo, useMemo } from "react";
import { STATUS_CONFIG } from "../constants";

interface ChildTask {
  id: number;
  name: string;
  taskKey?: string;
  status: string;
  type?: string;
  estimationPoints?: number;
  assignee?: {
    id?: string;
    username: string;
    fullName?: string;
  };
}

interface TaskChildrenProps {
  childTasks: ChildTask[];
  parentTaskId: number;
  projectId: number;
  onSubtaskCreated?: () => void;
  onSelfAssignAll?: () => Promise<void>;
  isAssigningAll?: boolean;
}

export const TaskChildren = memo(function TaskChildren({
  childTasks,
  parentTaskId,
  projectId,
  onSubtaskCreated,
  onSelfAssignAll,
  isAssigningAll,
}: TaskChildrenProps) {
  const t = useTranslations("tasks");
  const [showCreateModal, setShowCreateModal] = useSessionState(`createSubtaskModal-task-${parentTaskId}`, false);

  const hasUnassignedSubtasks = useMemo(() => {
    return childTasks.length > 0 && childTasks.some((child) => !child.assignee);
  }, [childTasks]);

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {t("subtasks")} ({childTasks.length})
          </h2>
          <div className="flex items-center gap-2">
            {hasUnassignedSubtasks && onSelfAssignAll && (
              <button
                onClick={onSelfAssignAll}
                disabled={isAssigningAll}
                className="inline-flex items-center gap-1 rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigningAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                {t("assignAllToMe")}
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
            >
              <Plus className="h-4 w-4" />
              {t("addSubtask")}
            </button>
          </div>
        </div>
        {childTasks.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("noSubtasks")}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {childTasks.map((subtask) => {
              const subtaskStatus =
                STATUS_CONFIG[subtask.status] || STATUS_CONFIG.TODO;
              return (
                <li key={subtask.id}>
                  <Link
                    href={`/dashboard/tasks/${subtask.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-sm ${subtaskStatus.bgColor}`}
                      >
                        {subtaskStatus.icon}
                      </div>
                      {/* Fixed-width type badge container for alignment */}
                      <div className="w-14 shrink-0">
                        {subtask.type && (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              subtask.type === "BUG"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {subtask.type === "BUG"
                              ? t("typeBug")
                              : t("typeTask")}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {subtask.taskKey && (
                            <TaskBadge taskKey={subtask.taskKey} taskId={subtask.id} />
                          )}
                          {subtask.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {subtask.assignee?.fullName ||
                            subtask.assignee?.username ||
                            t("unassigned")}
                          {subtask.estimationPoints
                            ? ` • ${subtask.estimationPoints} ${t("points")}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${subtaskStatus.bgColor} ${subtaskStatus.color}`}
                    >
                      {subtaskStatus.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create Subtask Modal */}
      <CreateTaskModal
        projectId={projectId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={onSubtaskCreated}
        parentTaskId={parentTaskId}
      />
    </>
  );
});
