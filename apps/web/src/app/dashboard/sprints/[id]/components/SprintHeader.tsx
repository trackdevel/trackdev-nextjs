import { BackButton } from "@/components/BackButton";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Loader2,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { SprintStatusBadge } from "./SprintStatusBadge";

interface SprintHeaderProps {
  sprintMeta: {
    name: string;
    status: string;
    statusText: string;
    startDate: string | null;
    endDate: string | null;
    project: { id: number; name: string } | null;
  };
  isPending: boolean;
  prevSprintId: number | null;
  nextSprintId: number | null;
  onRefresh: () => void;
  onAddTask: () => void;
}

export function SprintHeader({
  sprintMeta,
  isPending,
  prevSprintId,
  nextSprintId,
  onRefresh,
  onAddTask,
}: SprintHeaderProps) {
  const t = useTranslations("sprints");
  const { formatDateTimeRange } = useDateFormat();

  return (
    <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/dashboard/projects" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {sprintMeta.name}
              </h1>
              <SprintStatusBadge
                status={sprintMeta.status}
                statusText={sprintMeta.statusText}
              />
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
              )}
              {/* Sprint Navigation Arrows */}
              <div className="flex items-center gap-1 ml-2">
                {prevSprintId ? (
                  <Link
                    href={`/dashboard/sprints/${prevSprintId}`}
                    className="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title="Previous Sprint"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                ) : (
                  <span className="p-1 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                    <ChevronLeft className="h-5 w-5" />
                  </span>
                )}
                {nextSprintId ? (
                  <Link
                    href={`/dashboard/sprints/${nextSprintId}`}
                    className="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title="Next Sprint"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                ) : (
                  <span className="p-1 text-gray-300 dark:text-gray-600 cursor-not-allowed">
                    <ChevronRight className="h-5 w-5" />
                  </span>
                )}
              </div>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {sprintMeta.project && (
                <Link
                  href={`/dashboard/projects/${sprintMeta.project.id}`}
                  className="flex items-center gap-1 hover:text-primary-600"
                >
                  <FolderKanban className="h-4 w-4" />
                  {sprintMeta.project.name}
                </Link>
              )}
              {sprintMeta.startDate && sprintMeta.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDateTimeRange(
                    sprintMeta.startDate,
                    sprintMeta.endDate,
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="btn-secondary flex items-center gap-2"
            title="Refresh"
          >
            <Loader2
              className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={onAddTask}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("addTask")}
          </button>
        </div>
      </div>
    </div>
  );
}
