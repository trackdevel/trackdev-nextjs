"use client";

import type { Task } from "@trackdev/types";
import { useDroppable } from "@dnd-kit/react";
import { ChevronLeft, ChevronRight, FolderKanban, Plus, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { SortableBacklogTaskCard } from "./SortableBacklogTaskCard";

interface BacklogPanelDndKitProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddTask: () => void;
  backlogTasks: Task[];
  backlogSubtasksMap: Map<number, Task[]>;
  isDraggingFromSprint: boolean;
  draggedTaskId: number | null;
  showMyBacklogOnly: boolean;
  onToggleMyBacklog: () => void;
  backlogSortableGroup: string;
}

export function BacklogPanelDndKit({
  isOpen,
  onToggleOpen,
  onAddTask,
  backlogTasks,
  backlogSubtasksMap,
  isDraggingFromSprint,
  draggedTaskId,
  showMyBacklogOnly,
  onToggleMyBacklog,
  backlogSortableGroup,
}: BacklogPanelDndKitProps) {
  const t = useTranslations("sprints");

  const { ref: dropRef, isDropTarget } = useDroppable({
    id: "backlog",
    data: { type: "backlog" as const },
  });

  return (
    <div
      className={`h-full shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-all duration-300 ${
        isOpen ? "w-80" : "w-12"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Backlog Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          {isOpen && (
            <>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("backlog")}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleMyBacklog}
                  className={`rounded-sm p-1 ${showMyBacklogOnly ? "text-primary-600 bg-primary-50 dark:bg-primary-900/30" : "text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                  title={t("myStories")}
                >
                  <User className="h-4 w-4" />
                </button>
                <button
                  onClick={onAddTask}
                  className="rounded-sm p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                  title={t("addTask")}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
          <button
            onClick={onToggleOpen}
            className="rounded-sm p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Backlog Content */}
        {isOpen && (
          <div
            ref={dropRef}
            className={`flex-1 overflow-y-auto p-4 transition-colors duration-200 ${
              isDraggingFromSprint && isDropTarget
                ? "bg-primary-50 dark:bg-primary-900/30 ring-2 ring-inset ring-primary-300"
                : isDraggingFromSprint
                  ? "bg-primary-25 dark:bg-primary-900/20"
                  : ""
            }`}
          >
            {backlogTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <FolderKanban className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                {t("noBacklogTasks")}
                {isDraggingFromSprint && (
                  <p className="mt-2 text-primary-600">
                    {t("dropToBacklog")}
                  </p>
                )}
              </div>
            ) : (
              <div key={backlogSortableGroup} className="space-y-2">
                {isDraggingFromSprint && (
                  <div className="rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 p-4 text-center text-sm text-primary-600 dark:text-primary-400">
                    {t("dropToBacklog")}
                  </div>
                )}
                {backlogTasks.map((task, index) => (
                  <SortableBacklogTaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    subtasks={backlogSubtasksMap.get(task.id) || []}
                    draggedTaskId={draggedTaskId}
                    backlogSortableGroup={backlogSortableGroup}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
