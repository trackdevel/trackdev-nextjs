"use client";

import { LanguageProvider } from "@/i18n";
import { AuthProvider } from "@trackdev/api-client";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback } from "react";

const TOKEN_KEY = "trackdev_token";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

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

  return (
    <LanguageProvider>
      <AuthProvider
        baseUrl={process.env.NEXT_PUBLIC_API_URL}
        getStoredToken={getStoredToken}
        setStoredToken={setStoredToken}
        onAuthExpired={handleAuthExpired}
      >
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
}
