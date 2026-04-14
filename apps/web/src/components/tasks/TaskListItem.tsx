"use client";

import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { Task } from "@trackdev/types";
import { ArrowRight, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { TaskBadge } from "./TaskBadge";

interface TaskListItemProps {
  task: Task;
  showAssignee?: boolean;
  /** When provided, renders as a selectable row (no navigation) */
  onSelect?: (task: Task) => void;
  /** Whether this task is currently selected */
  isSelected?: boolean;
}

export function TaskListItem({
  task,
  showAssignee = true,
  onSelect,
  isSelected,
}: TaskListItemProps) {
  const t = useTranslations("tasks");

  const content = (
    <>
      <div className="flex items-center gap-3">
        {onSelect !== undefined && (
          <div
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 ${
              isSelected
                ? "border-primary-500 bg-primary-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {isSelected && <span className="text-white text-xs font-bold">✓</span>}
          </div>
        )}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <TaskBadge taskKey={task.taskKey || `#${task.id}`} taskId={task.id} />
            {task.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <TaskTypeBadge type={task.type} />
            <TaskStatusBadge status={task.status} />
            {((task.status === "DONE" && task.estimationPoints > 0) || task.status === "VERIFY") && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {task.estimationPoints} {t("points")}
              </span>
            )}
            {task.status === "VERIFY" && (() => {
              const hasOpenPr = task.pullRequests?.some((pr) => pr.state === "open" && !pr.merged) ?? false;
              return (
                <span
                  title={hasOpenPr ? t("hasOpenPr") : t("noOpenPr")}
                  className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${
                    hasOpenPr ? "bg-red-600" : "bg-green-600"
                  }`}
                >
                  PR
                </span>
              );
            })()}
            {showAssignee && task.assignee && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                •
                <MemberAvatar
                  username={task.assignee.fullName || task.assignee.username}
                  capitalLetters={task.assignee.capitalLetters}
                  color={task.assignee.color}
                  size="xxs"
                  title={task.assignee.fullName || task.assignee.username}
                />
                <span className="font-medium">
                  {task.assignee.fullName || task.assignee.username}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
      {onSelect === undefined && <ArrowRight className="h-4 w-4 text-gray-400" />}
    </>
  );

  if (onSelect !== undefined) {
    return (
      <li>
        <div
          role="checkbox"
          aria-checked={isSelected}
          onClick={() => onSelect(task)}
          className={`flex cursor-pointer items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
            isSelected ? "bg-primary-50 dark:bg-primary-900/20" : ""
          }`}
        >
          {content}
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={`/dashboard/tasks/${task.id}`}
        className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {content}
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
  onTaskToggle?: (task: Task) => void;
  selectedTaskIds?: Set<number>;
}

export function TaskList({ tasks, showAssignee = true, onTaskToggle, selectedTaskIds }: TaskListProps) {
  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {tasks.map((task) => (
        <TaskListItem
          key={task.id}
          task={task}
          showAssignee={showAssignee}
          onSelect={onTaskToggle}
          isSelected={selectedTaskIds?.has(task.id)}
        />
      ))}
    </ul>
  );
}
