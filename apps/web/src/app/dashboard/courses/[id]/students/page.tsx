"use client";

import { BackButton } from "@/components/BackButton";
import { EditStudentModal } from "@/components/students";
import { SimplePagination } from "@/components/ui";
import {
  coursesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { UserPublic } from "@trackdev/types";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function CourseStudentsPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStudent, setEditingStudent] = useState<UserPublic | null>(null);

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

  const students = course?.students || [];

  // Pagination
  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
  const paginatedStudents = students.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const removeMutation = useMutation(
    (studentId: string) => coursesApi.removeStudent(courseId, studentId),
    {
      onSuccess: () => refetch(),
    },
  );

  const handleRemoveStudent = (student: UserPublic) => {
    if (
      confirm(
        `Remove ${student.fullName || student.username} from this course?`,
      )
    ) {
      removeMutation.mutate(student.id);
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
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Enrolled Students
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
              <Plus className="h-4 w-4" />
              Add Students
            </Link>
          )}
        </div>
      </div>

      {/* Students Table */}
      {students.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No students enrolled
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Invite students to enroll them in this course.
          </p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  {canManage && (
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                {paginatedStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                          style={{
                            backgroundColor: student.color || "#3b82f6",
                          }}
                        >
                          {student.capitalLetters ||
                            student.fullName?.slice(0, 2).toUpperCase() ||
                            student.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {student.fullName || student.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {student.email}
                    </td>
                    {canManage && (
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Edit student"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveStudent(student)}
                            className="text-red-600 hover:text-red-800"
                            title="Remove from course"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
              totalItems={students.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="students"
            />
          )}
        </>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          isOpen={!!editingStudent}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
          onSuccess={() => {
            setEditingStudent(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
