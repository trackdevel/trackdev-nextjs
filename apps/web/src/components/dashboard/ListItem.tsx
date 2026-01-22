"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface ListItemProps {
  href: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  rightContent?: ReactNode;
}

export function ListItem({
  href,
  icon: Icon,
  iconBgColor,
  iconColor,
  title,
  subtitle,
  badge,
  rightContent,
}: ListItemProps) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {rightContent}
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </div>
      </Link>
    </li>
  );
}

interface MemberAvatarsProps {
  members?: Array<{
    id: string;
    username?: string;
    fullName?: string;
    color?: string;
    capitalLetters?: string;
  }>;
  max?: number;
}

export function MemberAvatars({ members, max = 3 }: MemberAvatarsProps) {
  if (!members || members.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {members.slice(0, max).map((member) => (
        <div
          key={member.id}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-medium text-white"
          style={{ backgroundColor: member.color || "#3b82f6" }}
          title={member.fullName || member.username}
        >
          {member.capitalLetters ||
            member.fullName?.slice(0, 2).toUpperCase() ||
            member.username?.slice(0, 2).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
