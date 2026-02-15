"use client";

import { BackButton } from "@/components/BackButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  projectsApi,
  tasksApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { TaskDetail, TaskStatus, TaskType } from "@trackdev/types";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import {
  TaskAttributes,
  TaskChildren,
  TaskDescription,
  TaskDiscussion,
  TaskHeader,
  TaskHistory,
  TaskPointsReview,
  TaskPullRequests,
  TaskSidebar,
} from "./components";
import type { EditField, EditState, TaskWithProject } from "./types";

// =============================================================================
// OPTIMISTIC UPDATE TYPES
// =============================================================================

type TaskOptimisticAction =
  | { type: "updateField"; field: string; value: unknown }
  | { type: "updateTask"; task: Partial<TaskDetail> };

// =============================================================================
// OPTIMISTIC REDUCER
// =============================================================================

function taskOptimisticReducer(
  task: TaskDetail,
  action: TaskOptimisticAction,
): TaskDetail {
  switch (action.type) {
    case "updateField":
      return { ...task, [action.field]: action.value };
    case "updateTask":
      return { ...task, ...action.task };
    default:
      return task;
  }
}

// =============================================================================
// INITIAL EDIT STATE
// =============================================================================

const initialEditState: EditState = {
  field: null,
  name: "",
  description: "",
  estimation: "",
  status: "BACKLOG",
  taskType: "TASK",
  sprintId: null,
  isSaving: false,
  error: null,
  taskOverride: null,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function TaskDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = Number(params.id);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const toast = useToast();

  // React 19: useTransition for non-blocking async updates
  const [, startTransition] = useTransition();

  // Get navigation source from query params
  const fromSource = searchParams.get("from");
  const sprintIdParam = searchParams.get("sprintId");
  const router = useRouter();

  // Core state: base task data from server
  const [baseTask, setBaseTask] = useState<TaskDetail | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch task data
  const {
    data: fetchedTask,
    isLoading: dataLoading,
    error: fetchError,
    refetch: refetchTask,
  } = useQuery(() => tasksApi.getById(taskId), [taskId], {
    enabled: isAuthenticated && !isNaN(taskId),
    onSuccess: (data) => setBaseTask(data),
  });

  // React 19: useOptimistic for instant UI updates
  // Only create optimistic state when we have task data
  const taskForOptimistic = baseTask ?? fetchedTask;
  const [optimisticTask, addOptimisticUpdate] = useOptimistic(
    taskForOptimistic!,
    taskOptimisticReducer,
  );

  // Edit state (for inline editing UI)
  const [editState, setEditState] = useState<EditState>(initialEditState);

  // Fetch project sprints for sprint selection
  const { data: projectSprints } = useQuery(
    () =>
      optimisticTask?.project?.id
        ? projectsApi.getSprints(optimisticTask.project.id)
        : Promise.resolve({ sprints: [], projectId: 0 }),
    [optimisticTask?.project?.id],
    {
      enabled: isAuthenticated && !!optimisticTask?.project?.id,
    },
  );

  // Filter sprints to only show ACTIVE or DRAFT (future) sprints
  const availableSprints = useMemo(() => {
    if (!projectSprints?.sprints) return [];
    return projectSprints.sprints
      .filter(
        (sprint) => sprint.status === "ACTIVE" || sprint.status === "DRAFT",
      )
      .sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      });
  }, [projectSprints?.sprints]);

  // Check user roles (still needed for comment edit/delete permissions and TaskAttributes)
  const isProfessor = user?.roles?.includes("PROFESSOR") ?? false;

  // Derived values
  const isLoading = authLoading || dataLoading;

  // =============================================================================
  // PERMISSION FLAGS (computed by backend, used directly in UI)
  // =============================================================================
  // These are computed by the backend based on the current user context.
  // The frontend just uses them - no duplicate business logic needed.

  const canEdit = optimisticTask?.canEdit ?? false;
  const canEditSprint = optimisticTask?.canEditSprint ?? false;
  const canSelfAssign = optimisticTask?.canSelfAssign ?? false;
  const canUnassign = optimisticTask?.canUnassign ?? false;
  const canDelete = optimisticTask?.canDelete ?? false;
  const canFreeze = optimisticTask?.canFreeze ?? false;
  const canComment = optimisticTask?.canComment ?? false;
  // Additional permission flag available: canAddSubtask (in optimisticTask)

  // USER_STORY status is derived from its children - no manual status change available
  // Only TASK and BUG can have their status changed manually
  const availableStatuses: TaskStatus[] =
    optimisticTask?.type === "USER_STORY"
      ? [] // USER_STORY status is computed, not manually changeable
      : ["BACKLOG", "TODO", "INPROGRESS", "VERIFY", "DONE"];

  // Compute back navigation
  const backNavigation = useMemo(() => {
    if (fromSource === "sprint" && sprintIdParam) {
      return {
        href: `/dashboard/sprints/${sprintIdParam}`,
        label: t("backToSprint"),
      };
    }
    if (optimisticTask?.project?.id) {
      return {
        href: `/dashboard/projects/${optimisticTask.project.id}`,
        label: optimisticTask.project.name,
      };
    }
    return {
      href: "/dashboard/projects",
      label: t("backToProjects"),
    };
  }, [fromSource, sprintIdParam, t, optimisticTask?.project]);

  // =============================================================================
  // EDIT HANDLERS
  // =============================================================================

  const handleStartEdit = useCallback(
    (field: EditField) => {
      if (optimisticTask && field) {
        setEditState({
          field,
          name: optimisticTask.name || "",
          description: optimisticTask.description || "",
          estimation:
            optimisticTask.estimationPoints != null
              ? String(optimisticTask.estimationPoints)
              : "",
          status: optimisticTask.status,
          taskType: optimisticTask.type,
          sprintId: optimisticTask.activeSprints?.[0]?.id ?? null,
          isSaving: false,
          error: null,
          taskOverride: null,
        });
      }
    },
    [optimisticTask],
  );

  const handleCancel = useCallback(() => {
    setEditState(initialEditState);
  }, []);

  const handleNameChange = useCallback((value: string) => {
    setEditState((prev) => ({ ...prev, name: value }));
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setEditState((prev) => ({ ...prev, description: value }));
  }, []);

  const handleEstimationChange = useCallback((value: string) => {
    setEditState((prev) => ({ ...prev, estimation: value }));
  }, []);

  const handleStatusChange = useCallback((value: TaskStatus) => {
    setEditState((prev) => ({ ...prev, status: value }));
  }, []);

  const handleTypeChange = useCallback((value: TaskType) => {
    setEditState((prev) => ({ ...prev, taskType: value }));
  }, []);

  const handleSprintChange = useCallback((value: number | null) => {
    setEditState((prev) => ({ ...prev, sprintId: value }));
  }, []);

  // =============================================================================
  // SAVE HANDLER (with optimistic updates)
  // =============================================================================

  const handleSave = useCallback(async () => {
    if (!taskId || isNaN(taskId) || !editState.field) return;

    // Validation
    if (editState.field === "name" && editState.name.trim() === "") {
      toast.error(t("taskNameCannotBeEmpty"));
      return;
    }

    // Build update data and optimistic update
    let updateData: Record<string, unknown> = {};
    let optimisticData: Partial<TaskDetail> = {};

    switch (editState.field) {
      case "name":
        updateData = { name: editState.name.trim() };
        optimisticData = { name: editState.name.trim() };
        break;
      case "description":
        updateData = { description: editState.description };
        optimisticData = { description: editState.description };
        break;
      case "estimation": {
        const points =
          editState.estimation.trim() === ""
            ? 0
            : parseInt(editState.estimation, 10);
        updateData = { estimationPoints: points };
        optimisticData = { estimationPoints: points };
        break;
      }
      case "status":
        updateData = { status: editState.status };
        optimisticData = { status: editState.status };
        break;
      case "type":
        updateData = { type: editState.taskType };
        optimisticData = { type: editState.taskType };
        break;
      case "sprint": {
        updateData = { sprintId: editState.sprintId };
        // Sprint update affects activeSprints array
        const sprint = availableSprints.find(
          (s) => s.id === editState.sprintId,
        );
        optimisticData = {
          activeSprints: sprint
            ? [
                {
                  id: sprint.id,
                  name: sprint.label,
                  status: sprint.status as "DRAFT" | "ACTIVE" | "CLOSED",
                },
              ]
            : [],
        };
        break;
      }
    }

    // Clear edit state immediately for responsive UI
    setEditState(initialEditState);

    startTransition(async () => {
      // Apply optimistic update
      addOptimisticUpdate({ type: "updateTask", task: optimisticData });

      try {
        await tasksApi.update(taskId, updateData);
        // Refetch to get server-computed fields (canEdit, pointsReview, etc.)
        await refetchTask();
      } catch (err) {
        // On error, base state unchanged = optimistic update auto-reverts
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("failedToUpdate");
        toast.error(errorMessage);
      }
    });
  }, [
    taskId,
    editState,
    availableSprints,
    addOptimisticUpdate,
    refetchTask,
    t,
    toast,
  ]);

  // =============================================================================
  // ACTION HANDLERS (with optimistic updates)
  // =============================================================================

  const handleFreeze = useCallback(async () => {
    if (!taskId || isNaN(taskId)) return;

    startTransition(async () => {
      addOptimisticUpdate({
        type: "updateField",
        field: "frozen",
        value: true,
      });

      try {
        await tasksApi.freeze(taskId);
        await refetchTask();
      } catch (err) {
        toast.error(t("failedToUpdate"));
      }
    });
  }, [taskId, addOptimisticUpdate, refetchTask, t, toast]);

  const handleUnfreeze = useCallback(async () => {
    if (!taskId || isNaN(taskId)) return;

    startTransition(async () => {
      addOptimisticUpdate({
        type: "updateField",
        field: "frozen",
        value: false,
      });

      try {
        await tasksApi.unfreeze(taskId);
        await refetchTask();
      } catch (err) {
        toast.error(t("failedToUpdate"));
      }
    });
  }, [taskId, addOptimisticUpdate, refetchTask, t, toast]);

  const handleSelfAssign = useCallback(async () => {
    if (!taskId || isNaN(taskId) || !user) return;

    startTransition(async () => {
      addOptimisticUpdate({
        type: "updateField",
        field: "assignee",
        value: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
        },
      });

      try {
        await tasksApi.selfAssign(taskId);
        await refetchTask();
      } catch (err) {
        toast.error(t("failedToAssign"));
      }
    });
  }, [taskId, user, addOptimisticUpdate, refetchTask, t, toast]);

  const handleUnassign = useCallback(async () => {
    if (!taskId || isNaN(taskId)) return;

    startTransition(async () => {
      addOptimisticUpdate({
        type: "updateField",
        field: "assignee",
        value: null,
      });

      try {
        await tasksApi.unassign(taskId);
        await refetchTask();
      } catch (err) {
        toast.error(t("failedToUnassign"));
      }
    });
  }, [taskId, addOptimisticUpdate, refetchTask, t, toast]);

  const handleSubtaskCreated = useCallback(() => {
    // Refetch to get updated childTasks
    refetchTask();
  }, [refetchTask]);

  const handleCommentAdded = useCallback(() => {
    // Refetch to get updated discussion
    refetchTask();
  }, [refetchTask]);

  // =============================================================================
  // DELETE HANDLER
  // =============================================================================
  // Note: canDelete is now computed by the backend and received as a flag

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!taskId || isNaN(taskId)) return;

    setIsDeleting(true);
    try {
      await tasksApi.delete(taskId);
      toast.success(t("taskDeleted"));

      // Navigate back after successful deletion
      if (fromSource === "sprint" && sprintIdParam) {
        router.push(`/dashboard/sprints/${sprintIdParam}`);
      } else if (optimisticTask?.project?.id) {
        router.push(`/dashboard/projects/${optimisticTask.project.id}`);
      } else {
        router.push("/dashboard/tasks");
      }
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : t("failedToDelete");
      toast.error(errorMessage);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [
    taskId,
    fromSource,
    sprintIdParam,
    optimisticTask?.project?.id,
    router,
    t,
    toast,
  ]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

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

  if (fetchError || !optimisticTask) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {t("taskNotFound")}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {t("taskNotFoundDescription")}
          </p>
          <Link
            href="/dashboard/projects"
            className="btn-primary mt-4 inline-flex"
          >
            {t("backToProjects")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back Navigation */}
      <BackButton
        fallbackHref={backNavigation.href}
        label={tCommon("back")}
        className="mb-6"
      />

      {/* Task Header */}
      <TaskHeader
        task={optimisticTask as TaskWithProject}
        editState={editState}
        canEdit={canEdit}
        canDelete={canDelete}
        canFreeze={canFreeze}
        onStartEdit={handleStartEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onNameChange={handleNameChange}
        onFreeze={handleFreeze}
        onUnfreeze={handleUnfreeze}
        onDelete={handleDeleteClick}
      />

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <TaskDescription
            description={optimisticTask.description}
            editState={editState}
            canEdit={canEdit}
            onStartEdit={() => handleStartEdit("description")}
            onSave={handleSave}
            onCancel={handleCancel}
            onDescriptionChange={handleDescriptionChange}
          />

          {/* Child Tasks (for User Stories) */}
          {optimisticTask.type === "USER_STORY" && (
            <TaskChildren
              childTasks={optimisticTask.childTasks || []}
              parentTaskId={taskId}
              projectId={optimisticTask.project?.id || 0}
              onSubtaskCreated={handleSubtaskCreated}
            />
          )}

          {/* Pull Requests */}
          <TaskPullRequests
            pullRequests={optimisticTask.pullRequests || []}
            taskId={taskId}
            projectMembers={optimisticTask.project?.members}
          />

          {/* Points Review Conversations */}
          <TaskPointsReview
            taskId={taskId}
            canStartPointsReview={optimisticTask.canStartPointsReview ?? false}
            canViewPointsReviews={optimisticTask.canViewPointsReviews ?? false}
            pointsReviewConversationCount={optimisticTask.pointsReviewConversationCount ?? 0}
            projectMembers={optimisticTask.project?.members}
            onConversationCreated={() => refetchTask()}
          />

          {/* Task History - Only visible to professors */}
          <TaskHistory taskId={taskId} />

          {/* Discussion/Comments */}
          <TaskDiscussion
            comments={optimisticTask.discussion || []}
            taskId={taskId}
            onCommentAdded={handleCommentAdded}
            canComment={canComment}
            isProfessor={isProfessor}
            currentUserId={user?.id}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <TaskSidebar
            task={optimisticTask as TaskWithProject}
            editState={editState}
            canEdit={canEdit}
            canEditSprint={canEditSprint}
            availableStatuses={availableStatuses}
            availableSprints={availableSprints}
            canSelfAssign={canSelfAssign}
            canUnassign={canUnassign}
            onStartEdit={handleStartEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onEstimationChange={handleEstimationChange}
            onStatusChange={handleStatusChange}
            onTypeChange={handleTypeChange}
            onSprintChange={handleSprintChange}
            onSelfAssign={handleSelfAssign}
            onUnassign={handleUnassign}
          />

          {/* Profile Attributes - Only visible to professors */}
          <TaskAttributes taskId={taskId} isProfessor={isProfessor} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={t("deleteTaskConfirmTitle")}
        message={t("deleteTaskConfirmMessage")}
        confirmLabel={t("deleteTask")}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
