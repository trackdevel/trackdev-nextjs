"use client";

import {
  ConfirmDialog,
  EmptyState,
  LoadingContainer,
  Modal,
  PageContainer,
  PageHeader,
  SearchInput,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  profilesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type { ProfileBasic, ProfileRequest } from "@trackdev/types";
import { FileSliders, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function ProfilesPage() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations("profiles");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileBasic | null>(
    null,
  );

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // API queries
  const {
    data: profiles,
    isLoading,
    error,
    refetch,
  } = useQuery(() => profilesApi.getAll(), [], {
    enabled: isAuthenticated,
  });

  // Create mutation
  const createMutation = useMutation(
    (data: ProfileRequest) => profilesApi.create(data),
    {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
        refetch();
        toast.success(t("createSuccess"));
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("createError");
        toast.error(errorMessage);
      },
    },
  );

  // Delete mutation
  const deleteMutation = useMutation((id: number) => profilesApi.delete(id), {
    onSuccess: () => {
      setShowDeleteDialog(false);
      setSelectedProfile(null);
      refetch();
      toast.success(t("deleteSuccess"));
    },
    onError: (err) => {
      const errorMessage =
        err instanceof ApiClientError && err.body?.message
          ? err.body.message
          : t("deleteError");
      toast.error(errorMessage);
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setValidationError(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formName.trim()) {
      setValidationError(t("validation.nameRequired"));
      return;
    }

    if (formName.trim().length > 100) {
      setValidationError(t("validation.nameTooLong"));
      return;
    }

    createMutation.mutate({
      name: formName.trim(),
      description: formDescription.trim() || undefined,
    });
  };

  const handleEdit = (profile: ProfileBasic) => {
    router.push(`/dashboard/profiles/${profile.id}`);
  };

  const handleDeleteClick = (profile: ProfileBasic) => {
    setSelectedProfile(profile);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedProfile) {
      deleteMutation.mutate(selectedProfile.id);
    }
  };

  // Filter profiles based on search query
  const filteredProfiles = (profiles || []).filter(
    (profile: ProfileBasic) =>
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("createProfile")}
          </button>
        }
      />

      <div className="mb-6">
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={t("searchPlaceholder")}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingContainer />
      ) : error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-6 py-12 text-center text-red-600 dark:text-red-400">
          {t("loadError")}
        </div>
      ) : paginatedProfiles.length > 0 ? (
        <div className="space-y-4">
          {paginatedProfiles.map((profile: ProfileBasic) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <FileSliders className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{profile.name}</h3>
                  {profile.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(profile)}
                  className="rounded-md p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
                  title={tCommon("edit")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(profile)}
                  className="rounded-md p-2 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                  title={tCommon("delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-md px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {tCommon("previous")}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
                className="rounded-md px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {tCommon("next")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={FileSliders}
          title={searchQuery ? t("noSearchResults") : t("noProfiles")}
          description={
            searchQuery
              ? t("noSearchResultsDescription")
              : t("noProfilesDescription")
          }
          action={
            !searchQuery ? (
              <button onClick={handleOpenCreateModal} className="btn-primary">
                <Plus className="mr-2 h-4 w-4" />
                {t("createProfile")}
              </button>
            ) : undefined
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t("createProfile")}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {validationError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              {validationError}
            </div>
          )}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("form.name")} *
            </label>
            <input
              type="text"
              id="name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={t("form.namePlaceholder")}
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("form.description")}
            </label>
            <textarea
              id="description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={t("form.descriptionPlaceholder")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isLoading
                ? tCommon("creating")
                : tCommon("create")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title={t("deleteProfile")}
        message={t("deleteConfirmation", { name: selectedProfile?.name || "" })}
        confirmLabel={tCommon("delete")}
        isLoading={deleteMutation.isLoading}
        variant="danger"
      />
    </PageContainer>
  );
}
