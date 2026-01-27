"use client";

import { BackButton } from "@/components/BackButton";
import { Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  coursesApi,
  profilesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { ProfileBasic } from "@trackdev/types";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  FolderKanban,
  Github,
  Layers,
  Mail,
  Send,
  Settings2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showApplyProfileModal, setShowApplyProfileModal] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    null,
  );

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

  // Fetch profiles for professors/admins
  const { data: profilesList } = useQuery(() => profilesApi.getAll(), [], {
    enabled: isAuthenticated && (isProfessor || isAdmin),
  });

  const profiles = profilesList || [];
  const canApplyProfile =
    canManage && !course?.profileId && profiles.length > 0;

  const applyProfileMutation = useMutation(
    (profileId: number) => coursesApi.applyProfile(courseId, profileId),
    {
      onSuccess: () => {
        setShowApplyProfileModal(false);
        setSelectedProfileId(null);
        refetch();
        toast.success("Profile applied successfully");
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : "Failed to apply profile";
        toast.error(errorMessage);
      },
    },
  );

  const handleApplyProfile = () => {
    if (selectedProfileId) {
      applyProfileMutation.mutate(selectedProfileId);
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {course.subject?.name || "Course"}
              </h1>
              <div className="mt-1 flex items-center gap-4 text-gray-600 dark:text-gray-400">
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
              {canApplyProfile && (
                <button
                  onClick={() => setShowApplyProfileModal(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  Apply Profile
                </button>
              )}
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
          className="card flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {course.projects?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Projects</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>

        <Link
          href={`/dashboard/courses/${courseId}/students`}
          className="card flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {course.students?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enrolled Students</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
        </Link>

        {canManage && (
          <Link
            href={`/dashboard/courses/${courseId}/invites`}
            className="card flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Mail className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {course.pendingInvites?.length || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Invites</p>
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

      {/* Apply Profile Modal */}
      {showApplyProfileModal && (
        <Modal
          isOpen={showApplyProfileModal}
          onClose={() => {
            setShowApplyProfileModal(false);
            setSelectedProfileId(null);
          }}
          title="Apply Profile"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a profile to apply to this course. This will configure the
              evaluation criteria for all projects in this course.
            </p>

            {profiles.length === 0 ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No profiles available. Create a profile first.
                </p>
                <Link
                  href="/dashboard/profiles/new"
                  className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700"
                >
                  Create Profile
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile: ProfileBasic) => (
                  <label
                    key={profile.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedProfileId === profile.id
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value={profile.id}
                      checked={selectedProfileId === profile.id}
                      onChange={() => setSelectedProfileId(profile.id)}
                      className="h-4 w-4 text-primary-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profile.name}
                      </p>
                      {profile.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {profile.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowApplyProfileModal(false);
                  setSelectedProfileId(null);
                }}
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyProfile}
                disabled={!selectedProfileId || applyProfileMutation.isLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {applyProfileMutation.isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Settings2 className="h-4 w-4" />
                )}
                Apply Profile
              </button>
            </div>
          </div>
        </Modal>
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
    },
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
          .join("\n")}${invalidEntries.length > 3 ? "\n..." : ""}`,
      );
      return;
    }

    inviteMutation.mutate(entryList);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Invite Students
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Student Invitations
            </label>
            <textarea
              value={entries}
              onChange={(e) => setEntries(e.target.value)}
              className="h-32 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder='Enter one per line. Formats:&#10;&#10;"John Doe", john.doe@example.com&#10;"Jane Smith", jane@example.com&#10;&#10;Or just emails:&#10;student@example.com'
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use \"Full Name\", email format (full name in quotes) or just
              email addresses, one per line
            </p>
          </div>

          {validationError && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400 whitespace-pre-line">
              {validationError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
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

        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            How it works:
          </h3>
          <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
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
