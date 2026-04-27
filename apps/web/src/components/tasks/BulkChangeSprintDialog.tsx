"use client";

import { Modal } from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import { useState } from "react";

export interface SprintOption {
  id: number;
  label: string;
}

interface BulkChangeSprintDialogProps {
  isOpen: boolean;
  selectedCount: number;
  projectName: string;
  sprints: SprintOption[];
  onClose: () => void;
  onConfirm: (sprintId: number | null) => void;
  isExecuting: boolean;
}

const BACKLOG_VALUE = "__backlog__";

export function BulkChangeSprintDialog({
  isOpen,
  selectedCount,
  projectName,
  sprints,
  onClose,
  onConfirm,
  isExecuting,
}: BulkChangeSprintDialogProps) {
  const t = useTranslations("tasks");
  const tCommon = useTranslations("common");
  const [selected, setSelected] = useState<string | null>(null);

  const handleClose = () => {
    if (isExecuting) return;
    setSelected(null);
    onClose();
  };

  const handleConfirm = () => {
    if (selected === null) return;
    if (selected === BACKLOG_VALUE) {
      onConfirm(null);
    } else {
      onConfirm(Number(selected));
    }
  };

  const renderOption = (key: string, label: string) => {
    const isActive = selected === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setSelected(key)}
        disabled={isExecuting}
        className={`rounded-md border px-4 py-3 text-left text-sm transition-colors ${
          isActive
            ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-200"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("bulkChangeSprintTitle")}
      maxWidth="md"
    >
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {t("bulkChangeSprintDescription", {
          count: selectedCount,
          project: projectName,
        })}
      </p>

      <div className="mb-6 grid grid-cols-1 gap-2">
        {renderOption(BACKLOG_VALUE, t("bulkSprintBacklogOption"))}
        {sprints.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            {t("bulkSprintNoSprintsAvailable")}
          </p>
        ) : (
          sprints.map((sprint) =>
            renderOption(String(sprint.id), sprint.label),
          )
        )}
      </div>

      <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
        {t("bulkChangeSprintNote")}
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
          disabled={selected === null || isExecuting}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExecuting ? tCommon("saving") : tCommon("confirm")}
        </button>
      </div>
    </Modal>
  );
}
