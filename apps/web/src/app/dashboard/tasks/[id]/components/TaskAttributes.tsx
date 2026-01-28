"use client";

import { Select } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  tasksApi,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { ProfileAttribute, TaskAttributeValue } from "@trackdev/types";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";

interface TaskAttributesProps {
  taskId: number;
  isProfessor: boolean;
}

export const TaskAttributes = memo(function TaskAttributes({
  taskId,
  isProfessor,
}: TaskAttributesProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [editingAttributeId, setEditingAttributeId] = useState<number | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [addingAttributeId, setAddingAttributeId] = useState<number | null>(
    null,
  );
  const [addValue, setAddValue] = useState("");

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
      enabled: !!taskId && isProfessor,
    });

  // Mutation to set/update attribute value
  const setValueMutation = useMutation(
    ({ attributeId, value }: { attributeId: number; value: string | null }) =>
      tasksApi.setAttributeValue(taskId, attributeId, { value }),
    {
      onSuccess: () => {
        refetchValues();
        setEditingAttributeId(null);
        setAddingAttributeId(null);
        setEditValue("");
        setAddValue("");
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

  // Get attributes that don't have values yet (for "Add" dropdown)
  const unsetAttributes =
    availableAttributes?.filter(
      (attr) => !attributeValues?.some((val) => val.attributeId === attr.id),
    ) || [];

  const handleStartEdit = (attrValue: TaskAttributeValue) => {
    setEditingAttributeId(attrValue.attributeId);
    setEditValue(attrValue.value || "");
  };

  const handleSaveEdit = () => {
    if (editingAttributeId !== null) {
      setValueMutation.mutate({
        attributeId: editingAttributeId,
        value: editValue || null,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingAttributeId(null);
    setEditValue("");
  };

  const handleStartAdd = (attr: ProfileAttribute) => {
    setAddingAttributeId(attr.id);
    setAddValue("");
  };

  const handleSaveAdd = () => {
    if (addingAttributeId !== null) {
      setValueMutation.mutate({
        attributeId: addingAttributeId,
        value: addValue || null,
      });
    }
  };

  const handleCancelAdd = () => {
    setAddingAttributeId(null);
    setAddValue("");
  };

  const handleDelete = (attributeId: number) => {
    deleteValueMutation.mutate(attributeId);
  };

  // Get the attribute definition for rendering the correct input
  const getAttributeDefinition = (
    attributeId: number,
  ): ProfileAttribute | undefined => {
    return availableAttributes?.find((a) => a.id === attributeId);
  };

  // Render input based on attribute type
  const renderValueInput = (
    attr: ProfileAttribute | undefined,
    value: string,
    onChange: (val: string) => void,
    enumValues?: string[],
  ) => {
    if (!attr) return null;

    switch (attr.type) {
      case "ENUM":
        return (
          <Select
            value={value}
            onChange={onChange}
            options={[
              { value: "", label: t("selectValue") },
              ...(enumValues || []).map((v) => ({ value: v, label: v })),
            ]}
            className="flex-1"
          />
        );
      case "INTEGER":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            step="1"
          />
        );
      case "FLOAT":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            step="0.01"
          />
        );
      case "STRING":
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
            {t("profileAttributes")}
          </h2>
        </div>
        <div className="px-6 py-4 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Don't show if there are no available attributes (no profile or no TASK-targeted attributes)
  if (!availableAttributes || availableAttributes.length === 0) {
    return null;
  }

  return (
    <div className="card">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("profileAttributes")}
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {/* Existing attribute values */}
        {attributeValues?.map((attrValue) => {
          const attrDef = getAttributeDefinition(attrValue.attributeId);
          const isEditing = editingAttributeId === attrValue.attributeId;

          return (
            <div key={attrValue.id} className="px-6 py-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {attrValue.attributeName}
              </p>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  {renderValueInput(
                    attrDef,
                    editValue,
                    setEditValue,
                    attrValue.enumValues,
                  )}
                  <button
                    onClick={handleSaveEdit}
                    disabled={setValueMutation.isLoading}
                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                    title={tCommon("save")}
                  >
                    {setValueMutation.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title={tCommon("cancel")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">
                    {attrValue.value || (
                      <span className="text-gray-400 italic">
                        {t("noValue")}
                      </span>
                    )}
                  </span>
                  {isProfessor && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(attrValue)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title={tCommon("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(attrValue.attributeId)}
                        disabled={deleteValueMutation.isLoading}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                        title={tCommon("delete")}
                      >
                        {deleteValueMutation.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Adding new attribute value */}
        {addingAttributeId !== null && (
          <div className="px-6 py-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {
                availableAttributes.find((a) => a.id === addingAttributeId)
                  ?.name
              }
            </p>
            <div className="flex items-center gap-2">
              {renderValueInput(
                availableAttributes.find((a) => a.id === addingAttributeId),
                addValue,
                setAddValue,
                availableAttributes.find((a) => a.id === addingAttributeId)
                  ?.enumValues,
              )}
              <button
                onClick={handleSaveAdd}
                disabled={setValueMutation.isLoading}
                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                title={tCommon("save")}
              >
                {setValueMutation.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleCancelAdd}
                className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title={tCommon("cancel")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Add attribute dropdown (only for professors, and only if there are unset attributes) */}
        {isProfessor && unsetAttributes.length > 0 && !addingAttributeId && (
          <div className="px-6 py-3">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-gray-400" />
              <Select
                value=""
                onChange={(value) => {
                  const attr = unsetAttributes.find(
                    (a) => a.id === parseInt(value),
                  );
                  if (attr) {
                    handleStartAdd(attr);
                  }
                }}
                options={[
                  { value: "", label: t("addAttribute") },
                  ...unsetAttributes.map((attr) => ({
                    value: attr.id.toString(),
                    label: attr.name,
                  })),
                ]}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Empty state - all attributes are set */}
        {isProfessor &&
          unsetAttributes.length === 0 &&
          (!attributeValues || attributeValues.length === 0) && (
            <div className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("noAttributesAvailable")}
            </div>
          )}
      </div>
    </div>
  );
});
