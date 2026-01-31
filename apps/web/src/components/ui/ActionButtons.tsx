"use client";

import { Pencil, Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
  showEdit?: boolean;
  showDelete?: boolean;
}

/**
 * Reusable action buttons for table rows (Edit/Delete).
 * Provides consistent styling and icons across the application.
 */
export function ActionButtons({
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  showEdit = true,
  showDelete = true,
}: ActionButtonsProps) {
  return (
    <div className="flex gap-2">
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
          title={editLabel}
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="rounded-sm p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
          title={deleteLabel}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
