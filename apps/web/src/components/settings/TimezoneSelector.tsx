"use client";

import { useToast } from "@/components/ui/Toast";
import {
  ApiClientError,
  useAuth,
  useMutation,
  usersApi,
} from "@trackdev/api-client";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

// Comprehensive list of IANA timezone identifiers organized by region
const TIMEZONES = [
  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: "+00:00" },

  // Africa
  { value: "Africa/Abidjan", label: "Abidjan", offset: "+00:00" },
  { value: "Africa/Cairo", label: "Cairo", offset: "+02:00" },
  { value: "Africa/Casablanca", label: "Casablanca", offset: "+01:00" },
  { value: "Africa/Johannesburg", label: "Johannesburg", offset: "+02:00" },
  { value: "Africa/Lagos", label: "Lagos", offset: "+01:00" },
  { value: "Africa/Nairobi", label: "Nairobi", offset: "+03:00" },
  { value: "Africa/Tunis", label: "Tunis", offset: "+01:00" },

  // America
  { value: "America/Anchorage", label: "Anchorage (AKST)", offset: "-09:00" },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "Buenos Aires",
    offset: "-03:00",
  },
  { value: "America/Bogota", label: "Bogotá", offset: "-05:00" },
  { value: "America/Chicago", label: "Chicago (CST)", offset: "-06:00" },
  { value: "America/Denver", label: "Denver (MST)", offset: "-07:00" },
  { value: "America/Halifax", label: "Halifax (AST)", offset: "-04:00" },
  { value: "America/Lima", label: "Lima", offset: "-05:00" },
  {
    value: "America/Los_Angeles",
    label: "Los Angeles (PST)",
    offset: "-08:00",
  },
  { value: "America/Mexico_City", label: "Mexico City", offset: "-06:00" },
  { value: "America/New_York", label: "New York (EST)", offset: "-05:00" },
  { value: "America/Phoenix", label: "Phoenix (MST)", offset: "-07:00" },
  { value: "America/Santiago", label: "Santiago", offset: "-03:00" },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: "-03:00" },
  { value: "America/Toronto", label: "Toronto (EST)", offset: "-05:00" },
  { value: "America/Vancouver", label: "Vancouver (PST)", offset: "-08:00" },

  // Asia
  { value: "Asia/Bangkok", label: "Bangkok", offset: "+07:00" },
  { value: "Asia/Colombo", label: "Colombo", offset: "+05:30" },
  { value: "Asia/Dhaka", label: "Dhaka", offset: "+06:00" },
  { value: "Asia/Dubai", label: "Dubai", offset: "+04:00" },
  { value: "Asia/Ho_Chi_Minh", label: "Ho Chi Minh City", offset: "+07:00" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "+08:00" },
  { value: "Asia/Jakarta", label: "Jakarta", offset: "+07:00" },
  { value: "Asia/Jerusalem", label: "Jerusalem", offset: "+02:00" },
  { value: "Asia/Karachi", label: "Karachi", offset: "+05:00" },
  { value: "Asia/Kolkata", label: "Kolkata", offset: "+05:30" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", offset: "+08:00" },
  { value: "Asia/Manila", label: "Manila", offset: "+08:00" },
  { value: "Asia/Seoul", label: "Seoul", offset: "+09:00" },
  { value: "Asia/Shanghai", label: "Shanghai", offset: "+08:00" },
  { value: "Asia/Singapore", label: "Singapore", offset: "+08:00" },
  { value: "Asia/Taipei", label: "Taipei", offset: "+08:00" },
  { value: "Asia/Tehran", label: "Tehran", offset: "+03:30" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: "+09:00" },

  // Atlantic
  { value: "Atlantic/Azores", label: "Azores", offset: "-01:00" },
  { value: "Atlantic/Canary", label: "Canary Islands", offset: "+00:00" },
  { value: "Atlantic/Reykjavik", label: "Reykjavik", offset: "+00:00" },

  // Australia
  { value: "Australia/Adelaide", label: "Adelaide", offset: "+09:30" },
  { value: "Australia/Brisbane", label: "Brisbane", offset: "+10:00" },
  { value: "Australia/Darwin", label: "Darwin", offset: "+09:30" },
  { value: "Australia/Melbourne", label: "Melbourne", offset: "+10:00" },
  { value: "Australia/Perth", label: "Perth", offset: "+08:00" },
  { value: "Australia/Sydney", label: "Sydney", offset: "+10:00" },

  // Europe
  { value: "Europe/Amsterdam", label: "Amsterdam", offset: "+01:00" },
  { value: "Europe/Athens", label: "Athens", offset: "+02:00" },
  { value: "Europe/Barcelona", label: "Barcelona", offset: "+01:00" },
  { value: "Europe/Berlin", label: "Berlin", offset: "+01:00" },
  { value: "Europe/Brussels", label: "Brussels", offset: "+01:00" },
  { value: "Europe/Bucharest", label: "Bucharest", offset: "+02:00" },
  { value: "Europe/Budapest", label: "Budapest", offset: "+01:00" },
  { value: "Europe/Copenhagen", label: "Copenhagen", offset: "+01:00" },
  { value: "Europe/Dublin", label: "Dublin", offset: "+00:00" },
  { value: "Europe/Helsinki", label: "Helsinki", offset: "+02:00" },
  { value: "Europe/Istanbul", label: "Istanbul", offset: "+03:00" },
  { value: "Europe/Kyiv", label: "Kyiv", offset: "+02:00" },
  { value: "Europe/Lisbon", label: "Lisbon", offset: "+00:00" },
  { value: "Europe/London", label: "London", offset: "+00:00" },
  { value: "Europe/Madrid", label: "Madrid", offset: "+01:00" },
  { value: "Europe/Milan", label: "Milan", offset: "+01:00" },
  { value: "Europe/Moscow", label: "Moscow", offset: "+03:00" },
  { value: "Europe/Oslo", label: "Oslo", offset: "+01:00" },
  { value: "Europe/Paris", label: "Paris", offset: "+01:00" },
  { value: "Europe/Prague", label: "Prague", offset: "+01:00" },
  { value: "Europe/Rome", label: "Rome", offset: "+01:00" },
  { value: "Europe/Stockholm", label: "Stockholm", offset: "+01:00" },
  { value: "Europe/Vienna", label: "Vienna", offset: "+01:00" },
  { value: "Europe/Warsaw", label: "Warsaw", offset: "+01:00" },
  { value: "Europe/Zurich", label: "Zürich", offset: "+01:00" },

  // Indian
  { value: "Indian/Maldives", label: "Maldives", offset: "+05:00" },
  { value: "Indian/Mauritius", label: "Mauritius", offset: "+04:00" },

  // Pacific
  { value: "Pacific/Auckland", label: "Auckland", offset: "+12:00" },
  { value: "Pacific/Fiji", label: "Fiji", offset: "+12:00" },
  { value: "Pacific/Guam", label: "Guam", offset: "+10:00" },
  { value: "Pacific/Honolulu", label: "Honolulu (HST)", offset: "-10:00" },
  { value: "Pacific/Tahiti", label: "Tahiti", offset: "-10:00" },
];

// Group timezones by region for display
const TIMEZONE_GROUPS = {
  UTC: TIMEZONES.filter((tz) => tz.value === "UTC"),
  Africa: TIMEZONES.filter((tz) => tz.value.startsWith("Africa/")),
  Americas: TIMEZONES.filter((tz) => tz.value.startsWith("America/")),
  Asia: TIMEZONES.filter((tz) => tz.value.startsWith("Asia/")),
  Atlantic: TIMEZONES.filter((tz) => tz.value.startsWith("Atlantic/")),
  Australia: TIMEZONES.filter((tz) => tz.value.startsWith("Australia/")),
  Europe: TIMEZONES.filter((tz) => tz.value.startsWith("Europe/")),
  "Indian Ocean": TIMEZONES.filter((tz) => tz.value.startsWith("Indian/")),
  Pacific: TIMEZONES.filter((tz) => tz.value.startsWith("Pacific/")),
};

interface TimezoneSelectorProps {
  showLabel?: boolean;
  className?: string;
}

export function TimezoneSelector({
  showLabel = true,
  className = "",
}: TimezoneSelectorProps) {
  const t = useTranslations("settings");
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTimezone = user?.timezone || "UTC";

  // Filter timezones based on search query
  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) {
      return TIMEZONE_GROUPS;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, typeof TIMEZONES> = {};

    Object.entries(TIMEZONE_GROUPS).forEach(([region, tzs]) => {
      const matchingTzs = tzs.filter(
        (tz) =>
          tz.value.toLowerCase().includes(query) ||
          tz.label.toLowerCase().includes(query) ||
          tz.offset.includes(query),
      );
      if (matchingTzs.length > 0) {
        filtered[region] = matchingTzs;
      }
    });

    return filtered;
  }, [searchQuery]);

  // Get the display label for current timezone
  const currentTimezoneLabel = useMemo(() => {
    const tz = TIMEZONES.find((t) => t.value === currentTimezone);
    return tz ? `${tz.label} (${tz.offset})` : currentTimezone;
  }, [currentTimezone]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Mutation for updating timezone
  const timezoneMutation = useMutation(
    (timezone: string) => usersApi.updateSelf({ timezone }),
    {
      onSuccess: () => {
        refreshUser();
        toast.success(t("timezoneSaved"));
        setIsOpen(false);
        setSearchQuery("");
      },
      onError: (err) => {
        const errorMessage =
          err instanceof ApiClientError && err.body?.message
            ? err.body.message
            : "Failed to update timezone";
        toast.error(errorMessage);
      },
    },
  );

  const handleTimezoneSelect = (timezoneValue: string) => {
    if (timezoneValue !== currentTimezone) {
      timezoneMutation.mutate(timezoneValue);
    } else {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex items-center gap-2">
        {showLabel && <Clock className="h-5 w-5 text-gray-400" />}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={timezoneMutation.isLoading}
          className="input flex w-full min-w-[280px] items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{currentTimezoneLabel}</span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[320px] rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          {/* Search input */}
          <div className="border-b border-gray-200 p-2 dark:border-gray-600">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("timezoneSelectPlaceholder")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Timezone list */}
          <div className="max-h-[300px] overflow-y-auto">
            {Object.entries(filteredTimezones).map(([region, tzs]) => (
              <div key={region}>
                <div className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {region}
                </div>
                {tzs.map((tz) => (
                  <button
                    key={tz.value}
                    type="button"
                    onClick={() => handleTimezoneSelect(tz.value)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      currentTimezone === tz.value
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        : "text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <span>{tz.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tz.offset}</span>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(filteredTimezones).length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No timezones found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
