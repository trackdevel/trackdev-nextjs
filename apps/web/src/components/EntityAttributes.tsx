"use client";

import { MarkdownEditor, MarkdownPreview, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { ApiClientError, useMutation, useQuery } from "@trackdev/api-client";
import type {
  EnumValueEntry,
  ListItem,
  ProfileAttribute,
  PullRequestAttributeListValue,
  StudentAttributeListValue,
} from "@trackdev/types";
import { Check, Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useState } from "react";

/**
 * Generic attribute value — works for both Task and PullRequest attribute values.
 */
interface AttributeValue {
  id: number;
  attributeId: number;
  attributeName: string;
  attributeType: string;
  attributeAppliedBy: "STUDENT" | "PROFESSOR";
  value: string | null;
  enumValues?: EnumValueEntry[];
}

type ListValueDTO = StudentAttributeListValue | PullRequestAttributeListValue;

interface EntityAttributesProps {
  entityId: string | number;
  /** Fetch current attribute values */
  fetchValues: () => Promise<AttributeValue[]>;
  /** Fetch available attributes from course profile */
  fetchAvailable: () => Promise<ProfileAttribute[]>;
  /** Set/update a scalar attribute value */
  setValue: (
    attrId: number,
    data: { value: string | null },
  ) => Promise<unknown>;
  /** Delete a scalar attribute value */
  deleteValue: (attrId: number) => Promise<void>;
  /** Fetch LIST attribute items (optional — omit if LIST not supported) */
  fetchListValues?: (attrId: number) => Promise<ListValueDTO>;
  /** Replace all LIST attribute items */
  setListValues?: (
    attrId: number,
    data: {
      items: { enumValue?: string; title: string; description?: string }[];
    },
  ) => Promise<ListValueDTO>;
  /** Delete all LIST attribute items */
  deleteListValues?: (attrId: number) => Promise<void>;
  /** Whether the current user can edit scalar attributes */
  canEditScalar: (appliedBy: "STUDENT" | "PROFESSOR" | undefined) => boolean;
  /** Whether the current user is a professor (for LIST display) */
  isProfessor: boolean;
}

interface AttributeRow {
  attribute: ProfileAttribute;
  currentValue: AttributeValue | null;
}

interface ListEditItem {
  enumValue: string;
  title: string;
  description: string;
}

export const EntityAttributes = memo(function EntityAttributes({
  entityId,
  fetchValues,
  fetchAvailable,
  setValue,
  deleteValue,
  fetchListValues,
  setListValues,
  deleteListValues,
  canEditScalar,
  isProfessor,
}: EntityAttributesProps) {
  const t = useTranslations("attributes");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [editingAttr, setEditingAttr] = useState<AttributeRow | null>(null);
  const [modalValue, setModalValue] = useState("");

  // LIST attribute state
  const [listDataCache, setListDataCache] = useState<
    Record<number, ListValueDTO>
  >({});
  const [editingSingleItem, setEditingSingleItem] = useState<{
    attr: ProfileAttribute;
    index: number; // -1 for new item
    item: ListEditItem;
  } | null>(null);
  const [previewingItem, setPreviewingItem] = useState<ListItem | null>(null);

  // Fetch current attribute values
  const {
    data: attributeValues,
    isLoading: isLoadingValues,
    refetch: refetchValues,
  } = useQuery(fetchValues, [entityId], {
    enabled: !!entityId,
  });

  // Fetch available attributes from the course profile
  const { data: availableAttributes, isLoading: isLoadingAttributes } =
    useQuery(fetchAvailable, [entityId], {
      enabled: !!entityId,
    });

  // Fetch list attribute data for all LIST-type attributes
  const listAttributes = (availableAttributes || []).filter(
    (attr) => attr.type === "LIST",
  );
  const supportsLists = !!fetchListValues && !!setListValues && !!deleteListValues;

  const fetchListData = useCallback(async () => {
    if (!supportsLists || !fetchListValues || listAttributes.length === 0)
      return;
    const results: Record<number, ListValueDTO> = {};
    await Promise.all(
      listAttributes.map(async (attr) => {
        try {
          const data = await fetchListValues(attr.id);
          results[attr.id] = data;
        } catch {
          // Attribute might not have values yet
        }
      }),
    );
    setListDataCache(results);
  }, [entityId, supportsLists, listAttributes.length]);

  useEffect(() => {
    if (supportsLists && listAttributes.length > 0) {
      fetchListData();
    }
  }, [availableAttributes, entityId]);

  // Mutation to set/update scalar attribute value
  const setValueMutation = useMutation(
    ({ attributeId, value }: { attributeId: number; value: string | null }) =>
      setValue(attributeId, { value }),
    {
      onSuccess: () => {
        refetchValues();
        setEditingAttr(null);
        setModalValue("");
        toast.success(t("valueSaved"));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("valueError");
        toast.error(errorMessage);
      },
    },
  );

  // Mutation to delete scalar attribute value
  const deleteValueMutation = useMutation(
    (attributeId: number) => deleteValue(attributeId),
    {
      onSuccess: () => {
        refetchValues();
        setEditingAttr(null);
        toast.success(t("valueDeleted"));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("valueDeleteError");
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
      items: { enumValue?: string; title: string; description?: string }[];
    }) => setListValues!(attributeId, { items }),
    {
      onSuccess: (data) => {
        setListDataCache((prev) => ({ ...prev, [data.attributeId]: data }));
        setEditingSingleItem(null);
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
    (attributeId: number) => deleteListValues!(attributeId),
    {
      onSuccess: () => {
        if (editingSingleItem) {
          setListDataCache((prev) => {
            const next = { ...prev };
            delete next[editingSingleItem.attr.id];
            return next;
          });
        }
        setEditingSingleItem(null);
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

  // LIST handlers — single-item editing
  const handleOpenItemEdit = (
    attr: ProfileAttribute,
    item: ListItem,
    index: number,
  ) => {
    setEditingSingleItem({
      attr,
      index,
      item: {
        enumValue: item.enumValue || "",
        title: item.title || "",
        description: item.description || "",
      },
    });
  };

  const handleAddItem = (attr: ProfileAttribute) => {
    setEditingSingleItem({
      attr,
      index: -1,
      item: { enumValue: "", title: "", description: "" },
    });
  };

  const handleSaveItem = () => {
    if (!editingSingleItem) return;
    const { attr, index, item } = editingSingleItem;
    if (!item.title.trim() && !item.enumValue.trim()) return;

    const cached = listDataCache[attr.id];
    const currentItems = cached?.items || [];

    const mapItem = (i: ListItem) => ({
      enumValue: i.enumValue || undefined,
      title: i.title,
      description: i.description || undefined,
    });

    let updatedItems;
    if (index === -1) {
      updatedItems = [
        ...currentItems.map(mapItem),
        {
          enumValue: item.enumValue || undefined,
          title: item.title,
          description: item.description || undefined,
        },
      ];
    } else {
      updatedItems = currentItems.map((i, idx) =>
        idx === index
          ? {
              enumValue: item.enumValue || undefined,
              title: item.title,
              description: item.description || undefined,
            }
          : mapItem(i),
      );
    }

    setListValueMutation.mutate({
      attributeId: attr.id,
      items: updatedItems,
    });
  };

  const handleDeleteItem = () => {
    if (!editingSingleItem) return;
    const { attr, index } = editingSingleItem;

    if (index === -1) {
      setEditingSingleItem(null);
      return;
    }

    const cached = listDataCache[attr.id];
    const currentItems = cached?.items || [];
    const remaining = currentItems.filter((_, idx) => idx !== index);

    if (remaining.length === 0) {
      deleteListValueMutation.mutate(attr.id);
    } else {
      setListValueMutation.mutate({
        attributeId: attr.id,
        items: remaining.map((i) => ({
          enumValue: i.enumValue || undefined,
          title: i.title,
          description: i.description || undefined,
        })),
      });
    }
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
            {t("title")}
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
              {t("title")}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {attributeRows.map((row) => {
              const editable = canEditScalar(row.attribute.appliedBy);
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
          </div>
        </div>
      )}

      {/* LIST attributes cards */}
      {supportsLists &&
        isProfessor &&
        listAttributes.map((attr) => {
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
                  onClick={() => handleAddItem(attr)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                  title={t("addListItem")}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {items.length === 0 ? (
                <div className="px-6 py-4 text-center text-sm italic text-gray-400 dark:text-gray-500">
                  {t("noListItems")}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-2 flex items-center gap-3"
                    >
                      {isEnumList && item.enumValue && (
                        <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400 shrink-0">
                          {item.enumValue}
                        </span>
                      )}
                      <span className="text-sm text-gray-900 dark:text-white flex-1">
                        {item.title}
                      </span>
                      {item.description && (
                        <button
                          onClick={() => setPreviewingItem(item)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                          title={t("viewDescription")}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenItemEdit(attr, item, idx)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
                        title={tCommon("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
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

      {/* Single item edit modal */}
      {editingSingleItem && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSingleItem(null)}
          title={
            editingSingleItem.index === -1
              ? t("addListItem")
              : editingSingleItem.attr.name
          }
          maxWidth="2xl"
          resizable
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {hasEnumRef(editingSingleItem.attr) && (
                <select
                  value={editingSingleItem.item.enumValue}
                  onChange={(e) =>
                    setEditingSingleItem((prev) =>
                      prev
                        ? {
                            ...prev,
                            item: { ...prev.item, enumValue: e.target.value },
                          }
                        : null,
                    )
                  }
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 w-1/3"
                >
                  <option value="">{t("selectCategory")}</option>
                  {(
                    listDataCache[editingSingleItem.attr.id]?.enumValues ||
                    editingSingleItem.attr.enumValues ||
                    []
                  ).map((ev) => (
                    <option key={ev.value} value={ev.value}>
                      {ev.value}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={editingSingleItem.item.title}
                onChange={(e) =>
                  setEditingSingleItem((prev) =>
                    prev
                      ? {
                          ...prev,
                          item: { ...prev.item, title: e.target.value },
                        }
                      : null,
                  )
                }
                placeholder={t("enterTitle")}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <MarkdownEditor
              value={editingSingleItem.item.description}
              onChange={(val) =>
                setEditingSingleItem((prev) =>
                  prev
                    ? {
                        ...prev,
                        item: { ...prev.item, description: val },
                      }
                    : null,
                )
              }
              height={200}
              placeholder={t("enterDescription")}
            />
            <div className="flex items-center justify-between pt-2">
              {editingSingleItem.index !== -1 ? (
                <button
                  onClick={handleDeleteItem}
                  disabled={
                    deleteListValueMutation.isLoading ||
                    setListValueMutation.isLoading
                  }
                  className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  {deleteListValueMutation.isLoading ||
                  setListValueMutation.isLoading ? (
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
                  onClick={() => setEditingSingleItem(null)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {tCommon("cancel")}
                </button>
                <button
                  onClick={handleSaveItem}
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

      {/* Markdown preview modal */}
      {previewingItem && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewingItem(null)}
          title={previewingItem.title || t("description")}
          maxWidth="lg"
        >
          <MarkdownPreview source={previewingItem.description || ""} />
        </Modal>
      )}
    </>
  );
});
