"use client";

import { CreateTaskModal } from "@/components/tasks";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useState } from "react";
import { STATUS_CONFIG } from "../constants";

interface ChildTask {
  id: number;
  name: string;
  taskKey?: string;
  status: string;
  type?: string;
  estimationPoints?: number;
  assignee?: {
    username: string;
    fullName?: string;
  };
}

interface TaskChildrenProps {
  childTasks: ChildTask[];
  parentTaskId: number;
  projectId: number;
  onSubtaskCreated?: () => void;
}

export const TaskChildren = memo(function TaskChildren({
  childTasks,
  parentTaskId,
  projectId,
  onSubtaskCreated,
}: TaskChildrenProps) {
  const t = useTranslations("tasks");
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            {t("subtasks")} ({childTasks.length})
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t("addSubtask")}
          </button>
        </div>
        {childTasks.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500">{t("noSubtasks")}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {childTasks.map((subtask) => {
              const subtaskStatus =
                STATUS_CONFIG[subtask.status] || STATUS_CONFIG.TODO;
              return (
                <li key={subtask.id}>
                  <Link
                    href={`/dashboard/tasks/${subtask.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded ${subtaskStatus.bgColor}`}
                      >
                        {subtaskStatus.icon}
                      </div>
                      {/* Fixed-width type badge container for alignment */}
                      <div className="w-14 flex-shrink-0">
                        {subtask.type && (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                              subtask.type === "BUG"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {subtask.type === "BUG" ? t("typeBug") : t("typeTask")}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {subtask.taskKey && (
                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                              {subtask.taskKey}
                            </span>
                          )}
                          {subtask.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {subtask.assignee?.fullName || subtask.assignee?.username || t("unassigned")}
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
