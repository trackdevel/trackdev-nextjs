"use client";

import { BackButton } from "@/components/BackButton";
import { ProjectList } from "@/components/ProjectList";
import {
  FormField,
  Modal,
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
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const PAGE_SIZE = 15;

export default function CourseProjectsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectToDelete, setProjectToDelete] =
    useState<ProjectWithMembers | null>(null);

  // Fetch course details for header and create modal (students list)
  const {
    data: course,
    isLoading: isCourseLoading,
    error: courseError,
  } = useQuery(() => coursesApi.getDetails(courseId), [courseId], {
    enabled: !!courseId,
  });

  // Fetch projects with server-side pagination
  const {
    data: projectsResponse,
    isLoading: isProjectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useQuery(
    () =>
      projectsApi.getPaginated({
        page: currentPage,
        size: PAGE_SIZE,
        courseId,
      }),
    [currentPage, courseId],
    { enabled: !!courseId },
  );

  const deleteMutation = useMutation<void, number>(
    (projectId: number) => projectsApi.delete(projectId),
    {
      onSuccess: () => {
        toast.success("Project deleted successfully");
        setProjectToDelete(null);
        refetchProjects();
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

  if (isCourseLoading) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center text-gray-500">
          Loading...
        </div>
      </div>
    );
  }

  if (courseError || !course) {
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
      <ProjectList
        projects={projectsResponse?.projects || []}
        totalElements={projectsResponse?.totalElements ?? 0}
        totalPages={projectsResponse?.totalPages ?? 0}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        isLoading={isProjectsLoading}
        error={projectsError}
        emptyTitle="No projects yet"
        emptyDescription="Projects will appear here once students create them or you add them."
        showCourseInfo={false}
        renderItemActions={
          canManage
            ? (project) => (
                <button
                  onClick={() => setProjectToDelete(project as ProjectWithMembers)}
                  className="mr-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )
            : undefined
        }
      />

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
            refetchProjects();
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
