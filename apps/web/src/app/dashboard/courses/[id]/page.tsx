"use client";

import { BackButton } from "@/components/BackButton";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  coursesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FolderKanban,
  Github,
  Layers,
  Mail,
  Send,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);

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
        <Link
          href={`/dashboard/courses/${courseId}/projects`}
          className="card flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-4">
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
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>

        <Link
          href={`/dashboard/courses/${courseId}/students`}
          className="card flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-4">
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
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>

        {canManage && (
          <Link
            href={`/dashboard/courses/${courseId}/invites`}
            className="card flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
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
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </Link>
        )}
      </div>

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
  const toast = useToast();
  const [entries, setEntries] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const inviteMutation = useMutation(
    (entries: string[]) => coursesApi.sendInvites(courseId, { entries }),
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (err: Error) => {
        const errorMessage =
          err instanceof ApiClientError && (err as ApiClientError).body?.message
            ? (err as ApiClientError).body!.message
            : "Failed to send invitations";
        toast.error(errorMessage);
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Parse entries (newline separated, each can be "Full Name", email OR just email)
    const entryList = entries
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (entryList.length === 0) {
      setValidationError("Please enter at least one entry");
      return;
    }

    // Basic validation: each entry should either be:
    // 1. "Full Name", email format
    // 2. Just an email
    const quotePattern = /^"([^"]+)"\s*,\s*(.+)$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const invalidEntries: string[] = [];

    entryList.forEach((entry) => {
      const match = quotePattern.exec(entry);
      if (match) {
        // Has full name format - validate the email part
        const email = match[2].trim();
        if (!emailPattern.test(email)) {
          invalidEntries.push(entry);
        }
      } else {
        // Plain email - validate it
        if (!emailPattern.test(entry)) {
          invalidEntries.push(entry);
        }
      }
    });

    if (invalidEntries.length > 0) {
      setValidationError(
        `Invalid entries (check email format or use \"Full Name\", email format):\n${invalidEntries
          .slice(0, 3)
          .join("\n")}${invalidEntries.length > 3 ? "\n..." : ""}`
      );
      return;
    }

    inviteMutation.mutate(entryList);
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
              Student Invitations
            </label>
            <textarea
              value={entries}
              onChange={(e) => setEntries(e.target.value)}
              className="h-32 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder='Enter one per line. Formats:&#10;&#10;"John Doe", john.doe@example.com&#10;"Jane Smith", jane@example.com&#10;&#10;Or just emails:&#10;student@example.com'
            />
            <p className="mt-1 text-xs text-gray-500">
              Use \"Full Name\", email format (full name in quotes) or just
              email addresses, one per line
            </p>
          </div>

          {validationError && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
              {validationError}
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
              • Use \"Full Name\", email format to include student names in
              invitations
            </li>
            <li>• Or just enter email addresses (backward compatible)</li>
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
