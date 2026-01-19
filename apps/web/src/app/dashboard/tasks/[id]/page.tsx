"use client";

import { BackButton } from "@/components/BackButton";
import { projectsApi, tasksApi, useAuth, useQuery } from "@trackdev/api-client";
import type { TaskStatus, TaskType } from "@trackdev/types";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useMemo, useReducer } from "react";
import {
  TaskChildren,
  TaskDescription,
  TaskDiscussion,
  TaskHeader,
  TaskHistory,
  TaskPullRequests,
  TaskSidebar,
} from "./components";
import type {
  EditAction,
  EditField,
  EditState,
  TaskWithProject,
} from "./types";

const initialEditState: EditState = {
  field: null,
  name: "",
  description: "",
  estimation: 0,
  status: "BACKLOG",
  taskType: "TASK",
  sprintId: null,
  isSaving: false,
  error: null,
  taskOverride: null,
};

function editReducer(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case "START_EDIT":
      return {
        ...state,
        field: action.field,
        name: action.task.name || "",
        description: action.task.description || "",
        estimation: action.task.estimationPoints ?? 0,
        status: action.task.status,
        taskType: action.task.type,
        sprintId: action.task.activeSprints?.[0]?.id ?? null,
        error: null,
      };
    case "SET_NAME":
      return { ...state, name: action.value };
    case "SET_DESCRIPTION":
      return { ...state, description: action.value };
    case "SET_ESTIMATION":
      return { ...state, estimation: action.value };
    case "SET_STATUS":
      return { ...state, status: action.value };
    case "SET_TASK_TYPE":
      return { ...state, taskType: action.value };
    case "SET_SPRINT":
      return { ...state, sprintId: action.value };
    case "SAVE_START":
      return { ...state, isSaving: true, error: null };
    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        field: null,
        error: null,
        taskOverride: { ...state.taskOverride, ...action.result },
      };
    case "SAVE_ERROR":
      return { ...state, isSaving: false, error: action.error };
    case "CANCEL":
      return { ...state, field: null, error: null };
    default:
      return state;
  }
}

export default function TaskDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const taskId = Number(params.id);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");

  // Get navigation source from query params (e.g., ?from=sprint&sprintId=123)
  const fromSource = searchParams.get("from");
  const sprintId = searchParams.get("sprintId");

  // Fetch task data
  const {
    data: fetchedTask,
    isLoading: dataLoading,
    error: fetchError,
    refetch: refetchTask,
  } = useQuery(() => tasksApi.getById(taskId), [taskId], {
    enabled: isAuthenticated && !isNaN(taskId),
  });

  // Fetch project sprints for sprint selection (only for TASK/BUG types)
  const { data: projectSprints } = useQuery(
    () =>
      fetchedTask?.project?.id
        ? projectsApi.getSprints(fetchedTask.project.id)
        : Promise.resolve({ sprints: [], projectId: 0 }),
    [fetchedTask?.project?.id],
    {
      enabled: isAuthenticated && !!fetchedTask?.project?.id,
    }
  );

  // Filter sprints to only show ACTIVE or DRAFT (future) sprints
  const availableSprints = useMemo(() => {
    if (!projectSprints?.sprints) return [];
    return projectSprints.sprints.filter(
      (sprint) => sprint.status === "ACTIVE" || sprint.status === "DRAFT"
    );
  }, [projectSprints?.sprints]);

  // Edit state managed by reducer
  const [editState, dispatch] = useReducer(editReducer, initialEditState);

  // Merge fetched data with local overrides - this is the single source of truth for display
  const task = useMemo<TaskWithProject | null>(() => {
    if (!fetchedTask) return null;
    return {
      ...fetchedTask,
      ...editState.taskOverride,
    };
  }, [fetchedTask, editState.taskOverride]);

  // Deferred value for smooth UI during saves
  const deferredTask = useDeferredValue(task);

  // Check if user is a professor
  const isProfessor = user?.roles?.includes("PROFESSOR") ?? false;
  const isStudent = user?.roles?.includes("STUDENT") ?? false;

  // Derived values
  const isLoading = authLoading || dataLoading;
  const isFrozen = fetchedTask?.frozen ?? false;
  // Professors can edit frozen tasks, students cannot
  const canEdit = (fetchedTask?.canEdit ?? false) && (!isFrozen || isProfessor);
  // Can self-assign if: is a student, task is unassigned, and task is not frozen
  const canSelfAssign =
    isStudent && !fetchedTask?.assignee && !isFrozen && !!fetchedTask;
  const availableStatuses: TaskStatus[] =
    task?.type === "USER_STORY"
      ? ["BACKLOG", "DEFINED", "DONE"]
      : ["BACKLOG", "TODO", "INPROGRESS", "VERIFY", "DONE"];

  // Compute back navigation based on source (must be before early returns to maintain hook order)
  const backNavigation = useMemo(() => {
    if (fromSource === "sprint" && sprintId) {
      return {
        href: `/dashboard/sprints/${sprintId}`,
        label: t("backToSprint"),
      };
    }
    if (deferredTask?.project?.id) {
      return {
        href: `/dashboard/projects/${deferredTask.project.id}`,
        label: deferredTask.project.name,
      };
    }
    return {
      href: "/dashboard/projects",
      label: t("backToProjects"),
    };
  }, [
    fromSource,
    sprintId,
    t,
    deferredTask?.project?.id,
    deferredTask?.project?.name,
  ]);

  // Memoized event handlers
  const handleStartEdit = useCallback(
    (field: EditField) => {
      if (task && field) {
        dispatch({ type: "START_EDIT", field, task });
      }
    },
    [task]
  );

  const handleCancel = useCallback(() => {
    dispatch({ type: "CANCEL" });
  }, []);

  const handleNameChange = useCallback((value: string) => {
    dispatch({ type: "SET_NAME", value });
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    dispatch({ type: "SET_DESCRIPTION", value });
  }, []);

  const handleEstimationChange = useCallback((value: number) => {
    dispatch({ type: "SET_ESTIMATION", value });
  }, []);

  const handleStatusChange = useCallback((value: TaskStatus) => {
    dispatch({ type: "SET_STATUS", value });
  }, []);

  const handleTypeChange = useCallback((value: TaskType) => {
    dispatch({ type: "SET_TASK_TYPE", value });
  }, []);

  const handleSprintChange = useCallback((value: number | null) => {
    dispatch({ type: "SET_SPRINT", value });
  }, []);

  const handleSave = useCallback(async () => {
    if (!taskId || isNaN(taskId) || !editState.field) return;

    // Validation
    if (editState.field === "name" && editState.name.trim() === "") {
      dispatch({ type: "SAVE_ERROR", error: t("taskNameCannotBeEmpty") });
      return;
    }

    dispatch({ type: "SAVE_START" });

    try {
      let updateData: Record<string, unknown> = {};
      switch (editState.field) {
        case "name":
          updateData = { name: editState.name.trim() };
          break;
        case "description":
          updateData = { description: editState.description };
          break;
        case "estimation":
          updateData = { estimationPoints: editState.estimation };
          break;
        case "status":
          updateData = { status: editState.status };
          break;
        case "type":
          updateData = { type: editState.taskType };
          break;
        case "sprint":
          updateData = { sprintId: editState.sprintId };
          break;
      }

      const result = await tasksApi.update(taskId, updateData);
      dispatch({ type: "SAVE_SUCCESS", result });
    } catch (err) {
      // Log error in development only
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to update task:", err);
      }
      dispatch({
        type: "SAVE_ERROR",
        error: t("failedToUpdate"),
      });
    }
  }, [
    taskId,
    editState.field,
    editState.name,
    editState.description,
    editState.estimation,
    editState.status,
    editState.taskType,
    editState.sprintId,
    t,
  ]);

  const handleFreeze = useCallback(async () => {
    if (!taskId || isNaN(taskId)) return;

    try {
      const result = await tasksApi.freeze(taskId);
      dispatch({ type: "SAVE_SUCCESS", result });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to freeze task:", err);
      }
    }
  }, [taskId]);

  const handleUnfreeze = useCallback(async () => {
    if (!taskId || isNaN(taskId)) return;

    try {
      const result = await tasksApi.unfreeze(taskId);
      dispatch({ type: "SAVE_SUCCESS", result });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to unfreeze task:", err);
      }
    }
  }, [taskId]);

  const handleSelfAssign = useCallback(async () => {
    if (!taskId || isNaN(taskId)) return;

    try {
      const result = await tasksApi.selfAssign(taskId);
      dispatch({ type: "SAVE_SUCCESS", result });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to self-assign task:", err);
      }
      dispatch({
        type: "SAVE_ERROR",
        error: t("failedToAssign"),
      });
    }
  }, [taskId, t]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Render error state
  if (fetchError || !deferredTask) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t("taskNotFound")}
          </h3>
          <p className="mt-2 text-gray-500">{t("taskNotFoundDescription")}</p>
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

  // Main render
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
        task={deferredTask}
        editState={editState}
        canEdit={canEdit}
        isProfessor={isProfessor}
        onStartEdit={handleStartEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onNameChange={handleNameChange}
        onFreeze={handleFreeze}
        onUnfreeze={handleUnfreeze}
      />

      {/* Error Display */}
      {editState.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {editState.error}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <TaskDescription
            description={deferredTask.description}
            editState={editState}
            canEdit={canEdit}
            onStartEdit={() => handleStartEdit("description")}
            onSave={handleSave}
            onCancel={handleCancel}
            onDescriptionChange={handleDescriptionChange}
          />

          {/* Child Tasks (for User Stories) */}
          {deferredTask.type === "USER_STORY" && (
            <TaskChildren
              childTasks={deferredTask.childTasks || []}
              parentTaskId={taskId}
            />
          )}

          {/* Pull Requests */}
          <TaskPullRequests
            pullRequests={deferredTask.pullRequests || []}
            taskId={taskId}
          />

          {/* Task History - Only visible to professors */}
          <TaskHistory taskId={taskId} />

          {/* Discussion/Comments */}
          <TaskDiscussion
            comments={deferredTask.discussion || []}
            taskId={taskId}
            onCommentAdded={refetchTask}
            isFrozen={isFrozen}
            isProfessor={isProfessor}
          />
        </div>

        {/* Right Column - Sidebar */}
        <TaskSidebar
          task={deferredTask}
          editState={editState}
          canEdit={canEdit}
          availableStatuses={availableStatuses}
          availableSprints={availableSprints}
          canSelfAssign={canSelfAssign}
          onStartEdit={handleStartEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onEstimationChange={handleEstimationChange}
          onStatusChange={handleStatusChange}
          onTypeChange={handleTypeChange}
          onSprintChange={handleSprintChange}
          onSelfAssign={handleSelfAssign}
        />
      </div>
    </div>
  );
}
