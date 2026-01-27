"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-yellow-600 hover:bg-yellow-700";

  const iconBgClass =
    variant === "danger"
      ? "bg-red-100 dark:bg-red-900/30"
      : "bg-yellow-100 dark:bg-yellow-900/30";

  const iconClass =
    variant === "danger"
      ? "text-red-600 dark:text-red-400"
      : "text-yellow-600 dark:text-yellow-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBgClass}`}
          >
            <AlertTriangle className={`h-5 w-5 ${iconClass}`} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <p className="mb-6 text-gray-600 dark:text-gray-300">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${confirmButtonClass}`}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
