"use client";

interface FormModalFooterProps {
  onCancel: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  submitButtonType?: "submit" | "button";
  submitButtonVariant?: "primary" | "danger";
}

/**
 * Reusable footer for form modals with Cancel and Submit buttons.
 * Handles loading states and consistent styling.
 */
export function FormModalFooter({
  onCancel,
  onSubmit,
  cancelLabel = "Cancel",
  submitLabel = "Submit",
  isSubmitting = false,
  submitDisabled = false,
  submitButtonType = "submit",
  submitButtonVariant = "primary",
}: FormModalFooterProps) {
  const baseButtonClass =
    "rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed";

  const submitButtonClass =
    submitButtonVariant === "danger"
      ? `${baseButtonClass} bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300`
      : `${baseButtonClass} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300`;

  return (
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className={`${baseButtonClass} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
        disabled={isSubmitting}
      >
        {cancelLabel}
      </button>
      <button
        type={submitButtonType}
        onClick={submitButtonType === "button" ? onSubmit : undefined}
        className={submitButtonClass}
        disabled={submitDisabled || isSubmitting}
      >
        {isSubmitting ? "..." : submitLabel}
      </button>
    </div>
  );
}
