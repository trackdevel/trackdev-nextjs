"use client";

import { BackButton } from "@/components/BackButton";
import { RecentTasksCard } from "@/components/tasks";
import {
  CardSection,
  DropdownMenu,
  FormField,
  ItemCard,
  MemberItem,
  Modal,
  StatCard,
  StatusBadge,
  getSprintStatusVariant,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  ApiClientError,
  githubReposApi,
  projectReportsApi,
  projectsApi,
  sprintPatternsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  AddGitHubRepoRequest,
  GitHubRepoSummary,
  Report,
  SprintPattern,
  Task,
} from "@trackdev/types";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit2,
  Eye,
  EyeOff,
  FileBarChart,
  FolderKanban,
  Github,
  Layers,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ManageMembersModal } from "./ManageMembersModal";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const tSprints = useTranslations("sprints");
  const tTasks = useTranslations("tasks");
  const tReports = useTranslations("reports");
  const { formatDateTimeRange } = useDateFormat();

  // Check if user is professor or admin
  const userRoles = user?.roles || [];
  const isProfessor = userRoles.includes("PROFESSOR");
  const isAdmin = userRoles.includes("ADMIN");
  const canEditMembers = isProfessor || isAdmin;

  // Modal state
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [showTokenFor, setShowTokenFor] = useState<number | null>(null);
  const [repoForm, setRepoForm] = useState<AddGitHubRepoRequest>({
    name: "",
    url: "",
    accessToken: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showApplyPatternModal, setShowApplyPatternModal] = useState(false);
  const [selectedPatternId, setSelectedPatternId] = useState<number | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const toast = useToast();

  const {
    data: project,
    isLoading,
    error,
    refetch: refetchProject,
  } = useQuery(() => projectsApi.getById(projectId), [projectId], {
    enabled: isAuthenticated && !isNaN(projectId),
  });

  const { data: tasksResponse } = useQuery(
    () => projectsApi.getTasks(projectId),
    [projectId],
    { enabled: isAuthenticated && !isNaN(projectId) },
  );

  const { data: sprintsResponse } = useQuery(
    () => projectsApi.getSprints(projectId),
    [projectId],
    { enabled: isAuthenticated && !isNaN(projectId) },
  );

  const { data: githubReposResponse, refetch: refetchRepos } = useQuery(
    () => githubReposApi.getAll(projectId),
    [projectId],
    { enabled: isAuthenticated && !isNaN(projectId) },
  );

  const { data: reportsResponse } = useQuery(
    () => projectReportsApi.getAll(projectId),
    [projectId],
    { enabled: isAuthenticated && !isNaN(projectId) },
  );

  // Fetch sprint patterns for the course (only for professors/admins)
  const { data: patternsData } = useQuery(
    () => sprintPatternsApi.getByCourse(project?.course?.id || 0),
    [project?.course?.id],
    {
      enabled:
        isAuthenticated && (isProfessor || isAdmin) && !!project?.course?.id,
    },
  );

  // Mutations
  const addRepoMutation = useMutation(
    (data: AddGitHubRepoRequest) => githubReposApi.add(projectId, data),
    {
      onSuccess: () => {
        setShowAddRepoModal(false);
        setRepoForm({ name: "", url: "", accessToken: "" });
        setValidationError(null);
        refetchRepos();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof ApiClientError && error.body?.message
            ? error.body.message
            : "Failed to add repository";
        toast.error(errorMessage);
      },
    },
  );

  const deleteRepoMutation = useMutation(
    (repoId: number) => githubReposApi.delete(projectId, repoId),
    {
      onSuccess: () => {
        refetchRepos();
      },
    },
  );

  const updateMembersMutation = useMutation(
    (memberIds: string[]) => projectsApi.updateMembers(projectId, memberIds),
    {
      onSuccess: () => {
        refetchProject();
      },
      onError: (error) => {
        const errorMessage =
          error instanceof ApiClientError && error.body?.message
            ? error.body.message
            : t("failedToUpdateMembers");
        toast.error(errorMessage);
      },
    },
  );

  const applyPatternMutation = useMutation(
    (patternId: number) => projectsApi.applySprintPattern(projectId, patternId),
    {
      onSuccess: () => {
        setShowApplyPatternModal(false);
        setSelectedPatternId(null);
        refetchProject();
        toast.success(t("sprintPatternApplied"));
      },
      onError: (error) => {
        const errorMessage =
          error instanceof ApiClientError && error.body?.message
            ? error.body.message
            : t("failedToApplyPattern");
        toast.error(errorMessage);
      },
    },
  );

  const deleteProjectMutation = useMutation(
    () => projectsApi.delete(projectId),
    {
      onSuccess: () => {
        toast.success(t("projectDeleted"));
        // Navigate back to the course projects page
        if (project?.course?.id) {
          router.push(`/dashboard/courses/${project.course.id}/projects`);
        } else {
          router.push("/dashboard/projects");
        }
      },
      onError: (error) => {
        const errorMessage =
          error instanceof ApiClientError && error.body?.message
            ? error.body.message
            : t("failedToDeleteProject");
        toast.error(errorMessage);
      },
    },
  );

  // Extract tasks array from response object
  const tasks = tasksResponse?.tasks || [];

  // Extract sprints array from response object and sort by start date ascending
  const sprints = [...(sprintsResponse?.sprints || [])].sort((a, b) => {
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  // Extract github repos
  const githubRepos = githubReposResponse?.repos || [];

  // Extract reports
  const reports = reportsResponse || [];

  // Extract sprint patterns
  const sprintPatterns = patternsData?.sprintPatterns || [];
  const canApplyPattern =
    (isProfessor || isAdmin) &&
    !project?.sprintPatternId &&
    sprintPatterns.length > 0;

  const handleApplyPattern = () => {
    if (selectedPatternId) {
      applyPatternMutation.mutate(selectedPatternId);
    }
  };

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!repoForm.name.trim()) {
      setValidationError(t("repoNameRequired"));
      return;
    }
    if (!repoForm.url.trim()) {
      setValidationError(t("repoUrlRequired"));
      return;
    }
    if (!repoForm.accessToken.trim()) {
      setValidationError(t("accessTokenRequired"));
      return;
    }

    addRepoMutation.mutate(repoForm);
  };

  const handleDeleteRepo = (repoId: number) => {
    if (confirm(t("confirmRemoveRepo"))) {
      deleteRepoMutation.mutate(repoId);
    }
  };

  const handleAddMember = (userId: string) => {
    const currentMemberIds = project?.members?.map((m) => m.id) || [];
    const updatedMemberIds = [...currentMemberIds, userId];
    updateMembersMutation.mutate(updatedMemberIds);
  };

  const handleRemoveMember = (userId: string) => {
    const currentMemberIds = project?.members?.map((m) => m.id) || [];
    const updatedMemberIds = currentMemberIds.filter((id) => id !== userId);
    updateMembersMutation.mutate(updatedMemberIds);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // Render error state
  if (error || !project) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {t("projectNotFound")}
          </h3>
          <p className="mt-2 text-gray-500">
            {t("projectNotFoundDescription")}
          </p>
          <Link
            href="/dashboard/projects"
            className="btn-primary mt-4 inline-flex"
          >
            {t("backToProjects")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back Button */}
      <BackButton
        fallbackHref="/dashboard/projects"
        label={tCommon("back")}
        className="mb-6"
      />

      {/* Project Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
            <FolderKanban className="h-7 w-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {project.course?.subject?.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {project.course?.startYear}
              </span>
            </div>
          </div>
        </div>

        {/* Actions Menu (Professor only) */}
        {isProfessor && (
          <DropdownMenu
            align="right"
            items={[
              {
                label: tCommon("delete"),
                icon: <Trash2 className="h-4 w-4" />,
                onClick: () => setShowDeleteModal(true),
                variant: "danger",
              },
            ]}
          />
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label={t("teamMembers")}
          value={project.members?.length || 0}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={CheckCircle2}
          label={t("tasksCompleted")}
          value={`${completedTasks} / ${totalTasks}`}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Calendar}
          label={tSprints("title")}
          value={sprints?.length || 0}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={BarChart3}
          label={t("qualification")}
          value={project.qualification ?? "-"}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* GitHub Integration Section */}
      <div className="mb-8">
        <CardSection
          title={t("githubRepos")}
          icon={Github}
          count={githubRepos.length}
          action={
            <button
              onClick={() => setShowAddRepoModal(true)}
              className="btn-primary flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              {t("addRepository")}
            </button>
          }
          isEmpty={githubRepos.length === 0}
          emptyMessage={`${t("noGithubRepos")}. ${t("addRepoToEnable")}`}
        >
          <ul className="divide-y">
            {githubRepos.map((repo: GitHubRepoSummary) => (
              <ItemCard
                key={repo.id}
                icon={Github}
                title={repo.name}
                subtitle={repo.fullName}
                rightContent={
                  <>
                    <StatusBadge
                      label={
                        repo.webhookActive ? t("webhookActive") : t("noWebhook")
                      }
                      variant={repo.webhookActive ? "success" : "neutral"}
                    />
                    <button
                      onClick={() => handleDeleteRepo(repo.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title={t("removeRepository")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                }
              />
            ))}
          </ul>
        </CardSection>
      </div>

      {/* Reports Section */}
      <div className="mb-8">
        <CardSection
          title={tReports("title")}
          icon={FileBarChart}
          count={reports.length}
          isEmpty={reports.length === 0}
          emptyMessage={tReports("noReportsAvailable")}
        >
          <ul className="divide-y">
            {reports.map((report: Report) => (
              <li key={report.id}>
                <Link
                  href={`/dashboard/projects/${projectId}/reports/${report.id}`}
                  className="block transition-colors hover:bg-gray-50"
                >
                  <ItemCard
                    icon={FileBarChart}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-600"
                    title={report.name}
                    subtitle={`${tReports("rows")}: ${
                      report.rowType || "-"
                    } | ${tReports("columns")}: ${report.columnType || "-"}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </CardSection>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Team Members */}
        <CardSection
          title={t("teamMembers")}
          action={
            canEditMembers && (
              <button
                onClick={() => setShowManageMembersModal(true)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title={t("editMembers")}
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )
          }
          isEmpty={!project.members || project.members.length === 0}
          emptyMessage={t("noTeamMembers")}
          className="lg:col-span-1"
        >
          <ul className="divide-y">
            {project.members?.map((member) => (
              <MemberItem
                key={member.id}
                username={member.username}
                email={member.email}
                capitalLetters={member.capitalLetters}
                color={member.color}
              />
            ))}
          </ul>
        </CardSection>

        {/* Sprints */}
        <CardSection
          title={tSprints("title")}
          action={
            canApplyPattern && (
              <button
                onClick={() => setShowApplyPatternModal(true)}
                className="btn-primary flex items-center gap-1 text-sm"
              >
                <Layers className="h-4 w-4" />
                {t("applyPattern")}
              </button>
            )
          }
          isEmpty={!sprints || sprints.length === 0}
          emptyMessage={
            canApplyPattern ? t("noSprintsApplyPattern") : t("noSprintsCreated")
          }
          className="lg:col-span-2"
        >
          <ul className="divide-y">
            {sprints?.map((sprint) => (
              <li key={sprint.id}>
                <Link
                  href={`/dashboard/sprints/${sprint.id}`}
                  className="block transition-colors hover:bg-gray-50"
                >
                  <ItemCard
                    icon={Calendar}
                    iconBgColor={
                      sprint.status === "ACTIVE"
                        ? "bg-green-100"
                        : sprint.status === "CLOSED"
                          ? "bg-gray-100"
                          : "bg-yellow-100"
                    }
                    iconColor={
                      sprint.status === "ACTIVE"
                        ? "text-green-600"
                        : sprint.status === "CLOSED"
                          ? "text-gray-600"
                          : "text-yellow-600"
                    }
                    title={sprint.label}
                    subtitle={
                      sprint.startDate && sprint.endDate
                        ? formatDateTimeRange(sprint.startDate, sprint.endDate)
                        : t("noDatesSet")
                    }
                    rightContent={
                      <StatusBadge
                        label={sprint.status}
                        variant={getSprintStatusVariant(
                          sprint.status as
                            | "ACTIVE"
                            | "CLOSED"
                            | "FUTURE"
                            | "CREATED",
                        )}
                      />
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        </CardSection>
      </div>

      {/* Tasks Section */}
      <div className="mt-8">
        <RecentTasksCard
          tasks={tasks as Task[]}
          showCount
          title={tTasks("recentTasks")}
          viewAllHref={`/dashboard/projects/${projectId}/tasks`}
          emptyTitle={t("noTasksCreated")}
          emptyDescription={t("createTasksInBacklog")}
        />
      </div>

      {/* Add Repository Modal */}
      <Modal
        isOpen={showAddRepoModal}
        onClose={() => {
          setShowAddRepoModal(false);
          setValidationError(null);
        }}
        title={t("addGithubRepository")}
      >
        <form onSubmit={handleAddRepo} className="space-y-4">
          {validationError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {validationError}
            </div>
          )}

          <FormField label={t("displayName")} htmlFor="repoName">
            <input
              type="text"
              id="repoName"
              value={repoForm.name}
              onChange={(e) =>
                setRepoForm({ ...repoForm, name: e.target.value })
              }
              className="input"
              placeholder="My Repository"
            />
          </FormField>

          <FormField
            label={t("repositoryUrl")}
            htmlFor="repoUrl"
            helpText={t("fullUrlToRepo")}
          >
            <input
              type="url"
              id="repoUrl"
              value={repoForm.url}
              onChange={(e) =>
                setRepoForm({ ...repoForm, url: e.target.value })
              }
              className="input"
              placeholder="https://github.com/owner/repo"
            />
          </FormField>

          <FormField
            label={t("accessToken")}
            htmlFor="accessToken"
            helpText={t("accessTokenScopes")}
          >
            <div className="relative">
              <input
                type={showTokenFor === -1 ? "text" : "password"}
                id="accessToken"
                value={repoForm.accessToken}
                onChange={(e) =>
                  setRepoForm({ ...repoForm, accessToken: e.target.value })
                }
                className="input pr-10"
                placeholder="ghp_xxxxxxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowTokenFor(showTokenFor === -1 ? null : -1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
              >
                {showTokenFor === -1 ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAddRepoModal(false);
                setValidationError(null);
              }}
              className="btn-secondary"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={addRepoMutation.isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {addRepoMutation.isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("adding")}
                </>
              ) : (
                <>
                  <Github className="h-4 w-4" />
                  {t("addRepository")}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Apply Sprint Pattern Modal */}
      <Modal
        isOpen={showApplyPatternModal}
        onClose={() => {
          setShowApplyPatternModal(false);
          setSelectedPatternId(null);
        }}
        title={t("applySprintPattern")}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("applyPatternDescription")}
          </p>

          <div className="space-y-2">
            {sprintPatterns.map((pattern: SprintPattern) => (
              <label
                key={pattern.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  selectedPatternId === pattern.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="sprintPattern"
                  value={pattern.id}
                  checked={selectedPatternId === pattern.id}
                  onChange={() => setSelectedPatternId(pattern.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {pattern.name}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {pattern.items.length}{" "}
                    {pattern.items.length === 1 ? "sprint" : "sprints"}
                  </div>
                  <div className="mt-2 space-y-1">
                    {[...pattern.items]
                      .sort((a, b) => {
                        if (!a.startDate) return 1;
                        if (!b.startDate) return -1;
                        return (
                          new Date(a.startDate).getTime() -
                          new Date(b.startDate).getTime()
                        );
                      })
                      .slice(0, 3)
                      .map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center gap-2 text-xs text-gray-500"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                            {idx + 1}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      ))}
                    {pattern.items.length > 3 && (
                      <div className="text-xs text-gray-400">
                        +{pattern.items.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowApplyPatternModal(false);
                setSelectedPatternId(null);
              }}
              className="btn-secondary"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={handleApplyPattern}
              disabled={!selectedPatternId || applyPatternMutation.isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {applyPatternMutation.isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("applying")}
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" />
                  {t("applyPattern")}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Members Modal */}
      {canEditMembers && project?.course?.id && (
        <ManageMembersModal
          isOpen={showManageMembersModal}
          onClose={() => setShowManageMembersModal(false)}
          courseId={project.course.id}
          currentMembers={project?.members || []}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          isLoading={updateMembersMutation.isLoading}
        />
      )}

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t("deleteProject")}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {t("deleteProjectConfirmation")}
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={() => deleteProjectMutation.mutate()}
              disabled={deleteProjectMutation.isLoading}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteProjectMutation.isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {tCommon("deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {tCommon("delete")}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
