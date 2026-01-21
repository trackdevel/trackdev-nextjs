/**
 * Date formatting utilities with timezone support
 *
 * These functions format dates according to the user's timezone preference,
 * displaying the timezone acronym alongside the formatted date/time.
 */

/**
 * Mapping of IANA timezone identifiers to their common abbreviations
 * for standard time (winter) and daylight saving time (summer)
 */
const TIMEZONE_ABBREVIATIONS: Record<
  string,
  { standard: string; daylight: string }
> = {
  // Central European Time
  "Europe/Madrid": { standard: "CET", daylight: "CEST" },
  "Europe/Paris": { standard: "CET", daylight: "CEST" },
  "Europe/Berlin": { standard: "CET", daylight: "CEST" },
  "Europe/Rome": { standard: "CET", daylight: "CEST" },
  "Europe/Amsterdam": { standard: "CET", daylight: "CEST" },
  "Europe/Brussels": { standard: "CET", daylight: "CEST" },
  "Europe/Vienna": { standard: "CET", daylight: "CEST" },
  "Europe/Warsaw": { standard: "CET", daylight: "CEST" },
  "Europe/Prague": { standard: "CET", daylight: "CEST" },
  "Europe/Budapest": { standard: "CET", daylight: "CEST" },
  "Europe/Stockholm": { standard: "CET", daylight: "CEST" },
  "Europe/Oslo": { standard: "CET", daylight: "CEST" },
  "Europe/Copenhagen": { standard: "CET", daylight: "CEST" },
  "Europe/Zurich": { standard: "CET", daylight: "CEST" },
  // Eastern European Time
  "Europe/Athens": { standard: "EET", daylight: "EEST" },
  "Europe/Bucharest": { standard: "EET", daylight: "EEST" },
  "Europe/Helsinki": { standard: "EET", daylight: "EEST" },
  "Europe/Sofia": { standard: "EET", daylight: "EEST" },
  "Europe/Kyiv": { standard: "EET", daylight: "EEST" },
  "Europe/Riga": { standard: "EET", daylight: "EEST" },
  "Europe/Tallinn": { standard: "EET", daylight: "EEST" },
  "Europe/Vilnius": { standard: "EET", daylight: "EEST" },
  // Western European Time
  "Europe/London": { standard: "GMT", daylight: "BST" },
  "Europe/Dublin": { standard: "GMT", daylight: "IST" },
  "Europe/Lisbon": { standard: "WET", daylight: "WEST" },
  // Other common timezones that benefit from abbreviations
  "Atlantic/Canary": { standard: "WET", daylight: "WEST" },
};

/**
 * Check if a date is in daylight saving time for a given timezone
 */
function isDaylightSavingTime(timezone: string, date: Date): boolean {
  try {
    // Get the offset for the given date
    const winterDate = new Date(date.getFullYear(), 0, 1); // January 1st
    const summerDate = new Date(date.getFullYear(), 6, 1); // July 1st

    const winterFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const summerFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const currentFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });

    const winterOffset =
      winterFormatter
        .formatToParts(winterDate)
        .find((p) => p.type === "timeZoneName")?.value || "";
    const summerOffset =
      summerFormatter
        .formatToParts(summerDate)
        .find((p) => p.type === "timeZoneName")?.value || "";
    const currentOffset =
      currentFormatter
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value || "";

    // If winter and summer offsets differ, DST is observed
    // Current date is in DST if its offset matches summer offset
    return winterOffset !== summerOffset && currentOffset === summerOffset;
  } catch {
    return false;
  }
}

/**
 * Get the timezone acronym for a given IANA timezone identifier
 * This handles both standard and daylight saving time abbreviations
 */
export function getTimezoneAcronym(
  timezone: string,
  date: Date = new Date(),
): string {
  try {
    // Check if we have a custom abbreviation for this timezone
    const customAbbrev = TIMEZONE_ABBREVIATIONS[timezone];
    if (customAbbrev) {
      const isDST = isDaylightSavingTime(timezone, date);
      return isDST ? customAbbrev.daylight : customAbbrev.standard;
    }

    // Use Intl.DateTimeFormat to get the timezone abbreviation
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });

    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find((part) => part.type === "timeZoneName");

    if (timeZonePart) {
      return timeZonePart.value;
    }

    // Fallback: return UTC offset if no abbreviation found
    return getTimezoneOffset(timezone, date);
  } catch {
    return "UTC";
  }
}

/**
 * Get the UTC offset string for a timezone (e.g., "+02:00" or "-05:00")
 */
export function getTimezoneOffset(
  timezone: string,
  date: Date = new Date(),
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });

    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find((part) => part.type === "timeZoneName");

    if (timeZonePart) {
      // Extract just the offset part (e.g., "GMT+02:00" -> "+02:00")
      const match = timeZonePart.value.match(/([+-]\d{2}:\d{2})/);
      if (match) {
        return match[1];
      }
      // For UTC, return "+00:00"
      if (timeZonePart.value === "GMT" || timeZonePart.value === "UTC") {
        return "+00:00";
      }
    }

    return "+00:00";
  } catch {
    return "+00:00";
  }
}

export interface FormatDateOptions {
  /** Include time in the output */
  includeTime?: boolean;
  /** Include timezone acronym in the output */
  includeTimezone?: boolean;
  /** Use short date format */
  shortDate?: boolean;
  /** Include seconds in time */
  includeSeconds?: boolean;
}

/**
 * Format a date string or Date object according to the user's timezone
 *
 * @param dateInput - ISO date string or Date object
 * @param timezone - IANA timezone identifier (e.g., "America/New_York", "Europe/London")
 * @param options - Formatting options
 * @returns Formatted date string with timezone acronym
 */
export function formatDate(
  dateInput: string | Date | undefined | null,
  timezone: string = "UTC",
  options: FormatDateOptions = {},
): string {
  if (!dateInput) {
    return "";
  }

  const {
    includeTime = false,
    includeTimezone = true,
    shortDate = false,
    includeSeconds = false,
  } = options;

  try {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    if (isNaN(date.getTime())) {
      return "";
    }

    // Build date format options
    const dateFormatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
    };

    if (shortDate) {
      dateFormatOptions.year = "numeric";
      dateFormatOptions.month = "short";
      dateFormatOptions.day = "numeric";
    } else {
      dateFormatOptions.year = "numeric";
      dateFormatOptions.month = "long";
      dateFormatOptions.day = "numeric";
    }

    if (includeTime) {
      dateFormatOptions.hour = "2-digit";
      dateFormatOptions.minute = "2-digit";
      if (includeSeconds) {
        dateFormatOptions.second = "2-digit";
      }
      dateFormatOptions.hour12 = false;
    }

    const formatter = new Intl.DateTimeFormat("en-US", dateFormatOptions);
    let formatted = formatter.format(date);

    // Add timezone acronym if requested
    if (includeTimezone && includeTime) {
      const acronym = getTimezoneAcronym(timezone, date);
      formatted = `${formatted} ${acronym}`;
    }

    return formatted;
  } catch {
    return "";
  }
}

/**
 * Format a date for display with time (e.g., "Jan 15, 2025, 14:30 CET")
 */
export function formatDateTime(
  dateInput: string | Date | undefined | null,
  timezone: string = "UTC",
): string {
  return formatDate(dateInput, timezone, {
    includeTime: true,
    includeTimezone: true,
    shortDate: true,
  });
}

/**
 * Format a date only (no time) (e.g., "Jan 15, 2025")
 */
export function formatDateOnly(
  dateInput: string | Date | undefined | null,
  timezone: string = "UTC",
): string {
  return formatDate(dateInput, timezone, {
    includeTime: false,
    includeTimezone: false,
    shortDate: true,
  });
}

/**
 * Format a date range for sprints (e.g., "Jan 15, 2025 - Feb 15, 2025")
 */
export function formatDateRange(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null,
  timezone: string = "UTC",
): string {
  const formattedStart = formatDateOnly(startDate, timezone);
  const formattedEnd = formatDateOnly(endDate, timezone);

  if (!formattedStart && !formattedEnd) {
    return "";
  }

  if (!formattedStart) {
    return `- ${formattedEnd}`;
  }

  if (!formattedEnd) {
    return `${formattedStart} -`;
  }

  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Format a date range with times for sprint patterns
 * (e.g., "Jan 15, 2025, 09:00 - Feb 15, 2025, 18:00 CET")
 */
export function formatDateTimeRange(
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null,
  timezone: string = "UTC",
): string {
  const formattedStart = formatDate(startDate, timezone, {
    includeTime: true,
    includeTimezone: false,
    shortDate: true,
  });
  const formattedEnd = formatDateTime(endDate, timezone);

  if (!formattedStart && !formattedEnd) {
    return "";
  }

  if (!formattedStart) {
    return `- ${formattedEnd}`;
  }

  if (!formattedEnd) {
    return `${formattedStart} -`;
  }

  return `${formattedStart} - ${formattedEnd}`;
}

/**
 * Convert a local datetime string (from datetime-local input) to ISO 8601 UTC format.
 * The input is interpreted as being in the specified timezone.
 *
 * @param localDatetime - DateTime string in format "YYYY-MM-DDTHH:mm" (no timezone)
 * @param timezone - The IANA timezone the localDatetime is expressed in (e.g., "Europe/Madrid")
 * @returns ISO 8601 string with UTC offset (e.g., "2025-01-21T13:30:00+00:00") or empty string if invalid
 *
 * @example
 * // User in Madrid enters 14:30, which is 13:30 UTC in winter (CET = UTC+1)
 * localDateTimeToUTC("2025-01-21T14:30", "Europe/Madrid")
 * // Returns: "2025-01-21T13:30:00+00:00"
 */
export function localDateTimeToUTC(
  localDatetime: string | undefined | null,
  timezone: string = "UTC",
): string {
  if (!localDatetime) {
    return "";
  }

  try {
    // Parse the local datetime string
    // The datetime-local input gives us "YYYY-MM-DDTHH:mm"
    const [datePart, timePart] = localDatetime.split("T");
    if (!datePart || !timePart) {
      return "";
    }

    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    // Create a Date object interpreted as the user's timezone
    // We need to find the UTC equivalent of this local time

    // First, create a formatter that will give us the offset for this timezone at this time
    const tempDate = new Date(year, month - 1, day, hours, minutes);

    // Get the timezone offset for the target timezone at this date
    const offsetFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    });
    const offsetParts = offsetFormatter.formatToParts(tempDate);
    const tzPart =
      offsetParts.find((p) => p.type === "timeZoneName")?.value || "GMT";

    // Parse offset like "GMT+01:00" or "GMT-05:00" or "GMT"
    let offsetMinutes = 0;
    const offsetMatch = tzPart.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (offsetMatch) {
      const sign = offsetMatch[1] === "+" ? 1 : -1;
      offsetMinutes =
        sign * (parseInt(offsetMatch[2]) * 60 + parseInt(offsetMatch[3]));
    }

    // Create the UTC date by subtracting the offset
    // If timezone is UTC+1, the local time 14:30 means 13:30 UTC
    const utcDate = new Date(year, month - 1, day, hours, minutes);
    utcDate.setMinutes(
      utcDate.getMinutes() - offsetMinutes - utcDate.getTimezoneOffset(),
    );

    // Format as ISO 8601 with +00:00 suffix (UTC)
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${utcDate.getUTCFullYear()}-${pad(utcDate.getUTCMonth() + 1)}-${pad(utcDate.getUTCDate())}T${pad(utcDate.getUTCHours())}:${pad(utcDate.getUTCMinutes())}:00+00:00`;
  } catch {
    return "";
  }
}

/**
 * Convert a UTC ISO 8601 datetime to a local datetime string for datetime-local input.
 * The output is expressed in the specified timezone.
 *
 * @param utcDatetime - ISO 8601 datetime string (e.g., "2025-01-21T13:30:00+00:00")
 * @param timezone - The IANA timezone to express the result in (e.g., "Europe/Madrid")
 * @returns DateTime string in format "YYYY-MM-DDTHH:mm" for datetime-local input
 *
 * @example
 * // UTC 13:30 displayed in Madrid timezone (CET = UTC+1) in winter
 * utcToLocalDateTime("2025-01-21T13:30:00+00:00", "Europe/Madrid")
 * // Returns: "2025-01-21T14:30"
 */
export function utcToLocalDateTime(
  utcDatetime: string | undefined | null,
  timezone: string = "UTC",
): string {
  if (!utcDatetime) {
    return "";
  }

  try {
    const date = new Date(utcDatetime);
    if (isNaN(date.getTime())) {
      return "";
    }

    // Format the date in the target timezone
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value || "00";

    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
  } catch {
    return "";
  }
}
