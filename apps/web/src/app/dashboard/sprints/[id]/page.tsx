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
  useMutation,
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
  Loader2,
  PlayCircle,
  Plus,
  Snowflake,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";

// Task status columns for the board
const BOARD_COLUMNS = [
  {
    id: "TODO",
    label: "To Do",
    color: "bg-gray-100",
    textColor: "text-gray-700",
  },
  {
    id: "INPROGRESS",
    label: "In Progress",
    color: "bg-blue-100",
    textColor: "text-blue-700",
  },
  {
    id: "VERIFY",
    label: "Verify",
    color: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  {
    id: "DONE",
    label: "Done",
    color: "bg-green-100",
    textColor: "text-green-700",
  },
] as const;

type BoardColumnId = (typeof BOARD_COLUMNS)[number]["id"];

interface Story {
  id: number;
  name: string;
  estimationPoints: number;
  subtasks: Task[];
}

export default function SprintBoardPage() {
  const params = useParams();
  const sprintId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("sprints");
  const toast = useToast();
  const { formatDateTimeRange } = useDateFormat();

  // Backlog panel state
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [createSubtaskForStoryId, setCreateSubtaskForStoryId] = useState<
    number | null
  >(null);
  const [draggedBacklogTask, setDraggedBacklogTask] = useState<Task | null>(
    null,
  );

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<{
    storyId: number;
    columnId: BoardColumnId;
  } | null>(null);

  // Local optimistic state for tasks (to update UI immediately on drop)
  const [localTaskUpdates, setLocalTaskUpdates] = useState<
    Map<number, TaskStatus>
  >(new Map());

  const {
    data: sprintBoard,
    isLoading: dataLoading,
    error,
    refetch: refetchBoard,
  } = useQuery(() => sprintsApi.getBoard(sprintId), [sprintId], {
    enabled: isAuthenticated && !isNaN(sprintId),
  });

  // Fetch project tasks to find backlog items (tasks without sprints)
  const { data: projectTasks, refetch: refetchProjectTasks } = useQuery(
    () =>
      sprintBoard?.project?.id
        ? projectsApi.getTasks(sprintBoard.project.id)
        : Promise.resolve({ tasks: [], projectId: 0 }),
    [sprintBoard?.project?.id],
    {
      enabled: isAuthenticated && !!sprintBoard?.project?.id,
    },
  );

  // Filter backlog tasks: show only USER_STORYs and standalone TASK/BUG (no parent)
  // Subtasks are shown nested under their parent USER_STORY
  const backlogTasks = useMemo(() => {
    if (!projectTasks?.tasks) return [];
    const allBacklogTasks = projectTasks.tasks.filter(
      (task) => !task.activeSprints || task.activeSprints.length === 0,
    );
    // Show USER_STORYs and standalone TASK/BUG (no parent)
    return allBacklogTasks.filter(
      (task) => task.type === "USER_STORY" || !task.parentTaskId,
    );
  }, [projectTasks?.tasks]);

  // State for expanded USER_STORYs in backlog
  const [expandedStories, setExpandedStories] = useState<Set<number>>(
    new Set(),
  );

  const toggleStoryExpand = useCallback((storyId: number) => {
    setExpandedStories((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  }, []);

  // Mutation for assigning task to sprint
  const assignToSprintMutation = useMutation(
    ({ taskId, sprintId }: { taskId: number; sprintId: number }) =>
      tasksApi.update(taskId, { sprintId }),
    {
      onSuccess: () => {
        // Refetch both the board and project tasks
        refetchBoard();
        refetchProjectTasks();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add task to sprint");
      },
    },
  );

  // Mutation for updating task status
  const updateTaskMutation = useMutation(
    ({
      taskId,
      status,
      previousStatus: _previousStatus, // Store for error recovery (unused in main function)
    }: {
      taskId: number;
      status: TaskStatus;
      previousStatus: TaskStatus;
    }) => tasksApi.update(taskId, { status }),
    {
      onSuccess: () => {
        // Keep the optimistic update in place - it shows the correct status
        // The localTaskUpdates will persist until the next full refetch of the board
        // This avoids the flash back to old status since sprintBoard.tasks is stale
      },
      onError: (error, variables) => {
        // Revert to the actual previous status (before the failed drag)
        setLocalTaskUpdates((prev) => {
          const next = new Map(prev);
          next.set(variables.taskId, variables.previousStatus);
          return next;
        });
        // Show error toast
        toast.error(error.message || "Failed to update task status");
      },
    },
  );

  // Show loading while auth is loading or data is loading
  const isLoading = authLoading || dataLoading;

  // Organize tasks into stories with subtasks
  const stories = useMemo(() => {
    if (!sprintBoard?.tasks) return [];

    const storyMap = new Map<number, Story>();
    const orphanTasks: Task[] = [];

    // First pass: identify USER_STORY tasks (these are the swim lanes)
    for (const task of sprintBoard.tasks) {
      if (task.type === "USER_STORY") {
        // This is a user story - it becomes a swim lane
        storyMap.set(task.id, {
          id: task.id,
          name: task.name,
          estimationPoints: task.estimationPoints || 0,
          subtasks: [],
        });
      }
    }

    // Second pass: assign subtasks (type TASK or BUG) to their parent stories
    for (const task of sprintBoard.tasks) {
      if ((task.type === "TASK" || task.type === "BUG") && task.parentTaskId) {
        const parentStory = storyMap.get(task.parentTaskId);
        if (parentStory) {
          parentStory.subtasks.push(task);
        } else {
          // Parent not in this sprint, treat as orphan
          orphanTasks.push(task);
        }
      } else if (
        (task.type === "TASK" || task.type === "BUG") &&
        !task.parentTaskId
      ) {
        // TASK or BUG without a parent - orphan
        orphanTasks.push(task);
      }
    }

    // If there are orphan tasks, create a special story for them
    if (orphanTasks.length > 0) {
      storyMap.set(-1, {
        id: -1,
        name: "Unassigned Tasks",
        estimationPoints: 0,
        subtasks: orphanTasks,
      });
    }

    // Return all stories (including those with no subtasks - they'll show empty lanes)
    return Array.from(storyMap.values());
  }, [sprintBoard?.tasks]);

  // Get tasks for a specific column and story, applying local optimistic updates
  const getTasksForColumn = useCallback(
    (story: Story, columnId: BoardColumnId): Task[] => {
      return story.subtasks.filter((task) => {
        // Use local update if available, otherwise use server state
        const effectiveStatus = localTaskUpdates.get(task.id) || task.status;
        return effectiveStatus === columnId;
      });
    },
    [localTaskUpdates],
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id.toString());
    // Add a slight delay to set the drag image
    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, storyId: number, columnId: BoardColumnId) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverColumn({ storyId, columnId });
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, _storyId: number, columnId: BoardColumnId) => {
      e.preventDefault();
      setDragOverColumn(null);

      if (!draggedTask) return;

      // Don't do anything if dropping in the same column
      const currentStatus =
        localTaskUpdates.get(draggedTask.id) || draggedTask.status;
      if (currentStatus === columnId) {
        setDraggedTask(null);
        return;
      }

      // Store the previous status before optimistic update
      const previousStatus = currentStatus;

      // Optimistically update the UI
      setLocalTaskUpdates((prev) => {
        const next = new Map(prev);
        next.set(draggedTask.id, columnId);
        return next;
      });

      // Call the API to update the task status, passing previousStatus for error recovery
      updateTaskMutation.mutate({
        taskId: draggedTask.id,
        status: columnId,
        previousStatus,
      });

      setDraggedTask(null);
    },
    [draggedTask, localTaskUpdates, updateTaskMutation],
  );

  // Backlog drag handlers
  const handleBacklogDragStart = useCallback(
    (e: React.DragEvent, task: Task) => {
      setDraggedBacklogTask(task);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id.toString());
      const target = e.target as HTMLElement;
      target.style.opacity = "0.5";
    },
    [],
  );

  const handleBacklogDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedBacklogTask(null);
    setDragOverColumn(null);
  }, []);

  const handleDropFromBacklog = useCallback(
    (e: React.DragEvent, _storyId: number, columnId: BoardColumnId) => {
      e.preventDefault();
      setDragOverColumn(null);

      if (!draggedBacklogTask) return;

      // Validation 1: Backlog tasks can only be moved to TODO column
      if (columnId !== "TODO") {
        toast.error(t("backlogTaskMustGoToTodo"));
        setDraggedBacklogTask(null);
        return;
      }

      // Validation 2: Sprint must be active or have future dates
      if (sprintBoard) {
        const isActive = sprintBoard.status === "ACTIVE";
        const endDate = sprintBoard.endDate
          ? new Date(sprintBoard.endDate)
          : null;
        const now = new Date();
        const isFuture = endDate && endDate >= now;

        if (!isActive && !isFuture) {
          toast.error(t("cannotAddToClosedSprint"));
          setDraggedBacklogTask(null);
          return;
        }
      }

      // Assign task to sprint
      assignToSprintMutation.mutate({
        taskId: draggedBacklogTask.id,
        sprintId: sprintId,
      });

      // Update status to TODO if not already
      if (draggedBacklogTask.status !== "TODO") {
        updateTaskMutation.mutate({
          taskId: draggedBacklogTask.id,
          status: "TODO",
          previousStatus: draggedBacklogTask.status,
        });
      }

      setDraggedBacklogTask(null);
    },
    [
      draggedBacklogTask,
      sprintId,
      sprintBoard,
      assignToSprintMutation,
      updateTaskMutation,
      t,
    ],
  );

  // Combined drop handler that handles both sprint tasks and backlog tasks
  const handleCombinedDrop = useCallback(
    (e: React.DragEvent, storyId: number, columnId: BoardColumnId) => {
      if (draggedBacklogTask) {
        handleDropFromBacklog(e, storyId, columnId);
      } else {
        handleDrop(e, storyId, columnId);
      }
    },
    [draggedBacklogTask, handleDropFromBacklog, handleDrop],
  );

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
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            Sprint not found
          </h3>
          <p className="mt-2 text-gray-500">
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

  return (
    <div className="flex h-full flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        <BackButton
          fallbackHref={`/dashboard/projects/${sprintBoard.project?.id}`}
          label="Back"
          className="mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                sprintBoard.status === "ACTIVE"
                  ? "bg-green-100"
                  : sprintBoard.status === "CLOSED"
                    ? "bg-gray-100"
                    : "bg-yellow-100"
              }`}
            >
              {sprintBoard.status === "ACTIVE" ? (
                <PlayCircle className="h-6 w-6 text-green-600" />
              ) : sprintBoard.status === "CLOSED" ? (
                <CheckCircle2 className="h-6 w-6 text-gray-600" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {sprintBoard.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {sprintBoard.project && (
                  <Link
                    href={`/dashboard/projects/${sprintBoard.project.id}`}
                    className="flex items-center gap-1 hover:text-primary-600 transition-colors"
                  >
                    <FolderKanban className="h-4 w-4" />
                    {sprintBoard.project.name}
                  </Link>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {sprintBoard.startDate && sprintBoard.endDate
                    ? formatDateTimeRange(
                        sprintBoard.startDate,
                        sprintBoard.endDate,
                      )
                    : "No dates set"}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    sprintBoard.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : sprintBoard.status === "CLOSED"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {sprintBoard.statusText || sprintBoard.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Board with Backlog Panel */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Collapsible Backlog Panel */}
        <div
          className={`flex-shrink-0 transition-all duration-300 ${
            isBacklogOpen ? "w-72" : "w-10"
          }`}
        >
          <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
            {/* Backlog Header */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2">
              {isBacklogOpen && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {t("backlog")}
                  </span>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {backlogTasks.length}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                {isBacklogOpen && (
                  <button
                    onClick={() => setShowCreateTaskModal(true)}
                    className="rounded p-1 text-primary-600 hover:bg-primary-50 hover:text-primary-700"
                    title={t("createTask")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsBacklogOpen(!isBacklogOpen)}
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                  title={
                    isBacklogOpen ? t("collapseBacklog") : t("expandBacklog")
                  }
                >
                  {isBacklogOpen ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Backlog Tasks */}
            {isBacklogOpen && (
              <div className="flex-1 overflow-auto p-2">
                {backlogTasks.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {t("noBacklogTasks")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {backlogTasks.map((task) => (
                      <BacklogStoryCard
                        key={task.id}
                        task={task}
                        isExpanded={expandedStories.has(task.id)}
                        onToggleExpand={() => toggleStoryExpand(task.id)}
                        onDragStart={handleBacklogDragStart}
                        onDragEnd={handleBacklogDragEnd}
                        isDragging={draggedBacklogTask?.id === task.id}
                        draggedTaskId={draggedBacklogTask?.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sprint Board */}
        <div className="flex-1 overflow-auto">
          {/* Column Headers */}
          <div className="sticky top-0 z-10 mb-2 grid grid-cols-4 gap-2 bg-gray-50 pb-2">
            {BOARD_COLUMNS.map((column) => (
              <div
                key={column.id}
                className={`rounded-lg ${column.color} px-3 py-2 text-center text-sm font-semibold ${column.textColor}`}
              >
                {column.label}
              </div>
            ))}
          </div>

          {/* Swim Lanes */}
          {stories.length === 0 ? (
            <div className="card px-6 py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No tasks in this sprint
              </h3>
              <p className="mt-2 text-gray-500">{t("dragFromBacklog")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="rounded-lg border border-gray-200 bg-white overflow-hidden"
                >
                  {/* Story Header - spans full width */}
                  {story.id !== -1 ? (
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                      <Link
                        href={`/dashboard/tasks/${story.id}?from=sprint&sprintId=${sprintId}`}
                        className="flex items-center gap-2 hover:text-primary-600 transition-colors flex-1"
                      >
                        <p className="text-sm font-semibold text-gray-900 hover:text-primary-600">
                          {story.name}
                        </p>
                        {story.estimationPoints > 0 && (
                          <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {story.estimationPoints} pts
                          </span>
                        )}
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateSubtaskForStoryId(story.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        {t("addTask")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {story.name}
                      </p>
                    </div>
                  )}

                  {/* Task Columns */}
                  <div className="grid grid-cols-4 gap-2 p-2">
                    {BOARD_COLUMNS.map((column) => {
                      const tasks = getTasksForColumn(story, column.id);
                      const isDropTarget =
                        dragOverColumn?.storyId === story.id &&
                        dragOverColumn?.columnId === column.id;
                      return (
                        <div
                          key={column.id}
                          className={`min-h-[80px] rounded-lg border-2 border-dashed p-2 transition-colors ${
                            isDropTarget
                              ? "border-primary-400 bg-primary-50"
                              : "border-gray-200 bg-gray-50/50"
                          }`}
                          onDragOver={(e) =>
                            handleDragOver(e, story.id, column.id)
                          }
                          onDragLeave={handleDragLeave}
                          onDrop={(e) =>
                            handleCombinedDrop(e, story.id, column.id)
                          }
                        >
                          <div className="flex flex-col gap-2">
                            {tasks.map((task) => (
                              <TaskCard
                                key={task.id}
                                task={task}
                                sprintId={sprintId}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                isDragging={draggedTask?.id === task.id}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal (for backlog) */}
      {sprintBoard?.project?.id && (
        <CreateTaskModal
          projectId={sprintBoard.project.id}
          isOpen={showCreateTaskModal}
          onClose={() => setShowCreateTaskModal(false)}
          onSuccess={() => {
            refetchBoard();
            refetchProjectTasks();
          }}
        />
      )}

      {/* Create Subtask Modal (for adding subtasks to stories) */}
      {sprintBoard?.project?.id && createSubtaskForStoryId && (
        <CreateTaskModal
          projectId={sprintBoard.project.id}
          parentTaskId={createSubtaskForStoryId}
          sprintId={sprintId}
          isOpen={!!createSubtaskForStoryId}
          onClose={() => setCreateSubtaskForStoryId(null)}
          onSuccess={() => {
            refetchBoard();
            refetchProjectTasks();
          }}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  sprintId: number;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
}

const TaskCard = memo(function TaskCard({
  task,
  sprintId,
  onDragStart,
  onDragEnd,
  isDragging,
}: TaskCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if we just finished dragging
    if (isDragging) {
      e.preventDefault();
    }
  };

  return (
    <Link
      href={`/dashboard/tasks/${task.id}?from=sprint&sprintId=${sprintId}`}
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`block rounded-lg border p-2 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
        isDragging
          ? "opacity-50 ring-2 ring-primary-400"
          : task.frozen
            ? "border-gray-300 bg-gray-100 opacity-60 grayscale hover:border-gray-400"
            : "border-gray-200 bg-white hover:border-primary-300"
      }`}
    >
      {task.taskKey && (
        <span
          className={`text-[10px] font-mono mb-0.5 block ${
            task.frozen ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {task.taskKey}
        </span>
      )}
      <div className="flex items-start gap-1.5">
        <p
          className={`text-sm font-medium line-clamp-2 flex-1 ${
            task.frozen ? "text-gray-600" : "text-gray-900"
          }`}
        >
          {task.name}
        </p>
        {task.frozen && (
          <span title="Frozen">
            <Snowflake className="h-3.5 w-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {task.assignee ? (
          <div className="flex items-center gap-1">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: task.assignee.color || "#6b7280" }}
              title={task.assignee.fullName || task.assignee.username}
            >
              {task.assignee.capitalLetters ||
                task.assignee.fullName?.slice(0, 2).toUpperCase() ||
                task.assignee.username?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
            <User className="h-3 w-3 text-gray-400" />
          </div>
        )}
        {task.estimationPoints !== undefined && task.estimationPoints > 0 && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {task.estimationPoints}
          </span>
        )}
      </div>
    </Link>
  );
});

// Backlog Task Card Component
interface BacklogTaskCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
}

const BacklogTaskCard = memo(function BacklogTaskCard({
  task,
  onDragStart,
  onDragEnd,
  isDragging,
}: BacklogTaskCardProps) {
  const getTypeIcon = () => {
    switch (task.type) {
      case "USER_STORY":
        return <FolderKanban className="h-3 w-3 text-purple-500" />;
      case "BUG":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if we just finished dragging
    if (isDragging) {
      e.preventDefault();
    }
  };

  return (
    <Link
      href={`/dashboard/tasks/${task.id}?from=backlog`}
      onClick={handleClick}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={`block rounded-lg border p-2 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
        isDragging
          ? "opacity-50 ring-2 ring-primary-400"
          : "border-gray-200 bg-white hover:border-primary-300"
      }`}
    >
      {task.taskKey && (
        <div className="flex items-center gap-1 mb-1">
          {getTypeIcon()}
          <span className="text-[10px] font-mono text-gray-400">
            {task.taskKey}
          </span>
        </div>
      )}
      <p className="text-sm font-medium line-clamp-2 text-gray-900">
        {task.name}
      </p>
      <div className="mt-2 flex items-center justify-between">
        {task.assignee ? (
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: task.assignee.color || "#6b7280" }}
            title={task.assignee.fullName || task.assignee.username}
          >
            {task.assignee.capitalLetters ||
              task.assignee.fullName?.slice(0, 2).toUpperCase() ||
              task.assignee.username?.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
            <User className="h-3 w-3 text-gray-400" />
          </div>
        )}
        {task.estimationPoints !== undefined && task.estimationPoints > 0 && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
            {task.estimationPoints}
          </span>
        )}
      </div>
    </Link>
  );
});

// Backlog Story Card Component - Shows USER_STORY with collapsible subtasks
interface BacklogStoryCardProps {
  task: Task;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
  draggedTaskId?: number;
}

const BacklogStoryCard = memo(function BacklogStoryCard({
  task,
  isExpanded,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  isDragging,
  draggedTaskId,
}: BacklogStoryCardProps) {
  const hasSubtasks = task.childTasks && task.childTasks.length > 0;
  const isUserStory = task.type === "USER_STORY";

  const getTypeIcon = () => {
    switch (task.type) {
      case "USER_STORY":
        return <FolderKanban className="h-3 w-3 text-purple-500" />;
      case "BUG":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
    }
  };

  const getSubtaskTypeIcon = (type: string) => {
    switch (type) {
      case "BUG":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleExpand();
  };

  return (
    <div className="flex flex-col">
      {/* Main Story/Task Card */}
      <div className="flex items-stretch">
        {/* Expand/Collapse Button for USER_STORYs with subtasks */}
        {isUserStory && hasSubtasks ? (
          <button
            onClick={handleExpandClick}
            className="flex items-center justify-center w-6 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-500" />
            )}
          </button>
        ) : null}

        {/* Task Card */}
        <Link
          href={`/dashboard/tasks/${task.id}?from=backlog`}
          onClick={handleClick}
          draggable
          onDragStart={(e) => onDragStart(e, task)}
          onDragEnd={onDragEnd}
          className={`flex-1 block p-2 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
            isDragging
              ? "opacity-50 ring-2 ring-primary-400"
              : "border-gray-200 bg-white hover:border-primary-300"
          } ${
            isUserStory && hasSubtasks
              ? "rounded-r-lg border border-l-0"
              : "rounded-lg border"
          }`}
        >
          {task.taskKey && (
            <div className="flex items-center gap-1 mb-1">
              {getTypeIcon()}
              <span className="text-[10px] font-mono text-gray-400">
                {task.taskKey}
              </span>
              {isUserStory && hasSubtasks && (
                <span className="ml-1 text-[10px] text-gray-400">
                  ({task.childTasks!.length})
                </span>
              )}
            </div>
          )}
          <p className="text-sm font-medium line-clamp-2 text-gray-900">
            {task.name}
          </p>
          <div className="mt-2 flex items-center justify-between">
            {task.assignee ? (
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: task.assignee.color || "#6b7280" }}
                title={task.assignee.fullName || task.assignee.username}
              >
                {task.assignee.capitalLetters ||
                  task.assignee.fullName?.slice(0, 2).toUpperCase() ||
                  task.assignee.username?.slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200">
                <User className="h-3 w-3 text-gray-400" />
              </div>
            )}
            {task.estimationPoints !== undefined &&
              task.estimationPoints > 0 && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                  {task.estimationPoints}
                </span>
              )}
          </div>
        </Link>
      </div>

      {/* Subtasks (expanded) */}
      {isUserStory && hasSubtasks && isExpanded && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-purple-200 pl-2">
          {task.childTasks!.map((subtask) => (
            <Link
              key={subtask.id}
              href={`/dashboard/tasks/${subtask.id}?from=backlog`}
              draggable
              onDragStart={(e) => onDragStart(e, subtask)}
              onDragEnd={onDragEnd}
              className={`block rounded-lg border p-2 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
                draggedTaskId === subtask.id
                  ? "opacity-50 ring-2 ring-primary-400"
                  : "border-gray-200 bg-white hover:border-primary-300"
              }`}
            >
              {subtask.taskKey && (
                <div className="flex items-center gap-1 mb-1">
                  {getSubtaskTypeIcon(subtask.type)}
                  <span className="text-[10px] font-mono text-gray-400">
                    {subtask.taskKey}
                  </span>
                </div>
              )}
              <p className="text-xs font-medium line-clamp-2 text-gray-900">
                {subtask.name}
              </p>
              <div className="mt-1 flex items-center justify-between">
                {subtask.assignee ? (
                  <div
                    className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-medium text-white"
                    style={{
                      backgroundColor: subtask.assignee.color || "#6b7280",
                    }}
                    title={
                      subtask.assignee.fullName || subtask.assignee.username
                    }
                  >
                    {subtask.assignee.capitalLetters ||
                      subtask.assignee.fullName?.slice(0, 2).toUpperCase() ||
                      subtask.assignee.username?.slice(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-2 w-2 text-gray-400" />
                  </div>
                )}
                {subtask.estimationPoints !== undefined &&
                  subtask.estimationPoints > 0 && (
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] font-medium text-gray-600">
                      {subtask.estimationPoints}
                    </span>
                  )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
