"use client";

import {
  AccessDenied,
  EmptyState,
  ErrorAlert,
  LoadingContainer,
  Modal,
  PageContainer,
  PageHeader,
  SearchInput,
  SimplePagination,
} from "@/components/ui";
import { useAuth, useMutation, useQuery, usersApi } from "@trackdev/api-client";
import type { User } from "@trackdev/types";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function WorkspaceUsersPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const t = useTranslations("wsUsers");
  const tCommon = useTranslations("common");
  const tUserTypes = useTranslations("userTypes");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Check if user is WORKSPACE_ADMIN
  const isWorkspaceAdmin =
    currentUser?.roles?.includes("WORKSPACE_ADMIN") ?? false;

  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form state for creating a new professor
  const [createForm, setCreateForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
  });

  // Form state for editing a user
  const [editForm, setEditForm] = useState({
    username: "",
    enabled: true,
  });

  // API queries
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery(() => usersApi.getWorkspaceUsers(), [], {
    enabled: isAuthenticated && isWorkspaceAdmin,
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
      fullName: string;
      email: string;
      password: string;
    }) =>
      usersApi.register({
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        userType: "PROFESSOR",
      }),
    {
      onSuccess: () => {
        setShowCreateUser(false);
        setCreateForm({ username: "", fullName: "", email: "", password: "" });
        refetch();
      },
    }
  );

  const updateUserMutation = useMutation(
    ({
      id,
      data,
    }: {
      id: string;
      data: { username?: string; enabled?: boolean };
    }) => usersApi.updateWorkspaceUser(id, data),
    {
      onSuccess: () => {
        setUserToEdit(null);
        setEditForm({ username: "", enabled: true });
        refetch();
      },
    }
  );

  const deleteUserMutation = useMutation((id: string) => usersApi.delete(id), {
    onSuccess: () => {
      setUserToDelete(null);
      refetch();
    },
  });

  // Handlers
  const handleCreateUser = () => {
    setCreateForm({ username: "", fullName: "", email: "", password: "" });
    setShowCreateUser(true);
  };

  const handleEditUser = (user: User) => {
    setEditForm({ username: user.username, enabled: user.enabled });
    setUserToEdit(user);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(createForm);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userToEdit) {
      updateUserMutation.mutate({
        id: userToEdit.id,
        data: {
          username:
            editForm.username !== userToEdit.username
              ? editForm.username
              : undefined,
          enabled:
            editForm.enabled !== userToEdit.enabled
              ? editForm.enabled
              : undefined,
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const getRoleBadge = (user: User) => {
    if (user.roles.includes("WORKSPACE_ADMIN")) {
      return {
        label: tUserTypes("workspaceAdmin"),
        color: "bg-orange-100 text-orange-700",
      };
    }
    if (user.roles.includes("PROFESSOR")) {
      return {
        label: tUserTypes("professor"),
        color: "bg-purple-100 text-purple-700",
      };
    }
    return { label: tUserTypes("user"), color: "bg-gray-100 text-gray-700" };
  };

  // Redirect if not workspace admin
  if (!isWorkspaceAdmin && !isLoading) {
    return (
      <AccessDenied
        title={t("accessDenied")}
        message={t("workspaceAdminOnly")}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <button onClick={handleCreateUser} className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            {t("createProfessor")}
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
          {error.message || t("errorLoading")}
        </div>
      ) : paginatedUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title={t("noUsers")}
          description={t("noUsersDescription")}
          action={{
            label: t("createProfessor"),
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
                    {t("fullName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("username")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("role")}
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
                {paginatedUsers.map((user) => {
                  const roleBadge = getRoleBadge(user);
                  const isProfessor = user.roles.includes("PROFESSOR");
                  const isSelf = user.id === currentUser?.id;

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                            style={{
                              backgroundColor: user.color || "#3b82f6",
                            }}
                          >
                            {user.capitalLetters ||
                              user.fullName?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.username}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleBadge.color}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            user.enabled
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.enabled ? t("active") : t("inactive")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isProfessor && !isSelf && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                              title={t("editUser")}
                            >
                              <Edit className="h-4 w-4" />
                              {tCommon("edit")}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                              title={t("deleteUser")}
                            >
                              <Trash2 className="h-4 w-4" />
                              {tCommon("delete")}
                            </button>
                          </div>
                        )}
                        {isSelf && (
                          <span className="text-sm text-gray-400 italic">
                            {t("you")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Create Professor Modal */}
      <Modal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        title={t("createProfessor")}
      >
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div className="form-group">
            <label>{t("username")}</label>
            <input
              type="text"
              value={createForm.username}
              onChange={(e) =>
                setCreateForm({ ...createForm, username: e.target.value })
              }
              required
              minLength={1}
              maxLength={50}
              pattern="^[a-zA-Z0-9_\\-#]+$"
              placeholder={t("usernamePlaceholder")}
            />
            <p className="mt-1 text-xs text-gray-500">{t("usernameHint")}</p>
          </div>

          <div className="form-group">
            <label>{t("fullName")}</label>
            <input
              type="text"
              value={createForm.fullName}
              onChange={(e) =>
                setCreateForm({ ...createForm, fullName: e.target.value })
              }
              required
              minLength={1}
              maxLength={100}
              placeholder={t("fullNamePlaceholder")}
            />
          </div>

          <div className="form-group">
            <label>{t("email")}</label>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) =>
                setCreateForm({ ...createForm, email: e.target.value })
              }
              required
              placeholder={t("emailPlaceholder")}
            />
          </div>

          <div className="form-group">
            <label>{t("password")}</label>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) =>
                setCreateForm({ ...createForm, password: e.target.value })
              }
              required
              minLength={8}
              placeholder={t("passwordPlaceholder")}
            />
            <p className="mt-1 text-xs text-gray-500">{t("passwordHint")}</p>
          </div>

          {createUserMutation.error && (
            <ErrorAlert message={createUserMutation.error.message} />
          )}

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

      {/* Edit User Modal */}
      <Modal
        isOpen={userToEdit !== null}
        onClose={() => setUserToEdit(null)}
        title={t("editUser")}
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div className="form-group">
            <label>{t("username")}</label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) =>
                setEditForm({ ...editForm, username: e.target.value })
              }
              required
              minLength={1}
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editForm.enabled}
                onChange={(e) =>
                  setEditForm({ ...editForm, enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>{t("userEnabled")}</span>
            </label>
          </div>

          {updateUserMutation.error && (
            <ErrorAlert message={updateUserMutation.error.message} />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setUserToEdit(null)}
              className="btn-outline"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isLoading}
              className="btn-primary"
            >
              {updateUserMutation.isLoading
                ? tCommon("loading")
                : tCommon("save")}
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
            {t("deleteUserConfirmation", {
              name: userToDelete?.username ?? "",
            })}
          </p>
          {deleteUserMutation.error && (
            <ErrorAlert message={deleteUserMutation.error.message} />
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
    </PageContainer>
  );
}
