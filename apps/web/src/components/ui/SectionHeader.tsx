"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional count to display in parentheses */
  count?: number;
  /** Optional action button(s) */
  action?: ReactNode;
  /** Whether to show bottom border */
  bordered?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Reusable section header with optional icon, count, and action button.
 * Used at the top of cards/sections for team members, repositories, sprints, etc.
 */
export function SectionHeader({
  title,
  icon: Icon,
  count,
  action,
  bordered = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 ${
        bordered ? "border-b border-gray-200 dark:border-gray-700" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {title}
          {count !== undefined && (
            <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">
              ({count})
            </span>
          )}
        </h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardSectionProps {
  /** Section title */
  title: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Optional count */
  count?: number;
  /** Optional action button */
  action?: ReactNode;
  /** Content inside the section */
  children: ReactNode;
  /** Empty state when no children */
  emptyMessage?: string;
  /** Whether the section has items (controls empty state) */
  isEmpty?: boolean;
  /** Additional className for the container */
  className?: string;
}

/**
 * Complete card section with header and content area.
 * Combines SectionHeader with card styling.
 */
export function CardSection({
  title,
  icon,
  count,
  action,
  children,
  emptyMessage,
  isEmpty = false,
  className = "",
}: CardSectionProps) {
  return (
    <div className={`card ${className}`}>
      <SectionHeader title={title} icon={icon} count={count} action={action} />
      {isEmpty && emptyMessage ? (
        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
