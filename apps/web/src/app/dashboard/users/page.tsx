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
  Select,
  SimplePagination,
} from "@/components/ui";
import {
  coursesApi,
  useAuth,
  useMutation,
  useQuery,
  usersApi,
  workspacesApi,
} from "@trackdev/api-client";
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
  const tCourses = useTranslations("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Check if user is admin or professor
  const isAdmin = currentUser?.roles?.includes("ADMIN") ?? false;
  const isWorkspaceAdmin =
    currentUser?.roles?.includes("WORKSPACE_ADMIN") ?? false;
  const isProfessor = currentUser?.roles?.includes("PROFESSOR") ?? false;
  const canManageUsers = isAdmin || isWorkspaceAdmin || isProfessor;

  // Helper function to convert role enum to translation key (camelCase)
  const roleToTranslationKey = (role: RoleName): string => {
    const mapping: Record<RoleName, string> = {
      ADMIN: "admin",
      WORKSPACE_ADMIN: "workspaceAdmin",
      PROFESSOR: "professor",
      STUDENT: "student",
    };
    return mapping[role] || role.toLowerCase();
  };

  // Modal states
  const [showCreateUser, setShowCreateUser] = useState(false);
  // For ADMIN: which type of user they're creating (selected in first step)
  const [selectedRoleToCreate, setSelectedRoleToCreate] =
    useState<RoleName | null>(null);

  // Form states
  const [userForm, setUserForm] = useState<{
    username: string;
    fullName: string;
    email: string;
    password: string;
    workspaceId?: number;
    courseId?: number;
  }>({
    username: "",
    fullName: "",
    email: "",
    password: "",
    workspaceId: undefined,
    courseId: undefined,
  });

  // API queries
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useQuery(() => usersApi.getAll(), [], {
    enabled: isAuthenticated && canManageUsers,
  });

  // Fetch courses for professor to select when creating students
  const { data: coursesResponse } = useQuery(() => coursesApi.getAll(), [], {
    enabled: isAuthenticated && isProfessor,
  });

  const courses = coursesResponse?.courses || [];

  // Fetch workspaces for admin when creating workspace admin
  const { data: workspacesResponse } = useQuery(
    () => workspacesApi.getAll(),
    [],
    {
      enabled: isAuthenticated && isAdmin,
    }
  );

  const workspaces = workspacesResponse || [];

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
      workspaceId?: number;
      courseId?: number;
    }) => usersApi.register(data),
    {
      onSuccess: () => {
        setShowCreateUser(false);
        setSelectedRoleToCreate(null);
        setUserForm({
          username: "",
          fullName: "",
          email: "",
          password: "",
          workspaceId: undefined,
          courseId: undefined,
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
    setUserForm({
      username: "",
      fullName: "",
      email: "",
      password: "",
      workspaceId: undefined,
      courseId: undefined,
    });
    // For ADMIN, they need to choose the role first (ADMIN or WORKSPACE_ADMIN)
    // For WORKSPACE_ADMIN, they can only create PROFESSOR (no choice needed)
    // For PROFESSOR, they can only create STUDENT (no choice needed)
    setSelectedRoleToCreate(null);
    setShowCreateUser(true);
  };

  const handleSelectRoleToCreate = (role: RoleName) => {
    setSelectedRoleToCreate(role);
  };

  const handleBackToRoleSelection = () => {
    setSelectedRoleToCreate(null);
  };

  // Determine which role the current user will create
  // - ADMIN: Chosen via selectedRoleToCreate (ADMIN or WORKSPACE_ADMIN)
  // - WORKSPACE_ADMIN: Always PROFESSOR
  // - PROFESSOR: Always STUDENT
  const getEffectiveRoleToCreate = (): RoleName | null => {
    if (isAdmin) return selectedRoleToCreate;
    if (isWorkspaceAdmin) return "PROFESSOR";
    if (isProfessor) return "STUDENT";
    return null;
  };

  const effectiveRoleToCreate = getEffectiveRoleToCreate();

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const roleToCreate = effectiveRoleToCreate;
    if (!roleToCreate) return;

    // For WORKSPACE_ADMIN creating PROFESSOR, auto-assign the workspace
    const submitData = {
      ...userForm,
      userType: roleToCreate,
      workspaceId:
        isWorkspaceAdmin && roleToCreate === "PROFESSOR"
          ? currentUser?.workspaceId
          : userForm.workspaceId,
    };
    createUserMutation.mutate(submitData);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
    }
  };

  // Redirect if not admin or professor
  if (!canManageUsers && !isLoading) {
    return <AccessDenied title={t("accessDenied")} message={t("adminOnly")} />;
  }

  return (
    <PageContainer>
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
                    {t("fullName")}
                  </th>
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
                            {user.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.username}
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
                            {role === "ADMIN" && <Shield className="h-3 w-3" />}
                            {tUserTypes(roleToTranslationKey(role))}
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
        onClose={() => {
          setShowCreateUser(false);
          setSelectedRoleToCreate(null);
        }}
        title={t("createUser")}
      >
        {/* Step 1 for ADMIN: Choose which type of user to create */}
        {isAdmin && !selectedRoleToCreate && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("selectUserTypeToCreate")}
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => handleSelectRoleToCreate("ADMIN")}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 hover:border-primary-300"
              >
                <Shield className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {tUserTypes("admin")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("adminDescription")}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleSelectRoleToCreate("WORKSPACE_ADMIN")}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 hover:border-primary-300"
              >
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    {tUserTypes("workspaceAdmin")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("workspaceAdminDescription")}
                  </p>
                </div>
              </button>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setShowCreateUser(false)}
                className="btn-outline"
              >
                {tCommon("cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Show form for the selected role (or immediately for non-ADMIN users) */}
        {effectiveRoleToCreate && (
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            {/* Back button for ADMIN to change role selection */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleBackToRoleSelection}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                ← {t("changeUserType")}
              </button>
            )}

            {/* Show which role is being created */}
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <span className="text-gray-600">{t("creatingRole")}:</span>{" "}
              <span className="font-medium text-gray-900">
                {tUserTypes(roleToTranslationKey(effectiveRoleToCreate))}
              </span>
            </div>

            {/* Common fields: username, fullName, email, password */}
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
                pattern="^[a-zA-Z0-9_\\-#]+$"
              />
              <p className="form-hint">{t("usernameHint")}</p>
            </div>
            <div className="form-group">
              <label>{t("fullName")}</label>
              <input
                type="text"
                value={userForm.fullName}
                onChange={(e) =>
                  setUserForm({ ...userForm, fullName: e.target.value })
                }
                required
                minLength={1}
                maxLength={100}
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

            {/* ADMIN creating WORKSPACE_ADMIN: needs workspace selection */}
            {isAdmin && effectiveRoleToCreate === "WORKSPACE_ADMIN" && (
              <div className="form-group">
                <label>{t("workspace")}</label>
                <Select
                  value={userForm.workspaceId?.toString() ?? ""}
                  onChange={(value) =>
                    setUserForm({
                      ...userForm,
                      workspaceId: value ? Number(value) : undefined,
                    })
                  }
                  placeholder={t("selectWorkspace")}
                  options={workspaces.map((workspace) => ({
                    value: workspace.id.toString(),
                    label: workspace.name,
                  }))}
                  required
                />
              </div>
            )}

            {/* PROFESSOR creating STUDENT: needs course selection */}
            {isProfessor && effectiveRoleToCreate === "STUDENT" && (
              <div className="form-group">
                <label>{tCourses("course")}</label>
                <Select
                  value={userForm.courseId?.toString() ?? ""}
                  onChange={(value) =>
                    setUserForm({
                      ...userForm,
                      courseId: value ? Number(value) : undefined,
                    })
                  }
                  placeholder={tCourses("selectCourse")}
                  options={courses.map((course) => ({
                    value: course.id.toString(),
                    label: `${course.subject?.name} - ${course.startYear}`,
                  }))}
                  required
                />
              </div>
            )}

            {/* WORKSPACE_ADMIN creating PROFESSOR: no extra fields needed */}
            {/* The workspace is auto-assigned from currentUser.workspaceId */}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCreateUser(false);
                  setSelectedRoleToCreate(null);
                }}
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
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={userToDelete !== null}
        onClose={() => setUserToDelete(null)}
        title={t("deleteUserTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t("deleteUserConfirmation")}</p>
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
