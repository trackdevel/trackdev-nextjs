"use client";

interface ErrorAlertProps {
  message: string;
  className?: string;
}

/**
 * Displays an error message in a styled alert box.
 * Used in forms and modals to show validation or API errors.
 */
export function ErrorAlert({ message, className = "" }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className={`rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600 ${className}`}
    >
      {message}
    </div>
  );
}
