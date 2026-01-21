/**
 * React hook for timezone-aware date formatting
 *
 * This hook provides date formatting functions that automatically use
 * the current user's timezone preference.
 */

"use client";

import { useAuth } from "@trackdev/api-client";
import { useCallback, useMemo } from "react";
import {
  formatDate,
  formatDateOnly,
  formatDateRange,
  formatDateTime,
  formatDateTimeRange,
  getTimezoneAcronym,
  type FormatDateOptions,
} from "./dateFormat";

export interface UseDateFormatReturn {
  /** User's current timezone */
  timezone: string;
  /** Get timezone acronym (e.g., "CET", "EST", "UTC") */
  getAcronym: (date?: Date) => string;
  /** Format date with full options control */
  format: (
    dateInput: string | Date | undefined | null,
    options?: FormatDateOptions,
  ) => string;
  /** Format date with time (e.g., "Jan 15, 2025, 14:30 CET") */
  formatDateTime: (dateInput: string | Date | undefined | null) => string;
  /** Format date only (e.g., "Jan 15, 2025") */
  formatDateOnly: (dateInput: string | Date | undefined | null) => string;
  /** Format date range (e.g., "Jan 15, 2025 - Feb 15, 2025") */
  formatDateRange: (
    startDate: string | Date | undefined | null,
    endDate: string | Date | undefined | null,
  ) => string;
  /** Format date/time range (e.g., "Jan 15, 2025, 09:00 - Feb 15, 2025, 18:00 CET") */
  formatDateTimeRange: (
    startDate: string | Date | undefined | null,
    endDate: string | Date | undefined | null,
  ) => string;
}

/**
 * Hook for timezone-aware date formatting using the current user's timezone
 *
 * @example
 * ```tsx
 * const { formatDateTime, formatDateRange, timezone } = useDateFormat();
 *
 * // Format a single date/time
 * const formattedDate = formatDateTime(task.createdAt);
 * // Output: "Jan 15, 2025, 14:30 CET"
 *
 * // Format a date range for sprints
 * const dateRange = formatDateRange(sprint.startDate, sprint.endDate);
 * // Output: "Jan 15, 2025 - Feb 15, 2025"
 * ```
 */
export function useDateFormat(): UseDateFormatReturn {
  const { user } = useAuth();

  // Get user's timezone, defaulting to UTC
  const timezone = useMemo(() => {
    return user?.timezone || "UTC";
  }, [user?.timezone]);

  const getAcronym = useCallback(
    (date?: Date) => {
      return getTimezoneAcronym(timezone, date);
    },
    [timezone],
  );

  const format = useCallback(
    (
      dateInput: string | Date | undefined | null,
      options?: FormatDateOptions,
    ) => {
      return formatDate(dateInput, timezone, options);
    },
    [timezone],
  );

  const formatDateTimeCallback = useCallback(
    (dateInput: string | Date | undefined | null) => {
      return formatDateTime(dateInput, timezone);
    },
    [timezone],
  );

  const formatDateOnlyCallback = useCallback(
    (dateInput: string | Date | undefined | null) => {
      return formatDateOnly(dateInput, timezone);
    },
    [timezone],
  );

  const formatDateRangeCallback = useCallback(
    (
      startDate: string | Date | undefined | null,
      endDate: string | Date | undefined | null,
    ) => {
      return formatDateRange(startDate, endDate, timezone);
    },
    [timezone],
  );

  const formatDateTimeRangeCallback = useCallback(
    (
      startDate: string | Date | undefined | null,
      endDate: string | Date | undefined | null,
    ) => {
      return formatDateTimeRange(startDate, endDate, timezone);
    },
    [timezone],
  );

  return {
    timezone,
    getAcronym,
    format,
    formatDateTime: formatDateTimeCallback,
    formatDateOnly: formatDateOnlyCallback,
    formatDateRange: formatDateRangeCallback,
    formatDateTimeRange: formatDateTimeRangeCallback,
  };
}
