"use client";

import { BackButton } from "@/components/BackButton";
import {
  coursesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  CourseInvite,
  ProjectWithMembers,
  UserPublic,
} from "@trackdev/types";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  Github,
  Layers,
  Mail,
  Plus,
  Send,
  Trash2,
  UserMinus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "projects" | "students" | "invites"
  >("projects");

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
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
          fallbackHref="/dashboard/courses"
          label="Back"
          className="mb-4"
        />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {course.subject?.name || "Course"}
              </h1>
              <div className="mt-1 flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {course.startYear} - {(course.startYear || 0) + 1}
                </span>
                {course.githubOrganization && (
                  <span className="flex items-center gap-1">
                    <Github className="h-4 w-4" />
                    {course.githubOrganization}
                  </span>
                )}
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <Link
                href={`/dashboard/courses/${courseId}/sprint-patterns`}
                className="btn-secondary flex items-center gap-2"
              >
                <Layers className="h-4 w-4" />
                Sprint Patterns
              </Link>
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Invite Students
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <FolderKanban className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {course.projects?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Projects</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {course.students?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Enrolled Students</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
            <Mail className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {course.pendingInvites?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Pending Invites</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab("projects")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "projects"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projects ({course.projects?.length || 0})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
              activeTab === "students"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students ({course.students?.length || 0})
            </span>
          </button>
          {canManage && (
            <button
              onClick={() => setActiveTab("invites")}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === "invites"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Invites ({course.pendingInvites?.length || 0})
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "projects" && (
        <ProjectsTab
          projects={course.projects || []}
          courseId={courseId}
          canManage={canManage}
        />
      )}
      {activeTab === "students" && (
        <StudentsTab
          students={course.students || []}
          courseId={courseId}
          canManage={canManage}
          onRemove={refetch}
        />
      )}
      {activeTab === "invites" && canManage && (
        <InvitesTab
          invites={course.pendingInvites || []}
          courseId={courseId}
          onCancel={refetch}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteStudentsModal
          courseId={courseId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// ==================== Tab Components ====================

function ProjectsTab({
  projects,
  courseId,
  canManage,
}: {
  projects: ProjectWithMembers[];
  courseId: number;
  canManage: boolean;
}) {
  if (projects.length === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No projects yet
        </h3>
        <p className="mt-2 text-gray-500">
          Projects will appear here once students create them or you add them.
        </p>
        {canManage && (
          <Link
            href={`/dashboard/courses/${courseId}/projects/new`}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Project
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/dashboard/projects/${project.id}`}
          className="card overflow-hidden transition-shadow hover:shadow-md"
        >
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">{project.name}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{project.members?.length || 0} members</span>
            </div>
            {project.members && project.members.length > 0 && (
              <div className="mt-3 flex -space-x-2">
                {project.members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white"
                    style={{ backgroundColor: member.color || "#6366f1" }}
                    title={member.username}
                  >
                    {member.capitalLetters ||
                      member.username?.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {(project.members?.length || 0) > 5 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium text-gray-600">
                    +{(project.members?.length || 0) - 5}
                  </div>
                )}
              </div>
            )}
            {project.qualification !== undefined &&
              project.qualification !== null && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Grade:</span>
                  <span className="font-semibold text-primary-600">
                    {project.qualification.toFixed(1)}
                  </span>
                </div>
              )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function StudentsTab({
  students,
  courseId,
  canManage,
  onRemove,
}: {
  students: UserPublic[];
  courseId: number;
  canManage: boolean;
  onRemove: () => void;
}) {
  const removeMutation = useMutation(
    (studentId: string) => coursesApi.removeStudent(courseId, studentId),
    {
      onSuccess: () => onRemove(),
    }
  );

  if (students.length === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No students enrolled
        </h3>
        <p className="mt-2 text-gray-500">
          Invite students to enroll them in this course.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            {canManage && (
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {students.map((student) => (
            <tr key={student.id}>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: student.color || "#6366f1" }}
                  >
                    {student.capitalLetters ||
                      student.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">
                    {student.username}
                  </span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                {student.email}
              </td>
              {canManage && (
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      if (
                        confirm(`Remove ${student.username} from this course?`)
                      ) {
                        removeMutation.mutate(student.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Remove from course"
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvitesTab({
  invites,
  courseId,
  onCancel,
}: {
  invites: CourseInvite[];
  courseId: number;
  onCancel: () => void;
}) {
  const cancelMutation = useMutation(
    (inviteId: number) => coursesApi.cancelInvite(courseId, inviteId),
    {
      onSuccess: () => onCancel(),
    }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ACCEPTED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "EXPIRED":
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (invites.length === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No pending invites
        </h3>
        <p className="mt-2 text-gray-500">
          Send invitations to students to enroll them in this course.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Sent
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Expires
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                {invite.email}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                    invite.status
                  )}`}
                >
                  {getStatusIcon(invite.status)}
                  {invite.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {new Date(invite.createdAt).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {invite.expiresAt
                  ? new Date(invite.expiresAt).toLocaleDateString()
                  : "-"}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right">
                {invite.status === "PENDING" && (
                  <button
                    onClick={() => {
                      if (confirm(`Cancel invitation to ${invite.email}?`)) {
                        cancelMutation.mutate(invite.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Cancel invitation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==================== Invite Modal ====================

function InviteStudentsModal({
  courseId,
  onClose,
  onSuccess,
}: {
  courseId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inviteMutation = useMutation(
    (emailList: string[]) =>
      coursesApi.sendInvites(courseId, { emails: emailList }),
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (err: Error) => {
        setError(err.message || "Failed to send invitations");
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Parse emails (comma, semicolon, newline, or space separated)
    const emailList = emails
      .split(/[,;\s\n]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    if (emailList.length === 0) {
      setError("Please enter at least one email address");
      return;
    }

    // Basic email validation
    const invalidEmails = emailList.filter(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    inviteMutation.mutate(emailList);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Invite Students
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email Addresses
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Enter email addresses, one per line or separated by commas&#10;&#10;student1@example.com&#10;student2@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple emails with commas, semicolons, or new lines
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {inviteMutation.isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Invitations
            </button>
          </div>
        </form>

        <div className="border-t bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            How it works:
          </h3>
          <ul className="space-y-1 text-xs text-gray-500">
            <li>
              • Each student will receive an email with a unique invitation link
            </li>
            <li>
              • If they already have an account, they will be automatically
              enrolled
            </li>
            <li>
              • If they don&apos;t have an account, they&apos;ll create a
              password to register
            </li>
            <li>• Invitations expire after 30 days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
