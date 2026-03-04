import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  projectsApi,
  tasksApi,
} from "@trackdev/api-client";
import type { Task, TaskStatus } from "@trackdev/types";
import { useCallback, useMemo, useState } from "react";

import type {
  DragItemData,
  DropTargetColumnData,
  TaskOptimisticAction,
} from "./types";
import { calculateNewRank, selectBacklogTasks } from "./utils";

// =============================================================================
// TYPES
// =============================================================================

interface UseDndKitDragDropParams {
  optimisticTasks: Map<number, Task>;
  addOptimisticUpdate: (action: TaskOptimisticAction) => void;
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

// =============================================================================
// HELPERS
// =============================================================================

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError && err.body?.message) {
    return err.body.message;
  }
  return fallback;
}

// =============================================================================
// HOOK
// =============================================================================

export function useDndKitDragDrop({
  optimisticTasks,
  addOptimisticUpdate,
  setTasks,
  startTransition,
  sprintId,
  sprintMeta,
  t,
  projectId,
}: UseDndKitDragDropParams) {
  const toast = useToast();

  // Compute backlog tasks for reorder calculations
  const backlogTasks = useMemo(
    () => selectBacklogTasks(optimisticTasks),
    [optimisticTasks],
  );

  // Active drag state for visual feedback across components
  const [activeDragData, setActiveDragData] = useState<DragItemData | null>(
    null,
  );

  // =========================================================================
  // ASYNC ACTIONS (business logic — same as useDragAndDrop)
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

      if (sprintMeta.status === "CLOSED") {
        toast.error(t("cannotAddToClosedSprint"));
        return;
      }

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
    [
      optimisticTasks,
      addOptimisticUpdate,
      setTasks,
      startTransition,
      sprintId,
      sprintMeta,
      t,
      toast,
    ],
  );

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
          toast.error(getErrorMessage(err, t("failedToMoveToBacklog")));
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
          toast.error(getErrorMessage(err, t("failedToMoveToBacklog")));
        }
      });
    },
    [addOptimisticUpdate, setTasks, startTransition, t, toast],
  );

  const reorderBacklogTask = useCallback(
    async (taskId: number, targetIndex: number) => {
      const newRank = calculateNewRank(backlogTasks, taskId, targetIndex);

      if (newRank === null) {
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
    [
      backlogTasks,
      projectId,
      addOptimisticUpdate,
      setTasks,
      startTransition,
      t,
      toast,
    ],
  );

  // =========================================================================
  // DROP ROUTING — handles sprint→backlog drops
  // =========================================================================

  const handleDropOnBacklog = useCallback(
    (taskId: number) => {
      const task = optimisticTasks.get(taskId);
      if (!task) return;

      if (task.type === "USER_STORY") {
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
          return;
        }

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
      } else {
        if (task.status !== "TODO") {
          toast.error(t("taskBegunCannotGoBacklog"));
          return;
        }
        removeTasksFromSprint([taskId]);
      }
    },
    [
      optimisticTasks,
      sprintId,
      removeUserStoryFromSprint,
      removeTasksFromSprint,
      t,
      toast,
    ],
  );

  // =========================================================================
  // DROP ROUTING — handles column drops (backlog→sprint or column change)
  // =========================================================================

  const handleDropOnColumn = useCallback(
    (
      sourceData: DragItemData,
      targetData: DropTargetColumnData,
    ) => {
      const { task: sourceTask, source } = sourceData;
      const { columnId } = targetData;
      const taskId = sourceTask.id;

      const task = optimisticTasks.get(taskId);
      if (!task) return;

      if (source === "backlog") {
        if (columnId !== "TODO") return;
        addTaskToSprint(taskId);
      } else {
        if (task.type === "USER_STORY") return;
        if (
          sprintMeta.status === "CLOSED" ||
          sprintMeta.status === "DRAFT"
        ) {
          return;
        }
        if (task.status !== columnId) {
          moveTaskToColumn(taskId, columnId);
        }
      }
    },
    [optimisticTasks, addTaskToSprint, moveTaskToColumn, sprintMeta.status],
  );

  // =========================================================================
  // DRAGDROP PROVIDER EVENT HANDLERS
  // =========================================================================

  const handleDragStart = useCallback(
    (event: { operation: { source: { data?: unknown } | null } }) => {
      const data = event.operation.source?.data as DragItemData | undefined;
      if (data) {
        setActiveDragData(data);
      }
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: {
      operation: {
        source: { id: unknown; data?: unknown } | null;
        target: { id: unknown; data?: unknown } | null;
      };
      canceled: boolean;
    }) => {
      const { operation, canceled } = event;

      if (canceled) {
        setActiveDragData(null);
        return;
      }

      const { source, target } = operation;
      if (!source || !target) {
        setActiveDragData(null);
        return;
      }

      const sourceData = source.data as DragItemData | undefined;
      const targetData = target.data as
        | DropTargetColumnData
        | { type: "backlog" }
        | DragItemData
        | undefined;

      if (!sourceData || !targetData) {
        setActiveDragData(null);
        return;
      }

      setActiveDragData(null);

      // Defer to next microtask to avoid state updates during @dnd-kit's
      // internal lifecycle (its useLayoutEffect uses flushSync on signals).
      queueMicrotask(() => {
        if ("type" in targetData) {
          if (targetData.type === "column") {
            handleDropOnColumn(
              sourceData,
              targetData as DropTargetColumnData,
            );
          } else if (targetData.type === "backlog") {
            // Sprint → Backlog
            if (sourceData.source === "sprint") {
              handleDropOnBacklog(sourceData.task.id);
            }
          }
        } else if ("source" in targetData) {
          // Both source and target are drag items (sortable backlog reorder)
          if (
            sourceData.source === "backlog" &&
            targetData.source === "backlog"
          ) {
            const sourceId = sourceData.task.id;
            const targetId = (targetData as DragItemData).task.id;
            if (sourceId === targetId) return;

            const stories = backlogTasks.filter(
              (t) => t.type === "USER_STORY",
            );
            const targetIndex = stories.findIndex((t) => t.id === targetId);
            if (targetIndex === -1) return;

            const sourceIndex = stories.findIndex((t) => t.id === sourceId);
            const insertIndex =
              sourceIndex < targetIndex ? targetIndex + 1 : targetIndex;

            reorderBacklogTask(sourceId, insertIndex);
          }
        }
      });
    },
    [
      handleDropOnColumn,
      handleDropOnBacklog,
      backlogTasks,
      reorderBacklogTask,
    ],
  );

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    activeDragData,
    providerProps: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  };
}
