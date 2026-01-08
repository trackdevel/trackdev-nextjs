"use client";

import { BackButton } from "@/components/BackButton";
import { RecentTasksCard } from "@/components/tasks";
import {
  githubReposApi,
  projectsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  AddGitHubRepoRequest,
  GitHubRepoSummary,
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
  FolderKanban,
  Github,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ManageMembersModal } from "./ManageMembersModal";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const { isAuthenticated, user } = useAuth();
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const tSprints = useTranslations("sprints");
  const tTasks = useTranslations("tasks");

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
  const [formError, setFormError] = useState<string | null>(null);

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
    { enabled: isAuthenticated && !isNaN(projectId) }
  );

  const { data: sprintsResponse } = useQuery(
    () => projectsApi.getSprints(projectId),
    [projectId],
    { enabled: isAuthenticated && !isNaN(projectId) }
  );

  const { data: githubReposResponse, refetch: refetchRepos } = useQuery(
    () => githubReposApi.getAll(projectId),
    [projectId],
    { enabled: isAuthenticated && !isNaN(projectId) }
  );

  // Mutations
  const addRepoMutation = useMutation(
    (data: AddGitHubRepoRequest) => githubReposApi.add(projectId, data),
    {
      onSuccess: () => {
        setShowAddRepoModal(false);
        setRepoForm({ name: "", url: "", accessToken: "" });
        setFormError(null);
        refetchRepos();
      },
      onError: (error) => {
        setFormError(error.message || "Failed to add repository");
      },
    }
  );

  const deleteRepoMutation = useMutation(
    (repoId: number) => githubReposApi.delete(projectId, repoId),
    {
      onSuccess: () => {
        refetchRepos();
      },
    }
  );

  const updateMembersMutation = useMutation(
    (memberIds: string[]) => projectsApi.updateMembers(projectId, memberIds),
    {
      onSuccess: () => {
        refetchProject();
      },
      onError: (error) => {
        alert(error.message || t("failedToUpdateMembers"));
      },
    }
  );

  // Extract tasks array from response object
  const tasks = tasksResponse?.tasks || [];

  // Extract sprints array from response object
  const sprints = sprintsResponse?.sprints || [];

  // Extract github repos
  const githubRepos = githubReposResponse?.repos || [];

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!repoForm.name.trim()) {
      setFormError(t("repoNameRequired"));
      return;
    }
    if (!repoForm.url.trim()) {
      setFormError(t("repoUrlRequired"));
      return;
    }
    if (!repoForm.accessToken.trim()) {
      setFormError(t("accessTokenRequired"));
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
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("teamMembers")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {project.members?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("tasksCompleted")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {completedTasks} / {totalTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                {tSprints("title")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {sprints?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("qualification")}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {project.qualification ?? "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Integration Section */}
      <div className="mb-8">
        <div className="card">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5 text-gray-700" />
              <h2 className="font-semibold text-gray-900">
                {t("githubRepos")} ({githubRepos.length})
              </h2>
            </div>
            <button
              onClick={() => setShowAddRepoModal(true)}
              className="btn-primary flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              {t("addRepository")}
            </button>
          </div>
          {githubRepos.length > 0 ? (
            <ul className="divide-y">
              {githubRepos.map((repo: GitHubRepoSummary) => (
                <li
                  key={repo.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Github className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{repo.name}</p>
                      <p className="text-sm text-gray-500">{repo.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        repo.webhookActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {repo.webhookActive ? t("webhookActive") : t("noWebhook")}
                    </span>
                    <button
                      onClick={() => handleDeleteRepo(repo.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title={t("removeRepository")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <Github className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">{t("noGithubRepos")}</p>
              <p className="text-sm">{t("addRepoToEnable")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Team Members */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-semibold text-gray-900">{t("teamMembers")}</h2>
            {canEditMembers && (
              <button
                onClick={() => setShowManageMembersModal(true)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title={t("editMembers")}
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>
          {project.members && project.members.length > 0 ? (
            <ul className="divide-y">
              {project.members.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: member.color || "#3b82f6" }}
                  >
                    {member.capitalLetters ||
                      member.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.username}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              {t("noTeamMembers")}
            </div>
          )}
        </div>

        {/* Sprints */}
        <div className="card lg:col-span-2">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold text-gray-900">{tSprints("title")}</h2>
          </div>
          {sprints && sprints.length > 0 ? (
            <ul className="divide-y">
              {sprints.map((sprint) => (
                <li key={sprint.id}>
                  <Link
                    href={`/dashboard/sprints/${sprint.id}`}
                    className="block px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            sprint.status === "ACTIVE"
                              ? "bg-green-100"
                              : sprint.status === "CLOSED"
                              ? "bg-gray-100"
                              : "bg-yellow-100"
                          }`}
                        >
                          <Calendar
                            className={`h-5 w-5 ${
                              sprint.status === "ACTIVE"
                                ? "text-green-600"
                                : sprint.status === "CLOSED"
                                ? "text-gray-600"
                                : "text-yellow-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {sprint.label}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sprint.startDate && sprint.endDate
                              ? `${new Date(
                                  sprint.startDate
                                ).toLocaleDateString()} - ${new Date(
                                  sprint.endDate
                                ).toLocaleDateString()}`
                              : t("noDatesSet")}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          sprint.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : sprint.status === "CLOSED"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {sprint.status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              {t("noSprintsCreated")}
            </div>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="mt-8">
        <RecentTasksCard
          tasks={tasks as Task[]}
          showCount
          title={tTasks("recentTasks")}
          viewAllHref={`/dashboard/projects/${projectId}/backlog`}
          emptyTitle={t("noTasksCreated")}
          emptyDescription={t("createTasksInBacklog")}
        />
      </div>

      {/* Add Repository Modal */}
      {showAddRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("addGithubRepository")}
              </h3>
              <button
                onClick={() => {
                  setShowAddRepoModal(false);
                  setFormError(null);
                }}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddRepo} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div>
                <label
                  htmlFor="repoName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("displayName")}
                </label>
                <input
                  type="text"
                  id="repoName"
                  value={repoForm.name}
                  onChange={(e) =>
                    setRepoForm({ ...repoForm, name: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="My Repository"
                />
              </div>

              <div>
                <label
                  htmlFor="repoUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("repositoryUrl")}
                </label>
                <input
                  type="url"
                  id="repoUrl"
                  value={repoForm.url}
                  onChange={(e) =>
                    setRepoForm({ ...repoForm, url: e.target.value })
                  }
                  className="input mt-1"
                  placeholder="https://github.com/owner/repo"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t("fullUrlToRepo")}
                </p>
              </div>

              <div>
                <label
                  htmlFor="accessToken"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("accessToken")}
                </label>
                <div className="relative mt-1">
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
                    onClick={() =>
                      setShowTokenFor(showTokenFor === -1 ? null : -1)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showTokenFor === -1 ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t("accessTokenScopes")}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRepoModal(false);
                    setFormError(null);
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
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {canEditMembers && (
        <ManageMembersModal
          isOpen={showManageMembersModal}
          onClose={() => setShowManageMembersModal(false)}
          currentMembers={project?.members || []}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          isLoading={updateMembersMutation.isLoading}
        />
      )}
    </div>
  );
}
