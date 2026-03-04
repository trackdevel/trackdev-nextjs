import type { Task } from "@trackdev/types";
import { useDraggable } from "@dnd-kit/react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { memo, useMemo } from "react";

import {
  BOARD_COLUMNS,
  type BoardColumnId,
  type DragItemData,
  type Story,
} from "../types";
import { canDropOnColumn } from "../utils";
import { BoardColumn } from "./BoardColumn";

interface StoryRowProps {
  story: Story;
  sprintId: number;
  expanded: boolean;
  onToggleExpand: (storyId: number) => void;
  onCreateSubtask: (storyId: number) => void;
  sprintStatus: string;
  draggedTaskId: number | null;
  dragSource: "sprint" | "backlog" | null;
}

export const StoryRow = memo(function StoryRow({
  story,
  sprintId,
  expanded,
  onToggleExpand,
  onCreateSubtask,
  sprintStatus,
  draggedTaskId,
  dragSource,
}: StoryRowProps) {
  const t = useTranslations("sprints");

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

  // Determine if dragging is active (for column drop validation)
  const isDragging = draggedTaskId !== null;
  const isDraggingFromSprint = dragSource === "sprint";

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
              dropDisabled={
                !canDropOnColumn(
                  isDragging,
                  isDraggingFromSprint,
                  col.id,
                  sprintStatus,
                )
              }
              draggedTaskId={draggedTaskId}
              dragSource={dragSource}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Story Header */}
      <StoryHeader
        story={story}
        sprintId={sprintId}
        expanded={expanded}
        onToggleExpand={onToggleExpand}
        onCreateSubtask={onCreateSubtask}
        totalPoints={totalPoints}
        draggedTaskId={draggedTaskId}
        t={t}
      />

      {/* Story Tasks */}
      {expanded && (
        <div className="grid grid-cols-4 gap-4 p-4">
          {BOARD_COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              columnId={col.id}
              storyId={story.id}
              tasks={tasksByColumn[col.id]}
              dropDisabled={
                !canDropOnColumn(
                  isDragging,
                  isDraggingFromSprint,
                  col.id,
                  sprintStatus,
                )
              }
              draggedTaskId={draggedTaskId}
              dragSource={dragSource}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Extracted so the useDraggable hook is only called for real stories (not orphan id=-1)
const StoryHeader = memo(function StoryHeader({
  story,
  sprintId,
  expanded,
  onToggleExpand,
  onCreateSubtask,
  totalPoints,
  draggedTaskId,
  t,
}: {
  story: Story;
  sprintId: number;
  expanded: boolean;
  onToggleExpand: (storyId: number) => void;
  onCreateSubtask: (storyId: number) => void;
  totalPoints: number;
  draggedTaskId: number | null;
  t: (key: string) => string;
}) {
  const syntheticTask = useMemo(
    () =>
      ({
        id: story.id,
        name: story.name,
        type: "USER_STORY",
        activeSprints: [{ id: sprintId }],
      }) as Task,
    [story.id, story.name, sprintId],
  );

  const data: DragItemData = { source: "sprint", task: syntheticTask };
  const { ref: handleRef } = useDraggable({
    id: `story-${story.id}`,
    data,
  });

  return (
    <div
      className={`flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
        draggedTaskId === story.id ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div ref={handleRef} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <button
          onClick={() => onToggleExpand(story.id)}
          className="p-0.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
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
  );
});
