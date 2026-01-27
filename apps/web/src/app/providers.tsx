"use client";

import { ThemeProvider } from "@/components/theme";
import { ToastProvider } from "@/components/ui";
import { LanguageProvider, useLanguage } from "@/i18n";
import { AuthProvider } from "@trackdev/api-client";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback } from "react";

const TOKEN_KEY = "trackdev_token";

// Inner component that has access to the language context
function AuthProviderWithLocale({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { locale } = useLanguage();

  const getStoredToken = useCallback(async () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  const setStoredToken = useCallback(async (token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  const handleAuthExpired = useCallback(() => {
    // Redirect to login when authentication expires (JWT expired)
    router.push("/login");
  }, [router]);

  // getLocale returns the current locale for Accept-Language header
  const getLocale = useCallback(() => locale, [locale]);

  return (
    <AuthProvider
      baseUrl={process.env.NEXT_PUBLIC_API_URL}
      getStoredToken={getStoredToken}
      setStoredToken={setStoredToken}
      onAuthExpired={handleAuthExpired}
      getLocale={getLocale}
    >
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProviderWithLocale>{children}</AuthProviderWithLocale>
      </LanguageProvider>
    </ThemeProvider>
  );
}
