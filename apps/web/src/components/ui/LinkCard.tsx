"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface LinkCardProps {
  /** URL to navigate to */
  href: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Custom icon element (alternative to icon prop) */
  iconElement?: ReactNode;
  /** Icon background color class */
  iconBgColor?: string;
  /** Icon color class */
  iconColor?: string;
  /** Primary title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional metadata content (shown below subtitle) */
  metadata?: ReactNode;
  /** Optional right-side content before the arrow */
  rightContent?: ReactNode;
  /** Whether to show navigation arrow */
  showArrow?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Clickable card component that links to another page.
 * Used for project cards, sprint cards, course cards, etc.
 */
export function LinkCard({
  href,
  icon: Icon,
  iconElement,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
  title,
  subtitle,
  metadata,
  rightContent,
  showArrow = true,
  className = "",
}: LinkCardProps) {
  return (
    <Link
      href={href}
      className={`card flex flex-col p-4 transition-colors hover:bg-gray-50 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {(Icon || iconElement) && (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor}`}
            >
              {iconElement ||
                (Icon && <Icon className={`h-5 w-5 ${iconColor}`} />)}
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightContent}
          {showArrow && <ArrowRight className="h-5 w-5 text-gray-400" />}
        </div>
      </div>
      {metadata && <div className="mt-4">{metadata}</div>}
    </Link>
  );
}

interface LinkCardGridProps {
  children: ReactNode;
  /** Number of columns on different screen sizes */
  columns?: {
    default?: 1 | 2 | 3;
    md?: 1 | 2 | 3;
    lg?: 1 | 2 | 3 | 4;
  };
  className?: string;
}

const columnClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

/**
 * Grid container for LinkCard components with responsive columns.
 */
export function LinkCardGrid({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  className = "",
}: LinkCardGridProps) {
  const defaultCols = columnClasses[columns.default || 1];
  const mdCols = columns.md ? `md:${columnClasses[columns.md]}` : "";
  const lgCols = columns.lg ? `lg:${columnClasses[columns.lg]}` : "";

  return (
    <div
      className={`grid gap-4 ${defaultCols} ${mdCols} ${lgCols} ${className}`}
    >
      {children}
    </div>
  );
}
