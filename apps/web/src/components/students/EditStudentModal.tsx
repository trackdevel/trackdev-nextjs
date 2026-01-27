"use client";

import { FormModalFooter, Modal } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { ApiClientError, useMutation, usersApi } from "@trackdev/api-client";
import type { UserPublic } from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: UserPublic;
  onSuccess: () => void;
}

export function EditStudentModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: EditStudentModalProps) {
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const toast = useToast();

  const [fullName, setFullName] = useState(student.fullName || "");
  const [githubUsername, setGithubUsername] = useState(
    student.githubInfo?.login || "",
  );

  // Reset form when student changes
  useEffect(() => {
    setFullName(student.fullName || "");
    setGithubUsername(student.githubInfo?.login || "");
  }, [student]);

  const updateMutation = useMutation(
    (data: { fullName?: string; githubUsername?: string }) =>
      usersApi.updateStudent(student.id, data),
    {
      onSuccess: () => {
        toast.success(t("studentUpdated"));
        onSuccess();
        onClose();
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("failedToUpdate");
        toast.error(errorMessage);
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error(t("fullNameRequired"));
      return;
    }

    updateMutation.mutate({
      fullName: fullName.trim(),
      githubUsername: githubUsername.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("editStudent")}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              {t("fullName")}
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="githubUsername"
              className="block text-sm font-medium text-gray-700"
            >
              {t("githubUsername")}
            </label>
            <input
              type="text"
              id="githubUsername"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              placeholder="e.g., octocat"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t("githubUsernameHint")}
            </p>
          </div>
        </div>

        <FormModalFooter
          onCancel={onClose}
          cancelLabel={tCommon("cancel")}
          submitLabel={tCommon("save")}
          isSubmitting={updateMutation.isLoading}
        />
      </form>
    </Modal>
  );
}
