import type { Task } from "@trackdev/types";

import type {
  BoardColumnId,
  SprintBoardResponse,
  Story,
  TaskOptimisticAction,
} from "./types";

// =============================================================================
// SELECTORS (pure functions)
// =============================================================================

export function selectSprintTasks(
  tasks: Map<number, Task>,
  sprintId: number,
): Task[] {
  return Array.from(tasks.values())
    .filter(
      (task) =>
        task.activeSprints &&
        task.activeSprints.length > 0 &&
        task.activeSprints.some((s) => s.id === sprintId),
    )
    .sort((a, b) => a.id - b.id);
}

export function selectBacklogTasks(tasks: Map<number, Task>): Task[] {
  return Array.from(tasks.values())
    .filter(
      (task) =>
        (!task.activeSprints || task.activeSprints.length === 0) &&
        (task.type === "USER_STORY" || !task.parentTaskId),
    )
    .sort((a, b) => {
      // USER_STORY tasks sorted by rank (lower rank = higher priority = displayed first)
      // Non-USER_STORY tasks (standalone TASK/BUG) go after all stories, sorted by id
      const aIsStory = a.type === "USER_STORY";
      const bIsStory = b.type === "USER_STORY";
      if (aIsStory && bIsStory) return a.rank - b.rank;
      if (aIsStory && !bIsStory) return -1;
      if (!aIsStory && bIsStory) return 1;
      return a.id - b.id;
    });
}

export function selectStories(
  sprintTasks: Task[],
  allTasks: Map<number, Task>,
  sprintId: number,
): Story[] {
  const storyMap = new Map<number, Story>();
  const orphanTasks: Task[] = [];

  // First, identify USER_STORYs in this sprint
  for (const task of sprintTasks) {
    if (task.type === "USER_STORY") {
      storyMap.set(task.id, {
        id: task.id,
        name: task.name,
        estimationPoints: task.estimationPoints || 0,
        subtasks: [],
        allSubtaskSprints: [],
      });
    }
  }

  // For each USER_STORY, first collect ALL subtasks to compute sprint badges,
  // then filter to only include subtasks in THIS sprint for the board
  for (const [storyId, story] of storyMap.entries()) {
    const allSubtasks: Task[] = [];
    const sprintMap = new Map<number, { id: number; name: string }>();

    // Find ALL subtasks of this story (from any sprint)
    for (const task of allTasks.values()) {
      if (
        (task.type === "TASK" || task.type === "BUG") &&
        task.parentTaskId === storyId
      ) {
        allSubtasks.push(task);
        // Collect all sprints from this subtask
        if (task.activeSprints) {
          for (const sprint of task.activeSprints) {
            if (!sprintMap.has(sprint.id)) {
              sprintMap.set(sprint.id, { id: sprint.id, name: sprint.name });
            }
          }
        }
      }
    }

    // Store all sprints for badges (sorted by id for chronological order)
    story.allSubtaskSprints = Array.from(sprintMap.values()).sort(
      (a, b) => a.id - b.id,
    );

    // Filter subtasks to only those in THIS sprint for the board, sorted by id
    story.subtasks = allSubtasks
      .filter(
        (task) =>
          task.activeSprints &&
          task.activeSprints.some((s) => s.id === sprintId),
      )
      .sort((a, b) => a.id - b.id);
  }

  // Handle orphan tasks (TASK/BUG without parent or parent not in this sprint)
  for (const task of sprintTasks) {
    if ((task.type === "TASK" || task.type === "BUG") && !task.parentTaskId) {
      orphanTasks.push(task);
    } else if (
      (task.type === "TASK" || task.type === "BUG") &&
      task.parentTaskId
    ) {
      // If parent story is not in this sprint, add to orphans
      if (!storyMap.has(task.parentTaskId)) {
        orphanTasks.push(task);
      }
    }
  }

  if (orphanTasks.length > 0) {
    storyMap.set(-1, {
      id: -1,
      name: "Unassigned Tasks",
      estimationPoints: 0,
      subtasks: orphanTasks.sort((a, b) => a.id - b.id),
      allSubtaskSprints: [],
    });
  }

  // Return stories sorted by id (with orphan tasks lane at the end)
  return Array.from(storyMap.values()).sort((a, b) => {
    // Keep orphan tasks (-1) at the end
    if (a.id === -1) return 1;
    if (b.id === -1) return -1;
    return a.id - b.id;
  });
}

// =============================================================================
// OPTIMISTIC REDUCER (for useOptimistic)
// =============================================================================

export function tasksOptimisticReducer(
  tasks: Map<number, Task>,
  action: TaskOptimisticAction,
): Map<number, Task> {
  const newTasks = new Map(tasks);

  switch (action.type) {
    case "updateStatus": {
      const task = newTasks.get(action.taskId);
      if (task) {
        newTasks.set(action.taskId, { ...task, status: action.status });
      }
      return newTasks;
    }

    case "addToSprint": {
      const task = newTasks.get(action.taskId);
      const newSprint = { id: action.sprintId, name: action.sprintName };
      if (task) {
        newTasks.set(action.taskId, {
          ...task,
          activeSprints: [newSprint] as Task["activeSprints"],
          status: task.status === "BACKLOG" ? "TODO" : task.status,
        });
      }
      // Also update subtasks (for USER_STORY drag)
      for (const subtaskId of action.subtaskIds) {
        const subtask = newTasks.get(subtaskId);
        if (subtask) {
          newTasks.set(subtaskId, {
            ...subtask,
            activeSprints: [newSprint] as Task["activeSprints"],
            status: subtask.status === "BACKLOG" ? "TODO" : subtask.status,
          });
        }
      }
      return newTasks;
    }

    case "removeFromSprint": {
      for (const taskId of action.taskIds) {
        const task = newTasks.get(taskId);
        if (task) {
          newTasks.set(taskId, { ...task, activeSprints: [] });
        }
      }
      return newTasks;
    }

    case "updateTasks": {
      for (const task of action.tasks) {
        newTasks.set(task.id, task);
      }
      return newTasks;
    }

    case "updateRank": {
      const task = newTasks.get(action.taskId);
      if (task) {
        newTasks.set(action.taskId, { ...task, rank: action.newRank });
      }
      return newTasks;
    }

    default:
      return newTasks;
  }
}

// =============================================================================
// HELPER: Merge server data with local tasks
// =============================================================================

export function mergeTasksFromServer(
  sprintBoard: SprintBoardResponse,
  projectTasks: Task[],
): Map<number, Task> {
  const tasks = new Map<number, Task>();
  for (const task of sprintBoard.tasks) {
    tasks.set(task.id, task);
  }
  for (const task of projectTasks) {
    if (!tasks.has(task.id)) {
      tasks.set(task.id, task);
    }
  }
  return tasks;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check whether a drop on a given column should be disabled.
 * Used by both handleDragOver/handleDropOnColumn and StoryRow.isColumnDropDisabled.
 */
export function canDropOnColumn(
  isDragging: boolean,
  isDraggingFromSprint: boolean,
  _columnId: BoardColumnId,
  sprintStatus: string,
): boolean {
  if (!isDragging) return true;
  // From backlog: drops go to the TopDropZone only, not story-row columns
  if (!isDraggingFromSprint) return false;
  // From sprint in DRAFT or CLOSED: no status changes
  if (
    isDraggingFromSprint &&
    (sprintStatus === "DRAFT" || sprintStatus === "CLOSED")
  )
    return false;
  return true;
}

// =============================================================================
// RANK CALCULATION (for backlog drag-and-drop reordering)
// =============================================================================

const RANK_GAP_SIZE = 65536;

/**
 * Calculate the new rank for a task being moved within the backlog.
 *
 * @param backlogTasks - The current ordered list of backlog tasks (sorted by rank)
 * @param draggedTaskId - The ID of the task being dragged
 * @param targetIndex - The final position of the task in the full sorted list (from @dnd-kit source.index)
 * @returns The new rank value, or null if rebalancing is needed
 */
export function calculateNewRank(
  backlogTasks: Task[],
  draggedTaskId: number,
  targetIndex: number,
): number | null {
  // Filter to only USER_STORY tasks (non-stories are not reorderable)
  const stories = backlogTasks.filter((t) => t.type === "USER_STORY");

  // Remove the dragged task from consideration
  const otherStories = stories.filter((t) => t.id !== draggedTaskId);

  if (otherStories.length === 0) {
    return RANK_GAP_SIZE;
  }

  // targetIndex is the final position in the full sorted list (from @dnd-kit's
  // source.index). It maps directly to the insert position in otherStories.
  const clampedIndex = Math.max(0, Math.min(targetIndex, otherStories.length));

  if (clampedIndex === 0) {
    // Moving to top: rank = first task's rank / 2
    const firstRank = otherStories[0].rank;
    const newRank = Math.floor(firstRank / 2);
    return newRank > 0 ? newRank : null; // null means need rebalance
  }

  if (clampedIndex >= otherStories.length) {
    // Moving to bottom: rank = last task's rank + GAP_SIZE
    return otherStories[otherStories.length - 1].rank + RANK_GAP_SIZE;
  }

  // Moving between two tasks: rank = midpoint
  const prevRank = otherStories[clampedIndex - 1].rank;
  const nextRank = otherStories[clampedIndex].rank;
  const newRank = Math.floor((prevRank + nextRank) / 2);

  // Check for gap exhaustion (midpoint equals one of the neighbors)
  if (newRank <= prevRank || newRank >= nextRank) {
    return null; // Need rebalance
  }

  return newRank;
}

