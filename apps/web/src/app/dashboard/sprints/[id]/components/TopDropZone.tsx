import { useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";

import { BOARD_COLUMNS, type DropTargetColumnData } from "../types";

export function TopDropZone() {
  const t = useTranslations("sprints");

  return (
    <div className="grid grid-cols-4 gap-4">
      {BOARD_COLUMNS.map((col) => (
        <TopDropColumn
          key={col.id}
          columnId={col.id}
          isTodo={col.id === "TODO"}
          t={t}
        />
      ))}
    </div>
  );
}

function TopDropColumn({
  columnId,
  isTodo,
  t,
}: {
  columnId: string;
  isTodo: boolean;
  t: (key: string) => string;
}) {
  const colData: DropTargetColumnData = {
    type: "column",
    storyId: -1,
    columnId: columnId as DropTargetColumnData["columnId"],
  };

  const { ref, isDropTarget } = useDroppable({
    id: `top-${columnId}`,
    data: colData,
    disabled: !isTodo,
  });

  return (
    <div
      ref={ref}
      className={`min-h-[60px] rounded-lg border-2 border-dashed p-4 transition-colors ${
        isTodo
          ? isDropTarget
            ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
            : "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
          : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50"
      }`}
    >
      <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
        {isTodo ? t("dropHereToAdd") : ""}
      </div>
    </div>
  );
}
