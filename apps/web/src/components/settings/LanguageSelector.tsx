"use client";

import { useLanguage } from "@/i18n";
import { languageNames, locales, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  showLabel?: boolean;
  className?: string;
}

export function LanguageSelector({
  showLabel = true,
  className = "",
}: LanguageSelectorProps) {
  const { locale, setLocale, isLoading } = useLanguage();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-5 w-5 text-gray-400" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && <Globe className="h-5 w-5 text-gray-400" />}
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="select"
        aria-label="Select language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {languageNames[loc]}
          </option>
        ))}
      </select>
    </div>
  );
}
