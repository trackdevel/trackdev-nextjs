"use client";

import { Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  coursesApi,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  EnumValueEntry,
  ProfileAttribute,
  StudentAttributeListValue,
  StudentAttributeValue,
} from "@trackdev/types";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";

interface StudentAttributesProps {
  courseId: number;
  userId: string;
}

interface AttributeRow {
  attribute: ProfileAttribute;
  currentValue: StudentAttributeValue | null;
}

interface ListEditItem {
  enumValue: string;
  stringValue: string;
}

export const StudentAttributes = memo(function StudentAttributes({
  courseId,
  userId,
}: StudentAttributesProps) {
  const t = useTranslations("studentProfile");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [editingAttr, setEditingAttr] = useState<AttributeRow | null>(null);
  const [modalValue, setModalValue] = useState("");

  // LIST attribute state
  const [editingListAttr, setEditingListAttr] =
    useState<ProfileAttribute | null>(null);
  const [listItems, setListItems] = useState<ListEditItem[]>([]);
  const [listDataCache, setListDataCache] = useState<
    Record<number, StudentAttributeListValue>
  >({});

  // Fetch current attribute values for the student
  const {
    data: attributeValues,
    isLoading: isLoadingValues,
    refetch: refetchValues,
  } = useQuery(
    () => coursesApi.getStudentAttributeValues(courseId, userId),
    [courseId, userId],
    { enabled: !!courseId && !!userId },
  );

  // Fetch available student-targeted attributes from the course profile
  const { data: availableAttributes, isLoading: isLoadingAttributes } =
    useQuery(
      () => coursesApi.getAvailableStudentAttributes(courseId),
      [courseId],
      { enabled: !!courseId },
    );

  // Fetch list attribute data for all LIST-type attributes
  const listAttributes = (availableAttributes || []).filter(
    (attr) => attr.type === "LIST",
  );

  const fetchListData = useCallback(async () => {
    if (listAttributes.length === 0) return;
    const results: Record<number, StudentAttributeListValue> = {};
    await Promise.all(
      listAttributes.map(async (attr) => {
        try {
          const data = await coursesApi.getStudentListAttributeValues(
            courseId,
            userId,
            attr.id,
          );
          results[attr.id] = data;
        } catch {
          // Attribute might not have values yet
        }
      }),
    );
    setListDataCache(results);
  }, [courseId, userId, listAttributes.length]);

  useEffect(() => {
    if (listAttributes.length > 0) {
      fetchListData();
    }
  }, [availableAttributes, courseId, userId]);

  // Mutation to set/update attribute value
  const setValueMutation = useMutation(
    ({ attributeId, value }: { attributeId: number; value: string | null }) =>
      coursesApi.setStudentAttributeValue(courseId, userId, attributeId, {
        value,
      }),
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
    (attributeId: number) =>
      coursesApi.deleteStudentAttributeValue(courseId, userId, attributeId),
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

  // Mutation for LIST attribute values
  const setListValueMutation = useMutation(
    ({
      attributeId,
      items,
    }: {
      attributeId: number;
      items: { enumValue?: string; stringValue: string }[];
    }) =>
      coursesApi.setStudentListAttributeValues(courseId, userId, attributeId, {
        items,
      }),
    {
      onSuccess: (data) => {
        setListDataCache((prev) => ({ ...prev, [data.attributeId]: data }));
        setEditingListAttr(null);
        setListItems([]);
        toast.success(t("listValueSaved"));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("listValueError");
        toast.error(errorMessage);
      },
    },
  );

  const deleteListValueMutation = useMutation(
    (attributeId: number) =>
      coursesApi.deleteStudentListAttributeValues(courseId, userId, attributeId),
    {
      onSuccess: () => {
        if (editingListAttr) {
          setListDataCache((prev) => {
            const next = { ...prev };
            delete next[editingListAttr.id];
            return next;
          });
        }
        setEditingListAttr(null);
        setListItems([]);
        toast.success(t("listValueDeleted"));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("listValueDeleteError");
        toast.error(errorMessage);
      },
    },
  );

  // Build unified list of scalar (non-LIST) attributes with their current values
  const scalarAttributes = (availableAttributes || []).filter(
    (attr) => attr.type !== "LIST",
  );
  const attributeRows: AttributeRow[] = scalarAttributes.map((attr) => {
    const currentValue =
      attributeValues?.find((val) => val.attributeId === attr.id) || null;
    return { attribute: attr, currentValue };
  });

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

  // LIST handlers
  const handleOpenListEdit = (attr: ProfileAttribute) => {
    const cached = listDataCache[attr.id];
    if (cached && cached.items.length > 0) {
      setListItems(
        cached.items.map((item) => ({
          enumValue: item.enumValue || "",
          stringValue: item.stringValue || "",
        })),
      );
    } else {
      setListItems([{ enumValue: "", stringValue: "" }]);
    }
    setEditingListAttr(attr);
  };

  const handleSaveList = () => {
    if (!editingListAttr) return;
    const validItems = listItems.filter(
      (item) => item.stringValue.trim() || item.enumValue.trim(),
    );
    setListValueMutation.mutate({
      attributeId: editingListAttr.id,
      items: validItems.map((item) => ({
        enumValue: item.enumValue || undefined,
        stringValue: item.stringValue,
      })),
    });
  };

  const handleDeleteList = () => {
    if (editingListAttr) {
      deleteListValueMutation.mutate(editingListAttr.id);
    }
  };

  const handleCloseListModal = () => {
    setEditingListAttr(null);
    setListItems([]);
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
            {t("attributes")}
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

  const hasEnumRef = (attr: ProfileAttribute) =>
    attr.enumRefId != null || attr.enumRefName != null;

  return (
    <>
      {/* Scalar attributes card */}
      {attributeRows.length > 0 && (
        <div className="card">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("attributes")}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {attributeRows.map((row) => {
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
                  <button
                    onClick={() => handleOpenEdit(row)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                    title={tCommon("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST attributes cards */}
      {listAttributes.map((attr) => {
        const cached = listDataCache[attr.id];
        const items = cached?.items || [];
        const isEnumList = hasEnumRef(attr);

        return (
          <div key={attr.id} className="card mt-4">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {attr.name}
              </h2>
              <button
                onClick={() => handleOpenListEdit(attr)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                title={tCommon("edit")}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            {items.length === 0 ? (
              <div className="px-6 py-4 text-center text-sm italic text-gray-400 dark:text-gray-500">
                {t("noListItems")}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, idx) => (
                  <div key={idx} className="px-6 py-2 flex items-center gap-3">
                    {isEnumList && item.enumValue && (
                      <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 shrink-0">
                        {item.enumValue}
                      </span>
                    )}
                    <span className="text-sm text-gray-900 dark:text-white">
                      {item.stringValue}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Scalar edit modal */}
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

      {/* LIST edit modal */}
      {editingListAttr && (
        <Modal
          isOpen={true}
          onClose={handleCloseListModal}
          title={editingListAttr.name}
          maxWidth="md"
        >
          <div className="space-y-4">
            {/* List items editor */}
            <div className="space-y-2">
              {listItems.map((item, idx) => {
                const isEnumList = hasEnumRef(editingListAttr);
                const enumValues =
                  listDataCache[editingListAttr.id]?.enumValues ||
                  editingListAttr.enumValues ||
                  [];

                return (
                  <div key={idx} className="flex items-center gap-2">
                    {isEnumList && (
                      <select
                        value={item.enumValue}
                        onChange={(e) => {
                          const updated = [...listItems];
                          updated[idx] = {
                            ...updated[idx],
                            enumValue: e.target.value,
                          };
                          setListItems(updated);
                        }}
                        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 w-1/3"
                      >
                        <option value="">{t("selectCategory")}</option>
                        {enumValues.map((ev) => (
                          <option key={ev.value} value={ev.value}>
                            {ev.value}
                          </option>
                        ))}
                      </select>
                    )}
                    <input
                      type="text"
                      value={item.stringValue}
                      onChange={(e) => {
                        const updated = [...listItems];
                        updated[idx] = {
                          ...updated[idx],
                          stringValue: e.target.value,
                        };
                        setListItems(updated);
                      }}
                      placeholder={t("enterValue")}
                      className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
                    />
                    {listItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setListItems(listItems.filter((_, i) => i !== idx))
                        }
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                setListItems([...listItems, { enumValue: "", stringValue: "" }])
              }
              className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <Plus className="h-3 w-3" />
              {t("addListItem")}
            </button>

            <div className="flex items-center justify-between pt-2">
              {/* Delete all button (only if items exist) */}
              {listDataCache[editingListAttr.id]?.items?.length > 0 ? (
                <button
                  onClick={handleDeleteList}
                  disabled={deleteListValueMutation.isLoading}
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  {deleteListValueMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {t("clearList")}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseListModal}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  onClick={handleSaveList}
                  disabled={setListValueMutation.isLoading}
                  className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {setListValueMutation.isLoading ? (
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
