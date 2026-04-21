"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface UserLike {
  id?: string | number;
  fullName?: string | null;
  username?: string | null;
}

interface UserLinkProps {
  user: UserLike | null | undefined;
  /** Course context needed to resolve the student profile route */
  courseId?: string | number | null;
  /** Override the displayed label (defaults to fullName || username) */
  label?: ReactNode;
  /** Render when user is missing */
  fallback?: ReactNode;
  className?: string;
  /** When true and no courseId is provided, still wrap in a span with className */
  wrapFallbackInSpan?: boolean;
}

const LINK_CLASS =
  "hover:text-primary-600 dark:hover:text-primary-400 hover:underline";

export function userProfileHref(
  userId: string | number,
  courseId: string | number,
): string {
  return `/dashboard/courses/${courseId}/students/${userId}`;
}

export function UserLink({
  user,
  courseId,
  label,
  fallback = null,
  className = "",
  wrapFallbackInSpan = false,
}: UserLinkProps) {
  if (!user) {
    return <>{fallback}</>;
  }

  const displayLabel = label ?? user.fullName ?? user.username ?? "";

  if (
    courseId !== null &&
    courseId !== undefined &&
    courseId !== "" &&
    user.id !== undefined &&
    user.id !== null &&
    user.id !== ""
  ) {
    return (
      <Link
        href={userProfileHref(user.id, courseId)}
        className={`${LINK_CLASS} ${className}`.trim()}
      >
        {displayLabel}
      </Link>
    );
  }

  if (wrapFallbackInSpan || className) {
    return <span className={className}>{displayLabel}</span>;
  }
  return <>{displayLabel}</>;
}
