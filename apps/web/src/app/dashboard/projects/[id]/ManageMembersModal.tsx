"use client";

import { Modal, SearchInput } from "@/components/ui";
import { useQuery, usersApi } from "@trackdev/api-client";
import type { UserPublic } from "@trackdev/types";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMembers: UserPublic[];
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 5;

export function ManageMembersModal({
  isOpen,
  onClose,
  currentMembers,
  onAddMember,
  onRemoveMember,
  isLoading = false,
}: ManageMembersModalProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all users
  const { data: usersResponse, isLoading: loadingUsers } = useQuery(
    () => usersApi.getAll(),
    [],
    { enabled: isOpen }
  );

  const allUsers = usersResponse?.users || [];

  // Filter to get only students
  const students = allUsers.filter((user) => user.roles?.includes("STUDENT"));

  // Filter students not currently in the project
  const currentMemberIds = new Set(currentMembers.map((m) => m.id));
  const availableStudents = students.filter(
    (student) => !currentMemberIds.has(student.id)
  );

  // Apply search filter
  const filteredStudents = availableStudents.filter(
    (student) =>
      student.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRemove = (member: UserPublic) => {
    if (confirm(t("confirmRemoveMember", { name: member.username }))) {
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
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            {t("currentMembers")} ({currentMembers.length})
          </h3>
          {currentMembers.length > 0 ? (
            <ul className="divide-y rounded-lg border">
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
                        member.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.username}
                      </p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(member)}
                    disabled={isLoading}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title={t("removeMember")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-gray-500">
              <UsersIcon className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm">{t("noTeamMembers")}</p>
            </div>
          )}
        </div>

        {/* Available Students Section */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-gray-900">
            {t("availableStudents")}
          </h3>

          <div className="mb-3">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t("searchStudents")}
            />
          </div>

          {loadingUsers ? (
            <div className="rounded-lg border px-4 py-8 text-center text-gray-500">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="mt-2 text-sm">{t("loadingStudents")}</p>
            </div>
          ) : paginatedStudents.length > 0 ? (
            <>
              <ul className="divide-y rounded-lg border">
                {paginatedStudents.map((student) => (
                  <li
                    key={student.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                        style={{
                          backgroundColor: student.color || "#3b82f6",
                        }}
                      >
                        {student.capitalLetters ||
                          student.username?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.username}
                        </p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddMember(student.id)}
                      disabled={isLoading}
                      className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {t("addMember")}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {tCommon("showing")}{" "}
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredStudents.length
                    )}{" "}
                    {tCommon("of")} {filteredStudents.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {tCommon("previous")}
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="rounded border px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {tCommon("next")}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-gray-500">
              <UsersIcon className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm">{t("noStudentsFound")}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="btn-outline">
            {tCommon("close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
