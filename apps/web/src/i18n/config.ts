// Supported locales
export const locales = ["en", "es", "ca"] as const;
export type Locale = (typeof locales)[number];

// Default locale when no preference is found
export const defaultLocale: Locale = "en";

// Language display names in their own language
export const languageNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
};

// LocalStorage key for persisting language preference
export const LANGUAGE_STORAGE_KEY = "trackdev_language";

// Get browser's preferred locale
export function getBrowserLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  // Get browser language (e.g., 'en-US', 'es', 'ca')
  const browserLang = navigator.language.split("-")[0];

  // Check if it's a supported locale
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // Fallback to checking navigator.languages
  for (const lang of navigator.languages) {
    const langCode = lang.split("-")[0];
    if (locales.includes(langCode as Locale)) {
      return langCode as Locale;
    }
  }

  return defaultLocale;
}

// Get stored locale from localStorage
export function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored && locales.includes(stored as Locale)) {
    return stored as Locale;
  }

  return null;
}

// Store locale preference
export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
}

// Get initial locale: stored > browser > default
export function getInitialLocale(): Locale {
  return getStoredLocale() || getBrowserLocale();
}
