"use client";

import { Check, FileText, Loader2, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import type { EditState } from "../types";

interface TaskDescriptionProps {
  description: string | undefined;
  editState: EditState;
  canEdit: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDescriptionChange: (value: string) => void;
}

export const TaskDescription = memo(function TaskDescription({
  description,
  editState,
  canEdit,
  onStartEdit,
  onSave,
  onCancel,
  onDescriptionChange,
}: TaskDescriptionProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");

  return (
    <div className="card">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("description")}
        </h2>
        {canEdit && editState.field !== "description" && (
          <button
            onClick={onStartEdit}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={tCommon("edit")}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="px-6 py-4">
        {editState.field === "description" ? (
          <div className="space-y-3">
            <textarea
              value={editState.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full min-h-[150px] text-gray-700 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              autoFocus
              placeholder={t("addDescription")}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={editState.isSaving}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {editState.isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {tCommon("save")}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={editState.isSaving}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                {tCommon("cancel")}
              </button>
            </div>
          </div>
        ) : description ? (
          <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
        ) : (
          <p className="text-gray-500 italic">{t("noDescriptionProvided")}</p>
        )}
      </div>
    </div>
  );
});
