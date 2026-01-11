"use client";

import {
  EmptyState,
  LoadingContainer,
  Modal,
  PageHeader,
  SearchInput,
  SimplePagination,
} from "@/components/ui";
import { useAuth, useMutation, useQuery, usersApi } from "@trackdev/api-client";
import type { RoleName } from "@trackdev/types";
import { Shield, Trash2, UserPlus, Users as UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const tUserTypes = useTranslations("userTypes");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = currentUser?.roles?.includes("ADMIN") ?? false;

  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState<{
    username: string;
    email: string;
    password: string;
    userType: RoleName;
  }>({
    username: "",
    email: "",
    password: "",
    userType: "STUDENT",
  });

  // API queries
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery(() => usersApi.getAll(), [], {
    enabled: isAuthenticated && isAdmin,
  });

  const users = usersResponse?.users || [];

  // Filter users by search query
  const filteredUsers = searchQuery
    ? users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Mutations
  const createUserMutation = useMutation(
    (data: {
      username: string;
      email: string;
      password: string;
      userType: RoleName;
    }) => usersApi.register(data),
    {
      onSuccess: () => {
        setShowCreateUser(false);
        setUserForm({
          username: "",
          email: "",
          password: "",
          userType: "STUDENT",
        });
        refetch();
      },
    }
  );

  const deleteUserMutation = useMutation(
    (userId: string) => usersApi.delete(userId),
    {
      onSuccess: () => {
        setUserToDelete(null);
        refetch();
      },
    }
  );

  // Handlers
  const handleCreateUser = () => {
    setUserForm({ username: "", email: "", password: "", userType: "STUDENT" });
    setShowCreateUser(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(userForm);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
    }
  };

  // Redirect if not admin
  if (!isAdmin && !isLoading) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">{t("accessDenied")}</p>
          <p className="text-sm">{t("adminOnly")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <PageHeader
          title={t("title")}
          description={t("subtitle")}
          action={
            <button onClick={handleCreateUser} className="btn-primary gap-2">
              <UserPlus className="h-4 w-4" />
              {t("createUser")}
            </button>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t("searchPlaceholder")}
          />
        </div>

        {isLoading ? (
          <LoadingContainer />
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-red-600">
            {error.message || "Error loading users"}
          </div>
        ) : paginatedUsers.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-12 w-12" />}
            title={t("noUsers")}
            description={t("noUsersDescription")}
            action={{
              label: t("createUser"),
              onClick: handleCreateUser,
            }}
          />
        ) : (
          <>
            {/* Users Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("username")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("email")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("roles")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      {t("status")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      {tCommon("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                            style={{ backgroundColor: user.color }}
                          >
                            {user.capitalLetters}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : role === "PROFESSOR"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {role === "ADMIN" && (
                                <Shield className="h-3 w-3" />
                              )}
                              {tUserTypes(role.toLowerCase())}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.enabled ? t("active") : t("inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          disabled={user.id === currentUser?.id}
                          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                          title={
                            user.id === currentUser?.id
                              ? t("cannotDeleteSelf")
                              : t("deleteUser")
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          {tCommon("delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Create User Modal */}
        <Modal
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          title={t("createUser")}
        >
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="form-group">
              <label>{t("username")}</label>
              <input
                type="text"
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({ ...userForm, username: e.target.value })
                }
                required
                minLength={1}
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label>{t("email")}</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>{t("password")}</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                required
                minLength={8}
              />
              <p className="form-hint">{t("passwordHint")}</p>
            </div>
            <div className="form-group">
              <label>{t("userType")}</label>
              <select
                value={userForm.userType}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    userType: e.target.value as RoleName,
                  })
                }
                required
              >
                <option value="STUDENT">{tUserTypes("student")}</option>
                <option value="PROFESSOR">{tUserTypes("professor")}</option>
                <option value="ADMIN">{tUserTypes("admin")}</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateUser(false)}
                className="btn-outline"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="submit"
                disabled={createUserMutation.isLoading}
                className="btn-primary"
              >
                {createUserMutation.isLoading
                  ? tCommon("creating")
                  : tCommon("create")}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={userToDelete !== null}
          onClose={() => setUserToDelete(null)}
          title={t("deleteUserTitle")}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("deleteUserConfirmation")}
            </p>
            {deleteUserMutation.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {deleteUserMutation.error.message}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="btn-outline"
                disabled={deleteUserMutation.isLoading}
              >
                {tCommon("cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteUserMutation.isLoading}
                className="btn-danger"
              >
                {deleteUserMutation.isLoading
                  ? tCommon("deleting")
                  : tCommon("delete")}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
