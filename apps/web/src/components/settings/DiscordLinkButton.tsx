"use client";

import { useToast } from "@/components/ui/Toast";
import {
    ApiClientError,
    discordApi,
    useAuth,
    useMutation,
} from "@trackdev/api-client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Loader2, MessageSquare, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface DiscordLinkButtonProps {
    className?: string;
}

export function DiscordLinkButton({ className = "" }: DiscordLinkButtonProps) {
    const t = useTranslations("settings");
    const toast = useToast();
    const { user, refreshUser } = useAuth();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const isLinked = !!user?.discordInfo?.discordId;

    const handshakeMutation = useMutation(() => discordApi.getHandshake(), {
        onSuccess: (data) => {
            window.location.href = data.url;
        },
        onError: (err: ApiClientError) => {
            const errorMessage = err.body?.message
                    ? err.body.message
                    : t("discordLinkError");
            toast.error(errorMessage);
        },
    });

    const unlinkMutation = useMutation(() => discordApi.unlink(), {
        onSuccess: () => {
            toast.success(t("discordUnlinkSuccess"));
            setIsConfirmOpen(false);
            refreshUser();
        },
        onError: (err: ApiClientError) => {
            const errorMessage = err.body?.message
                    ? err.body.message
                    : t("discordUnlinkError");
            toast.error(errorMessage);
            setIsConfirmOpen(false);
        },
    });

    const handleLink = () => {
        handshakeMutation.mutate();
    };

    const handleUnlink = () => {
        setIsConfirmOpen(true);
    };

    const confirmUnlink = () => {
        unlinkMutation.mutate();
    };

    if (isLinked) {
        return (
            <>
                <div
                    className={`flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700 ${className}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">{t("discord")}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("discordLinked", { username: user?.discordInfo?.username || "" })}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleUnlink}
                        disabled={unlinkMutation.isLoading}
                        className="btn-outline flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                    >
                        {unlinkMutation.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Unlink className="h-4 w-4" />
                        )}
                        {t("unlinkDiscord")}
                    </button>
                </div>

                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={confirmUnlink}
                    title={t("confirmUnlinkDiscord")}
                    message={t("confirmUnlinkDiscordMessage")}
                    confirmLabel={t("unlinkDiscord")}
                    isLoading={unlinkMutation.isLoading}
                    variant="danger"
                />
            </>
        );
    }

    return (
        <div
            className={`flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700 ${className}`}
        >
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                    <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white">{t("discord")}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("discordDescription")}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={handleLink}
                disabled={handshakeMutation.isLoading}
                className="btn-primary flex items-center gap-2"
            >
                {handshakeMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <MessageSquare className="h-4 w-4" />
                )}
                {t("linkDiscord")}
            </button>
        </div>
    );
}
