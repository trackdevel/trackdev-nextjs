"use client";

import { coursesApi, useAuth, useQuery } from "@trackdev/api-client";
import type { Course } from "@trackdev/types";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FolderKanban,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface CourseCardContentProps {
  course: Course;
  showDetailsLink: boolean;
}

function CourseCardContent({
  course,
  showDetailsLink,
}: CourseCardContentProps) {
  const t = useTranslations("courses");
  const tProjects = useTranslations("projects");
  const { user } = useAuth();
  const isStudent = user?.roles?.includes("STUDENT");

  return (
    <>
      {/* Course Header */}
      <div className="bg-primary-600 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 truncate">
            <h3 className="truncate font-semibold text-white">
              {course.subject?.name || t("course")}
            </h3>
            <p className="text-sm text-white/80">
              {course.startYear} - {(course.startYear || 0) + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Course Body */}
      <div className="p-4">
        {isStudent ? (
          /* Student View - Show only enrolled projects */
          <>
            <div className="mb-2 text-sm font-medium text-gray-700">
              {tProjects("myProjects")}
            </div>
            {course.enrolledProjects && course.enrolledProjects.length > 0 ? (
              <ul className="space-y-2">
                {course.enrolledProjects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="flex items-center gap-2 rounded-md p-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <FolderKanban className="h-4 w-4" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">{tProjects("noProjects")}</p>
            )}
          </>
        ) : (
          /* Professor/Admin View - Show full info */
          <>
            <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FolderKanban className="h-4 w-4" />
                <span>
                  {t("projectCount", { count: course.projectCount ?? 0 })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{course.startYear}</span>
              </div>
            </div>

            {/* GitHub Organization */}
            {course.githubOrganization && (
              <p className="mb-4 truncate text-sm text-gray-500">
                GitHub: {course.githubOrganization}
              </p>
            )}

            {/* View Details Button - only for professors/admins */}
            {showDetailsLink && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-primary-600 group-hover:text-primary-700">
                  {t("viewDetails")}
                </span>
                <ArrowRight className="h-4 w-4 text-primary-600 transition-transform group-hover:translate-x-1" />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function CoursesPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("courses");

  const {
    data: coursesResponse,
    isLoading,
    error,
  } = useQuery(() => coursesApi.getAll(), [], { enabled: isAuthenticated });

  // Extract courses from wrapped response
  const courses = coursesResponse?.courses || [];

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");
  const canViewCourseDetails = isAdmin || isProfessor;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-gray-600">
            {isProfessor || isAdmin
              ? t("adminProfessorSubtitle")
              : t("studentSubtitle")}
          </p>
        </div>
        {(isProfessor || isAdmin) && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("newCourse")}
          </button>
        )}
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="card px-6 py-12 text-center text-red-600">
          {t("failedToLoad")}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) =>
            canViewCourseDetails ? (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="card group overflow-hidden transition-shadow hover:shadow-md"
              >
                <CourseCardContent course={course} showDetailsLink={true} />
              </Link>
            ) : (
              <div key={course.id} className="card overflow-hidden">
                <CourseCardContent course={course} showDetailsLink={false} />
              </div>
            )
          )}
        </div>
      ) : (
        <div className="card px-6 py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t("noCourses")}
          </h3>
          <p className="mt-2 text-gray-500">
            {isProfessor || isAdmin
              ? t("noCoursesAdminProfessor")
              : t("noCoursesStudent")}
          </p>
          {(isProfessor || isAdmin) && (
            <button className="btn-primary mt-4">
              <Plus className="mr-2 h-4 w-4" />
              {t("createFirstCourse")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
