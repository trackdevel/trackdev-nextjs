import type { Task } from "@trackdev/types";
import { ChevronLeft, ChevronRight, FolderKanban, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { BacklogTaskCard } from "./BacklogTaskCard";

interface BacklogPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onAddTask: () => void;
  backlogTasks: Task[];
  backlogSubtasksMap: Map<number, Task[]>;
  isDragging: boolean;
  isDraggingFromSprint: boolean;
  dragOverBacklog: boolean;
  onDragOverBacklog: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDropOnBacklog: (e: React.DragEvent) => void;
  onDragStart: (e: React.DragEvent, task: Task, source: "backlog") => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function BacklogPanel({
  isOpen,
  onToggleOpen,
  onAddTask,
  backlogTasks,
  backlogSubtasksMap,
  isDragging,
  isDraggingFromSprint,
  dragOverBacklog,
  onDragOverBacklog,
  onDragLeave,
  onDropOnBacklog,
  onDragStart,
  onDragEnd,
}: BacklogPanelProps) {
  const t = useTranslations("sprints");

  return (
    <div
      className={`shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-all duration-300 ${
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
              <button
                onClick={onAddTask}
                className="mr-2 rounded-sm p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                title={t("addTask")}
              >
                <Plus className="h-5 w-5" />
              </button>
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
            className={`flex-1 overflow-y-auto p-4 ${
              isDragging && isDraggingFromSprint && dragOverBacklog
                ? "bg-primary-50 dark:bg-primary-900/30 ring-2 ring-inset ring-primary-300"
                : isDragging && isDraggingFromSprint
                  ? "bg-primary-25 dark:bg-primary-900/20"
                  : ""
            }`}
            onDragOver={onDragOverBacklog}
            onDragLeave={onDragLeave}
            onDrop={onDropOnBacklog}
          >
            {backlogTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <FolderKanban className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                {t("noBacklogTasks")}
                {isDragging && isDraggingFromSprint && (
                  <p className="mt-2 text-primary-600">
                    {t("dropToBacklog")}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {isDragging && isDraggingFromSprint && (
                  <div className="mb-4 rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 p-4 text-center text-sm text-primary-600 dark:text-primary-400">
                    {t("dropToBacklog")}
                  </div>
                )}
                {backlogTasks.map((task) => (
                  <BacklogTaskCard
                    key={task.id}
                    task={task}
                    subtasks={backlogSubtasksMap.get(task.id) || []}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
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
