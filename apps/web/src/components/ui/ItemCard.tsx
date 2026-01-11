"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface ItemCardProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Custom icon element (alternative to icon prop) */
  iconElement?: ReactNode;
  /** Icon background color class (e.g., "bg-blue-100") */
  iconBgColor?: string;
  /** Icon color class (e.g., "text-blue-600") */
  iconColor?: string;
  /** Primary title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional right-side content (badges, buttons, etc.) */
  rightContent?: ReactNode;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional className for the container */
  className?: string;
}

/**
 * Reusable item card component for list items with icon, title, subtitle, and optional right content.
 * Used in member lists, repository lists, sprint lists, etc.
 */
export function ItemCard({
  icon: Icon,
  iconElement,
  iconBgColor = "bg-gray-100",
  iconColor = "text-gray-600",
  title,
  subtitle,
  rightContent,
  onClick,
  className = "",
}: ItemCardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`flex w-full items-center justify-between px-6 py-4 ${
        onClick ? "cursor-pointer text-left hover:bg-gray-50" : ""
      } ${className}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
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
          <p className="font-medium text-gray-900">{title}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {rightContent && (
        <div className="flex items-center gap-2">{rightContent}</div>
      )}
    </Component>
  );
}
