"use client";

import { ListItem, MemberAvatars } from "@/components/dashboard";
import { RecentTasksCard } from "@/components/tasks";
import {
  Badge,
  ContentCard,
  EmptyState,
  ErrorMessage,
  LoadingContainer,
  StatCard,
} from "@/components/ui";
import {
  coursesApi,
  projectsApi,
  sprintsApi,
  tasksApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { Course, Project, Sprint, Task } from "@trackdev/types";
import { BookOpen, Calendar, FolderKanban, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const tCourses = useTranslations("courses");
  const tSprints = useTranslations("sprints");
  const tTasks = useTranslations("tasks");

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");
  const isStudent = userRoles.includes("STUDENT") && !isProfessor && !isAdmin;

  // Courses - only fetch for admin/professor (students get their courses from projects)
  const {
    data: coursesResponse,
    isLoading: coursesLoading,
    error: coursesErrorData,
    refetch: refetchCourses,
  } = useQuery(() => coursesApi.getAll(), [], {
    enabled: isAuthenticated && (isAdmin || isProfessor),
  });

  const {
    data: projectsResponse,
    isLoading: projectsLoading,
    error: projectsErrorData,
    refetch: refetchProjects,
  } = useQuery(() => projectsApi.getAll(), [], { enabled: isAuthenticated });

  // Sprints - fetch for admin only (students get active sprints from projects)
  const {
    data: sprintsResponse,
    isLoading: sprintsLoading,
    error: sprintsErrorData,
    refetch: refetchSprints,
  } = useQuery(() => sprintsApi.getAll(), [], {
    enabled: isAuthenticated && isAdmin,
  });

  // Recent tasks - fetch for all users
  const {
    data: recentTasksResponse,
    isLoading: tasksLoading,
    error: tasksErrorData,
    refetch: refetchTasks,
  } = useQuery(() => tasksApi.getRecent(), [], { enabled: isAuthenticated });

  // Extract data from wrapped responses
  const courses = coursesResponse?.courses || [];
  const projects = projectsResponse?.projects || [];
  const sprints = sprintsResponse?.sprints || [];
  const recentTasks = recentTasksResponse?.tasks || [];

  // For students, derive courses from projects
  const uniqueCoursesFromProjects = useMemo(() => {
    if (!isStudent) return [];
    const courseMap = new Map<number, Course>();
    projects.forEach((p) => {
      if (p.course?.id) {
        courseMap.set(p.course.id, p.course as Course);
      }
    });
    return Array.from(courseMap.values());
  }, [projects, isStudent]);

  // For students, get active sprints with their project info, sorted by start date
  const activeSprintsWithProjects = useMemo(() => {
    if (!isStudent) return [];
    const result: Array<{
      sprint: Sprint;
      project: Project;
    }> = [];
    projects.forEach((p) => {
      if (p.sprints) {
        (p.sprints as Sprint[])
          .filter((s) => s.status === "ACTIVE")
          .forEach((sprint) => {
            result.push({ sprint, project: p as Project });
          });
      }
    });
    // Sort by sprint start date ascending
    return result.sort((a, b) => {
      if (!a.sprint.startDate) return 1;
      if (!b.sprint.startDate) return -1;
      return (
        new Date(a.sprint.startDate).getTime() -
        new Date(b.sprint.startDate).getTime()
      );
    });
  }, [projects, isStudent]);

  // Calculate active sprints count
  const activeSprintsCount = useMemo(() => {
    if (isAdmin) {
      return sprints.filter((s) => s.status === "ACTIVE").length;
    }
    // For students and professors, count active sprints from projects
    let count = 0;
    projects.forEach((p) => {
      if (p.sprints) {
        count += p.sprints.filter((s) => s.status === "ACTIVE").length;
      }
    });
    return count;
  }, [projects, sprints, isAdmin]);

  const isLoading =
    coursesLoading || projectsLoading || sprintsLoading || tasksLoading;

  // Check if any request has a critical error (network, timeout, auth)
  const criticalError = [
    projectsErrorData,
    tasksErrorData,
    coursesErrorData,
    sprintsErrorData,
  ].find((e) => e && (e.isNetworkError || e.isTimeout || e.status === 401));

  const handleRetryAll = () => {
    refetchProjects();
    refetchTasks();
    if (isAdmin || isProfessor) refetchCourses();
    if (isAdmin) refetchSprints();
  };

  // Calculate stats
  const totalProjects = projects?.length || 0;
  const totalCourses = isStudent
    ? uniqueCoursesFromProjects.length
    : courses?.length || 0;
  const totalMembers =
    projects?.reduce((acc, p) => acc + (p.members?.length || 0), 0) || 0;

  // Show critical error banner
  if (criticalError && !isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        </div>
        <ErrorMessage
          error={criticalError}
          onRetry={handleRetryAll}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("welcome", { name: user?.fullName || user?.username || "" })}
        </h1>
        <p className="mt-1 text-gray-600">
          {isAdmin && t("adminSubtitle")}
          {isProfessor && !isAdmin && t("professorSubtitle")}
          {isStudent && t("studentSubtitle")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label={tNav("projects")}
          value={totalProjects}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={BookOpen}
          label={tNav("courses")}
          value={totalCourses}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={Users}
          label={isProfessor || isAdmin ? tNav("students") : t("teamMembers")}
          value={totalMembers}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
          isLoading={isLoading}
        />
        <StatCard
          icon={Calendar}
          label={t("activeSprints")}
          value={activeSprintsCount}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Courses Section (Admin/Professor) or Active Sprints Section (Student) */}
        {isStudent ? (
          <ContentCard title={t("activeSprints")}>
            {projectsLoading ? (
              <LoadingContainer />
            ) : activeSprintsWithProjects.length > 0 ? (
              <ul className="divide-y">
                {activeSprintsWithProjects
                  .slice(0, 5)
                  .map(({ sprint, project }) => (
                    <ListItem
                      key={sprint.id}
                      href={`/dashboard/sprints/${sprint.id}`}
                      icon={Calendar}
                      iconBgColor="bg-orange-100"
                      iconColor="text-orange-600"
                      title={sprint.name}
                      subtitle={
                        <>
                          <span className="mr-1 rounded-sm bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                            {project.slug}
                          </span>
                          {project.name}
                        </>
                      }
                      badge={
                        <Badge
                          text={tSprints("statusActive")}
                          variant="success"
                        />
                      }
                    />
                  ))}
              </ul>
            ) : (
              <EmptyState icon={Calendar} title={t("noActiveSprints")} />
            )}
          </ContentCard>
        ) : (
          <ContentCard
            title={t("yourCourses")}
            viewAllHref="/dashboard/courses"
          >
            {coursesLoading ? (
              <LoadingContainer />
            ) : courses && courses.length > 0 ? (
              <ul className="divide-y">
                {courses.slice(0, 5).map((course) => (
                  <ListItem
                    key={course.id}
                    href={`/dashboard/courses/${course.id}`}
                    icon={BookOpen}
                    iconBgColor="bg-primary-100"
                    iconColor="text-primary-600"
                    title={course.subject?.name || tCourses("title")}
                    subtitle={`${course.startYear} - ${
                      (course.startYear || 0) + 1
                    }`}
                    rightContent={
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FolderKanban className="h-4 w-4" />
                        {course.projects?.length || 0}{" "}
                        {tNav("projects").toLowerCase()}
                      </div>
                    }
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={BookOpen}
                title={t("noCoursesFound")}
                description={t("createCourseToStart")}
              />
            )}
          </ContentCard>
        )}

        {/* Projects Section */}
        <ContentCard
          title={
            isProfessor || isAdmin ? t("recentProjects") : t("yourProjects")
          }
          viewAllHref="/dashboard/projects"
        >
          {projectsLoading ? (
            <LoadingContainer />
          ) : projects && projects.length > 0 ? (
            <ul className="divide-y">
              {projects.slice(0, 5).map((project) => (
                <ListItem
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  icon={FolderKanban}
                  iconBgColor="bg-green-100"
                  iconColor="text-green-600"
                  title={project.name}
                  subtitle={project.course?.subject?.name || ""}
                  rightContent={
                    <MemberAvatars members={project.members || []} />
                  }
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title={t("noProjectsFound")}
              description={isStudent ? t("joinCourseToSeeProjects") : undefined}
            />
          )}
        </ContentCard>
      </div>

      {/* Recent Tasks Section */}
      <div className="mt-8">
        <RecentTasksCard
          tasks={recentTasks as Task[]}
          isLoading={tasksLoading}
          title={tTasks("recentTasks")}
          emptyTitle={tTasks("noRecentTasks")}
          emptyDescription={tTasks("tasksAppearHere")}
        />
      </div>
    </div>
  );
}
