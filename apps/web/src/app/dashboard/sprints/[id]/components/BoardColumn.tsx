import type { Task } from "@trackdev/types";
import { memo } from "react";

import type { BoardColumnId } from "../types";
import { TaskCard } from "./TaskCard";

interface BoardColumnProps {
  columnId: BoardColumnId;
  storyId: number;
  tasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task, source: "sprint") => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  onDragLeave: () => void;
  onDrop: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  isDropTarget: boolean;
  isDragging: boolean;
  isDraggingFromSprint: boolean;
  dropDisabled?: boolean;
}

export const BoardColumn = memo(function BoardColumn({
  columnId,
  storyId,
  tasks,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDropTarget,
  isDragging,
  isDraggingFromSprint,
  dropDisabled,
}: BoardColumnProps) {
  return (
    <div
      className={`min-h-[100px] rounded-lg border-2 border-dashed p-2 transition-colors ${
        dropDisabled
          ? "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50"
          : isDropTarget
            ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
            : isDragging && !isDraggingFromSprint
              ? "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
              : "border-transparent bg-gray-50 dark:bg-gray-700/50"
      }`}
      onDragOver={(e) => onDragOver(e, storyId, columnId)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, storyId, columnId)}
    >
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
});
