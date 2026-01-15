"use client";

import { BackButton } from "@/components/BackButton";
import {
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
  Clock,
  FolderKanban,
  Loader2,
  PlayCircle,
  User,
} from "lucide-react";
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
  } = useQuery(() => sprintsApi.getBoard(sprintId), [sprintId], {
    enabled: isAuthenticated && !isNaN(sprintId),
  });

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
        // Set error message to display
        setUpdateError(error.message || "Failed to update task status");
        // Clear error after 5 seconds
        setTimeout(() => setUpdateError(null), 5000);
      },
    }
  );

  // Error state for task updates
  const [updateError, setUpdateError] = useState<string | null>(null);

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

    // Second pass: assign subtasks (type TASK) to their parent stories
    for (const task of sprintBoard.tasks) {
      if (task.type === "TASK" && task.parentTaskId) {
        const parentStory = storyMap.get(task.parentTaskId);
        if (parentStory) {
          parentStory.subtasks.push(task);
        } else {
          // Parent not in this sprint, treat as orphan
          orphanTasks.push(task);
        }
      } else if (task.type === "TASK" && !task.parentTaskId) {
        // TASK without a parent - orphan
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
    [localTaskUpdates]
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
    []
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
    [draggedTask, localTaskUpdates, updateTaskMutation]
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
      {/* Error Toast */}
      {updateError && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 shadow-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{updateError}</span>
          <button
            onClick={() => setUpdateError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

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
                    ? `${new Date(
                        sprintBoard.startDate
                      ).toLocaleDateString()} - ${new Date(
                        sprintBoard.endDate
                      ).toLocaleDateString()}`
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

      {/* Board */}
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
            <p className="mt-2 text-gray-500">
              Add tasks to this sprint to see them on the board.
            </p>
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
                  <Link
                    href={`/dashboard/tasks/${story.id}?from=sprint&sprintId=${sprintId}`}
                    className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {story.name}
                    </p>
                    {story.estimationPoints > 0 && (
                      <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {story.estimationPoints} pts
                      </span>
                    )}
                  </Link>
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
                        onDrop={(e) => handleDrop(e, story.id, column.id)}
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
      className={`block rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-all hover:shadow-md hover:border-primary-300 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 ring-2 ring-primary-400" : ""
      }`}
    >
      {task.taskKey && (
        <span className="text-[10px] font-mono text-gray-400 mb-0.5 block">
          {task.taskKey}
        </span>
      )}
      <p className="text-sm font-medium text-gray-900 line-clamp-2">
        {task.name}
      </p>
      <div className="mt-2 flex items-center justify-between">
        {task.assignee ? (
          <div className="flex items-center gap-1">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: task.assignee.color || "#6b7280" }}
              title={task.assignee.username}
            >
              {task.assignee.capitalLetters ||
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
