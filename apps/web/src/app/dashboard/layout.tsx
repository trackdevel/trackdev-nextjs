"use client";

import { useNavigationTracking } from "@/components/BackButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@trackdev/api-client";
import type { RoleName } from "@trackdev/types";
import {
  BookOpen,
  Building2,
  FolderKanban,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  roles?: RoleName[];
}

const navItemsConfig: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "overview",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/dashboard/courses",
    labelKey: "courses",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    href: "/dashboard/projects",
    labelKey: "projects",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    href: "/dashboard/users",
    labelKey: "users",
    icon: <Users className="h-5 w-5" />,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/ws-users",
    labelKey: "users",
    icon: <Users className="h-5 w-5" />,
    roles: ["WORKSPACE_ADMIN"],
  },
  {
    href: "/dashboard/workspaces",
    labelKey: "workspaces",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/subjects",
    labelKey: "subjects",
    icon: <BookOpen className="h-5 w-5" />,
    roles: ["ADMIN", "WORKSPACE_ADMIN", "PROFESSOR"],
  },
  {
    href: "/dashboard/reports",
    labelKey: "reports",
    icon: <Layers className="h-5 w-5" />,
    roles: ["PROFESSOR"],
  },
  {
    href: "/dashboard/settings",
    labelKey: "settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const t = useTranslations("navigation");
  const tAuth = useTranslations("auth");
  const tUserTypes = useTranslations("userTypes");

  // Track navigation history for BackButton functionality
  useNavigationTracking();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Calculate derived values before any early returns
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes("ADMIN");
  const isProfessor = userRoles.includes("PROFESSOR");
  const isStudent = userRoles.includes("STUDENT");

  // Create nav items with translated labels
  const navItems = useMemo(
    () =>
      navItemsConfig
        .map((item) => ({
          ...item,
          label: t(item.labelKey),
        }))
        .filter((item) => {
          if (!item.roles) return true;
          return item.roles.some((role) => userRoles.includes(role));
        }),
    [t, userRoles]
  );

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getRoleBadge = () => {
    if (isAdmin)
      return { label: tUserTypes("admin"), color: "bg-red-100 text-red-700" };
    if (isProfessor)
      return {
        label: tUserTypes("professor"),
        color: "bg-purple-100 text-purple-700",
      };
    if (isStudent)
      return {
        label: tUserTypes("student"),
        color: "bg-blue-100 text-blue-700",
      };
    return { label: tUserTypes("user"), color: "bg-gray-100 text-gray-700" };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Layers className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">TrackDev</span>
          </div>

          {/* User Info */}
          <div className="border-b px-4 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: user?.color || "#3b82f6" }}
              >
                {user?.capitalLetters ||
                  user?.username?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-gray-900">
                  {user?.username}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.color}`}
              >
                <Shield className="h-3 w-3" />
                {roleBadge.label}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              {tAuth("logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        <div className="min-h-screen">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
