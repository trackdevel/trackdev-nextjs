import { MemberAvatar } from "@/components/ui/MemberAvatar";
import type { Task } from "@trackdev/types";
import { Snowflake } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task, source: "sprint") => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
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
    <Link
      href={`/dashboard/tasks/${task.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task, "sprint")}
      onDragEnd={onDragEnd}
      className="block cursor-grab rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${getTypeColor()}`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {task.name}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {task.taskKey && <span>{task.taskKey}</span>}
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
        {task.assignee && (
          <MemberAvatar
            size="xs"
            username={task.assignee.fullName || task.assignee.username}
            capitalLetters={task.assignee.capitalLetters}
            color={task.assignee.color}
            title={task.assignee.fullName || task.assignee.username}
          />
        )}
      </div>
    </Link>
  );
});
