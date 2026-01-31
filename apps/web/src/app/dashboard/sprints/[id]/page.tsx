"use client";

import { BackButton } from "@/components/BackButton";
import { CreateTaskModal } from "@/components/tasks";
import { useToast } from "@/components/ui/Toast";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  projectsApi,
  sprintsApi,
  tasksApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { Task, TaskStatus } from "@trackdev/types";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  FolderKanban,
  GripVertical,
  Loader2,
  PlayCircle,
  Plus,
  Snowflake,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";

// =============================================================================
// CONSTANTS
// =============================================================================

const BOARD_COLUMNS = [
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

type BoardColumnId = (typeof BOARD_COLUMNS)[number]["id"];

// =============================================================================
// TYPES
// =============================================================================

interface SprintBoardResponse {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  statusText: string;
  project: { id: number; name: string };
  tasks: Task[];
}

interface Story {
  id: number;
  name: string;
  estimationPoints: number;
  subtasks: Task[];
  // All sprints where this story has subtasks (for sprint badges)
  allSubtaskSprints: { id: number; name: string }[];
}

interface DragState {
  taskId: number | null;
  source: "sprint" | "backlog" | null;
}

interface DragOverTarget {
  type: "column" | "backlog" | null;
  storyId?: number;
  columnId?: BoardColumnId;
}

// Optimistic update action types
type TaskOptimisticAction =
  | { type: "updateStatus"; taskId: number; status: TaskStatus }
  | {
      type: "addToSprint";
      taskId: number;
      subtaskIds: number[];
      sprintId: number;
      sprintName: string;
    }
  | { type: "removeFromSprint"; taskIds: number[] }
  | { type: "updateTasks"; tasks: Task[] };

// =============================================================================
// SELECTORS (pure functions)
// =============================================================================

function selectSprintTasks(tasks: Map<number, Task>, sprintId: number): Task[] {
  return Array.from(tasks.values())
    .filter(
      (task) =>
        task.activeSprints &&
        task.activeSprints.length > 0 &&
        task.activeSprints.some((s) => s.id === sprintId),
    )
    .sort((a, b) => a.id - b.id);
}

function selectBacklogTasks(tasks: Map<number, Task>): Task[] {
  return Array.from(tasks.values())
    .filter(
      (task) =>
        (!task.activeSprints || task.activeSprints.length === 0) &&
        (task.type === "USER_STORY" || !task.parentTaskId),
    )
    .sort((a, b) => a.id - b.id);
}

function selectStories(
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

function tasksOptimisticReducer(
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

    default:
      return newTasks;
  }
}

// =============================================================================
// HELPER: Merge server data with local tasks
// =============================================================================

function mergeTasksFromServer(
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
// MAIN COMPONENT
// =============================================================================

export default function SprintBoardPage() {
  const params = useParams();
  const sprintId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("sprints");
  const toast = useToast();
  const { formatDateTimeRange } = useDateFormat();

  // React 19: useTransition for async state updates
  const [isPending, startTransition] = useTransition();

  // Core state
  const [tasks, setTasks] = useState<Map<number, Task>>(new Map());
  const [sprintMeta, setSprintMeta] = useState<{
    name: string;
    status: string;
    statusText: string;
    startDate: string | null;
    endDate: string | null;
    project: { id: number; name: string } | null;
  }>({
    name: "",
    status: "",
    statusText: "",
    startDate: null,
    endDate: null,
    project: null,
  });

  // React 19: useOptimistic for optimistic UI updates
  // When async action completes, setTasks updates the base state and optimistic state auto-syncs
  const [optimisticTasks, addOptimisticUpdate] = useOptimistic(
    tasks,
    tasksOptimisticReducer,
  );

  // UI state
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createSubtaskForStoryId, setCreateSubtaskForStoryId] = useState<
    number | null
  >(null);
  // Track collapsed stories (all stories are expanded by default)
  const [collapsedStories, setCollapsedStories] = useState<Set<number>>(
    new Set(),
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Drag state (kept simple, no need for optimistic updates)
  const [dragState, setDragState] = useState<DragState>({
    taskId: null,
    source: null,
  });
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(
    null,
  );

  // Data fetching
  const {
    data: sprintBoard,
    isLoading: boardLoading,
    error,
    refetch: refetchBoard,
  } = useQuery(() => sprintsApi.getBoard(sprintId), [sprintId], {
    enabled: isAuthenticated && !isNaN(sprintId),
  });

  const { data: projectTasks, refetch: refetchProjectTasks } = useQuery(
    () =>
      sprintBoard?.project?.id
        ? projectsApi.getTasks(sprintBoard.project.id)
        : Promise.resolve({ tasks: [], projectId: 0 }),
    [sprintBoard?.project?.id],
    { enabled: isAuthenticated && !!sprintBoard?.project?.id },
  );

  // Fetch all sprints for the project to enable prev/next navigation
  const { data: projectSprints } = useQuery(
    () =>
      sprintBoard?.project?.id
        ? projectsApi.getSprints(sprintBoard.project.id)
        : Promise.resolve({ sprints: [], projectId: 0 }),
    [sprintBoard?.project?.id],
    { enabled: isAuthenticated && !!sprintBoard?.project?.id },
  );

  // Compute previous and next sprint IDs for navigation
  const { prevSprintId, nextSprintId } = useMemo(() => {
    if (!projectSprints?.sprints || projectSprints.sprints.length === 0) {
      return { prevSprintId: null, nextSprintId: null };
    }
    const sprints = projectSprints.sprints;
    const currentIndex = sprints.findIndex((s) => s.id === sprintId);
    if (currentIndex === -1) {
      return { prevSprintId: null, nextSprintId: null };
    }
    return {
      prevSprintId: currentIndex > 0 ? sprints[currentIndex - 1].id : null,
      nextSprintId:
        currentIndex < sprints.length - 1 ? sprints[currentIndex + 1].id : null,
    };
  }, [projectSprints, sprintId]);

  // Refetch data when window gains focus (to catch changes made in other views)
  useEffect(() => {
    const handleFocus = () => {
      refetchBoard();
      refetchProjectTasks();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchBoard, refetchProjectTasks]);

  // Sync server data to local state
  useEffect(() => {
    if (sprintBoard && projectTasks) {
      const mergedTasks = mergeTasksFromServer(sprintBoard, projectTasks.tasks);
      setTasks(mergedTasks);
      setSprintMeta({
        name: sprintBoard.name,
        status: sprintBoard.status,
        statusText: sprintBoard.statusText,
        startDate: sprintBoard.startDate,
        endDate: sprintBoard.endDate,
        project: sprintBoard.project,
      });
      if (!isInitialized) {
        // Load collapsed stories from localStorage (all stories expanded by default)
        const storageKey = `sprint-${sprintId}-collapsed-stories`;
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const collapsedIds = JSON.parse(stored) as number[];
            setCollapsedStories(new Set(collapsedIds));
          }
        } catch {
          // Ignore localStorage errors
        }
        setIsInitialized(true);
      }
    }
  }, [sprintBoard, projectTasks, isInitialized, sprintId]);

  // Derived state using optimisticTasks (which includes pending optimistic updates)
  const sprintTasks = useMemo(
    () => selectSprintTasks(optimisticTasks, sprintId),
    [optimisticTasks, sprintId],
  );
  const backlogTasks = useMemo(
    () => selectBacklogTasks(optimisticTasks),
    [optimisticTasks],
  );
  // Compute backlog subtasks from optimisticTasks Map (for USER_STORYs in backlog)
  const backlogSubtasksMap = useMemo(() => {
    const map = new Map<number, Task[]>();
    // Find all subtasks in backlog (no activeSprints) that have a parentTaskId
    const subtasksInBacklog = Array.from(optimisticTasks.values()).filter(
      (task) =>
        (!task.activeSprints || task.activeSprints.length === 0) &&
        task.parentTaskId &&
        (task.type === "TASK" || task.type === "BUG"),
    );
    // Group by parentTaskId
    for (const subtask of subtasksInBacklog) {
      const parentId = subtask.parentTaskId!;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId)!.push(subtask);
    }
    return map;
  }, [optimisticTasks]);
  const stories = useMemo(
    () => selectStories(sprintTasks, optimisticTasks, sprintId),
    [sprintTasks, optimisticTasks, sprintId],
  );

  const isLoading = authLoading || boardLoading || !isInitialized;

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const toggleStoryExpand = useCallback(
    (storyId: number) => {
      setCollapsedStories((prev) => {
        const next = new Set(prev);
        if (next.has(storyId)) {
          next.delete(storyId); // Expand (remove from collapsed)
        } else {
          next.add(storyId); // Collapse (add to collapsed)
        }
        // Persist to localStorage
        const storageKey = `sprint-${sprintId}-collapsed-stories`;
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
        } catch {
          // Ignore localStorage errors
        }
        return next;
      });
    },
    [sprintId],
  );

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
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverTarget({ type: "column", storyId, columnId });
    },
    [],
  );

  const handleDragOverBacklog = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget({ type: "backlog" });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  // =============================================================================
  // ASYNC ACTIONS (using useTransition + useOptimistic)
  // =============================================================================

  const moveTaskToColumn = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      const task = optimisticTasks.get(taskId);
      if (!task) return;

      startTransition(async () => {
        // Apply optimistic update immediately
        addOptimisticUpdate({
          type: "updateStatus",
          taskId,
          status: newStatus,
        });

        try {
          const updatedTask = await tasksApi.update(taskId, {
            status: newStatus,
          });
          // Update base state with server response (syncs optimistic state)
          setTasks((prev) => {
            const next = new Map(prev);
            next.set(taskId, updatedTask);
            return next;
          });
        } catch (err) {
          // On error, base state unchanged = optimistic update auto-reverts
          toast.error((err as Error).message || "Failed to update task status");
        }
      });
    },
    [optimisticTasks, addOptimisticUpdate, toast],
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
        // Apply optimistic update (includes subtasks for USER_STORY)
        addOptimisticUpdate({
          type: "addToSprint",
          taskId,
          subtaskIds,
          sprintId,
          sprintName: sprintMeta.name,
        });

        try {
          const updatedTask = await tasksApi.update(taskId, { sprintId });
          // Update base state with server response
          setTasks((prev) => {
            const next = new Map(prev);
            next.set(taskId, updatedTask);
            // Update subtasks in base state too (they're updated on the server)
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
          toast.error((err as Error).message || "Failed to add task to sprint");
        }
      });
    },
    [optimisticTasks, addOptimisticUpdate, sprintId, sprintMeta, t, toast],
  );

  // Remove USER_STORY from sprint (backend cascades to subtasks)
  const removeUserStoryFromSprint = useCallback(
    async (userStoryId: number, subtaskIds: number[]) => {
      startTransition(async () => {
        // Optimistically update USER_STORY and all subtasks
        addOptimisticUpdate({
          type: "removeFromSprint",
          taskIds: [userStoryId, ...subtaskIds],
        });

        try {
          // Only call API with USER_STORY ID - backend cascades to subtasks
          const updatedTask = await tasksApi.update(userStoryId, {
            sprintId: null,
          });

          // Update base state with server response
          setTasks((prev) => {
            const next = new Map(prev);
            next.set(userStoryId, updatedTask);
            // Update subtasks in base state (they're updated on the server)
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
          toast.error((err as Error).message || t("failedToMoveToBacklog"));
        }
      });
    },
    [addOptimisticUpdate, t, toast],
  );

  const removeTasksFromSprint = useCallback(
    async (taskIds: number[], parentUserStoryId?: number) => {
      // Include parent USER_STORY in optimistic update if provided
      const allIdsToUpdate = parentUserStoryId
        ? [...taskIds, parentUserStoryId]
        : taskIds;

      startTransition(async () => {
        // Apply optimistic update
        addOptimisticUpdate({
          type: "removeFromSprint",
          taskIds: allIdsToUpdate,
        });

        try {
          const results = await Promise.all(
            taskIds.map((id) => tasksApi.update(id, { sprintId: null })),
          );

          // Update base state with server responses
          setTasks((prev) => {
            const next = new Map(prev);
            for (const task of results) {
              next.set(task.id, task);
            }
            // Also update parent USER_STORY locally (its sprint is derived from children)
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
          toast.error((err as Error).message || t("failedToMoveToBacklog"));
        }
      });
    },
    [addOptimisticUpdate, t, toast],
  );

  // =============================================================================
  // DROP HANDLERS
  // =============================================================================

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
          toast.error(t("backlogTaskMustGoToTodo"));
          setDragState({ taskId: null, source: null });
          return;
        }
        addTaskToSprint(taskId);
      } else {
        // USER_STORY cannot change status via drag (status is derived from children)
        if (task.type === "USER_STORY") {
          setDragState({ taskId: null, source: null });
          return;
        }

        // Tasks in CLOSED (past) sprints cannot change status
        if (sprintMeta.status === "CLOSED") {
          toast.error(t("cannotChangeStatusInClosedSprint"));
          setDragState({ taskId: null, source: null });
          return;
        }

        // Tasks in FUTURE sprint (DRAFT) cannot change from TODO
        if (
          sprintMeta.status === "DRAFT" &&
          task.status === "TODO" &&
          columnId !== "TODO"
        ) {
          toast.error(t("cannotChangeStatusInFutureSprint"));
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
      t,
      toast,
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
        // Get ALL child tasks (from any sprint, not just current sprint)
        // This is required because ALL subtasks must be in TODO state to move story to backlog
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

        // Only send USER_STORY ID to backend - it will cascade to subtasks
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

  const handleRefresh = useCallback(() => {
    refetchBoard();
    refetchProjectTasks();
  }, [refetchBoard, refetchProjectTasks]);

  // =============================================================================
  // RENDER
  // =============================================================================

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !sprintBoard) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            Sprint not found
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            The sprint you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access.
          </p>
          <Link
            href="/dashboard/projects"
            className="btn-primary mt-4 inline-flex"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const isDragging = dragState.taskId !== null;
  const isDraggingFromSprint = dragState.source === "sprint";
  const dragOverBacklog = dragOverTarget?.type === "backlog";

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton fallbackHref="/dashboard/projects" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sprintMeta.name}
                </h1>
                <SprintStatusBadge
                  status={sprintMeta.status}
                  statusText={sprintMeta.statusText}
                />
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                )}
                {/* Sprint Navigation Arrows */}
                <div className="flex items-center gap-1 ml-2">
                  {prevSprintId ? (
                    <Link
                      href={`/dashboard/sprints/${prevSprintId}`}
                      className="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      title="Previous Sprint"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Link>
                  ) : (
                    <span className="p-1 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                      <ChevronLeft className="h-5 w-5" />
                    </span>
                  )}
                  {nextSprintId ? (
                    <Link
                      href={`/dashboard/sprints/${nextSprintId}`}
                      className="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      title="Next Sprint"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  ) : (
                    <span className="p-1 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                      <ChevronRight className="h-5 w-5" />
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {sprintMeta.project && (
                  <Link
                    href={`/dashboard/projects/${sprintMeta.project.id}`}
                    className="flex items-center gap-1 hover:text-primary-600"
                  >
                    <FolderKanban className="h-4 w-4" />
                    {sprintMeta.project.name}
                  </Link>
                )}
                {sprintMeta.startDate && sprintMeta.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDateTimeRange(
                      sprintMeta.startDate,
                      sprintMeta.endDate,
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="btn-secondary flex items-center gap-2"
              title="Refresh"
            >
              <Loader2
                className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setShowCreateTaskModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t("addTask")}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Backlog Panel */}
        <div
          className={`shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 transition-all duration-300 ${
            isBacklogOpen ? "w-80" : "w-12"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Backlog Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              {isBacklogOpen && (
                <>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {t("backlog")}
                  </h2>
                  <button
                    onClick={() => setShowCreateTaskModal(true)}
                    className="mr-2 rounded-sm p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                    title={t("addTask")}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsBacklogOpen(!isBacklogOpen)}
                className="rounded-sm p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {isBacklogOpen ? (
                  <ChevronLeft className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Backlog Content */}
            {isBacklogOpen && (
              <div
                className={`flex-1 overflow-y-auto p-4 ${
                  isDragging && isDraggingFromSprint && dragOverBacklog
                    ? "bg-primary-50 dark:bg-primary-900/30 ring-2 ring-inset ring-primary-300"
                    : isDragging && isDraggingFromSprint
                      ? "bg-primary-25 dark:bg-primary-900/20"
                      : ""
                }`}
                onDragOver={handleDragOverBacklog}
                onDragLeave={handleDragLeave}
                onDrop={handleDropOnBacklog}
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
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sprint Board */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="min-w-[800px]">
            {/* Column Headers */}
            <div className="mb-4 grid grid-cols-4 gap-4">
              {BOARD_COLUMNS.map((col) => (
                <div
                  key={col.id}
                  className={`rounded-lg px-4 py-2 text-center font-medium ${col.color} ${col.textColor}`}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Stories */}
            {stories.length === 0 ? (
              <EmptySprintState
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropOnColumn}
                dragOverTarget={dragOverTarget}
                isDragging={isDragging}
                isDraggingFromSprint={isDraggingFromSprint}
              />
            ) : (
              <div className="space-y-4">
                {/* Drop zone for backlog tasks when dragging from backlog */}
                {isDragging && !isDraggingFromSprint && (
                  <div className="grid grid-cols-4 gap-4">
                    {BOARD_COLUMNS.map((col) => (
                      <div
                        key={col.id}
                        className={`min-h-[60px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                          col.id === "TODO"
                            ? dragOverTarget?.type === "column" &&
                              dragOverTarget.storyId === -1 &&
                              dragOverTarget.columnId === "TODO"
                              ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
                              : "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
                            : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50"
                        }`}
                        onDragOver={(e) => {
                          if (col.id === "TODO") {
                            handleDragOver(e, -1, col.id);
                          }
                        }}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => {
                          if (col.id === "TODO") {
                            handleDropOnColumn(e, -1, col.id);
                          }
                        }}
                      >
                        <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                          {col.id === "TODO" ? t("dropHereToAdd") : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {stories.map((story) => (
                  <StoryRow
                    key={story.id}
                    story={story}
                    sprintId={sprintId}
                    expanded={!collapsedStories.has(story.id)}
                    onToggleExpand={toggleStoryExpand}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropOnColumn}
                    onCreateSubtask={setCreateSubtaskForStoryId}
                    dragOverTarget={dragOverTarget}
                    isDragging={isDragging}
                    isDraggingFromSprint={isDraggingFromSprint}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTaskModal && sprintMeta.project && (
        <CreateTaskModal
          projectId={sprintMeta.project.id}
          sprintId={sprintId}
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onSuccess={() => {
            setShowCreateTaskModal(false);
            refetchBoard();
            refetchProjectTasks();
          }}
        />
      )}

      {/* Create Subtask Modal */}
      {createSubtaskForStoryId && sprintMeta.project && (
        <CreateTaskModal
          projectId={sprintMeta.project.id}
          sprintId={sprintId}
          parentTaskId={createSubtaskForStoryId}
          isOpen={!!createSubtaskForStoryId}
          onClose={() => setCreateSubtaskForStoryId(null)}
          onSuccess={() => {
            setCreateSubtaskForStoryId(null);
            refetchBoard();
            refetchProjectTasks();
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// MEMOIZED COMPONENTS
// =============================================================================

const SprintStatusBadge = memo(function SprintStatusBadge({
  status,
  statusText,
}: {
  status: string;
  statusText: string;
}) {
  const getStatusStyle = () => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "FUTURE":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "ACTIVE":
        return <PlayCircle className="h-3 w-3" />;
      case "FUTURE":
        return <Clock className="h-3 w-3" />;
      case "CLOSED":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle()}`}
    >
      {getStatusIcon()}
      {statusText}
    </span>
  );
});

interface StoryRowProps {
  story: Story;
  sprintId: number;
  expanded: boolean;
  onToggleExpand: (storyId: number) => void;
  onDragStart: (e: React.DragEvent, task: Task, source: "sprint") => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  onDragLeave: () => void;
  onDrop: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  onCreateSubtask: (storyId: number) => void;
  dragOverTarget: DragOverTarget | null;
  isDragging: boolean;
  isDraggingFromSprint: boolean;
}

const StoryRow = memo(function StoryRow({
  story,
  sprintId,
  expanded,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCreateSubtask,
  dragOverTarget,
  isDragging,
  isDraggingFromSprint,
}: StoryRowProps) {
  const t = useTranslations("sprints");
  const [isDraggingThis, setIsDraggingThis] = useState(false);

  const tasksByColumn = useMemo(() => {
    const byColumn: Record<BoardColumnId, Task[]> = {
      TODO: [],
      INPROGRESS: [],
      VERIFY: [],
      DONE: [],
    };
    // Sort subtasks by id first for consistent ordering
    const sortedSubtasks = [...story.subtasks].sort((a, b) => a.id - b.id);
    for (const task of sortedSubtasks) {
      const status = task.status as BoardColumnId;
      if (byColumn[status]) {
        byColumn[status].push(task);
      }
    }
    return byColumn;
  }, [story.subtasks]);

  const totalPoints = story.subtasks.reduce(
    (sum, t) => sum + (t.estimationPoints || 0),
    0,
  );

  if (story.id === -1) {
    // Orphan tasks (no parent story)
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("unassignedTasks")}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4 p-4">
          {BOARD_COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              columnId={col.id}
              storyId={story.id}
              tasks={tasksByColumn[col.id]}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              isDropTarget={
                dragOverTarget?.type === "column" &&
                dragOverTarget.storyId === story.id &&
                dragOverTarget.columnId === col.id
              }
              isDragging={isDragging}
              isDraggingFromSprint={isDraggingFromSprint}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Story Header */}
      <div
        className="flex cursor-pointer items-center justify-between border-b border-gray-100 dark:border-gray-700 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => {
          // Only toggle if not dragging
          if (!isDraggingThis) {
            onToggleExpand(story.id);
          }
        }}
        draggable
        onDragStart={(e) => {
          setIsDraggingThis(true);
          onDragStart(
            e,
            {
              id: story.id,
              name: story.name,
              type: "USER_STORY",
              activeSprints: [{ id: sprintId }],
            } as Task,
            "sprint",
          );
        }}
        onDragEnd={(e) => {
          // Reset dragging state after a short delay to prevent click from firing
          setTimeout(() => setIsDraggingThis(false), 100);
          onDragEnd(e);
        }}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 cursor-grab text-gray-400" />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
          <Link
            href={`/dashboard/tasks/${story.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
          >
            {story.name}
          </Link>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({story.subtasks.length} {t("tasks")})
          </span>
          {/* Sprint badges showing which sprints have subtasks */}
          {story.allSubtaskSprints.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {story.allSubtaskSprints.map((sprint) => (
                <span
                  key={sprint.id}
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                    sprint.id === sprintId
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 ring-1 ring-primary-500"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                  title={sprint.name}
                >
                  {sprint.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {totalPoints > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {totalPoints} {t("points")}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubtask(story.id);
            }}
            className="rounded-sm p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
            title={t("addSubtask")}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Story Tasks */}
      {expanded && (
        <div className="grid grid-cols-4 gap-4 p-4">
          {BOARD_COLUMNS.map((col) => (
            <BoardColumn
              key={col.id}
              columnId={col.id}
              storyId={story.id}
              tasks={tasksByColumn[col.id]}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              isDropTarget={
                dragOverTarget?.type === "column" &&
                dragOverTarget.storyId === story.id &&
                dragOverTarget.columnId === col.id
              }
              isDragging={isDragging}
              isDraggingFromSprint={isDraggingFromSprint}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface BoardColumnProps {
  columnId: BoardColumnId;
  storyId: number;
  tasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task, source: "sprint") => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  onDragLeave: () => void;
  onDrop: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  isDropTarget: boolean;
  isDragging: boolean;
  isDraggingFromSprint: boolean;
}

const BoardColumn = memo(function BoardColumn({
  columnId,
  storyId,
  tasks,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDropTarget,
  isDragging,
  isDraggingFromSprint,
}: BoardColumnProps) {
  return (
    <div
      className={`min-h-[100px] rounded-lg border-2 border-dashed p-2 transition-colors ${
        isDropTarget
          ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
          : isDragging && !isDraggingFromSprint
            ? "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
            : "border-transparent bg-gray-50 dark:bg-gray-700/50"
      }`}
      onDragOver={(e) => onDragOver(e, storyId, columnId)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, storyId, columnId)}
    >
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
});

interface TaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task, source: "sprint") => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const TaskCard = memo(function TaskCard({
  task,
  onDragStart,
  onDragEnd,
}: TaskCardProps) {
  const getTypeColor = () => {
    switch (task.type) {
      case "TASK":
        return "bg-blue-500";
      case "BUG":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Link
      href={`/dashboard/tasks/${task.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task, "sprint")}
      onDragEnd={onDragEnd}
      className="block cursor-grab rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 shadow-xs transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${getTypeColor()}`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
            {task.name}
          </p>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {task.taskKey && <span>{task.taskKey}</span>}
            {task.estimationPoints !== undefined &&
              task.estimationPoints > 0 && (
                <span className="rounded-sm bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5">
                  {task.estimationPoints}p
                </span>
              )}
            {task.frozen && (
              <span title="Frozen">
                <Snowflake className="h-3 w-3 text-blue-400" />
              </span>
            )}
          </div>
        </div>
        {task.assignee && (
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: task.assignee.color || "#3b82f6" }}
            title={task.assignee.fullName || task.assignee.username}
          >
            {task.assignee.capitalLetters ||
              (task.assignee.fullName || task.assignee.username)
                .charAt(0)
                .toUpperCase()}
          </div>
        )}
      </div>
    </Link>
  );
});

interface BacklogTaskCardProps {
  task: Task;
  subtasks: Task[];
  onDragStart: (e: React.DragEvent, task: Task, source: "backlog") => void;
  onDragEnd: (e: React.DragEvent) => void;
}

const BacklogTaskCard = memo(function BacklogTaskCard({
  task,
  subtasks,
  onDragStart,
  onDragEnd,
}: BacklogTaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = task.type === "USER_STORY" && subtasks.length > 0;

  const getTypeIcon = () => {
    switch (task.type) {
      case "USER_STORY":
        return <FolderKanban className="h-4 w-4 text-purple-500" />;
      case "TASK":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "BUG":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSubtaskTypeIcon = (type: string) => {
    switch (type) {
      case "TASK":
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case "BUG":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-xs">
      <div
        draggable
        onDragStart={(e) => onDragStart(e, task, "backlog")}
        onDragEnd={onDragEnd}
        className="cursor-grab p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
      >
        <div className="flex items-start gap-2">
          {hasSubtasks && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="mt-0.5 rounded-sm p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3 text-gray-400" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )}
            </button>
          )}
          {getTypeIcon()}
          <div className="min-w-0 flex-1 overflow-hidden">
            <Link
              href={`/dashboard/tasks/${task.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
            >
              {task.name}
            </Link>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {task.taskKey && <span>{task.taskKey}</span>}
              {hasSubtasks && (
                <span className="text-gray-400 dark:text-gray-500">
                  ({subtasks.length})
                </span>
              )}
              {task.estimationPoints !== undefined &&
                task.estimationPoints > 0 && (
                  <span className="rounded-sm bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5">
                    {task.estimationPoints}p
                  </span>
                )}
            </div>
          </div>
          {task.assignee && (
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: task.assignee.color || "#3b82f6" }}
              title={task.assignee.fullName || task.assignee.username}
            >
              {task.assignee.capitalLetters ||
                (task.assignee.fullName || task.assignee.username)
                  .charAt(0)
                  .toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Subtasks (expanded) */}
      {hasSubtasks && expanded && (
        <div className="border-t border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2">
          <div className="space-y-1.5 pl-4">
            {subtasks.map((subtask) => (
              <Link
                key={subtask.id}
                href={`/dashboard/tasks/${subtask.id}`}
                className="flex items-center gap-2 rounded-sm p-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {getSubtaskTypeIcon(subtask.type)}
                <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
                  {subtask.name}
                </span>
                {subtask.estimationPoints !== undefined &&
                  subtask.estimationPoints > 0 && (
                    <span className="rounded-sm bg-gray-200 dark:bg-gray-600 px-1 py-0.5 text-gray-600 dark:text-gray-300">
                      {subtask.estimationPoints}p
                    </span>
                  )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

interface EmptySprintStateProps {
  onDragOver: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  onDragLeave: () => void;
  onDrop: (
    e: React.DragEvent,
    storyId: number,
    columnId: BoardColumnId,
  ) => void;
  dragOverTarget: DragOverTarget | null;
  isDragging: boolean;
  isDraggingFromSprint: boolean;
}

const EmptySprintState = memo(function EmptySprintState({
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverTarget,
  isDragging,
  isDraggingFromSprint,
}: EmptySprintStateProps) {
  const t = useTranslations("sprints");

  // Only show drop zone for TODO column when dragging from backlog
  const showDropZone = isDragging && !isDraggingFromSprint;

  return (
    <div className="rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8">
      {showDropZone ? (
        <div className="grid grid-cols-4 gap-4">
          {BOARD_COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`min-h-[150px] rounded-lg border-2 border-dashed p-4 transition-colors ${
                col.id === "TODO"
                  ? dragOverTarget?.type === "column" &&
                    dragOverTarget.storyId === -1 &&
                    dragOverTarget.columnId === "TODO"
                    ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30"
                    : "border-primary-200 bg-primary-25 dark:bg-primary-900/20"
                  : "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 opacity-50"
              }`}
              onDragOver={(e) => {
                if (col.id === "TODO") {
                  onDragOver(e, -1, col.id);
                }
              }}
              onDragLeave={onDragLeave}
              onDrop={(e) => {
                if (col.id === "TODO") {
                  onDrop(e, -1, col.id);
                }
              }}
            >
              <div className="flex h-full items-center justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                {col.id === "TODO" ? t("dropHereToAdd") : col.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {t("noTasksInSprint")}
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("dragTasksFromBacklog")}
          </p>
        </div>
      )}
    </div>
  );
});
