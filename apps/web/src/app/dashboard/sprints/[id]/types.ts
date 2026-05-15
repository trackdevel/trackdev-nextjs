import type { Task, TaskStatus } from "@trackdev/types";

// =============================================================================
// CONSTANTS
// =============================================================================

export const BOARD_COLUMNS = [
  {
    id: "TODO",
    label: "To Do",
    color: "bg-gray-100 dark:bg-gray-700",
    textColor: "text-gray-700 dark:text-gray-300",
  },
  {
    id: "INPROGRESS",
    label: "In Progress",
    color: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-700 dark:text-blue-400",
  },
  {
    id: "VERIFY",
    label: "Verify",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-700 dark:text-yellow-400",
  },
  {
    id: "DONE",
    label: "Done",
    color: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-700 dark:text-green-400",
  },
] as const;

export type BoardColumnId = (typeof BOARD_COLUMNS)[number]["id"];

// =============================================================================
// TYPES
// =============================================================================

export interface SprintBoardResponse {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  statusText: string;
  project: { id: number; name: string };
  tasks: Task[];
}

export interface Story {
  id: number;
  name: string;
  taskKey?: string;
  status: string;
  estimationPoints: number;
  assignee?: Task["assignee"];
  frozen?: boolean;
  subtasks: Task[];
  // All sprints where this story has subtasks (for sprint badges)
  allSubtaskSprints: { id: number; name: string }[];
}

// @dnd-kit data types
export interface DragItemData {
  source: "sprint" | "backlog";
  task: Task;
}

export interface DropTargetColumnData {
  type: "column";
  storyId: number;
  columnId: BoardColumnId;
}

export interface DropTargetBacklogData {
  type: "backlog";
}

export type DropTargetData = DropTargetColumnData | DropTargetBacklogData;

// Drop intent — captured synchronously in handleDragEnd, processed in useEffect
export type DropIntent =
  | {
      kind: "dropOnColumn";
      sourceData: DragItemData;
      targetData: DropTargetColumnData;
    }
  | { kind: "dropOnBacklog"; taskId: number }
  | { kind: "reorderBacklog"; taskId: number; targetIndex: number };

// Optimistic update action types
export type TaskOptimisticAction =
  | { type: "updateStatus"; taskId: number; status: TaskStatus }
  | {
      type: "addToSprint";
      taskId: number;
      subtaskIds: number[];
      sprintId: number;
      sprintName: string;
    }
  | { type: "removeFromSprint"; taskIds: number[] }
  | { type: "updateTasks"; tasks: Task[] }
  | { type: "updateRank"; taskId: number; newRank: number };

// =============================================================================
// UTILITIES
// =============================================================================

export const COLLAPSED_STORIES_STORAGE_KEY = (sprintId: number) =>
  `sprint-${sprintId}-collapsed-stories`;
