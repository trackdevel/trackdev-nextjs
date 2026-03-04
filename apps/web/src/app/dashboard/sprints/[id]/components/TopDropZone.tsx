import { useDroppable } from "@dnd-kit/react";
import { useTranslations } from "next-intl";

import type { DropTargetColumnData } from "../types";

export function TopDropZone() {
  const t = useTranslations("sprints");

  const colData: DropTargetColumnData = {
    type: "column",
    storyId: -1,
    columnId: "TODO",
  };

  const { ref, isDropTarget } = useDroppable({
    id: "top-TODO",
    data: colData,
  });

  return (
    <div
      ref={ref}
      className={`min-h-[60px] rounded-lg border-2 border-dashed p-4 transition-colors ${
        isDropTarget
          ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
          : "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
      }`}
    >
      <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
        {t("dropHereToAdd")}
      </div>
    </div>
  );
}
