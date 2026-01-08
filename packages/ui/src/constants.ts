// ============================================
// Shared Constants
// ============================================

import type { SprintStatus, TaskStatus, TaskType } from "@trackdev/types";

/**
 * Task status configuration
 */
export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  BACKLOG: { label: "Backlog", color: "#6b7280", bgColor: "#f3f4f6" },
  TODO: { label: "To Do", color: "#3b82f6", bgColor: "#dbeafe" },
  INPROGRESS: { label: "In Progress", color: "#f59e0b", bgColor: "#fef3c7" },
  VERIFY: { label: "Verify", color: "#8b5cf6", bgColor: "#ede9fe" },
  DONE: { label: "Done", color: "#10b981", bgColor: "#d1fae5" },
  DEFINED: { label: "Defined", color: "#6b7280", bgColor: "#f3f4f6" },
};

/**
 * Task type configuration
 */
export const TASK_TYPE_CONFIG: Record<
  TaskType,
  { label: string; color: string; bgColor: string }
> = {
  USER_STORY: { label: "User Story", color: "#3b82f6", bgColor: "#dbeafe" },
  TASK: { label: "Task", color: "#10b981", bgColor: "#d1fae5" },
  BUG: { label: "Bug", color: "#ef4444", bgColor: "#fee2e2" },
};

/**
 * Sprint status configuration
 */
export const SPRINT_STATUS_CONFIG: Record<
  SprintStatus,
  { label: string; color: string; bgColor: string }
> = {
  DRAFT: { label: "Draft", color: "#6b7280", bgColor: "#f3f4f6" },
  ACTIVE: { label: "Active", color: "#10b981", bgColor: "#d1fae5" },
  CLOSED: { label: "Closed", color: "#3b82f6", bgColor: "#dbeafe" },
};

/**
 * Estimation points options
 */
export const ESTIMATION_POINTS = [0, 1, 2, 3, 5, 8, 13, 21];

/**
 * Primary colors for theming
 */
export const COLORS = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
};

/**
 * App configuration
 */
export const APP_CONFIG = {
  name: "TrackDev",
  description: "Agile Project Management for Education",
  version: "1.0.0",
};
