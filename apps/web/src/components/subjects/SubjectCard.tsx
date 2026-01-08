"use client";

import type { Course, Subject } from "@trackdev/types";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit2,
  FolderKanban,
  Lock,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface CourseItemProps {
  course: Course;
  canEdit: boolean;
  isOwnCourse: boolean;
  isAdmin: boolean;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}

export function CourseItem({
  course,
  canEdit,
  isOwnCourse,
  isAdmin,
  onEdit,
  onDelete,
}: CourseItemProps) {
  const t = useTranslations("subjects");
  const projectCount = course.projects?.length || 0;

  return (
    <div
      className={`flex items-center justify-between px-6 py-3 hover:bg-gray-50 ${
        !canEdit ? "bg-gray-50/50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded ${
            canEdit ? "bg-green-100" : "bg-gray-100"
          }`}
        >
          {canEdit ? (
            <Calendar className="h-4 w-4 text-green-600" />
          ) : (
            <Lock className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">
              {course.startYear} - {course.startYear + 1}
            </p>
            {!canEdit && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {t("otherProfessor")}
              </span>
            )}
            {isOwnCourse && !isAdmin && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                {t("yourCourse")}
              </span>
            )}
          </div>
          {projectCount > 0 && (
            <p className="text-sm text-gray-500">
              {projectCount} {projectCount === 1 ? t("project") : t("projects")}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canEdit ? (
          <>
            <button
              onClick={() => onEdit(course)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title={t("editCourseTitle")}
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(course)}
              className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title={t("deleteCourseTitle")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">{t("viewOnly")}</span>
        )}
      </div>
    </div>
  );
}

interface SubjectCardProps {
  subject: Subject;
  isExpanded: boolean;
  isAdmin: boolean;
  userId?: string;
  onToggleExpand: (id: number) => void;
  onCreateCourse: (subject: Subject) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
}

export function SubjectCard({
  subject,
  isExpanded,
  isAdmin,
  userId,
  onToggleExpand,
  onCreateCourse,
  onEditSubject,
  onDeleteSubject,
  onEditCourse,
  onDeleteCourse,
}: SubjectCardProps) {
  const t = useTranslations("subjects");
  const courses = subject.courses || [];
  const hasCourses = courses.length > 0;

  const canEditCourse = (course: Course): boolean => {
    if (isAdmin) return true;
    return course.ownerId === userId;
  };

  return (
    <div className="card overflow-hidden">
      {/* Subject Header */}
      <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleExpand(subject.id)}
            className="rounded p-1 hover:bg-gray-200"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <BookOpen className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{subject.name}</h3>
            <p className="text-sm text-gray-500">
              {subject.acronym} • {courses.length}{" "}
              {courses.length === 1 ? t("course") : t("courses")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCreateCourse(subject)}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            {t("addCourse")}
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEditSubject(subject)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title={t("editSubjectTitle")}
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteSubject(subject)}
                className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title={
                  hasCourses
                    ? t("cannotDeleteSubjectWithCourses")
                    : t("deleteSubjectTitle")
                }
                disabled={hasCourses}
              >
                <Trash2
                  className={`h-4 w-4 ${hasCourses ? "opacity-30" : ""}`}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Courses List */}
      {isExpanded && (
        <div className="divide-y">
          {courses.length > 0 ? (
            courses.map((course) => (
              <CourseItem
                key={course.id}
                course={course}
                canEdit={canEditCourse(course)}
                isOwnCourse={course.ownerId === userId}
                isAdmin={isAdmin}
                onEdit={onEditCourse}
                onDelete={onDeleteCourse}
              />
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <FolderKanban className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2">{t("noCoursesYet")}</p>
              <button
                onClick={() => onCreateCourse(subject)}
                className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {t("addFirstCourse")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
