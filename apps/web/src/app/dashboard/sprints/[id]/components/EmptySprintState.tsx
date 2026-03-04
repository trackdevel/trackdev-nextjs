import { useDroppable } from "@dnd-kit/react";
import { FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";

import {
  BOARD_COLUMNS,
  type DropTargetColumnData,
} from "../types";

interface EmptySprintStateProps {
  isDraggingFromBacklog: boolean;
}

export const EmptySprintState = memo(function EmptySprintState({
  isDraggingFromBacklog,
}: EmptySprintStateProps) {
  const t = useTranslations("sprints");

  const showDropZone = isDraggingFromBacklog;

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8">
      {showDropZone ? (
        <div className="grid grid-cols-4 gap-4">
          {BOARD_COLUMNS.map((col) => (
            <EmptyColumn
              key={col.id}
              columnId={col.id}
              label={col.label}
              isTodo={col.id === "TODO"}
              t={t}
            />
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

// Extracted so useDroppable is only called when the drop zone is visible
function EmptyColumn({
  columnId,
  label,
  isTodo,
  t,
}: {
  columnId: string;
  label: string;
  isTodo: boolean;
  t: (key: string) => string;
}) {
  const colData: DropTargetColumnData = {
    type: "column",
    storyId: -1,
    columnId: columnId as DropTargetColumnData["columnId"],
  };

  const { ref, isDropTarget } = useDroppable({
    id: `empty-${columnId}`,
    data: colData,
    disabled: !isTodo,
  });

  return (
    <div
      ref={ref}
      className={`min-h-[150px] rounded-lg border-2 border-dashed p-4 transition-colors ${
        isTodo
          ? isDropTarget
            ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
            : "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
          : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50"
      }`}
    >
      <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
        {isTodo ? t("dropHereToAdd") : label}
      </div>
    </div>
  );
}
