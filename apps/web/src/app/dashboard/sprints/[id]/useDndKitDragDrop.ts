import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  projectsApi,
  tasksApi,
} from "@trackdev/api-client";
import type { Task, TaskStatus } from "@trackdev/types";
import { isSortable } from "@dnd-kit/react/sortable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  DragItemData,
  DropIntent,
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

  // Sortable group reset key — incremented on every drag end to force
  // @dnd-kit's useSortable to re-register items with their correct indices.
  // Without this, when a backlog item is dragged toward the sprint (passing
  // over other backlog items), the sortable rearranges internally.  If the
  // drop is rejected, the items stay in the wrong visual order because
  // useSortable's layout effect only re-runs when group/index changes.
  const [sortResetKey, setSortResetKey] = useState(0);
  const backlogSortableGroup = `backlog-${sortResetKey}`;

  // =========================================================================
  // INTENT + EFFECT: Deterministic deferred drop processing
  //
  // @dnd-kit/react calls flushSync inside a useLayoutEffect when isDragSource
  // transitions to false.  flushSync can discard in-flight startTransition
  // optimistic updates.  To avoid this, handleDragEnd only captures the drop
  // intent in a ref.  A useEffect (guaranteed to run AFTER all layout effects
  // and flushSync) then processes the intent in a clean React state.
  // =========================================================================

  const pendingDropRef = useRef<DropIntent | null>(null);

  // =========================================================================
  // ASYNC ACTIONS (business logic)
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
  // HANDLER REFS — always point to latest versions for the useEffect below
  // =========================================================================

  const handleDropOnColumnRef = useRef(handleDropOnColumn);
  const handleDropOnBacklogRef = useRef(handleDropOnBacklog);
  const reorderBacklogTaskRef = useRef(reorderBacklogTask);
  handleDropOnColumnRef.current = handleDropOnColumn;
  handleDropOnBacklogRef.current = handleDropOnBacklog;
  reorderBacklogTaskRef.current = reorderBacklogTask;

  // =========================================================================
  // DEFERRED DROP PROCESSING
  //
  // React guarantees useEffect runs AFTER all useLayoutEffect callbacks
  // (where @dnd-kit's flushSync happens) and AFTER paint.  This means our
  // startTransition + addOptimisticUpdate happen in a completely clean state.
  // =========================================================================

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const intent = pendingDropRef.current;
    if (!intent) return;

    // Clear immediately — process exactly once (StrictMode safe)
    pendingDropRef.current = null;

    switch (intent.kind) {
      case "dropOnColumn":
        handleDropOnColumnRef.current(intent.sourceData, intent.targetData);
        break;
      case "dropOnBacklog":
        handleDropOnBacklogRef.current(intent.taskId);
        break;
      case "reorderBacklog":
        reorderBacklogTaskRef.current(intent.taskId, intent.targetIndex);
        break;
    }
  });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
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
      if (!sourceData) {
        setActiveDragData(null);
        return;
      }

      // Snapshot all Proxy-backed values NOW, before @dnd-kit's
      // useLayoutEffect + flushSync cleanup can invalidate them.
      const sortable = isSortable(source);
      const initialIndex =
        sortable && "initialIndex" in source
          ? (source.initialIndex as number)
          : null;
      const currentIndex =
        sortable && "index" in source ? (source.index as number) : null;
      const targetData = target.data as
        | DropTargetColumnData
        | { type: "backlog" }
        | undefined;

      // Build the DropIntent from snapshotted values.
      // Cross-container drops take priority over sortable reorder,
      // because @dnd-kit updates source.index even when the item is
      // dragged OUT of its sortable group (e.g. backlog → sprint).
      let intent: DropIntent | null = null;

      if (targetData && "type" in targetData) {
        if (targetData.type === "column") {
          intent = {
            kind: "dropOnColumn",
            sourceData,
            targetData: targetData as DropTargetColumnData,
          };
        } else if (targetData.type === "backlog") {
          if (sourceData.source === "sprint") {
            intent = { kind: "dropOnBacklog", taskId: sourceData.task.id };
          } else if (
            sortable &&
            initialIndex !== null &&
            currentIndex !== null &&
            initialIndex !== currentIndex
          ) {
            intent = {
              kind: "reorderBacklog",
              taskId: sourceData.task.id,
              targetIndex: currentIndex,
            };
          }
        }
      } else if (
        sortable &&
        initialIndex !== null &&
        currentIndex !== null &&
        initialIndex !== currentIndex
      ) {
        // Target is another sortable item (no type field)
        intent = {
          kind: "reorderBacklog",
          taskId: sourceData.task.id,
          targetIndex: currentIndex,
        };
      }

      // Store intent for the useEffect to process after flushSync completes
      pendingDropRef.current = intent;

      // Clear drag visual state — triggers re-render → useEffect
      setActiveDragData(null);

      // Reset sortable group to force items back to their data-driven order
      setSortResetKey((k) => k + 1);
    },
    [], // Empty deps: stable reference, no closures over changing state
  );

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    activeDragData,
    backlogSortableGroup,
    providerProps: {
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
  };
}
