"use client";

import {
  EmptyState,
  LoadingContainer,
  PageContainer,
  PageHeader,
} from "@/components/ui";
import { projectsApi, useAuth, useQuery } from "@trackdev/api-client";
import { ArrowRight, BookOpen, Calendar, FolderKanban } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function ProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("projects");

  const {
    data: projectsResponse,
    isLoading,
    error,
  } = useQuery(() => projectsApi.getAll(), [], { enabled: isAuthenticated });

  // Extract projects from wrapped response
  const projects = projectsResponse?.projects || [];

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={
          isProfessor || isAdmin
            ? t("adminProfessorSubtitle")
            : t("studentSubtitle")
        }
      />

      {/* Projects List */}
      {isLoading ? (
        <LoadingContainer />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600">
          {t("failedToLoad")}
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="card">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("allProjects")} ({projects.length})
              </h2>
            </div>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                      <FolderKanban className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
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
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title={t("noProjects")}
          description={
            isProfessor || isAdmin
              ? t("noProjectsAdminProfessor")
              : t("noProjectsStudent")
          }
        />
      )}
    </PageContainer>
  );
}
