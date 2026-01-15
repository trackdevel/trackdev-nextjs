"use client";

interface AccessDeniedProps {
  title: string;
  message: string;
}

/**
 * Displays an access denied message when user doesn't have permission to view a page.
 */
export function AccessDenied({ title, message }: AccessDeniedProps) {
  return (
    <div className="p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-semibold">{title}</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
