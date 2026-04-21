import { TaskBadge } from "@/components/tasks/TaskBadge";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { userProfileHref } from "@/components/ui/UserLink";
import type { Task } from "@trackdev/types";
import { useDraggable } from "@dnd-kit/react";
import { Snowflake } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import type { DragItemData } from "../types";
import { TaskHoverPreview } from "./TaskHoverPreview";

interface TaskCardProps {
  task: Task;
  isBeingDragged: boolean;
  courseId?: number;
}

export const TaskCard = memo(function TaskCard({ task, isBeingDragged, courseId }: TaskCardProps) {
  const data: DragItemData = { source: "sprint", task };
  // Intentionally not reading isDragSource — its Proxy tracking triggers
  // flushSync inside useLayoutEffect when drag ends, causing React errors.
  const { ref } = useDraggable({
    id: `sprint-${task.id}`,
    data,
  });

  const getTypeColor = () => {
    switch (task.type) {
      case "TASK":
        return "bg-blue-500";
      case "BUG":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <TaskHoverPreview task={task} disabled={isBeingDragged}>
      <div
        ref={ref}
        className={`cursor-grab rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-xs transition-all duration-300 ease-in-out hover:shadow-md active:cursor-grabbing ${
          isBeingDragged ? "opacity-50" : ""
        }`}
      >
        <div className="p-3">
          <div className="flex items-start gap-2">
            <div
              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${getTypeColor()}`}
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/dashboard/tasks/${task.id}`}
                draggable={false}
                className="block truncate text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
              >
                {task.name}
              </Link>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {task.taskKey && <TaskBadge taskKey={task.taskKey} taskId={task.id} />}
                {task.estimationPoints !== undefined &&
                  task.estimationPoints > 0 && (
                    <span className="rounded-sm bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5">
                      {task.estimationPoints}p
                    </span>
                  )}
                {task.frozen && (
                  <span title="Frozen">
                    <Snowflake className="h-3 w-3 text-blue-400" />
                  </span>
                )}
              </div>
            </div>
            {task.assignee &&
              (courseId && task.assignee.id ? (
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
              ))}
          </div>
        </div>
      </div>
    </TaskHoverPreview>
  );
});
