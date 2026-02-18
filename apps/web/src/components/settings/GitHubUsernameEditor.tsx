"use client";

import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  useAuth,
  useMutation,
  usersApi,
} from "@trackdev/api-client";
import { Check, Github, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface GitHubUsernameEditorProps {
  showLabel?: boolean;
  className?: string;
}

export function GitHubUsernameEditor({
  showLabel = true,
  className = "",
}: GitHubUsernameEditorProps) {
  const t = useTranslations("settings");
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [githubUsername, setGithubUsername] = useState(
    user?.githubInfo?.login || "",
  );

  // Reset value when user changes
  useEffect(() => {
    setGithubUsername(user?.githubInfo?.login || "");
  }, [user?.githubInfo?.login]);

  const updateMutation = useMutation(
    (username: string) =>
      usersApi.updateSelf({ githubUsername: username || undefined }),
    {
      onSuccess: () => {
        toast.success(t("githubUsernameSaved"));
        refreshUser();
        setIsEditing(false);
      },
      onError: (err: Error) => {
        const errorMessage =
          err instanceof ApiClientError && (err as ApiClientError).body?.message
            ? (err as ApiClientError).body!.message
            : t("githubUsernameSaveError");
        toast.error(errorMessage);
      },
    },
  );

  const handleSave = () => {
    updateMutation.mutate(githubUsername.trim());
  };

  const handleCancel = () => {
    setGithubUsername(user?.githubInfo?.login || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className={className}>
      {showLabel && <label className="label mb-1">{t("githubUsername")}</label>}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Github className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isEditing || updateMutation.isLoading}
            className="input w-full pl-10 disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
            placeholder={t("githubUsernamePlaceholder")}
          />
        </div>
        {isEditing ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMutation.isLoading}
              className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700 disabled:opacity-50"
              title={t("save")}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateMutation.isLoading}
              className="rounded-md bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              title={t("cancel")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            title={t("edit")}
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("githubUsernameHint")}</p>
    </div>
  );
}
