"use client";

import { useToast } from "@/components/ui/Toast";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface TaskBadgeProps {
  taskKey: string;
  taskId: number;
}

export function TaskBadge({ taskKey, taskId }: TaskBadgeProps) {
  const t = useTranslations("tasks");
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/tasks/${taskId}`;
    const markdown = `[${taskKey}](${url})`;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast.success(t("taskLinkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("taskLinkCopyError"));
    }
  };

  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-700 dark:text-gray-400">
      <span className="text-gray-500 dark:text-gray-400">{taskKey}</span>
      <button
        onClick={handleCopy}
        className="inline-flex items-center rounded-sm p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:text-gray-300 dark:hover:bg-gray-600 transition-colors"
        title={t("copyTaskLink")}
        type="button"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </button>
    </span>
  );
}
