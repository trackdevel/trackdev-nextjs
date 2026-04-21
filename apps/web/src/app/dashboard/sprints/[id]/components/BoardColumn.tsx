import type { Task } from "@trackdev/types";
import { useDroppable } from "@dnd-kit/react";
import { memo } from "react";

import type { BoardColumnId, DropTargetColumnData } from "../types";
import { TaskCard } from "./TaskCard";

interface BoardColumnProps {
  columnId: BoardColumnId;
  storyId: number;
  tasks: Task[];
  dropDisabled?: boolean;
  draggedTaskId: number | null;
  dragSource: "sprint" | "backlog" | null;
  courseId?: number;
}

export const BoardColumn = memo(function BoardColumn({
  columnId,
  storyId,
  tasks,
  dropDisabled,
  draggedTaskId,
  dragSource,
  courseId,
}: BoardColumnProps) {
  const colData: DropTargetColumnData = {
    type: "column",
    storyId,
    columnId,
  };

  const { ref, isDropTarget } = useDroppable({
    id: `col-${storyId}-${columnId}`,
    data: colData,
    disabled: dropDisabled,
  });

  return (
    <div
      ref={ref}
      className={`min-h-[100px] rounded-lg border-2 border-dashed p-2 transition-colors ${
        dropDisabled
          ? "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50"
          : isDropTarget
            ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
            : "border-transparent bg-gray-50 dark:bg-gray-700/50"
      }`}
    >
      <div className="space-y-2">
        {tasks.map((task) => {
          const isBeingDragged =
            dragSource === "sprint" && draggedTaskId === task.id;
          return (
            <div
              key={task.id}
              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                isBeingDragged
                  ? "grid-rows-[0fr] opacity-0"
                  : "grid-rows-[1fr] opacity-100"
              }`}
            >
              <div className="overflow-hidden p-0.5 -m-0.5">
                <TaskCard
                  task={task}
                  isBeingDragged={isBeingDragged}
                  courseId={courseId}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
