"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProjectFrozenBannerProps {
  frozen?: boolean;
}

export function ProjectFrozenBanner({ frozen }: ProjectFrozenBannerProps) {
  const t = useTranslations("projects");

  if (!frozen) {
    return null;
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{t("projectFrozenBanner")}</p>
    </div>
  );
}
