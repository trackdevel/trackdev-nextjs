"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface ContentCardProps {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: ReactNode;
  className?: string;
}

export function ContentCard({
  title,
  viewAllHref,
  viewAllLabel = "View all",
  children,
  className = "",
}: ContentCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {viewAllLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
