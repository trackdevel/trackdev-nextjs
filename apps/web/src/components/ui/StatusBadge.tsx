"use client";

type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "primary";

interface StatusBadgeProps {
  /** The text to display */
  label: string;
  /** Visual variant */
  variant?: StatusVariant;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional className */
  className?: string;
}

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-700",
  primary: "bg-primary-100 text-primary-700",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

/**
 * Reusable status badge component with various color variants.
 * Used for sprint status, task status, webhook status, etc.
 */
export function StatusBadge({
  label,
  variant = "neutral",
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {label}
    </span>
  );
}

// Common status mappings for convenience
export type SprintStatus = "ACTIVE" | "CLOSED" | "FUTURE" | "CREATED";
export type TaskStatus = "BACKLOG" | "TODO" | "INPROGRESS" | "VERIFY" | "DONE";

/**
 * Get the appropriate variant for a sprint status
 */
export function getSprintStatusVariant(status: SprintStatus): StatusVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "CLOSED":
      return "neutral";
    case "FUTURE":
    case "CREATED":
      return "warning";
    default:
      return "neutral";
  }
}

/**
 * Get the appropriate variant for a task status
 */
export function getTaskStatusVariant(status: TaskStatus): StatusVariant {
  switch (status) {
    case "DONE":
      return "success";
    case "INPROGRESS":
      return "info";
    case "VERIFY":
      return "warning";
    case "TODO":
      return "primary";
    case "BACKLOG":
    default:
      return "neutral";
  }
}
