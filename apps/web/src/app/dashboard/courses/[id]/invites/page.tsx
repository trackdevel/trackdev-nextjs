"use client";

import { BackButton } from "@/components/BackButton";
import { SimplePagination } from "@/components/ui";
import { useDateFormat } from "@/utils/useDateFormat";
import {
  coursesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { CourseInvite } from "@trackdev/types";
import { CheckCircle2, Clock, Mail, Send, Trash2, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function CourseInvitesPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const { formatDateOnly } = useDateFormat();
  const [currentPage, setCurrentPage] = useState(1);

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

  const invites = course?.pendingInvites || [];

  // Pagination
  const totalPages = Math.ceil(invites.length / ITEMS_PER_PAGE);
  const paginatedInvites = invites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const cancelMutation = useMutation(
    (inviteId: number) => coursesApi.cancelInvite(courseId, inviteId),
    {
      onSuccess: () => refetch(),
    },
  );

  const handleCancelInvite = (invite: CourseInvite) => {
    if (confirm(`Cancel invitation to ${invite.email}?`)) {
      cancelMutation.mutate(invite.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "ACCEPTED":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "ACCEPTED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
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
          fallbackHref={`/dashboard/courses/${courseId}`}
          label="Back to Course"
          className="mb-4"
        />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
              <Mail className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Course Invites
              </h1>
              <div className="mt-1 text-gray-600 dark:text-gray-400">
                {course.subject?.name || "Course"} - {course.startYear} -{" "}
                {(course.startYear || 0) + 1}
              </div>
            </div>
          </div>

          {canManage && (
            <Link
              href={`/dashboard/courses/${courseId}`}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Invites
            </Link>
          )}
        </div>
      </div>

      {/* Invites Table */}
      {invites.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No pending invites
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Send invitations to students to enroll them in this course.
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Expires
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {paginatedInvites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <Mail className="mr-2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {invite.email}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(
                          invite.status,
                        )}`}
                      >
                        {getStatusIcon(invite.status)}
                        {invite.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDateOnly(invite.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {invite.expiresAt
                        ? formatDateOnly(invite.expiresAt)
                        : "-"}
                    </td>
                    {canManage && (
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        {invite.status === "PENDING" && (
                          <button
                            onClick={() => handleCancelInvite(invite)}
                            className="text-red-600 hover:text-red-800"
                            title="Cancel invitation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <SimplePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={invites.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="invites"
            />
          )}
        </>
      )}
    </div>
  );
}
