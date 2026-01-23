"use client";

import { FormField, Modal, Select } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  projectsApi,
  tasksApi,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { TaskType } from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface CreateTaskModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** If provided, creates a subtask under this parent task (restricts type to TASK/BUG) */
  parentTaskId?: number;
  /** If provided, assigns the created subtask to this sprint */
  sprintId?: number;
}

interface TaskForm {
  name: string;
  description: string;
  type: TaskType;
  assigneeId: string;
}

/**
 * Modal for creating a new task in a project.
 * Tasks are created in the backlog with no sprint assigned.
 * If parentTaskId is provided, creates a subtask instead (type restricted to TASK/BUG).
 */
export function CreateTaskModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  parentTaskId,
  sprintId,
}: CreateTaskModalProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const isSubtaskMode = !!parentTaskId;

  const [form, setForm] = useState<TaskForm>({
    name: "",
    description: "",
    type: "USER_STORY",
    assigneeId: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form completely when modal opens or mode changes
  useEffect(() => {
    if (isOpen) {
      setForm({
        name: "",
        description: "",
        type: isSubtaskMode ? "TASK" : "USER_STORY",
        assigneeId: "",
      });
      setValidationError(null);
    }
  }, [isOpen, isSubtaskMode]);

  // Fetch project details to get members for assignee dropdown
  const { data: project } = useQuery(
    () => projectsApi.getById(projectId),
    [projectId],
    { enabled: isOpen && projectId > 0 },
  );

  // Task type options - exclude USER_STORY for subtasks
  const TASK_TYPES: { value: TaskType; label: string }[] = isSubtaskMode
    ? [
        { value: "TASK", label: t("typeTask") },
        { value: "BUG", label: t("typeBug") },
      ]
    : [
        { value: "USER_STORY", label: t("typeUserStory") },
        { value: "TASK", label: t("typeTask") },
        { value: "BUG", label: t("typeBug") },
      ];

  // Assignee options from project members
  const assigneeOptions = [
    { value: "", label: t("unassigned") },
    ...(project?.members || []).map((member) => ({
      value: member.id,
      label: member.fullName || member.username,
    })),
  ];

  // Mutation for creating a regular task
  const createTaskMutation = useMutation(
    (data: TaskForm) =>
      projectsApi.createTask(projectId, {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        assigneeId: data.assigneeId || undefined,
      }),
    {
      onSuccess: () => {
        toast.success(t("taskCreated"));
        resetForm();
        onClose();
        onSuccess?.();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof ApiClientError && error.body?.message
            ? error.body.message
            : t("failedToCreateTask");
        toast.error(errorMessage);
      },
    },
  );

  // Mutation for creating a subtask
  const createSubtaskMutation = useMutation(
    (data: TaskForm) =>
      tasksApi.createSubtask(
        parentTaskId!,
        {
          name: data.name,
          description: data.description || undefined,
          type: data.type,
          assigneeId: data.assigneeId || undefined,
        },
        sprintId,
      ),
    {
      onSuccess: () => {
        toast.success(t("subtaskCreated"));
        resetForm();
        onClose();
        onSuccess?.();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof ApiClientError && error.body?.message
            ? error.body.message
            : t("failedToCreateSubtask");
        toast.error(errorMessage);
      },
    },
  );

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      type: isSubtaskMode ? "TASK" : "USER_STORY",
      assigneeId: "",
    });
    setValidationError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!form.name.trim()) {
      setValidationError(t("taskNameRequired"));
      return;
    }
    if (form.name.length > 100) {
      setValidationError(t("taskNameTooLong"));
      return;
    }

    if (isSubtaskMode) {
      createSubtaskMutation.mutate(form);
    } else {
      createTaskMutation.mutate(form);
    }
  };

  const isLoading =
    createTaskMutation.isLoading || createSubtaskMutation.isLoading;
  const modalTitle = isSubtaskMode ? t("addSubtask") : t("createTask");
  const submitLabel = isSubtaskMode ? t("addSubtask") : t("createTask");

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {validationError}
          </div>
        )}

        <FormField label={t("name")} htmlFor="taskName" required>
          <input
            type="text"
            id="taskName"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder={t("taskNamePlaceholder")}
            maxLength={100}
            autoFocus
          />
        </FormField>

        <FormField label={t("description")} htmlFor="taskDescription">
          <textarea
            id="taskDescription"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input min-h-[100px]"
            placeholder={t("taskDescriptionPlaceholder")}
            rows={3}
          />
        </FormField>

        <FormField label={t("type")} htmlFor="taskType">
          <Select
            value={form.type}
            onChange={(value) => setForm({ ...form, type: value as TaskType })}
            options={TASK_TYPES}
            aria-label={t("type")}
          />
        </FormField>

        <FormField label={t("assignee")} htmlFor="taskAssignee">
          <Select
            value={form.assigneeId}
            onChange={(value) => setForm({ ...form, assigneeId: value })}
            options={assigneeOptions}
            placeholder={t("selectAssignee")}
            aria-label={t("assignee")}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={handleClose} className="btn-secondary">
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {tCommon("creating")}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
