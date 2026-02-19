import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  tasksApi,
} from "@trackdev/api-client";
import type { Task, TaskStatus } from "@trackdev/types";
import { useCallback, useState } from "react";

import type { BoardColumnId, DragOverTarget, DragState } from "./types";
import { canDropOnColumn } from "./utils";

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
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiClientError && err.body?.message) {
    return err.body.message;
  }
  return fallback;
}

export function useDragAndDrop({
  optimisticTasks,
  addOptimisticUpdate,
  setTasks,
  startTransition,
  sprintId,
  sprintMeta,
  t,
}: UseDragAndDropParams) {
  const toast = useToast();

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    taskId: null,
    source: null,
  });
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(
    null,
  );

  // =========================================================================
  // DRAG EVENT HANDLERS
  // =========================================================================

  const handleDragStart = useCallback(
    (e: React.DragEvent, task: Task, source: "sprint" | "backlog") => {
      setDragState({ taskId: task.id, source });
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id.toString());
      (e.target as HTMLElement).style.opacity = "0.5";
    },
    [],
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDragState({ taskId: null, source: null });
    setDragOverTarget(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, storyId: number, columnId: BoardColumnId) => {
      const isDraggingFromSprint = dragState.source === "sprint";
      if (!canDropOnColumn(true, isDraggingFromSprint, columnId, sprintMeta.status))
        return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverTarget({ type: "column", storyId, columnId });
    },
    [dragState.source, sprintMeta.status],
  );

  const handleDragOverBacklog = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget({ type: "backlog" });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

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

  // =========================================================================
  // DROP HANDLERS
  // =========================================================================

  const handleDropOnColumn = useCallback(
    (e: React.DragEvent, _storyId: number, columnId: BoardColumnId) => {
      e.preventDefault();
      setDragOverTarget(null);

      const { taskId, source } = dragState;
      if (!taskId) return;

      const task = optimisticTasks.get(taskId);
      if (!task) return;

      if (source === "backlog") {
        if (columnId !== "TODO") {
          setDragState({ taskId: null, source: null });
          return;
        }
        addTaskToSprint(taskId);
      } else {
        if (task.type === "USER_STORY") {
          setDragState({ taskId: null, source: null });
          return;
        }

        if (
          sprintMeta.status === "CLOSED" ||
          sprintMeta.status === "DRAFT"
        ) {
          setDragState({ taskId: null, source: null });
          return;
        }

        if (task.status !== columnId) {
          moveTaskToColumn(taskId, columnId);
        }
      }
      setDragState({ taskId: null, source: null });
    },
    [
      dragState,
      optimisticTasks,
      addTaskToSprint,
      moveTaskToColumn,
      sprintMeta.status,
    ],
  );

  const handleDropOnBacklog = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverTarget(null);

      const { taskId, source } = dragState;
      if (!taskId || source !== "sprint") {
        setDragState({ taskId: null, source: null });
        return;
      }

      const task = optimisticTasks.get(taskId);
      if (!task) {
        setDragState({ taskId: null, source: null });
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
          setDragState({ taskId: null, source: null });
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
        setDragState({ taskId: null, source: null });
        return;
      } else {
        if (task.status !== "TODO") {
          toast.error(t("taskBegunCannotGoBacklog"));
          setDragState({ taskId: null, source: null });
          return;
        }
        removeTasksFromSprint([taskId]);
      }
      setDragState({ taskId: null, source: null });
    },
    [
      dragState,
      optimisticTasks,
      sprintId,
      removeUserStoryFromSprint,
      removeTasksFromSprint,
      t,
      toast,
    ],
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
  };
}
