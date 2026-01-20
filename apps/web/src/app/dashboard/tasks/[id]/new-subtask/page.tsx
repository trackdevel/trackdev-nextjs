"use client";

import { BackButton } from "@/components/BackButton";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  tasksApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { TaskType } from "@trackdev/types";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export default function NewSubtaskPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentTaskId = Number(params.id);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");

  // Get navigation source from query params
  const fromSource = searchParams.get("from");
  const sprintId = searchParams.get("sprintId");

  const toast = useToast();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("TASK");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch parent task to verify it's a USER_STORY
  const {
    data: parentTask,
    isLoading: parentLoading,
    error: parentError,
  } = useQuery(() => tasksApi.getById(parentTaskId), [parentTaskId], {
    enabled: isAuthenticated && !isNaN(parentTaskId),
  });

  // Parse sprintId as number if it exists
  const sprintIdNum = sprintId ? Number(sprintId) : undefined;

  // Create subtask mutation
  const createSubtaskMutation = useMutation(
    (data: { name: string; description?: string; type: TaskType }) =>
      tasksApi.createSubtask(parentTaskId, data, sprintIdNum),
    {
      onSuccess: () => {
        // Navigate back to the parent task or sprint view
        if (fromSource === "sprint" && sprintId) {
          router.push(`/dashboard/sprints/${sprintId}`);
        } else {
          router.push(`/dashboard/tasks/${parentTaskId}`);
        }
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("failedToCreateSubtask");
        toast.error(errorMessage);
      },
    }
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      if (!name.trim()) {
        setValidationError(t("taskNameRequired"));
        return;
      }

      if (name.trim().length > 100) {
        setValidationError(t("taskNameTooLong"));
        return;
      }

      setValidationError(null);
      createSubtaskMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        type: taskType,
      });
    },
    [name, description, taskType, createSubtaskMutation, t]
  );

  // Compute back navigation
  const backHref =
    fromSource === "sprint" && sprintId
      ? `/dashboard/sprints/${sprintId}`
      : `/dashboard/tasks/${parentTaskId}`;

  const isLoading = authLoading || parentLoading;
  const isSubmitting = createSubtaskMutation.isLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Error state - parent not found or not a USER_STORY
  if (parentError || !parentTask) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t("taskNotFound")}
          </h3>
          <p className="mt-2 text-gray-500">{t("taskNotFoundDescription")}</p>
        </div>
      </div>
    );
  }

  // Verify parent is a USER_STORY
  if (parentTask.type !== "USER_STORY") {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t("cannotAddSubtask")}
          </h3>
          <p className="mt-2 text-gray-500">
            {t("subtasksOnlyForUserStories")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back Navigation */}
      <BackButton
        fallbackHref={backHref}
        label={tCommon("back")}
        className="mb-6"
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("newSubtask")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("addingSubtaskTo")}:{" "}
          <span className="font-medium">{parentTask.name}</span>
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Validation Error Display */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {validationError}
            </div>
          )}

          {/* Task Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("taskName")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder={t("enterTaskName")}
              maxLength={100}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/100 {t("characters")}
            </p>
          </div>

          {/* Task Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("type")}
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="TASK"
                  checked={taskType === "TASK"}
                  onChange={() => setTaskType("TASK")}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t("typeTask")}
                </span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="BUG"
                  checked={taskType === "BUG"}
                  onChange={() => setTaskType("BUG")}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  disabled={isSubmitting}
                />
                <span className="ml-2 text-sm text-gray-700">
                  {t("typeBug")}
                </span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("description")}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder={t("enterDescription")}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push(backHref)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? tCommon("creating") : tCommon("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
