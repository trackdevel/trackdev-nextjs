"use client";

import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBgColor?: string;
  iconColor?: string;
  isLoading?: boolean;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  iconBgColor = "bg-primary-100",
  iconColor = "text-primary-600",
  isLoading = false,
}: StatCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBgColor}`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLoading ? "..." : value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MiniStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBgColor?: string;
  iconColor?: string;
}

export function MiniStatCard({
  icon: Icon,
  label,
  value,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600",
}: MiniStatCardProps) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBgColor}`}
      >
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
