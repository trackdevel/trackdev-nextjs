"use client";

import {
  ConfirmDialog,
  LoadingContainer,
  Modal,
  PageContainer,
  Select,
} from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  profilesApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  AttributeTarget,
  AttributeType,
  ProfileComplete,
  ProfileRequest,
} from "@trackdev/types";
import {
  ArrowLeft,
  FileSliders,
  List,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { use, useState } from "react";

export default function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("profiles");
  const tCommon = useTranslations("common");
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [profileValidationError, setProfileValidationError] = useState<
    string | null
  >(null);

  // Enum modal state
  const [showEnumModal, setShowEnumModal] = useState(false);
  const [editingEnumIndex, setEditingEnumIndex] = useState<number | null>(null);
  const [enumName, setEnumName] = useState("");
  const [enumValues, setEnumValues] = useState("");
  const [enumValidationError, setEnumValidationError] = useState<string | null>(
    null,
  );

  // Attribute modal state
  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [editingAttributeIndex, setEditingAttributeIndex] = useState<
    number | null
  >(null);
  const [attributeName, setAttributeName] = useState("");
  const [attributeType, setAttributeType] = useState<AttributeType>("STRING");
  const [attributeTarget, setAttributeTarget] =
    useState<AttributeTarget>("STUDENT");
  const [attributeEnumRef, setAttributeEnumRef] = useState<string>("");
  const [attributeValidationError, setAttributeValidationError] = useState<
    string | null
  >(null);

  // Delete state
  const [showDeleteEnumDialog, setShowDeleteEnumDialog] = useState(false);
  const [showDeleteAttributeDialog, setShowDeleteAttributeDialog] =
    useState(false);
  const [enumToDeleteIndex, setEnumToDeleteIndex] = useState<number | null>(
    null,
  );
  const [attributeToDeleteIndex, setAttributeToDeleteIndex] = useState<
    number | null
  >(null);

  // API query
  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery(() => profilesApi.getById(parseInt(id)), [id], {
    enabled: isAuthenticated && !!id,
  });

  // Helper to build ProfileRequest from current profile
  const buildProfileRequest = (profile: ProfileComplete): ProfileRequest => ({
    name: profile.name,
    description: profile.description,
    enums: profile.enums?.map((e) => ({
      id: e.id,
      name: e.name,
      values: e.values,
    })),
    attributes: profile.attributes?.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      target: a.target,
      enumRefName: a.enumRefName,
    })),
  });

  // Single mutation for all profile updates
  const updateProfileMutation = useMutation(
    (data: ProfileRequest) => profilesApi.update(parseInt(id), data),
    {
      onSuccess: () => {
        refetch();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("updateError");
        toast.error(errorMessage);
      },
    },
  );

  // Form reset functions
  const resetEnumForm = () => {
    setEditingEnumIndex(null);
    setEnumName("");
    setEnumValues("");
    setEnumValidationError(null);
  };

  const resetAttributeForm = () => {
    setEditingAttributeIndex(null);
    setAttributeName("");
    setAttributeType("STRING");
    setAttributeTarget("STUDENT");
    setAttributeEnumRef("");
    setAttributeValidationError(null);
  };

  // Profile edit handlers
  const handleStartEditProfile = () => {
    if (profile) {
      setProfileName(profile.name);
      setProfileDescription(profile.description || "");
      setProfileValidationError(null);
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setProfileValidationError(null);

    if (!profileName.trim()) {
      setProfileValidationError(t("validation.nameRequired"));
      return;
    }

    if (profileName.trim().length > 100) {
      setProfileValidationError(t("validation.nameTooLong"));
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        ...buildProfileRequest(profile),
        name: profileName.trim(),
        description: profileDescription.trim() || undefined,
      });
      setIsEditingProfile(false);
      toast.success(t("updateSuccess"));
    } catch {
      // Error handled by mutation
    }
  };

  // Enum handlers
  const handleOpenEnumModal = (index?: number) => {
    if (index !== undefined && profile?.enums) {
      const profileEnum = profile.enums[index];
      setEditingEnumIndex(index);
      setEnumName(profileEnum.name);
      setEnumValues(profileEnum.values.join(", "));
    } else {
      resetEnumForm();
    }
    setShowEnumModal(true);
  };

  const handleSaveEnum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setEnumValidationError(null);

    if (!enumName.trim()) {
      setEnumValidationError(t("validation.enumNameRequired"));
      return;
    }

    const valuesArray = enumValues
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (valuesArray.length === 0) {
      setEnumValidationError(t("validation.enumValuesRequired"));
      return;
    }

    const currentEnums = profile.enums || [];
    let newEnums;

    if (editingEnumIndex !== null) {
      // Update existing enum
      newEnums = currentEnums.map((e, i) =>
        i === editingEnumIndex
          ? { ...e, name: enumName.trim(), values: valuesArray }
          : e,
      );
    } else {
      // Add new enum (no id for new)
      newEnums = [
        ...currentEnums.map((e) => ({
          id: e.id,
          name: e.name,
          values: e.values,
        })),
        { name: enumName.trim(), values: valuesArray },
      ];
    }

    try {
      await updateProfileMutation.mutateAsync({
        ...buildProfileRequest(profile),
        enums: newEnums,
      });
      setShowEnumModal(false);
      resetEnumForm();
      toast.success(
        editingEnumIndex !== null
          ? t("enums.updateSuccess")
          : t("enums.createSuccess"),
      );
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteEnumClick = (index: number) => {
    setEnumToDeleteIndex(index);
    setShowDeleteEnumDialog(true);
  };

  const handleConfirmDeleteEnum = async () => {
    if (!profile || enumToDeleteIndex === null) return;

    const currentEnums = profile.enums || [];
    const newEnums = currentEnums
      .filter((_, i) => i !== enumToDeleteIndex)
      .map((e) => ({ id: e.id, name: e.name, values: e.values }));

    try {
      await updateProfileMutation.mutateAsync({
        ...buildProfileRequest(profile),
        enums: newEnums,
      });
      setShowDeleteEnumDialog(false);
      setEnumToDeleteIndex(null);
      toast.success(t("enums.deleteSuccess"));
    } catch {
      // Error handled by mutation
    }
  };

  // Attribute handlers
  const handleOpenAttributeModal = (index?: number) => {
    if (index !== undefined && profile?.attributes) {
      const attribute = profile.attributes[index];
      setEditingAttributeIndex(index);
      setAttributeName(attribute.name);
      setAttributeType(attribute.type);
      setAttributeTarget(attribute.target);
      setAttributeEnumRef(attribute.enumRefName || "");
    } else {
      resetAttributeForm();
    }
    setShowAttributeModal(true);
  };

  const handleSaveAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setAttributeValidationError(null);

    if (!attributeName.trim()) {
      setAttributeValidationError(t("validation.attributeNameRequired"));
      return;
    }

    if (attributeType === "ENUM" && !attributeEnumRef) {
      setAttributeValidationError(t("validation.enumRefRequired"));
      return;
    }

    const currentAttributes = profile.attributes || [];
    let newAttributes;

    const newAttr = {
      name: attributeName.trim(),
      type: attributeType,
      target: attributeTarget,
      enumRefName: attributeType === "ENUM" ? attributeEnumRef : undefined,
    };

    if (editingAttributeIndex !== null) {
      // Update existing attribute
      newAttributes = currentAttributes.map((a, i) =>
        i === editingAttributeIndex ? { ...a, ...newAttr } : a,
      );
    } else {
      // Add new attribute
      newAttributes = [
        ...currentAttributes.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          target: a.target,
          enumRefName: a.enumRefName,
        })),
        newAttr,
      ];
    }

    try {
      await updateProfileMutation.mutateAsync({
        ...buildProfileRequest(profile),
        attributes: newAttributes,
      });
      setShowAttributeModal(false);
      resetAttributeForm();
      toast.success(
        editingAttributeIndex !== null
          ? t("attributes.updateSuccess")
          : t("attributes.createSuccess"),
      );
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteAttributeClick = (index: number) => {
    setAttributeToDeleteIndex(index);
    setShowDeleteAttributeDialog(true);
  };

  const handleConfirmDeleteAttribute = async () => {
    if (!profile || attributeToDeleteIndex === null) return;

    const currentAttributes = profile.attributes || [];
    const newAttributes = currentAttributes
      .filter((_, i) => i !== attributeToDeleteIndex)
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        target: a.target,
        enumRefName: a.enumRefName,
      }));

    try {
      await updateProfileMutation.mutateAsync({
        ...buildProfileRequest(profile),
        attributes: newAttributes,
      });
      setShowDeleteAttributeDialog(false);
      setAttributeToDeleteIndex(null);
      toast.success(t("attributes.deleteSuccess"));
    } catch {
      // Error handled by mutation
    }
  };

  // Type/Target display helpers
  const getTypeLabel = (type: AttributeType) => {
    const labels: Record<AttributeType, string> = {
      STRING: t("types.string"),
      INTEGER: t("types.integer"),
      FLOAT: t("types.float"),
      ENUM: t("types.enum"),
    };
    return labels[type];
  };

  const getTargetLabel = (target: AttributeTarget) => {
    const labels: Record<AttributeTarget, string> = {
      STUDENT: t("targets.student"),
      TASK: t("targets.task"),
      PULL_REQUEST: t("targets.pullRequest"),
    };
    return labels[target];
  };

  const getEnumToDeleteName = () => {
    if (enumToDeleteIndex !== null && profile?.enums) {
      return profile.enums[enumToDeleteIndex]?.name || "";
    }
    return "";
  };

  const getAttributeToDeleteName = () => {
    if (attributeToDeleteIndex !== null && profile?.attributes) {
      return profile.attributes[attributeToDeleteIndex]?.name || "";
    }
    return "";
  };

  return (
    <PageContainer>
      {isLoading ? (
        <LoadingContainer />
      ) : profile ? (
        <>
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/profiles"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToProfiles")}
            </Link>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <FileSliders className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                {isEditingProfile ? (
                  <div className="space-y-2">
                    {profileValidationError && (
                      <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-2 text-sm text-red-700 dark:text-red-400">
                        {profileValidationError}
                      </div>
                    )}
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-lg font-semibold text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <textarea
                      value={profileDescription}
                      onChange={(e) => setProfileDescription(e.target.value)}
                      rows={2}
                      className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder={t("form.descriptionPlaceholder")}
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {profile.name}
                    </h1>
                    {profile.description && (
                      <p className="mt-1 text-gray-500 dark:text-gray-400">
                        {profile.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {isEditingProfile ? (
                  <>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      {tCommon("cancel")}
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={updateProfileMutation.isLoading}
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updateProfileMutation.isLoading
                        ? tCommon("saving")
                        : tCommon("save")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleStartEditProfile}
                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <Pencil className="mr-1 inline h-4 w-4" />
                    {tCommon("edit")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Enums Section */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                <List className="h-5 w-5 text-gray-400" />
                {t("enums.title")}
              </h2>
              <button
                onClick={() => handleOpenEnumModal()}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t("enums.add")}
              </button>
            </div>

            {profile.enums && profile.enums.length > 0 ? (
              <div className="space-y-3">
                {profile.enums.map((profileEnum, index) => (
                  <div
                    key={profileEnum.id || index}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {profileEnum.name}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {profileEnum.values.map((value, valueIndex) => (
                          <span
                            key={valueIndex}
                            className="inline-flex rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEnumModal(index)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
                        title={tCommon("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEnumClick(index)}
                        className="rounded-md p-2 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                        title={tCommon("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <List className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t("enums.empty")}
                </p>
              </div>
            )}
          </div>

          {/* Attributes Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900 dark:text-white">
                <Tag className="h-5 w-5 text-gray-400" />
                {t("attributes.title")}
              </h2>
              <button
                onClick={() => handleOpenAttributeModal()}
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t("attributes.add")}
              </button>
            </div>

            {profile.attributes && profile.attributes.length > 0 ? (
              <div className="space-y-3">
                {profile.attributes.map((attribute, index) => (
                  <div
                    key={attribute.id || index}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {attribute.name}
                      </h3>
                      <div className="mt-1 flex gap-2">
                        <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400">
                          {getTypeLabel(attribute.type)}
                          {attribute.enumRefName &&
                            `: ${attribute.enumRefName}`}
                        </span>
                        <span className="inline-flex rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs text-green-700 dark:text-green-400">
                          {getTargetLabel(attribute.target)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAttributeModal(index)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
                        title={tCommon("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttributeClick(index)}
                        className="rounded-md p-2 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                        title={tCommon("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-6 text-center">
                <Tag className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t("attributes.empty")}
                </p>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Enum Modal */}
      <Modal
        isOpen={showEnumModal}
        onClose={() => {
          setShowEnumModal(false);
          resetEnumForm();
        }}
        title={editingEnumIndex !== null ? t("enums.edit") : t("enums.add")}
      >
        <form onSubmit={handleSaveEnum} className="space-y-4">
          {enumValidationError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              {enumValidationError}
            </div>
          )}
          <div>
            <label
              htmlFor="enumName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("form.enumName")} *
            </label>
            <input
              type="text"
              id="enumName"
              value={enumName}
              onChange={(e) => setEnumName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={t("form.enumNamePlaceholder")}
            />
          </div>
          <div>
            <label
              htmlFor="enumValues"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("form.enumValues")} *
            </label>
            <input
              type="text"
              id="enumValues"
              value={enumValues}
              onChange={(e) => setEnumValues(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={t("form.enumValuesPlaceholder")}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("form.enumValuesHelp")}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEnumModal(false);
                resetEnumForm();
              }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isLoading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateProfileMutation.isLoading
                ? tCommon("saving")
                : editingEnumIndex !== null
                  ? tCommon("save")
                  : tCommon("create")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Attribute Modal */}
      <Modal
        isOpen={showAttributeModal}
        onClose={() => {
          setShowAttributeModal(false);
          resetAttributeForm();
        }}
        title={
          editingAttributeIndex !== null
            ? t("attributes.edit")
            : t("attributes.add")
        }
      >
        <form onSubmit={handleSaveAttribute} className="space-y-4">
          {attributeValidationError && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-400">
              {attributeValidationError}
            </div>
          )}
          <div>
            <label
              htmlFor="attributeName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("form.attributeName")} *
            </label>
            <input
              type="text"
              id="attributeName"
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={t("form.attributeNamePlaceholder")}
            />
          </div>
          <div>
            <label
              htmlFor="attributeType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("form.attributeType")} *
            </label>
            <Select
              value={attributeType}
              onChange={(value) => setAttributeType(value as AttributeType)}
              options={[
                { value: "STRING", label: t("types.string") },
                { value: "INTEGER", label: t("types.integer") },
                { value: "FLOAT", label: t("types.float") },
                { value: "ENUM", label: t("types.enum") },
              ]}
              className="mt-1"
              aria-label={t("form.attributeType")}
            />
          </div>
          {attributeType === "ENUM" && (
            <div>
              <label
                htmlFor="attributeEnumRef"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("form.enumRef")} *
              </label>
              <Select
                value={attributeEnumRef}
                onChange={(value) => setAttributeEnumRef(value)}
                options={[
                  { value: "", label: t("form.selectEnum") },
                  ...(profile?.enums?.map((profileEnum) => ({
                    value: profileEnum.name,
                    label: profileEnum.name,
                  })) || []),
                ]}
                placeholder={t("form.selectEnum")}
                className="mt-1"
                aria-label={t("form.enumRef")}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="attributeTarget"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("form.attributeTarget")} *
            </label>
            <Select
              value={attributeTarget}
              onChange={(value) => setAttributeTarget(value as AttributeTarget)}
              options={[
                { value: "STUDENT", label: t("targets.student") },
                { value: "TASK", label: t("targets.task") },
                { value: "PULL_REQUEST", label: t("targets.pullRequest") },
              ]}
              className="mt-1"
              aria-label={t("form.attributeTarget")}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAttributeModal(false);
                resetAttributeForm();
              }}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isLoading}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateProfileMutation.isLoading
                ? tCommon("saving")
                : editingAttributeIndex !== null
                  ? tCommon("save")
                  : tCommon("create")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Enum Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteEnumDialog}
        onClose={() => setShowDeleteEnumDialog(false)}
        onConfirm={handleConfirmDeleteEnum}
        title={t("enums.delete")}
        message={t("enums.deleteConfirmation", { name: getEnumToDeleteName() })}
        confirmLabel={tCommon("delete")}
        isLoading={updateProfileMutation.isLoading}
        variant="danger"
      />

      {/* Delete Attribute Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteAttributeDialog}
        onClose={() => setShowDeleteAttributeDialog(false)}
        onConfirm={handleConfirmDeleteAttribute}
        title={t("attributes.delete")}
        message={t("attributes.deleteConfirmation", {
          name: getAttributeToDeleteName(),
        })}
        confirmLabel={tCommon("delete")}
        isLoading={updateProfileMutation.isLoading}
        variant="danger"
      />
    </PageContainer>
  );
}
