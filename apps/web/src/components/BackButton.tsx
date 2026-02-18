"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface BackButtonProps {
  /**
   * Fallback URL to navigate to if there's no history or if the user
   * navigated directly to this page.
   */
  fallbackHref: string;
  /**
   * Label to display next to the back arrow.
   * Defaults to "Back"
   */
  label?: string;
  /**
   * Additional CSS classes for the button
   */
  className?: string;
}

/**
 * A smart back button that uses browser history when available,
 * or falls back to a specified URL.
 *
 * Uses sessionStorage to track if the user has navigation history
 * within the app, ensuring we don't navigate outside the application.
 */
export function BackButton({
  fallbackHref,
  label = "Back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // Check if we have history entries from within our app
    // We track this via sessionStorage to know if user navigated within the app
    const historyLength = window.history.length;
    const appHistoryCount = parseInt(
      sessionStorage.getItem("appHistoryCount") || "0",
      10
    );

    // If we have app history and browser has enough history entries, we can go back
    setCanGoBack(appHistoryCount > 0 && historyLength > 1);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      if (canGoBack) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    },
    [canGoBack, fallbackHref, router]
  );

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

/**
 * Hook to track navigation history within the app.
 * Call this in your root layout to enable BackButton functionality.
 */
export function useNavigationTracking() {
  useEffect(() => {
    // Increment app history count on each navigation
    const incrementHistory = () => {
      const current = parseInt(
        sessionStorage.getItem("appHistoryCount") || "0",
        10
      );
      sessionStorage.setItem("appHistoryCount", String(current + 1));
    };

    // Initialize on mount
    incrementHistory();

    // Listen for popstate (browser back/forward)
    const handlePopState = () => {
      const current = parseInt(
        sessionStorage.getItem("appHistoryCount") || "0",
        10
      );
      if (current > 0) {
        sessionStorage.setItem("appHistoryCount", String(current - 1));
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
}
