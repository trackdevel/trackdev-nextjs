"use client";

import { Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  tasksApi,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  EnumValueEntry,
  ProfileAttribute,
  TaskAttributeValue,
} from "@trackdev/types";
import { Check, Loader2, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";

interface TaskAttributesProps {
  taskId: number;
  isProfessor: boolean;
  isAssignee: boolean;
  isFrozen: boolean;
}

interface AttributeRow {
  attribute: ProfileAttribute;
  currentValue: TaskAttributeValue | null;
}

export const TaskAttributes = memo(function TaskAttributes({
  taskId,
  isProfessor,
  isAssignee,
  isFrozen,
}: TaskAttributesProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [editingAttr, setEditingAttr] = useState<AttributeRow | null>(null);
  const [modalValue, setModalValue] = useState("");

  // Fetch current attribute values for the task
  const {
    data: attributeValues,
    isLoading: isLoadingValues,
    refetch: refetchValues,
  } = useQuery(() => tasksApi.getAttributeValues(taskId), [taskId], {
    enabled: !!taskId,
  });

  // Fetch available attributes from the course profile
  const { data: availableAttributes, isLoading: isLoadingAttributes } =
    useQuery(() => tasksApi.getAvailableAttributes(taskId), [taskId], {
      enabled: !!taskId,
    });

  // Mutation to set/update attribute value
  const setValueMutation = useMutation(
    ({ attributeId, value }: { attributeId: number; value: string | null }) =>
      tasksApi.setAttributeValue(taskId, attributeId, { value }),
    {
      onSuccess: () => {
        refetchValues();
        setEditingAttr(null);
        setModalValue("");
        toast.success(t("attributeValueSaved"));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("attributeValueError");
        toast.error(errorMessage);
      },
    },
  );

  // Mutation to delete attribute value
  const deleteValueMutation = useMutation(
    (attributeId: number) => tasksApi.deleteAttributeValue(taskId, attributeId),
    {
      onSuccess: () => {
        refetchValues();
        setEditingAttr(null);
        toast.success(t("attributeValueDeleted"));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("attributeValueDeleteError");
        toast.error(errorMessage);
      },
    },
  );

  // Determine if user can edit a specific attribute based on appliedBy and frozen state
  const canEditAttribute = (
    appliedBy: "STUDENT" | "PROFESSOR" | undefined,
  ): boolean => {
    if (isProfessor) return true;
    if (appliedBy === "STUDENT" && isAssignee && !isFrozen) return true;
    return false;
  };

  // Build unified list of all attributes with their current values
  const attributeRows: AttributeRow[] = (availableAttributes || []).map(
    (attr) => {
      const currentValue =
        attributeValues?.find((val) => val.attributeId === attr.id) || null;
      return { attribute: attr, currentValue };
    },
  );

  const handleOpenEdit = (row: AttributeRow) => {
    setEditingAttr(row);
    setModalValue(row.currentValue?.value || "");
  };

  const handleSave = () => {
    if (editingAttr) {
      setValueMutation.mutate({
        attributeId: editingAttr.attribute.id,
        value: modalValue || null,
      });
    }
  };

  const handleDelete = () => {
    if (editingAttr) {
      deleteValueMutation.mutate(editingAttr.attribute.id);
    }
  };

  const handleCloseModal = () => {
    setEditingAttr(null);
    setModalValue("");
  };

  // Get enum values: prefer from the current value (if set), otherwise from the attribute definition
  const getEnumValues = (row: AttributeRow): EnumValueEntry[] => {
    return row.currentValue?.enumValues || row.attribute.enumValues || [];
  };

  // Render the appropriate input inside the modal based on attribute type
  const renderModalInput = (row: AttributeRow) => {
    const attr = row.attribute;

    switch (attr.type) {
      case "ENUM": {
        const enumValues = getEnumValues(row);
        return (
          <div className="space-y-1.5">
            {enumValues.map((v, idx) => {
              const isSelected = modalValue === v.value;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setModalValue(isSelected ? "" : v.value)}
                  className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-primary-700 dark:text-primary-300"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {v.value}
                  </span>
                  {v.description && (
                    <p
                      className={`mt-0.5 text-xs ${
                        isSelected
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {v.description}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        );
      }
      case "INTEGER":
        return (
          <input
            type="number"
            value={modalValue}
            onChange={(e) => setModalValue(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            step="1"
            min={attr.minValue || undefined}
            max={attr.maxValue || undefined}
          />
        );
      case "FLOAT":
        return (
          <input
            type="number"
            value={modalValue}
            onChange={(e) => setModalValue(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            step="0.01"
            min={attr.minValue || undefined}
            max={attr.maxValue || undefined}
          />
        );
      case "STRING":
      default:
        return (
          <input
            type="text"
            value={modalValue}
            onChange={(e) => setModalValue(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
          />
        );
    }
  };

  // Show loading state
  if (isLoadingValues || isLoadingAttributes) {
    return (
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t("additionalAttributes")}
          </h2>
        </div>
        <div className="px-6 py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Don't show if there are no available attributes
  if (!availableAttributes || availableAttributes.length === 0) {
    return null;
  }

  return (
    <>
      <div className="card">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t("additionalAttributes")}
          </h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {attributeRows.map((row) => {
            const editable = canEditAttribute(row.attribute.appliedBy);
            const hasValue = row.currentValue?.value != null;

            return (
              <div
                key={row.attribute.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {row.attribute.name}
                  </p>
                  <span
                    className={
                      hasValue
                        ? "text-sm text-gray-900 dark:text-white"
                        : "text-sm italic text-gray-400 dark:text-gray-500"
                    }
                  >
                    {hasValue ? row.currentValue!.value : t("notSet")}
                  </span>
                </div>
                {editable && (
                  <button
                    onClick={() => handleOpenEdit(row)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                    title={tCommon("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {attributeRows.length === 0 &&
            (isProfessor || isAssignee) && (
              <div className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("noAttributesAvailable")}
              </div>
            )}
        </div>
      </div>

      {/* Edit modal */}
      {editingAttr && (
        <Modal
          isOpen={true}
          onClose={handleCloseModal}
          title={editingAttr.attribute.name}
          maxWidth="sm"
        >
          <div className="space-y-4">
            {renderModalInput(editingAttr)}

            {/* Min/Max hint for numeric types */}
            {(editingAttr.attribute.type === "INTEGER" ||
              editingAttr.attribute.type === "FLOAT") &&
              (editingAttr.attribute.minValue ||
                editingAttr.attribute.maxValue) && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {editingAttr.attribute.minValue &&
                    `Min: ${editingAttr.attribute.minValue}`}
                  {editingAttr.attribute.minValue &&
                    editingAttr.attribute.maxValue &&
                    " · "}
                  {editingAttr.attribute.maxValue &&
                    `Max: ${editingAttr.attribute.maxValue}`}
                </p>
              )}

            <div className="flex items-center justify-between pt-2">
              {/* Delete button (only if there is a current value) */}
              {editingAttr.currentValue?.value != null ? (
                <button
                  onClick={handleDelete}
                  disabled={deleteValueMutation.isLoading}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  {deleteValueMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {tCommon("delete")}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseModal}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={setValueMutation.isLoading}
                  className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {setValueMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {tCommon("save")}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
});
