"use client";

import { BackButton } from "@/components/BackButton";
import {
  EmptyState,
  FormError,
  FormField,
  LinkCard,
  LoadingContainer,
  Modal,
  SimplePagination,
  StatusBadge,
} from "@/components/ui";
import {
  coursesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  IdObject,
  ProjectCreateRequest,
  UserPublic,
} from "@trackdev/types";
import { FolderKanban, Plus, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const ITEMS_PER_PAGE = 9;

export default function CourseProjectsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: course,
    isLoading,
    error,
    refetch,
  } = useQuery(() => coursesApi.getDetails(courseId), [courseId], {
    enabled: !!courseId,
  });

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");
  const canManage = isAdmin || (isProfessor && course?.ownerId === user?.id);

  const projects = course?.projects || [];

  // Pagination
  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const paginatedProjects = projects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return <LoadingContainer className="py-12" />;
  }

  if (error || !course) {
    return (
      <div className="p-8">
        <div className="card px-6 py-12 text-center text-red-600">
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
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
              <FolderKanban className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <div className="mt-1 text-gray-600">
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

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Projects will appear here once students create them or you add them."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project) => (
              <LinkCard
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                icon={FolderKanban}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                title={project.name}
                metadata={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>
                        {project.members?.length || 0} member
                        {project.members?.length !== 1 ? "s" : ""}
                      </span>
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
            ))}
          </div>

          {totalPages > 1 && (
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={projects.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="projects"
            />
          )}
        </>
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
  const [projectName, setProjectName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          err instanceof Error ? err.message : "Failed to create project";
        setError(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }
    if (projectName.length < 1 || projectName.length > 100) {
      setError("Project name must be between 1 and 100 characters");
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
        : [...prev, userId]
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
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 p-2">
            {students.length === 0 ? (
              <p className="py-2 text-center text-sm text-gray-500">
                No students enrolled in this course
              </p>
            ) : (
              students.map((student) => (
                <label
                  key={student.id}
                  className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(student.id)}
                    onChange={() => toggleMember(student.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {student.username}
                    </div>
                    <div className="text-xs text-gray-500">{student.email}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedMembers.length > 0 && (
            <p className="mt-2 text-xs text-gray-600">
              {selectedMembers.length} member
              {selectedMembers.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </FormField>

        <FormError message={error} className="mb-4" />

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
