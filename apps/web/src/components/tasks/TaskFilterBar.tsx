"use client";

import { Select } from "@/components/ui";
import type { TaskStatus, TaskType } from "@trackdev/types";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  Filter,
  Search,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

/** Sentinel value for the assignee filter to match tasks without an assignee. */
export const UNASSIGNED_ASSIGNEE_VALUE = "__unassigned__";

const TASK_TYPE_VALUES: TaskType[] = ["USER_STORY", "TASK", "BUG"];

/** Parse the CSV `filters.type` value into the list of selected TaskTypes. */
export function parseTaskTypes(value: string): TaskType[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is TaskType =>
      TASK_TYPE_VALUES.includes(s as TaskType),
    );
}

export interface TaskFilters {
  /** Comma-separated list of TaskTypes; "" means no type filter. Use `parseTaskTypes` to read. */
  type: string;
  status: TaskStatus | "";
  assigneeId: string;
  projectId?: string;
  sprintId?: string;
  search: string;
  sortOrder: "asc" | "desc";
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onFilterChange: (key: string, value: string) => void;
  onSortToggle: () => void;
  onClearFilters: () => void;
  assigneeOptions?: { value: string; label: string }[];
  currentUserId?: string;
  /** Project options for the project filter dropdown */
  projectOptions?: { value: string; label: string }[];
  /** When provided, a sprint filter dropdown is shown */
  sprintOptions?: { value: string; label: string }[];
}

export function TaskFilterBar({
  filters,
  onFilterChange,
  onSortToggle,
  onClearFilters,
  assigneeOptions = [],
  currentUserId,
  projectOptions,
  sprintOptions,
}: TaskFilterBarProps) {
  const t = useTranslations("tasks");
  const tProjects = useTranslations("projects");

  const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
    { value: "USER_STORY", label: t("typeUserStory") },
    { value: "TASK", label: t("typeTask") },
    { value: "BUG", label: t("typeBug") },
  ];

  const TASK_STATUSES: { value: TaskStatus | ""; label: string }[] = [
    { value: "", label: t("allStatuses") },
    { value: "BACKLOG", label: t("statusBacklog") },
    { value: "TODO", label: t("statusTodo") },
    { value: "INPROGRESS", label: t("statusInProgress") },
    { value: "VERIFY", label: t("statusVerify") },
    { value: "DONE", label: t("statusDone") },
  ];

  const hasActiveFilters =
    filters.type !== "" ||
    filters.status !== "" ||
    filters.assigneeId !== "" ||
    filters.search !== "" ||
    (filters.projectId !== undefined && filters.projectId !== "") ||
    (filters.sprintId !== undefined && filters.sprintId !== "");

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-4">
        {/* Filter icon and label */}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">{t("filters")}:</span>
        </div>

        {/* Search by name */}
        <div className="relative min-w-[180px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-500 shadow-xs focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        {/* Project filter */}
        {projectOptions && (
          <Select
            value={filters.projectId ?? ""}
            onChange={(value) => onFilterChange("projectId", value)}
            options={[
              { value: "", label: tProjects("allProjects") },
              ...projectOptions,
            ]}
            className="w-auto"
          />
        )}

        {/* Type filter (multi-select) */}
        <TypeMultiSelect
          selected={parseTaskTypes(filters.type)}
          options={TASK_TYPE_OPTIONS}
          onChange={(types) => onFilterChange("type", types.join(","))}
          allLabel={t("allTypes")}
        />

        {/* Status filter */}
        <Select
          value={filters.status}
          onChange={(value) => onFilterChange("status", value)}
          options={TASK_STATUSES.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="w-auto"
        />

        {/* Assignee filter */}
        <Select
          value={filters.assigneeId}
          onChange={(value) => onFilterChange("assigneeId", value)}
          options={[
            { value: "", label: t("allAssignees") },
            { value: UNASSIGNED_ASSIGNEE_VALUE, label: t("unassigned") },
            ...(currentUserId
              ? [{ value: currentUserId, label: t("assignedToMe") }]
              : []),
            ...assigneeOptions
              .filter((opt) => opt.value !== currentUserId)
              .map((option) => ({
                value: option.value,
                label: option.label,
              })),
          ]}
          className="w-auto"
        />

        {/* Sprint filter (optional, project-scoped) */}
        {sprintOptions && (
          <Select
            value={filters.sprintId ?? ""}
            onChange={(value) => onFilterChange("sprintId", value)}
            options={[
              { value: "", label: t("allSprints") },
              ...sprintOptions,
            ]}
            className="w-auto"
          />
        )}

        {/* Sort order toggle — label shows the action (what clicking will switch to) */}
        <button
          onClick={onSortToggle}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          title={
            filters.sortOrder === "desc"
              ? t("sortOldestFirst")
              : t("sortNewestFirst")
          }
        >
          {filters.sortOrder === "desc" ? (
            <>
              <ArrowDownAZ className="h-4 w-4" />
              <span>{t("oldest")}</span>
            </>
          ) : (
            <>
              <ArrowUpAZ className="h-4 w-4" />
              <span>{t("newest")}</span>
            </>
          )}
        </button>

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
            {t("clearFilters")}
          </button>
        )}
      </div>
    </div>
  );
}

interface TypeMultiSelectProps {
  selected: TaskType[];
  options: { value: TaskType; label: string }[];
  onChange: (types: TaskType[]) => void;
  allLabel: string;
}

function TypeMultiSelect({
  selected,
  options,
  onChange,
  allLabel,
}: TypeMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const toggle = (value: TaskType) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const triggerLabel =
    selected.length === 0
      ? allLabel
      : options
          .filter((opt) => selected.includes(opt.value))
          .map((opt) => opt.label)
          .join(", ");

  return (
    <div ref={containerRef} className="relative w-auto">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-xs transition-colors hover:bg-gray-50 focus:border-primary-500 focus:outline-hidden focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <span
          className={
            selected.length === 0
              ? "text-gray-500 dark:text-gray-400"
              : "text-gray-900 dark:text-white"
          }
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-hidden dark:border-gray-600 dark:bg-gray-800"
        >
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => toggle(option.value)}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-gray-900 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-500 dark:bg-gray-700"
                />
                <span>{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
