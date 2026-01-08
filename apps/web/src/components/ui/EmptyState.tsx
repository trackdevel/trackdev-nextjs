"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { isValidElement } from "react";

interface EmptyStateProps {
  icon: LucideIcon | ReactNode;
  title: string;
  description?: string;
  action?:
    | {
        label: string;
        onClick: () => void;
      }
    | ReactNode;
  className?: string;
}

function isLucideIcon(icon: LucideIcon | ReactNode): icon is LucideIcon {
  // LucideIcons are ForwardRefExoticComponent - check for $$typeof and render
  return (
    typeof icon === "function" ||
    (typeof icon === "object" &&
      icon !== null &&
      "$$typeof" in icon &&
      "render" in icon)
  );
}

function isActionObject(
  action: { label: string; onClick: () => void } | ReactNode
): action is { label: string; onClick: () => void } {
  // Check it's an action object and NOT a React element
  return (
    typeof action === "object" &&
    action !== null &&
    !isValidElement(action) &&
    "label" in action &&
    "onClick" in action
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "py-12",
}: EmptyStateProps) {
  return (
    <div className={`px-6 text-center ${className}`}>
      {isLucideIcon(icon) ? (
        (() => {
          const Icon = icon;
          return <Icon className="mx-auto h-12 w-12 text-gray-400" />;
        })()
      ) : (
        <div className="mx-auto text-gray-400">{icon}</div>
      )}
      <p className="mt-2 text-gray-500">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      )}
      {action &&
        (isActionObject(action) ? (
          <button
            onClick={action.onClick}
            className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {action.label}
          </button>
        ) : (
          <div className="mt-3">{action}</div>
        ))}
    </div>
  );
}
