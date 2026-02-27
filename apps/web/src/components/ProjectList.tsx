"use client";

import { EmptyState, LoadingContainer } from "@/components/ui";
import { Pagination } from "@/components/ui/Pagination";
import type { Project } from "@trackdev/types";
import { ArrowRight, BookOpen, Calendar, FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

interface ProjectListProps {
  projects: Project[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  error: unknown;
  emptyTitle: string;
  emptyDescription: string;
  showCourseInfo?: boolean;
  renderItemActions?: (project: Project) => ReactNode;
  header?: ReactNode;
}

export function ProjectList({
  projects,
  totalElements,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
  isLoading,
  error,
  emptyTitle,
  emptyDescription,
  showCourseInfo = true,
  renderItemActions,
  header,
}: ProjectListProps) {
  const t = useTranslations("projects");

  if (isLoading) {
    return <LoadingContainer />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600">
        {t("failedToLoad")}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="h-12 w-12" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="card">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {t("allProjects")} ({totalElements})
          </h2>
          {header}
        </div>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {projects.map((project) => (
          <li
            key={project.id}
            className="flex items-center hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="flex flex-1 items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <FolderKanban className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  {showCourseInfo && (
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {project.course
                          ? `${project.course.startYear} - ${
                              project.course.startYear + 1
                            }`
                          : t("noCourse")}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {project.course?.subject?.name || t("noSubject")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Team Members */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {project.members?.slice(0, 4).map((member) => (
                      <div
                        key={member.id}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white"
                        style={{
                          backgroundColor: member.color || "#3b82f6",
                        }}
                        title={member.fullName || member.username}
                      >
                        {member.capitalLetters ||
                          member.fullName?.slice(0, 2).toUpperCase() ||
                          member.username?.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {(project.members?.length || 0) > 4 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium text-gray-600 dark:border-gray-800 dark:bg-gray-600 dark:text-gray-300">
                        +{project.members!.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t("memberCount", {
                      count: project.members?.length || 0,
                    })}
                  </span>
                </div>

                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
            {renderItemActions?.(project)}
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalElements}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemLabel={t("projects")}
      />
    </div>
  );
}
