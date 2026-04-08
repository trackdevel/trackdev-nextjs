"use client";

import type { Task } from "@trackdev/types";
import { Loader2, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

interface LinkedTasksSectionProps {
  linkedTasks: Task[];
  canManageLinks: boolean;
  onAddLink: () => void;
  onRemoveLink: (linkedTask: Task) => Promise<void>;
}

export function LinkedTasksSection({
  linkedTasks,
  canManageLinks,
  onAddLink,
  onRemoveLink,
}: LinkedTasksSectionProps) {
  const t = useTranslations("tasks");
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = async (task: Task) => {
    setRemovingId(task.id);
    try {
      await onRemoveLink(task);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="card">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("linkedTasks")}
        </h2>
        {canManageLinks && (
          <button
            onClick={onAddLink}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            title={t("addLink")}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {linkedTasks.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
            {t("noLinkedTasks")}
          </p>
        ) : (
          linkedTasks.map((linked) => (
            <div
              key={linked.id}
              className="px-6 py-3 flex items-center justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/tasks/${linked.id}`}
                  className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400 truncate block"
                >
                  {linked.taskKey || `#${linked.id}`} {linked.name}
                </Link>
              </div>
              {canManageLinks && (
                <button
                  onClick={() => handleRemove(linked)}
                  disabled={removingId === linked.id}
                  className="shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded disabled:opacity-50"
                  title={t("removeLink")}
                >
                  {removingId === linked.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
