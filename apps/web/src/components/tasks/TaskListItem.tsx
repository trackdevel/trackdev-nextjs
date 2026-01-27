"use client";

import type { Task } from "@trackdev/types";
import { ArrowRight, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface TaskListItemProps {
  task: Task;
  showAssignee?: boolean;
}

export function TaskListItem({ task, showAssignee = true }: TaskListItemProps) {
  return (
    <li>
      <Link
        href={`/dashboard/tasks/${task.id}`}
        className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-700 dark:text-gray-300">
                {task.taskKey || `#${task.id}`}
              </span>
              {task.name}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <TaskTypeBadge type={task.type} />
              <TaskStatusBadge status={task.status} />
              {showAssignee && task.assignee && (
                <span className="text-gray-500 dark:text-gray-400">
                  •{" "}
                  <span className="font-medium">
                    {task.assignee.fullName || task.assignee.username}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </Link>
    </li>
  );
}

interface TaskTypeBadgeProps {
  type: Task["type"];
}

export function TaskTypeBadge({ type }: TaskTypeBadgeProps) {
  const t = useTranslations("tasks");

  const styles = {
    USER_STORY:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    BUG: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    TASK: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };

  const labelKeys: Record<string, string> = {
    USER_STORY: "typeUserStory",
    BUG: "typeBug",
    TASK: "typeTask",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[type] || styles.TASK
      }`}
    >
      {t(labelKeys[type] || "typeTask")}
    </span>
  );
}

interface TaskStatusBadgeProps {
  status: Task["status"];
}

export function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const t = useTranslations("tasks");

  const statusKeys: Record<string, string> = {
    BACKLOG: "statusBacklog",
    TODO: "statusTodo",
    INPROGRESS: "statusInProgress",
    VERIFY: "statusVerify",
    DONE: "statusDone",
    DEFINED: "statusDefined",
  };

  return (
    <span className="text-gray-500 dark:text-gray-400">
      {t(statusKeys[status] || status)}
    </span>
  );
}

interface TaskListProps {
  tasks: Task[];
  showAssignee?: boolean;
}

export function TaskList({ tasks, showAssignee = true }: TaskListProps) {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} showAssignee={showAssignee} />
      ))}
    </ul>
  );
}
