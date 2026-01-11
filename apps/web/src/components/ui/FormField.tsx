"use client";

import type { ReactNode } from "react";

interface FormFieldProps {
  /** Label text for the field */
  label: string;
  /** Unique ID for the input (used for htmlFor) */
  htmlFor?: string;
  /** Help text shown below the input */
  helpText?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** The input element(s) */
  children: ReactNode;
  /** Additional className for the container */
  className?: string;
}

/**
 * Reusable form field wrapper with label, help text, and error handling.
 * Wraps around input elements to provide consistent styling.
 */
export function FormField({
  label,
  htmlFor,
  helpText,
  error,
  required,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="mt-1">{children}</div>
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  /** Additional className */
  inputClassName?: string;
  /** Whether the input has an error */
  hasError?: boolean;
}

/**
 * Styled text input component.
 */
export function TextInput({
  inputClassName = "",
  hasError,
  ...props
}: TextInputProps) {
  return (
    <input
      className={`input ${
        hasError ? "border-red-500 focus:ring-red-500" : ""
      } ${inputClassName}`}
      {...props}
    />
  );
}

interface FormErrorProps {
  /** Error message to display */
  message: string | null | undefined;
  /** Additional className */
  className?: string;
}

/**
 * Form error alert component.
 */
export function FormError({ message, className = "" }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      className={`rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}
    >
      {message}
    </div>
  );
}
