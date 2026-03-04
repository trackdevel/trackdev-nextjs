import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  projectsApi,
  tasksApi,
} from "@trackdev/api-client";
import type { Task, TaskStatus } from "@trackdev/types";
import { useCallback, useMemo, useRef, useState } from "react";

import type { BoardColumnId, DragOverTarget, DragState } from "./types";
import {
  calculateNewRank,
  canDropOnColumn,
  getDropIndex,
  selectBacklogTasks,
} from "./utils";

interface UseDragAndDropParams {
  optimisticTasks: Map<number, Task>;
  addOptimisticUpdate: (action: import("./types").TaskOptimisticAction) => void;
  setTasks: React.Dispatch<React.SetStateAction<Map<number, Task>>>;
  startTransition: React.TransitionStartFunction;
  sprintId: number;
  sprintMeta: {
    name: string;
    status: string;
  };
  t: (key: string) => string;
  projectId: number | null;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError && err.body?.message) {
    return err.body.message;
  }
  return fallback;
}

const NULL_DRAG: DragState = { taskId: null, source: null };

export function useDragAndDrop({
  optimisticTasks,
  addOptimisticUpdate,
  setTasks,
  startTransition,
  sprintId,
  sprintMeta,
  t,
  projectId,
}: UseDragAndDropParams) {
  const toast = useToast();

  // Compute backlog tasks for reorder calculations
  const backlogTasks = useMemo(
    () => selectBacklogTasks(optimisticTasks),
    [optimisticTasks],
  );

  // Drag state: useState for triggering re-renders (collapse animation, etc.)
  // and useRef for synchronous access in event handlers (avoids stale closures).
  const [dragState, setDragState] = useState<DragState>(NULL_DRAG);
  const dragStateRef = useRef<DragState>(NULL_DRAG);

  const updateDragState = useCallback((next: DragState) => {
    dragStateRef.current = next;
    setDragState(next);
  }, []);

  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(
    null,
  );
  const dragOverTargetRef = useRef<DragOverTarget | null>(null);

  const updateDragOverTarget = useCallback((next: DragOverTarget | null) => {
    dragOverTargetRef.current = next;
    setDragOverTarget(next);
  }, []);

  // =========================================================================
  // DRAG EVENT HANDLERS
  // =========================================================================

  const handleDragStart = useCallback(
    (e: React.DragEvent, task: Task, source: "sprint" | "backlog") => {
      updateDragState({ taskId: task.id, source });
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id.toString());
      // The drag image is captured synchronously by the browser.
      // React's batched state update triggers a re-render AFTER the event
      // handler returns, so the collapse animation only starts after the
      // drag image is already captured.
      const el = e.target as HTMLElement;
      // Native dragend listener: ensures cleanup even if React unmounts the element
      const onNativeDragEnd = () => {
        updateDragState(NULL_DRAG);
        updateDragOverTarget(null);
        el.removeEventListener("dragend", onNativeDragEnd);
      };
      el.addEventListener("dragend", onNativeDragEnd);
    },
    [updateDragState],
  );

  const handleDragEnd = useCallback(
    (_e: React.DragEvent) => {
      updateDragState(NULL_DRAG);
      updateDragOverTarget(null);
    },
    [updateDragState],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, storyId: number, columnId: BoardColumnId) => {
      const isDraggingFromSprint = dragStateRef.current.source === "sprint";
      if (!canDropOnColumn(true, isDraggingFromSprint, columnId, sprintMeta.status))
        return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      updateDragOverTarget({ type: "column", storyId, columnId });
    },
    [sprintMeta.status],
  );

  const handleDragOverBacklog = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // When dragging from backlog (reordering), don't override the
    // backlog-reorder target — the cursor may be on a gap between cards
    // or on a wrapper div, and resetting to "backlog" would make the
    // reorder indicator flicker.
    if (dragStateRef.current.source !== "backlog") {
      updateDragOverTarget({ type: "backlog" });
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return; // Still within the same container, don't clear
    }
    updateDragOverTarget(null);
  }, []);

  // Drag over a specific backlog task card (for reorder indicator)
  const handleDragOverBacklogTask = useCallback(
    (e: React.DragEvent, targetTask: Task) => {
      const ds = dragStateRef.current;
      // Only allow reordering USER_STORY tasks within the backlog
      if (ds.source !== "backlog") return;
      const draggedTask = ds.taskId ? optimisticTasks.get(ds.taskId) : null;
      if (!draggedTask || draggedTask.type !== "USER_STORY") return;
      if (targetTask.type !== "USER_STORY") return;
      if (ds.taskId === targetTask.id) return;

      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = "move";

      const { position } = getDropIndex(e, targetTask, backlogTasks);
      updateDragOverTarget({
        type: "backlog-reorder",
        targetTaskId: targetTask.id,
        position,
      });
    },
    [optimisticTasks, backlogTasks],
  );

  // =========================================================================
  // ASYNC ACTIONS (using useTransition + useOptimistic)
  // =========================================================================

  const moveTaskToColumn = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      const task = optimisticTasks.get(taskId);
      if (!task) return;

      startTransition(async () => {
        addOptimisticUpdate({
          type: "updateStatus",
          taskId,
          status: newStatus,
        });

        try {
          const updatedTask = await tasksApi.update(taskId, {
            status: newStatus,
          });
          setTasks((prev) => {
            const next = new Map(prev);
            next.set(taskId, updatedTask);
            return next;
          });
        } catch (err) {
          toast.error(
            getErrorMessage(err, "Failed to update task status"),
          );
        }
      });
    },
    [optimisticTasks, addOptimisticUpdate, setTasks, startTransition, toast],
  );

  const addTaskToSprint = useCallback(
    async (taskId: number) => {
      const task = optimisticTasks.get(taskId);
      if (!task) return;

      // Validation: Cannot add tasks to CLOSED sprints
      if (sprintMeta.status === "CLOSED") {
        toast.error(t("cannotAddToClosedSprint"));
        return;
      }

      // Find subtasks if this is a USER_STORY (backend cascades sprint assignment)
      const subtaskIds: number[] = [];
      if (task.type === "USER_STORY") {
        for (const t of optimisticTasks.values()) {
          if (t.parentTaskId === taskId) {
            subtaskIds.push(t.id);
          }
        }
      }

      startTransition(async () => {
        addOptimisticUpdate({
          type: "addToSprint",
          taskId,
          subtaskIds,
          sprintId,
          sprintName: sprintMeta.name,
        });

        try {
          const updatedTask = await tasksApi.update(taskId, { sprintId });
          setTasks((prev) => {
            const next = new Map(prev);
            next.set(taskId, updatedTask);
            for (const subtaskId of subtaskIds) {
              const subtask = next.get(subtaskId);
              if (subtask) {
                next.set(subtaskId, {
                  ...subtask,
                  activeSprints: updatedTask.activeSprints,
                  status:
                    subtask.status === "BACKLOG" ? "TODO" : subtask.status,
                });
              }
            }
            return next;
          });
        } catch (err) {
          toast.error(
            getErrorMessage(err, "Failed to add task to sprint"),
          );
        }
      });
    },
    [optimisticTasks, addOptimisticUpdate, setTasks, startTransition, sprintId, sprintMeta, t, toast],
  );

  // Remove USER_STORY from sprint (backend cascades to subtasks)
  const removeUserStoryFromSprint = useCallback(
    async (userStoryId: number, subtaskIds: number[]) => {
      startTransition(async () => {
        addOptimisticUpdate({
          type: "removeFromSprint",
          taskIds: [userStoryId, ...subtaskIds],
        });

        try {
          const updatedTask = await tasksApi.update(userStoryId, {
            sprintId: null,
          });

          setTasks((prev) => {
            const next = new Map(prev);
            next.set(userStoryId, updatedTask);
            for (const subtaskId of subtaskIds) {
              const subtask = next.get(subtaskId);
              if (subtask) {
                next.set(subtaskId, {
                  ...subtask,
                  activeSprints: [],
                });
              }
            }
            return next;
          });
        } catch (err) {
          toast.error(
            getErrorMessage(err, t("failedToMoveToBacklog")),
          );
        }
      });
    },
    [addOptimisticUpdate, setTasks, startTransition, t, toast],
  );

  const removeTasksFromSprint = useCallback(
    async (taskIds: number[], parentUserStoryId?: number) => {
      const allIdsToUpdate = parentUserStoryId
        ? [...taskIds, parentUserStoryId]
        : taskIds;

      startTransition(async () => {
        addOptimisticUpdate({
          type: "removeFromSprint",
          taskIds: allIdsToUpdate,
        });

        try {
          const results = await Promise.all(
            taskIds.map((id) => tasksApi.update(id, { sprintId: null })),
          );

          setTasks((prev) => {
            const next = new Map(prev);
            for (const task of results) {
              next.set(task.id, task);
            }
            if (parentUserStoryId) {
              const parentTask = next.get(parentUserStoryId);
              if (parentTask) {
                next.set(parentUserStoryId, {
                  ...parentTask,
                  activeSprints: [],
                });
              }
            }
            return next;
          });
        } catch (err) {
          toast.error(
            getErrorMessage(err, t("failedToMoveToBacklog")),
          );
        }
      });
    },
    [addOptimisticUpdate, setTasks, startTransition, t, toast],
  );

  // Reorder a USER_STORY within the backlog
  const reorderBacklogTask = useCallback(
    async (taskId: number, targetIndex: number) => {
      const newRank = calculateNewRank(backlogTasks, taskId, targetIndex);

      if (newRank === null) {
        // Gap exhaustion: rebalance first, then notify user to retry
        if (!projectId) return;
        try {
          await projectsApi.rebalanceRanks(projectId);
          toast.info(t("ranksRebalanced"));
        } catch (err) {
          toast.error(getErrorMessage(err, t("failedToReorder")));
        }
        return;
      }

      startTransition(async () => {
        addOptimisticUpdate({
          type: "updateRank",
          taskId,
          newRank,
        });

        try {
          const updatedTask = await tasksApi.update(taskId, { rank: newRank });
          setTasks((prev) => {
            const next = new Map(prev);
            next.set(taskId, updatedTask);
            return next;
          });
        } catch (err) {
          toast.error(getErrorMessage(err, t("failedToReorder")));
        }
      });
    },
    [backlogTasks, projectId, addOptimisticUpdate, setTasks, startTransition, t, toast],
  );

  // =========================================================================
  // DROP HANDLERS
  // =========================================================================

  const handleDropOnColumn = useCallback(
    (e: React.DragEvent, _storyId: number, columnId: BoardColumnId) => {
      e.preventDefault();
      updateDragOverTarget(null);

      // Read from ref to avoid stale closure — React may not have committed
      // the re-render from handleDragStart yet when this handler fires.
      const { taskId, source } = dragStateRef.current;
      if (!taskId) return;

      const task = optimisticTasks.get(taskId);
      if (!task) return;

      if (source === "backlog") {
        if (columnId !== "TODO") {
          updateDragState(NULL_DRAG);
          return;
        }
        addTaskToSprint(taskId);
      } else {
        if (task.type === "USER_STORY") {
          updateDragState(NULL_DRAG);
          return;
        }

        if (
          sprintMeta.status === "CLOSED" ||
          sprintMeta.status === "DRAFT"
        ) {
          updateDragState(NULL_DRAG);
          return;
        }

        if (task.status !== columnId) {
          moveTaskToColumn(taskId, columnId);
        }
      }
      updateDragState(NULL_DRAG);
    },
    [
      optimisticTasks,
      addTaskToSprint,
      moveTaskToColumn,
      sprintMeta.status,
      updateDragState,
    ],
  );

  const handleDropOnBacklog = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const reorderTarget = dragOverTargetRef.current;
      updateDragOverTarget(null);

      const { taskId, source } = dragStateRef.current;

      // Handle backlog reorder drops — when the user drops on the reorder
      // placeholder (pointer-events-none) or a gap between cards, the event
      // lands here instead of on a BacklogTaskCard.
      if (taskId && source === "backlog" && reorderTarget?.type === "backlog-reorder") {
        const stories = backlogTasks.filter((t) => t.type === "USER_STORY");
        const targetIndex = stories.findIndex((t) => t.id === reorderTarget.targetTaskId);
        if (targetIndex >= 0) {
          const index = reorderTarget.position === "before" ? targetIndex : targetIndex + 1;
          reorderBacklogTask(taskId, index);
        }
        updateDragState(NULL_DRAG);
        return;
      }

      if (!taskId || source !== "sprint") {
        updateDragState(NULL_DRAG);
        return;
      }

      const task = optimisticTasks.get(taskId);
      if (!task) {
        updateDragState(NULL_DRAG);
        return;
      }

      if (task.type === "USER_STORY") {
        // Get ALL child tasks (from any sprint)
        const allChildTasks = Array.from(optimisticTasks.values()).filter(
          (t) =>
            t.parentTaskId === taskId &&
            (t.type === "TASK" || t.type === "BUG"),
        );

        const hasNonTodoChildren = allChildTasks.some(
          (child) => child.status !== "TODO",
        );
        if (hasNonTodoChildren) {
          toast.error(t("userStoryChildrenMustBeTodo"));
          updateDragState(NULL_DRAG);
          return;
        }

        // Get child tasks in this sprint for optimistic update
        const childIdsInSprint = allChildTasks
          .filter(
            (t) =>
              t.activeSprints &&
              t.activeSprints.length > 0 &&
              t.activeSprints.some((s) => s.id === sprintId),
          )
          .map((c) => c.id);

        removeUserStoryFromSprint(taskId, childIdsInSprint);
      } else if (task.parentTaskId) {
        toast.error(t("subtaskCannotMoveToBacklog"));
        updateDragState(NULL_DRAG);
        return;
      } else {
        if (task.status !== "TODO") {
          toast.error(t("taskBegunCannotGoBacklog"));
          updateDragState(NULL_DRAG);
          return;
        }
        removeTasksFromSprint([taskId]);
      }
      updateDragState(NULL_DRAG);
    },
    [
      optimisticTasks,
      backlogTasks,
      sprintId,
      removeUserStoryFromSprint,
      removeTasksFromSprint,
      reorderBacklogTask,
      t,
      toast,
      updateDragState,
    ],
  );

  const handleDropOnBacklogTask = useCallback(
    (e: React.DragEvent, targetTask: Task) => {
      const { taskId, source } = dragStateRef.current;
      // Only handle drops from backlog (reordering). For sprint→backlog drops,
      // let the event bubble up to handleDropOnBacklog.
      if (!taskId || source !== "backlog") {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      updateDragOverTarget(null);

      const draggedTask = optimisticTasks.get(taskId);
      if (!draggedTask || draggedTask.type !== "USER_STORY") {
        updateDragState(NULL_DRAG);
        return;
      }

      if (targetTask.type !== "USER_STORY" || taskId === targetTask.id) {
        updateDragState(NULL_DRAG);
        return;
      }

      const { index } = getDropIndex(e, targetTask, backlogTasks);
      reorderBacklogTask(taskId, index);
      updateDragState(NULL_DRAG);
    },
    [optimisticTasks, backlogTasks, reorderBacklogTask, updateDragState],
  );

  // =========================================================================
  // DERIVED STATE
  // =========================================================================

  const isDragging = dragState.taskId !== null;
  const isDraggingFromSprint = dragState.source === "sprint";
  const dragOverBacklog = dragOverTarget?.type === "backlog";

  return {
    dragState,
    dragOverTarget,
    isDragging,
    isDraggingFromSprint,
    dragOverBacklog,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragOverBacklog,
    handleDragLeave,
    handleDropOnColumn,
    handleDropOnBacklog,
    handleDragOverBacklogTask,
    handleDropOnBacklogTask,
    reorderBacklogTask,
  };
}
