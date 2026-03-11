"use client";

import { CreateTaskModal } from "@/components/tasks";
import { useToast } from "@/components/ui/Toast";
import {
  projectsApi,
  sprintsApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { Task } from "@trackdev/types";
import { DragDropProvider } from "@dnd-kit/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSessionState } from "@/utils/useSessionState";
import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";

import {
  EmptySprintState,
  SprintHeader,
  StoryRow,
} from "./components";
import { BacklogPanelDndKit } from "./components/BacklogPanelDndKit";
import { TopDropZone } from "./components/TopDropZone";
import {
  BOARD_COLUMNS,
  COLLAPSED_STORIES_STORAGE_KEY,
} from "./types";
import { useDndKitDragDrop } from "./useDndKitDragDrop";
import { useSprintSSE } from "./useSprintSSE";
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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
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
  const [optimisticTasks, addOptimisticUpdate] = useOptimistic(
    tasks,
    tasksOptimisticReducer,
  );

  // UI state
  const [isBacklogOpen, setIsBacklogOpen] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useSessionState(`createTaskModal-sprint-${sprintId}`, false);
  const [createSubtaskForStoryId, setCreateSubtaskForStoryId] = useSessionState<
    number | null
  >(`createSubtaskModal-sprint-${sprintId}`, null);
  const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);
  const [collapsedStories, setCollapsedStories] = useState<Set<number>>(
    new Set(),
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const toast = useToast();

  // Real-time SSE updates
  useSprintSSE({
    sprintId,
    enabled: isAuthenticated && isInitialized && !isNaN(sprintId),
    setTasks,
    currentUserId: user?.id ?? null,
    toast,
    t,
  });

  // Drag and drop (@dnd-kit/react)
  const { activeDragData, providerProps } = useDndKitDragDrop({
    optimisticTasks,
    addOptimisticUpdate,
    setTasks,
    startTransition,
    sprintId,
    sprintMeta,
    t,
    projectId: sprintMeta.project?.id ?? null,
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

  const { data: projectSprints } = useQuery(
    () =>
      sprintBoard?.project?.id
        ? projectsApi.getSprints(sprintBoard.project.id)
        : Promise.resolve({ sprints: [], projectId: 0 }),
    [sprintBoard?.project?.id],
    { enabled: isAuthenticated && !!sprintBoard?.project?.id },
  );

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
        currentIndex < sprints.length - 1
          ? sprints[currentIndex + 1].id
          : null,
    };
  }, [projectSprints, sprintId]);


  useEffect(() => {
    if (sprintBoard && projectTasks) {
      const mergedTasks = mergeTasksFromServer(
        sprintBoard,
        projectTasks.tasks,
      );
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
        try {
          const stored = localStorage.getItem(
            COLLAPSED_STORIES_STORAGE_KEY(sprintId),
          );
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

  // Derived state
  const sprintTasks = useMemo(
    () => selectSprintTasks(optimisticTasks, sprintId),
    [optimisticTasks, sprintId],
  );
  const backlogTasks = useMemo(
    () => selectBacklogTasks(optimisticTasks),
    [optimisticTasks],
  );
  const backlogSubtasksMap = useMemo(() => {
    const map = new Map<number, Task[]>();
    const subtasksInBacklog = Array.from(optimisticTasks.values()).filter(
      (task) =>
        (!task.activeSprints || task.activeSprints.length === 0) &&
        task.parentTaskId &&
        (task.type === "TASK" || task.type === "BUG"),
    );
    for (const subtask of subtasksInBacklog) {
      const parentId = subtask.parentTaskId!;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId)!.push(subtask);
    }
    return map;
  }, [optimisticTasks]);
  const allStories = useMemo(
    () => selectStories(sprintTasks, optimisticTasks, sprintId),
    [sprintTasks, optimisticTasks, sprintId],
  );

  // Filter stories to only show those with subtasks assigned to current user,
  // or user stories assigned to me with no subtasks
  const stories = useMemo(() => {
    if (!showMyTasksOnly || !user) return allStories;
    return allStories
      .map((story) => ({
        ...story,
        subtasks: story.subtasks.filter(
          (task) => task.assignee?.id === user.id,
        ),
      }))
      .filter((story) => {
        if (story.subtasks.length > 0) return true;
        // Keep user stories assigned to me with no subtasks
        // (id > 0 excludes the "Unassigned Tasks" pseudo-story)
        if (story.id > 0) {
          const storyTask = optimisticTasks.get(story.id);
          return storyTask?.assignee?.id === user.id;
        }
        return false;
      });
  }, [allStories, showMyTasksOnly, user, optimisticTasks]);

  // Drag state for visual feedback
  const draggedTaskId = activeDragData?.task.id ?? null;
  const dragSource = activeDragData?.source ?? null;
  const isDragging = activeDragData != null;
  const isDraggingFromBacklog = isDragging && dragSource === "backlog";
  const isDraggingFromSprint = isDragging && dragSource === "sprint";

  const isLoading = authLoading || boardLoading || !isInitialized;

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const toggleStoryExpand = useCallback(
    (storyId: number) => {
      setCollapsedStories((prev) => {
        const next = new Set(prev);
        if (next.has(storyId)) {
          next.delete(storyId);
        } else {
          next.add(storyId);
        }
        try {
          localStorage.setItem(
            COLLAPSED_STORIES_STORAGE_KEY(sprintId),
            JSON.stringify(Array.from(next)),
          );
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
    <div className="flex h-screen flex-col">
      <SprintHeader
        sprintMeta={sprintMeta}
        isPending={isPending}
        prevSprintId={prevSprintId}
        nextSprintId={nextSprintId}
        onRefresh={handleRefresh}
        onAddTask={() => setShowCreateTaskModal(true)}
        showMyTasksOnly={showMyTasksOnly}
        onToggleMyTasks={() => setShowMyTasksOnly((prev) => !prev)}
      />

      {/* Main content — wrapped in DragDropProvider */}
      <DragDropProvider {...providerProps}>
        <div className="flex flex-1 overflow-hidden">
          <BacklogPanelDndKit
            isOpen={isBacklogOpen}
            onToggleOpen={() => setIsBacklogOpen(!isBacklogOpen)}
            onAddTask={() => setShowCreateTaskModal(true)}
            backlogTasks={backlogTasks}
            backlogSubtasksMap={backlogSubtasksMap}
            isDraggingFromSprint={isDraggingFromSprint}
            draggedTaskId={draggedTaskId}
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
                <EmptySprintState isDraggingFromBacklog={isDraggingFromBacklog} />
              ) : (
                <div className="space-y-4">
                  {/* Drop zone for backlog tasks when dragging from backlog */}
                  {isDraggingFromBacklog && (
                    <TopDropZone />
                  )}
                  {stories.map((story) => (
                    <StoryRow
                      key={story.id}
                      story={story}
                      sprintId={sprintId}
                      expanded={!collapsedStories.has(story.id)}
                      onToggleExpand={toggleStoryExpand}
                      onCreateSubtask={setCreateSubtaskForStoryId}
                      sprintStatus={sprintMeta.status}
                      draggedTaskId={draggedTaskId}
                      dragSource={dragSource}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DragDropProvider>

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
