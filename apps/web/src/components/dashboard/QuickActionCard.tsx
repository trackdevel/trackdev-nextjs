"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickActionCardProps {
  href: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
}

export function QuickActionCard({
  href,
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  description,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-4 p-4 transition-colors hover:bg-gray-50"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor}`}
      >
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}
