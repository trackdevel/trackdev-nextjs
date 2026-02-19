"use client";

import { CreateTaskModal } from "@/components/tasks";
import {
  projectsApi,
  sprintsApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { Task } from "@trackdev/types";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";

import {
  BacklogPanel,
  EmptySprintState,
  SprintHeader,
  StoryRow,
} from "./components";
import {
  BOARD_COLUMNS,
  COLLAPSED_STORIES_STORAGE_KEY,
} from "./types";
import { useDragAndDrop } from "./useDragAndDrop";
import {
  mergeTasksFromServer,
  selectBacklogTasks,
  selectSprintTasks,
  selectStories,
  tasksOptimisticReducer,
} from "./utils";

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SprintBoardPage() {
  const params = useParams();
  const sprintId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("sprints");

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

  // Drag and drop
  const {
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
  } = useDragAndDrop({
    optimisticTasks,
    addOptimisticUpdate,
    setTasks,
    startTransition,
    sprintId,
    sprintMeta,
    t,
  });

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
        try {
          const stored = localStorage.getItem(COLLAPSED_STORIES_STORAGE_KEY(sprintId));
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
        try {
          localStorage.setItem(COLLAPSED_STORIES_STORAGE_KEY(sprintId), JSON.stringify(Array.from(next)));
        } catch {
          // Ignore localStorage errors
        }
        return next;
      });
    },
    [sprintId],
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

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      <SprintHeader
        sprintMeta={sprintMeta}
        isPending={isPending}
        prevSprintId={prevSprintId}
        nextSprintId={nextSprintId}
        onRefresh={handleRefresh}
        onAddTask={() => setShowCreateTaskModal(true)}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        <BacklogPanel
          isOpen={isBacklogOpen}
          onToggleOpen={() => setIsBacklogOpen(!isBacklogOpen)}
          onAddTask={() => setShowCreateTaskModal(true)}
          backlogTasks={backlogTasks}
          backlogSubtasksMap={backlogSubtasksMap}
          isDragging={isDragging}
          isDraggingFromSprint={isDraggingFromSprint}
          dragOverBacklog={dragOverBacklog}
          onDragOverBacklog={handleDragOverBacklog}
          onDragLeave={handleDragLeave}
          onDropOnBacklog={handleDropOnBacklog}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />

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
                    sprintStatus={sprintMeta.status}
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
