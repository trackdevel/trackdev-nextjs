import type { Task } from "@trackdev/types";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useMemo, useState } from "react";

import { BOARD_COLUMNS, type BoardColumnId, type DragOverTarget, type Story } from "../types";
import { canDropOnColumn } from "../utils";
import { BoardColumn } from "./BoardColumn";

interface StoryRowProps {
  story: Story;
  sprintId: number;
  expanded: boolean;
  onToggleExpand: (storyId: number) => void;
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
  onCreateSubtask: (storyId: number) => void;
  dragOverTarget: DragOverTarget | null;
  isDragging: boolean;
  isDraggingFromSprint: boolean;
  sprintStatus: string;
}

export const StoryRow = memo(function StoryRow({
  story,
  sprintId,
  expanded,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCreateSubtask,
  dragOverTarget,
  isDragging,
  isDraggingFromSprint,
  sprintStatus,
}: StoryRowProps) {
  const t = useTranslations("sprints");
  const [isDraggingThis, setIsDraggingThis] = useState(false);

  const tasksByColumn = useMemo(() => {
    const byColumn: Record<BoardColumnId, Task[]> = {
      TODO: [],
      INPROGRESS: [],
      VERIFY: [],
      DONE: [],
    };
    const sortedSubtasks = [...story.subtasks].sort((a, b) => a.id - b.id);
    for (const task of sortedSubtasks) {
      const status = task.status as BoardColumnId;
      if (byColumn[status]) {
        byColumn[status].push(task);
      }
    }
    return byColumn;
  }, [story.subtasks]);

  const totalPoints = story.subtasks.reduce(
    (sum: number, t: Task) => sum + (t.estimationPoints || 0),
    0,
  );

  if (story.id === -1) {
    // Orphan tasks (no parent story)
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("unassignedTasks")}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4 p-4">
          {BOARD_COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              columnId={col.id}
              storyId={story.id}
              tasks={tasksByColumn[col.id]}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              isDropTarget={
                dragOverTarget?.type === "column" &&
                dragOverTarget.storyId === story.id &&
                dragOverTarget.columnId === col.id
              }
              isDragging={isDragging}
              isDraggingFromSprint={isDraggingFromSprint}
              dropDisabled={!canDropOnColumn(isDragging, isDraggingFromSprint, col.id, sprintStatus)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Story Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => {
          // Only toggle if not dragging
          if (!isDraggingThis) {
            onToggleExpand(story.id);
          }
        }}
        draggable
        onDragStart={(e) => {
          setIsDraggingThis(true);
          onDragStart(
            e,
            {
              id: story.id,
              name: story.name,
              type: "USER_STORY",
              activeSprints: [{ id: sprintId }],
            } as Task,
            "sprint",
          );
        }}
        onDragEnd={(e) => {
          // Reset dragging state after a short delay to prevent click from firing
          setTimeout(() => setIsDraggingThis(false), 100);
          onDragEnd(e);
        }}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 cursor-grab text-gray-400" />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
          <Link
            href={`/dashboard/tasks/${story.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
          >
            {story.name}
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({story.subtasks.length} {t("tasks")})
          </span>
          {/* Sprint badges showing which sprints have subtasks */}
          {story.allSubtaskSprints.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {story.allSubtaskSprints.map((sprint) => (
                <span
                  key={sprint.id}
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                    sprint.id === sprintId
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 ring-1 ring-primary-500"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                  title={sprint.name}
                >
                  {sprint.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {totalPoints > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalPoints} {t("points")}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubtask(story.id);
            }}
            className="rounded-sm p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
            title={t("addSubtask")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Story Tasks */}
      {expanded && (
        <div className="grid grid-cols-4 gap-4 p-4">
          {BOARD_COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              columnId={col.id}
              storyId={story.id}
              tasks={tasksByColumn[col.id]}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              isDropTarget={
                dragOverTarget?.type === "column" &&
                dragOverTarget.storyId === story.id &&
                dragOverTarget.columnId === col.id
              }
              isDragging={isDragging}
              isDraggingFromSprint={isDraggingFromSprint}
              dropDisabled={!canDropOnColumn(isDragging, isDraggingFromSprint, col.id, sprintStatus)}
            />
          ))}
        </div>
      )}
    </div>
  );
});
