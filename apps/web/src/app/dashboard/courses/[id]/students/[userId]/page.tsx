"use client";

import { BackButton } from "@/components/BackButton";
import {
  coursesApi,
  projectsApi,
  useAuth,
  usersApi,
  useQuery,
} from "@trackdev/api-client";
import type { Task } from "@trackdev/types";
import {
  AlertCircle,
  BookOpen,
  ClipboardList,
  FolderOpen,
  Loader2,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { StudentAttributes } from "./components/StudentAttributes";

// Status badge colors (same pattern as task detail)
const STATUS_STYLES: Record<string, string> = {
  BACKLOG: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  TODO: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  INPROGRESS:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  VERIFY:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "statusBacklog",
  TODO: "statusTodo",
  INPROGRESS: "statusInProgress",
  VERIFY: "statusVerify",
  DONE: "statusDone",
};

interface TaskWithProject extends Task {
  projectName: string;
  projectId: number;
}

export default function StudentProfilePage() {
  const params = useParams();
  const courseId = Number(params.id);
  const userId = params.userId as string;
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("studentProfile");
  const tTasks = useTranslations("tasks");

  const isProfessor = user?.roles?.includes("PROFESSOR") ?? false;
  const isAdmin = user?.roles?.includes("ADMIN") ?? false;

  // Fetch student info
  const {
    data: student,
    isLoading: isLoadingStudent,
    error: studentError,
  } = useQuery(() => usersApi.getByUuid(userId), [userId], {
    enabled: isAuthenticated && !!userId,
  });

  // Fetch course details (includes projects with members)
  const {
    data: courseDetails,
    isLoading: isLoadingCourse,
    error: courseError,
  } = useQuery(() => coursesApi.getDetails(courseId), [courseId], {
    enabled: isAuthenticated && !!courseId,
  });

  // Find projects where this student is a member
  const studentProjects = useMemo(() => {
    if (!courseDetails?.projects) return [];
    return courseDetails.projects.filter(
      (p) => p.members && p.members.some((m) => m.id === userId),
    );
  }, [courseDetails, userId]);

  // Fetch tasks for each project the student is in
  const [allTasks, setAllTasks] = useState<TaskWithProject[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  useEffect(() => {
    if (studentProjects.length === 0) {
      setAllTasks([]);
      return;
    }

    let cancelled = false;
    setIsLoadingTasks(true);

    Promise.all(
      studentProjects.map((project) =>
        projectsApi.getTasks(project.id).then((response) => ({
          projectId: project.id,
          projectName: project.name,
          tasks: response.tasks,
        })),
      ),
    )
      .then((results) => {
        if (cancelled) return;
        const tasks: TaskWithProject[] = [];
        for (const result of results) {
          for (const task of result.tasks) {
            if (task.assignee?.id === userId) {
              tasks.push({
                ...task,
                projectName: result.projectName,
                projectId: result.projectId,
              });
            }
          }
        }
        setAllTasks(tasks);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTasks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentProjects, userId]);

  const isLoading = isLoadingStudent || isLoadingCourse;
  const error = studentError || courseError;

  // Access check: only professors and admins
  if (isAuthenticated && !isProfessor && !isAdmin) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Access denied
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-8">
        <BackButton
          fallbackHref={`/dashboard/courses/${courseId}`}
          className="mb-4"
        />
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("errorLoading")}
          </p>
        </div>
      </div>
    );
  }

  const courseName = courseDetails?.subject?.name
    ? `${courseDetails.subject.name} ${courseDetails.startYear}-${(courseDetails.startYear || 0) + 1}`
    : "";

  return (
    <div className="p-8">
      {/* Back button */}
      <BackButton
        fallbackHref={`/dashboard/courses/${courseId}/students`}
        className="mb-6"
      />

      {/* Header: Avatar + Name + Email */}
      <div className="mb-8 flex items-start gap-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white shrink-0"
          style={{ backgroundColor: student.color || "#3b82f6" }}
        >
          {student.capitalLetters ||
            student.fullName?.slice(0, 2).toUpperCase() ||
            student.username?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {student.fullName || student.username}
          </h1>
          {student.email && (
            <div className="mt-1 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Mail className="h-4 w-4" />
              <span>{student.email}</span>
            </div>
          )}
          {courseName && (
            <div className="mt-1 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <BookOpen className="h-4 w-4" />
              <span>{courseName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Projects + Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="card">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("projects")}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({studentProjects.length})
              </span>
            </div>
            {studentProjects.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("noProjects")}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {studentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-center px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                      {project.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Tasks */}
          <div className="card">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {t("assignedTasks")}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({allTasks.length})
              </span>
            </div>
            {isLoadingTasks ? (
              <div className="px-6 py-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : allTasks.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("noTasks")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {t("taskName")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {t("project")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {t("sprint")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {t("status")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {allTasks.map((task) => (
                      <tr key={task.id}>
                        <td className="whitespace-nowrap px-6 py-3">
                          <Link
                            href={`/dashboard/tasks/${task.id}`}
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                          >
                            {task.taskKey
                              ? `${task.taskKey} - ${task.name}`
                              : task.name}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <Link
                            href={`/dashboard/projects/${task.projectId}`}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {task.projectName}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {task.activeSprints && task.activeSprints.length > 0
                            ? task.activeSprints
                                .map((s) => s.name)
                                .join(", ")
                            : t("noSprint")}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] || STATUS_STYLES.TODO}`}
                          >
                            {tTasks(STATUS_LABELS[task.status] || task.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Student Attributes */}
        <div>
          <StudentAttributes courseId={courseId} userId={userId} />
        </div>
      </div>
    </div>
  );
}
