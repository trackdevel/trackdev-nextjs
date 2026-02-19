import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { Task } from "@trackdev/types";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import { memo, useState } from "react";

interface BacklogTaskCardProps {
  task: Task;
  subtasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task, source: "backlog") => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const BacklogTaskCard = memo(function BacklogTaskCard({
  task,
  subtasks,
  onDragStart,
  onDragEnd,
}: BacklogTaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = task.type === "USER_STORY" && subtasks.length > 0;

  const getTypeIcon = () => {
    switch (task.type) {
      case "USER_STORY":
        return <FolderKanban className="h-4 w-4 text-purple-500" />;
      case "TASK":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "BUG":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSubtaskTypeIcon = (type: string) => {
    switch (type) {
      case "TASK":
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case "BUG":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-xs">
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task, "backlog")}
        onDragEnd={onDragEnd}
        className="cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
      >
        <div className="flex items-start gap-2">
          {hasSubtasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="mt-0.5 rounded-sm p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )}
            </button>
          )}
          {getTypeIcon()}
          <div className="min-w-0 flex-1 overflow-hidden">
            <Link
              href={`/dashboard/tasks/${task.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
            >
              {task.name}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {task.taskKey && <span>{task.taskKey}</span>}
              {hasSubtasks && (
                <span className="text-gray-400 dark:text-gray-500">
                  ({subtasks.length})
                </span>
              )}
              {task.estimationPoints !== undefined &&
                task.estimationPoints > 0 && (
                  <span className="rounded-sm bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5">
                    {task.estimationPoints}p
                  </span>
                )}
            </div>
          </div>
          {task.assignee && (
            <MemberAvatar
              size="xxs"
              username={task.assignee.fullName || task.assignee.username}
              capitalLetters={task.assignee.capitalLetters}
              color={task.assignee.color}
              title={task.assignee.fullName || task.assignee.username}
            />
          )}
        </div>
      </div>

      {/* Subtasks (expanded) */}
      {hasSubtasks && expanded && (
        <div className="border-t border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2">
          <div className="space-y-1.5 pl-4">
            {subtasks.map((subtask) => (
              <Link
                key={subtask.id}
                href={`/dashboard/tasks/${subtask.id}`}
                className="flex items-center gap-2 rounded-sm p-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {getSubtaskTypeIcon(subtask.type)}
                <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
                  {subtask.name}
                </span>
                {subtask.estimationPoints !== undefined &&
                  subtask.estimationPoints > 0 && (
                    <span className="rounded-sm bg-gray-200 dark:bg-gray-600 px-1 py-0.5 text-gray-600 dark:text-gray-300">
                      {subtask.estimationPoints}p
                    </span>
                  )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
