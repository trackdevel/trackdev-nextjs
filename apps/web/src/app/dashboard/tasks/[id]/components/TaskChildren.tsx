"use client";

import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo } from "react";
import { STATUS_CONFIG } from "../constants";

interface ChildTask {
  id: number;
  name: string;
  taskKey?: string;
  status: string;
  estimationPoints?: number;
  assignee?: {
    username: string;
  };
}

interface TaskChildrenProps {
  childTasks: ChildTask[];
}

export const TaskChildren = memo(function TaskChildren({
  childTasks,
}: TaskChildrenProps) {
  const t = useTranslations("tasks");

  if (childTasks.length === 0) return null;

  return (
    <div className="card">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          {t("subtasks")} ({childTasks.length})
        </h2>
      </div>
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
                      {subtask.assignee?.username || t("unassigned")}
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
    </div>
  );
});
