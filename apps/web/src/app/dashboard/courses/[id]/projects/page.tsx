"use client";

import { BackButton } from "@/components/BackButton";
import {
  EmptyState,
  FormField,
  ItemCard,
  LoadingContainer,
  Modal,
  Select,
  SimplePagination,
  StatusBadge,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  coursesApi,
  projectsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  IdObject,
  ProjectCreateRequest,
  ProjectWithMembers,
  UserPublic,
} from "@trackdev/types";
import { FolderKanban, Plus, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const PAGE_SIZE_OPTIONS = [15, 30, 50];
const DEFAULT_PAGE_SIZE = 15;

export default function CourseProjectsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const t = useTranslations("common");
  const tProjects = useTranslations("projects");
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectToDelete, setProjectToDelete] =
    useState<ProjectWithMembers | null>(null);

  const {
    data: course,
    isLoading,
    error,
    refetch,
  } = useQuery(() => coursesApi.getDetails(courseId), [courseId], {
    enabled: !!courseId,
  });

  const deleteMutation = useMutation<void, number>(
    (projectId: number) => projectsApi.delete(projectId),
    {
      onSuccess: () => {
        toast.success("Project deleted successfully");
        setProjectToDelete(null);
        refetch();
      },
      onError: (err: unknown) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : "Failed to delete project";
        toast.error(errorMessage);
      },
    },
  );

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");
  const canManage = isAdmin || (isProfessor && course?.ownerId === user?.id);

  const projects = [...(course?.projects || [])].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  // Pagination
  const totalPages = Math.ceil(projects.length / pageSize);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (isLoading) {
    return <LoadingContainer className="py-12" />;
  }

  if (error || !course) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center text-red-600 dark:text-red-400">
          Failed to load course details. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <BackButton
          fallbackHref={`/dashboard/courses/${courseId}`}
          label="Back to Course"
          className="mb-4"
        />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <FolderKanban className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
              <div className="mt-1 text-gray-600 dark:text-gray-400">
                {course.subject?.name || "Course"} - {course.startYear} -{" "}
                {(course.startYear || 0) + 1}
              </div>
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Projects will appear here once students create them or you add them."
        />
      ) : (
        <>
          {/* Page Size Selector */}
          <div className="mb-4 flex items-center justify-end gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("itemsPerPage")}:
            </span>
            <Select
              value={pageSize.toString()}
              onChange={(value) => handlePageSizeChange(Number(value))}
              options={PAGE_SIZE_OPTIONS.map((size) => ({
                value: size.toString(),
                label: size.toString(),
              }))}
              className="w-20"
            />
          </div>

          {/* Projects Item List */}
          <div className="card divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="block flex-1"
                >
                  <ItemCard
                    icon={FolderKanban}
                    iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                    iconColor="text-blue-600 dark:text-blue-400"
                    title={project.name}
                    subtitle={tProjects("memberCount", {
                      count: project.members?.length || 0,
                    })}
                    rightContent={
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>{project.members?.length || 0}</span>
                        </div>
                        {project.qualification != null && (
                          <StatusBadge
                            label={`${project.qualification.toFixed(1)}/10`}
                            variant="primary"
                          />
                        )}
                      </div>
                    }
                  />
                </Link>
                {canManage && (
                  <button
                    onClick={() => setProjectToDelete(project)}
                    className="mr-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={projects.length}
              itemsPerPage={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="projects"
            />
          )}
        </>
      )}

      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setProjectToDelete(null)}
          title="Delete Project"
          maxWidth="sm"
        >
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the project{" "}
              <strong className="text-gray-900 dark:text-white">{projectToDelete.name}</strong>?
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone. All sprints associated with this
              project will also be deleted.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setProjectToDelete(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(projectToDelete.id)}
              disabled={deleteMutation.isLoading}
              className="btn-danger flex items-center gap-2"
            >
              {deleteMutation.isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          courseId={courseId}
          students={course.students || []}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ==================== Create Project Modal ====================

function CreateProjectModal({
  courseId,
  students,
  onClose,
  onSuccess,
}: {
  courseId: number;
  students: UserPublic[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [projectName, setProjectName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createMutation = useMutation<IdObject, ProjectCreateRequest>(
    (data: ProjectCreateRequest) => coursesApi.createProject(courseId, data),
    {
      onSuccess: (response: IdObject) => {
        onSuccess();
        // Redirect to the newly created project
        router.push(`/dashboard/projects/${response.id}`);
      },
      onError: (err: unknown) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : "Failed to create project";
        toast.error(errorMessage);
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!projectName.trim()) {
      setValidationError("Project name is required");
      return;
    }
    if (projectName.length < 1 || projectName.length > 100) {
      setValidationError("Project name must be between 1 and 100 characters");
      return;
    }

    const data: ProjectCreateRequest = {
      name: projectName.trim(),
      ...(selectedMembers.length > 0 && { members: selectedMembers }),
    };

    createMutation.mutate(data);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Create New Project"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Project Name"
          htmlFor="projectName"
          helpText="Choose a descriptive name for the project (1-100 characters)"
          className="mb-4"
        >
          <input
            type="text"
            id="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="input"
            placeholder="Enter project name"
            maxLength={100}
          />
        </FormField>

        <FormField label="Team Members (Optional)" className="mb-4">
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 p-2 dark:border-gray-600">
            {students.length === 0 ? (
              <p className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                No students enrolled in this course
              </p>
            ) : (
              students.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center gap-3 rounded-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(student.id)}
                    onChange={() => toggleMember(student.id)}
                    className="h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {student.fullName || student.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{student.email}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedMembers.length > 0 && (
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {selectedMembers.length} member
              {selectedMembers.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </FormField>

        {validationError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {validationError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {createMutation.isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
}
