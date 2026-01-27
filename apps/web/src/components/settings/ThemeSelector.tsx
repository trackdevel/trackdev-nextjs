"use client";

import { useTheme, type Theme } from "@/components/theme";
import { Select } from "@/components/ui";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

interface ThemeSelectorProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeSelector({
  showLabel = true,
  className = "",
}: ThemeSelectorProps) {
  const { theme, setTheme, isLoading } = useTheme();
  const t = useTranslations("settings");

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Sun className="h-5 w-5 text-gray-400" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  const themeOptions = [
    { value: "light" as Theme, label: t("themeLight"), icon: Sun },
    { value: "dark" as Theme, label: t("themeDark"), icon: Moon },
    { value: "system" as Theme, label: t("themeSystem"), icon: Monitor },
  ];

  const currentIcon =
    themeOptions.find((opt) => opt.value === theme)?.icon || Sun;
  const IconComponent = currentIcon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <IconComponent className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      )}
      <Select
        value={theme}
        onChange={(value) => setTheme(value as Theme)}
        options={themeOptions.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        aria-label={t("selectTheme")}
      />
    </div>
  );
}
