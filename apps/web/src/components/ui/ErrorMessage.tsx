"use client";

import { ApiClientError } from "@trackdev/api-client";
import {
  AlertCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  ServerCrash,
  Wifi,
  WifiOff,
} from "lucide-react";
import { LoadingContainer } from "./LoadingSpinner";

export interface ErrorInfo {
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isAuthError?: boolean;
  isServerError?: boolean;
  status?: number;
  message?: string;
  getUserMessage?: () => string;
}

export interface ErrorMessageProps {
  error: ErrorInfo | ApiClientError | null;
  onRetry?: () => void;
  className?: string;
  variant?: "inline" | "card" | "banner";
}

/**
 * Get the appropriate icon for an error type
 */
function getErrorIcon(error: ErrorInfo): React.ReactNode {
  if (error.isNetworkError && !error.isTimeout) {
    return <WifiOff className="h-5 w-5 text-red-500" />;
  }
  if (error.isTimeout) {
    return <Wifi className="h-5 w-5 text-orange-500" />;
  }
  if (error.status === 401 || error.status === 403) {
    return <Lock className="h-5 w-5 text-yellow-500" />;
  }
  if (error.isServerError) {
    return <ServerCrash className="h-5 w-5 text-red-500" />;
  }
  return <AlertCircle className="h-5 w-5 text-red-500" />;
}

/**
 * Get the error title based on error type
 */
function getErrorTitle(error: ErrorInfo): string {
  if (error.isNetworkError && !error.isTimeout) {
    return "Connection Error";
  }
  if (error.isTimeout) {
    return "Request Timeout";
  }
  if (error.status === 401) {
    return "Authentication Required";
  }
  if (error.status === 403) {
    return "Access Denied";
  }
  if (error.isServerError) {
    return "Server Error";
  }
  if (error.status === 404) {
    return "Not Found";
  }
  return "Error";
}

/**
 * Get a user-friendly message for the error
 */
function getErrorMessage(error: ErrorInfo): string {
  // Use the error's own getUserMessage if available
  if (error.getUserMessage) {
    return error.getUserMessage();
  }

  // Fallback messages
  if (error.isNetworkError && !error.isTimeout) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }
  if (error.isTimeout) {
    return "The request timed out. Please try again.";
  }
  if (error.status === 401) {
    return "You need to log in to access this resource.";
  }
  if (error.status === 403) {
    return "You don't have permission to access this resource.";
  }
  if (error.isServerError) {
    return "An unexpected server error occurred. Please try again later.";
  }

  return error.message || "An unexpected error occurred. Please try again.";
}

/**
 * ErrorMessage component for displaying API errors with appropriate styling and retry functionality
 */
export function ErrorMessage({
  error,
  onRetry,
  className = "",
  variant = "card",
}: ErrorMessageProps) {
  if (!error) return null;

  const icon = getErrorIcon(error);
  const title = getErrorTitle(error);
  const message = getErrorMessage(error);

  // Inline variant - minimal, for form errors
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-red-600 dark:text-red-400 ${className}`}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 text-red-700 hover:text-red-800 underline dark:text-red-400 dark:hover:text-red-300"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Banner variant - full width, for page-level errors
  if (variant === "banner") {
    const bgColor = error.isNetworkError
      ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
      : error.isAuthError
        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";

    return (
      <div className={`border-l-4 p-4 ${bgColor} ${className}`}>
        <div className="flex items-start gap-3">
          {icon}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {message}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default) - centered, for empty states
  const bgColor = error.isNetworkError
    ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
    : error.isAuthError
      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
      : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";

  return (
    <div
      className={`rounded-lg border p-6 text-center ${bgColor} ${className}`}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xs dark:bg-gray-700">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * QueryStateContainer - handles loading, error, and empty states for data fetching
 */
export interface QueryStateContainerProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: ErrorInfo | ApiClientError | null;
  onRetry?: () => void;
  loadingClassName?: string;
  errorVariant?: "inline" | "card" | "banner";
  children: React.ReactNode;
}

export function QueryStateContainer({
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  loadingClassName = "py-12",
  errorVariant = "card",
  children,
}: QueryStateContainerProps) {
  if (isLoading) {
    return <LoadingContainer className={loadingClassName} />;
  }

  if (isError && error) {
    return (
      <div className={loadingClassName}>
        <ErrorMessage error={error} onRetry={onRetry} variant={errorVariant} />
      </div>
    );
  }

  return <>{children}</>;
}

export default ErrorMessage;
