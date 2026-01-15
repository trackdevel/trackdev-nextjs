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
import {
  useAuth,
  useMutation,
  useQuery,
  workspacesApi,
} from "@trackdev/api-client";
import type { Workspace } from "@trackdev/types";
import { Building2, Edit, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function WorkspacesPage() {
  const { isAuthenticated, user: currentUser } = useAuth();
  const t = useTranslations("workspaces");
  const tCommon = useTranslations("common");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Check if user is admin
  const isAdmin = currentUser?.roles?.includes("ADMIN") ?? false;

  // Modal states
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(
    null
  );
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(
    null
  );

  // Form state
  const [workspaceForm, setWorkspaceForm] = useState({
    name: "",
  });

  // API queries
  const {
    data: workspacesResponse,
    isLoading,
    error,
    refetch,
  } = useQuery(() => workspacesApi.getAll(), [], {
    enabled: isAuthenticated && isAdmin,
  });

  const workspaces = workspacesResponse || [];

  // Filter workspaces by search query
  const filteredWorkspaces = searchQuery
    ? workspaces.filter((workspace) =>
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : workspaces;

  // Pagination logic
  const totalPages = Math.ceil(filteredWorkspaces.length / ITEMS_PER_PAGE);
  const paginatedWorkspaces = filteredWorkspaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Mutations
  const createWorkspaceMutation = useMutation(
    (data: { name: string }) => workspacesApi.create(data),
    {
      onSuccess: () => {
        setShowCreateWorkspace(false);
        setWorkspaceForm({ name: "" });
        refetch();
      },
    }
  );

  const updateWorkspaceMutation = useMutation(
    ({ id, data }: { id: number; data: { name?: string } }) =>
      workspacesApi.update(id, data),
    {
      onSuccess: () => {
        setWorkspaceToEdit(null);
        setWorkspaceForm({ name: "" });
        refetch();
      },
    }
  );

  const deleteWorkspaceMutation = useMutation(
    (id: number) => workspacesApi.delete(id),
    {
      onSuccess: () => {
        setWorkspaceToDelete(null);
        refetch();
      },
    }
  );

  // Handlers
  const handleCreateWorkspace = () => {
    setWorkspaceForm({ name: "" });
    setShowCreateWorkspace(true);
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    setWorkspaceForm({ name: workspace.name });
    setWorkspaceToEdit(workspace);
  };

  const handleDeleteClick = (workspace: Workspace) => {
    setWorkspaceToDelete(workspace);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkspaceMutation.mutate(workspaceForm);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workspaceToEdit) {
      updateWorkspaceMutation.mutate({
        id: workspaceToEdit.id,
        data: workspaceForm,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (workspaceToDelete) {
      deleteWorkspaceMutation.mutate(workspaceToDelete.id);
    }
  };

  // Redirect if not admin
  if (!isAdmin && !isLoading) {
    return <AccessDenied title={t("accessDenied")} message={t("adminOnly")} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <button onClick={handleCreateWorkspace} className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            {t("createWorkspace")}
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
      ) : paginatedWorkspaces.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title={t("noWorkspaces")}
          description={t("noWorkspacesDescription")}
          action={{
            label: t("createWorkspace"),
            onClick: handleCreateWorkspace,
          }}
        />
      ) : (
        <>
          {/* Workspaces Table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t("name")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    {tCommon("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedWorkspaces.map((workspace) => (
                  <tr
                    key={workspace.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {workspace.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditWorkspace(workspace)}
                          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                          title={t("editWorkspace")}
                        >
                          <Edit className="h-4 w-4" />
                          {tCommon("edit")}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(workspace)}
                          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                          title={t("deleteWorkspace")}
                        >
                          <Trash2 className="h-4 w-4" />
                          {tCommon("delete")}
                        </button>
                      </div>
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

      {/* Create Workspace Modal */}
      <Modal
        isOpen={showCreateWorkspace}
        onClose={() => setShowCreateWorkspace(false)}
        title={t("createWorkspace")}
      >
        <form onSubmit={handleSubmitCreate} className="space-y-4">
          <div className="form-group">
            <label>{t("name")}</label>
            <input
              type="text"
              value={workspaceForm.name}
              onChange={(e) =>
                setWorkspaceForm({ ...workspaceForm, name: e.target.value })
              }
              required
              minLength={1}
              maxLength={100}
              placeholder={t("namePlaceholder")}
            />
          </div>

          {createWorkspaceMutation.error && (
            <ErrorAlert message={createWorkspaceMutation.error.message} />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateWorkspace(false)}
              className="btn-outline"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={createWorkspaceMutation.isLoading}
              className="btn-primary"
            >
              {createWorkspaceMutation.isLoading
                ? tCommon("creating")
                : tCommon("create")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Workspace Modal */}
      <Modal
        isOpen={workspaceToEdit !== null}
        onClose={() => setWorkspaceToEdit(null)}
        title={t("editWorkspace")}
      >
        <form onSubmit={handleSubmitEdit} className="space-y-4">
          <div className="form-group">
            <label>{t("name")}</label>
            <input
              type="text"
              value={workspaceForm.name}
              onChange={(e) =>
                setWorkspaceForm({ ...workspaceForm, name: e.target.value })
              }
              required
              minLength={1}
              maxLength={100}
            />
          </div>

          {updateWorkspaceMutation.error && (
            <ErrorAlert message={updateWorkspaceMutation.error.message} />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setWorkspaceToEdit(null)}
              className="btn-outline"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={updateWorkspaceMutation.isLoading}
              className="btn-primary"
            >
              {updateWorkspaceMutation.isLoading
                ? tCommon("loading")
                : tCommon("save")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={workspaceToDelete !== null}
        onClose={() => setWorkspaceToDelete(null)}
        title={t("deleteWorkspaceTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {t("deleteWorkspaceConfirmation", {
              name: workspaceToDelete?.name ?? "",
            })}
          </p>
          {deleteWorkspaceMutation.error && (
            <ErrorAlert message={deleteWorkspaceMutation.error.message} />
          )}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setWorkspaceToDelete(null)}
              className="btn-outline"
              disabled={deleteWorkspaceMutation.isLoading}
            >
              {tCommon("cancel")}
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteWorkspaceMutation.isLoading}
              className="btn-danger"
            >
              {deleteWorkspaceMutation.isLoading
                ? tCommon("deleting")
                : tCommon("delete")}
            </button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
