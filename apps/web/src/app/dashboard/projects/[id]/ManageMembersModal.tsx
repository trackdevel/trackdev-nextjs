"use client";

import { Modal, SearchInput } from "@/components/ui";
import { coursesApi, useQuery } from "@trackdev/api-client";
import type { UserPublic } from "@trackdev/types";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  currentMembers: UserPublic[];
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 5;

export function ManageMembersModal({
  isOpen,
  onClose,
  courseId,
  currentMembers,
  onAddMember,
  onRemoveMember,
  isLoading = false,
}: ManageMembersModalProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch students enrolled in the course
  const { data: studentsResponse, isLoading: loadingStudents } = useQuery(
    () => coursesApi.getStudents(courseId),
    [courseId],
    { enabled: isOpen && !!courseId },
  );

  const courseStudents = studentsResponse?.students || [];

  // Filter students not currently in the project
  const currentMemberIds = new Set(currentMembers.map((m) => m.id));
  const availableStudents = courseStudents.filter(
    (student) => !currentMemberIds.has(student.id),
  );

  // Apply search filter
  const filteredStudents = availableStudents.filter(
    (student) =>
      student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRemove = (member: UserPublic) => {
    if (
      confirm(
        t("confirmRemoveMember", { name: member.fullName || member.username }),
      )
    ) {
      onRemoveMember(member.id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("manageMembers")}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Current Members Section */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            {t("currentMembers")} ({currentMembers.length})
          </h3>
          {currentMembers.length > 0 ? (
            <ul className="divide-y rounded-lg border dark:divide-gray-700 dark:border-gray-700">
              {currentMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: member.color || "#3b82f6" }}
                    >
                      {member.capitalLetters ||
                        member.fullName?.slice(0, 2).toUpperCase() ||
                        member.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.fullName || member.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={isLoading}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 disabled:opacity-50"
                    title={t("removeMember")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-gray-500 dark:border-gray-600 dark:text-gray-400">
              <UsersIcon className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm">{t("noTeamMembers")}</p>
            </div>
          )}
        </div>

        {/* Add Students Section - Search-based */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
            {t("availableStudents")}
          </h3>

          <div className="relative">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("searchStudents")}
            />

            {/* Search Results - shown immediately below search bar */}
            {searchQuery.length > 0 && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {loadingStudents ? (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    <p className="mt-2 text-sm">{t("loadingStudents")}</p>
                  </div>
                ) : paginatedStudents.length > 0 ? (
                  <>
                    <ul className="divide-y dark:divide-gray-700">
                      {paginatedStudents.map((student) => (
                        <li
                          key={student.id}
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                              style={{
                                backgroundColor: student.color || "#3b82f6",
                              }}
                            >
                              {student.capitalLetters ||
                                student.fullName?.slice(0, 2).toUpperCase() ||
                                student.username?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.fullName || student.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {student.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              onAddMember(student.id);
                              setSearchQuery("");
                            }}
                            disabled={isLoading}
                            className="flex items-center gap-1 rounded-sm bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                            {t("addMember")}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {/* Pagination info */}
                    {filteredStudents.length > ITEMS_PER_PAGE && (
                      <div className="border-t px-4 py-2 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        {tCommon("showing")} {paginatedStudents.length}{" "}
                        {tCommon("of")} {filteredStudents.length} •{" "}
                        <button
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage >= totalPages}
                          className="text-primary-600 hover:underline disabled:text-gray-400 dark:text-primary-400 dark:disabled:text-gray-500"
                        >
                          {tCommon("showMore")}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">{t("noStudentsFound")}</p>
                  </div>
                )}
              </div>
            )}

            {/* Hint when not searching */}
            {searchQuery.length === 0 && !loadingStudents && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t("typeToSearchStudents")}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4 dark:border-gray-700">
          <button onClick={onClose} className="btn-outline">
            {tCommon("close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
