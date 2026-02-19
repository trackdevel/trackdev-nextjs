import { FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";

import { BOARD_COLUMNS, type BoardColumnId, type DragOverTarget } from "../types";

interface EmptySprintStateProps {
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
  dragOverTarget: DragOverTarget | null;
  isDragging: boolean;
  isDraggingFromSprint: boolean;
}

export const EmptySprintState = memo(function EmptySprintState({
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverTarget,
  isDragging,
  isDraggingFromSprint,
}: EmptySprintStateProps) {
  const t = useTranslations("sprints");

  // Only show drop zone for TODO column when dragging from backlog
  const showDropZone = isDragging && !isDraggingFromSprint;

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8">
      {showDropZone ? (
        <div className="grid grid-cols-4 gap-4">
          {BOARD_COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`min-h-[150px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                col.id === "TODO"
                  ? dragOverTarget?.type === "column" &&
                    dragOverTarget.storyId === -1 &&
                    dragOverTarget.columnId === "TODO"
                    ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
                    : "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50"
              }`}
              onDragOver={(e) => {
                if (col.id === "TODO") {
                  onDragOver(e, -1, col.id);
                }
              }}
              onDragLeave={onDragLeave}
              onDrop={(e) => {
                if (col.id === "TODO") {
                  onDrop(e, -1, col.id);
                }
              }}
            >
              <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                {col.id === "TODO" ? t("dropHereToAdd") : col.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {t("noTasksInSprint")}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("dragTasksFromBacklog")}
          </p>
        </div>
      )}
    </div>
  );
});
