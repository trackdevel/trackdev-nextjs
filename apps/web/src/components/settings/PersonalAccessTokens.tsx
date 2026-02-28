"use client";

import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  tokensApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  PersonalAccessTokenCreated,
  PersonalAccessTokensResponse,
  CreateTokenRequest,
} from "@trackdev/api-client";
import {
  AlertTriangle,
  Check,
  Clipboard,
  Key,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function PersonalAccessTokens() {
  const { user } = useAuth();
  const t = useTranslations("settings");
  const toast = useToast();
  const isStudent = user?.roles?.includes("STUDENT") ?? false;

  if (isStudent) return null;

  const [tokenName, setTokenName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const {
    data: tokensData,
    isLoading: tokensLoading,
    refetch: refetchTokens,
  } = useQuery<PersonalAccessTokensResponse>(
    () => tokensApi.list(),
    [],
  );

  const createMutation = useMutation<PersonalAccessTokenCreated, CreateTokenRequest>(
    (data) => tokensApi.create(data),
    {
      onSuccess: (result) => {
        setCreatedToken(result.token);
        setCopied(false);
        setTokenName("");
        setExpiresAt("");
        toast.success(t("tokenCreatedSuccess"));
        refetchTokens();
      },
      onError: (err) => {
        const msg =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("tokenCreateError");
        toast.error(msg);
      },
    },
  );

  const revokeMutation = useMutation<void, string>(
    (id) => tokensApi.revoke(id),
    {
      onSuccess: () => {
        setConfirmRevokeId(null);
        toast.success(t("tokenRevoked"));
        refetchTokens();
      },
      onError: (err) => {
        setConfirmRevokeId(null);
        const msg =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : t("tokenRevokeError");
        toast.error(msg);
      },
    },
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) return;

    createMutation.mutate({
      name: tokenName.trim(),
      expiresAt: expiresAt ? `${expiresAt}T23:59:59Z` : null,
    });
  };

  const handleCopy = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      setCopied(true);
      toast.success(t("tokenCopied"));
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error(t("tokenCopyError"));
    }
  };

  const handleRevoke = (id: string) => {
    if (confirmRevokeId === id) {
      revokeMutation.mutate(id);
    } else {
      setConfirmRevokeId(id);
      setTimeout(() => setConfirmRevokeId(null), 5000);
    }
  };

  const tokens = tokensData?.tokens ?? [];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t("tokenNeverUsed");
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="card">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {t("pat")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("patDescription")}
        </p>
      </div>
      <div className="p-6">
        {/* Created token banner */}
        {createdToken && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {t("tokenCreatedWarning")}
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-white px-3 py-2 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                {createdToken}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  copied
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t("copyToken")}
                  </>
                ) : (
                  <>
                    <Clipboard className="h-4 w-4" />
                    {t("copyToken")}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Create token form */}
        <form onSubmit={handleCreate} className="mb-6 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="pat-name" className="label">
              {t("patName")}
            </label>
            <input
              id="pat-name"
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder={t("patNamePlaceholder")}
              className="input mt-1"
              maxLength={100}
              required
            />
          </div>
          <div className="min-w-[180px]">
            <label htmlFor="pat-expires" className="label">
              {t("patExpiration")}
            </label>
            <input
              id="pat-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="input mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isLoading || !tokenName.trim()}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {createMutation.isLoading ? t("generatingToken") : t("generateToken")}
          </button>
        </form>

        {/* Token list */}
        {tokensLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="py-8 text-center">
            <Key className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("noTokens")}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t("noTokensDescription")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="pb-2 pr-4">{t("patName")}</th>
                  <th className="pb-2 pr-4">{t("tokenPrefix")}</th>
                  <th className="pb-2 pr-4">{t("tokenCreatedAt")}</th>
                  <th className="pb-2 pr-4">{t("tokenLastUsed")}</th>
                  <th className="pb-2 pr-4">{t("tokenExpires")}</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {tokens.map((token) => (
                  <tr key={token.id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-3 pr-4 font-medium">{token.name}</td>
                    <td className="py-3 pr-4">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">
                        {token.tokenPrefix}...
                      </code>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                      {formatDate(token.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                      {token.lastUsedAt
                        ? formatDate(token.lastUsedAt)
                        : t("tokenNeverUsed")}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">
                      {token.expiresAt
                        ? formatDate(token.expiresAt)
                        : t("tokenNeverExpires")}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRevoke(token.id)}
                        disabled={revokeMutation.isLoading}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          confirmRevokeId === token.id
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {confirmRevokeId === token.id
                          ? t("revokeTokenConfirm")
                          : t("revokeToken")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
