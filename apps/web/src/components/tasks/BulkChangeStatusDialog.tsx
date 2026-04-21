"use client";

import { Modal } from "@/components/ui/Modal";
import type { TaskStatus } from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useState } from "react";

const STATUS_OPTIONS: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "INPROGRESS",
  "VERIFY",
  "DONE",
];

const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  BACKLOG: "statusBacklog",
  TODO: "statusTodo",
  INPROGRESS: "statusInProgress",
  VERIFY: "statusVerify",
  DONE: "statusDone",
};

interface BulkChangeStatusDialogProps {
  isOpen: boolean;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (status: TaskStatus) => void;
  isExecuting: boolean;
}

export function BulkChangeStatusDialog({
  isOpen,
  selectedCount,
  onClose,
  onConfirm,
  isExecuting,
}: BulkChangeStatusDialogProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const [selected, setSelected] = useState<TaskStatus | null>(null);

  const handleClose = () => {
    if (isExecuting) return;
    setSelected(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("bulkChangeStatusTitle")}
      maxWidth="md"
    >
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {t("bulkChangeStatusDescription", { count: selectedCount })}
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2">
        {STATUS_OPTIONS.map((status) => {
          const isActive = selected === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setSelected(status)}
              disabled={isExecuting}
              className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                isActive
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-200"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="font-medium">{t(STATUS_LABEL_KEYS[status])}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        {t("bulkChangeStatusNote")}
      </p>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={isExecuting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {tCommon("cancel")}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || isExecuting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExecuting ? tCommon("saving") : tCommon("confirm")}
        </button>
      </div>
    </Modal>
  );
}
