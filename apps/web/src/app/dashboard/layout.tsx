"use client";

import { useNavigationTracking } from "@/components/BackButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { activitiesApi, useAuth, useQuery } from "@trackdev/api-client";
import type { RoleName } from "@trackdev/types";
import {
  Activity,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileSliders,
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
import { useEffect, useMemo, useRef, useState } from "react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  roles?: RoleName[];
  showBadge?: boolean;
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
    href: "/dashboard/activity",
    labelKey: "activity",
    icon: <Activity className="h-5 w-5" />,
    roles: ["STUDENT"],
    showBadge: true,
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
    href: "/dashboard/profiles",
    labelKey: "profiles",
    icon: <FileSliders className="h-5 w-5" />,
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

  // Sidebar collapsed state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("sidebar-collapsed", String(newValue));
  };

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

  // Track if we were on the activity page to trigger refetch when leaving
  const isOnActivityPage = pathname === "/dashboard/activity";
  const wasOnActivityPageRef = useRef(false);

  // Query for unread activity count (only for students)
  const {
    data: unreadData,
    isError: unreadError,
    refetch: refetchUnread,
  } = useQuery(() => activitiesApi.getUnreadCount(), [isStudent], {
    enabled: isAuthenticated && isStudent,
  });
  const hasUnreadActivity = unreadData?.hasUnread ?? false;

  // Refetch unread count when leaving the activity page
  useEffect(() => {
    if (wasOnActivityPageRef.current && !isOnActivityPage && isStudent) {
      // User just left the activity page, refetch the unread count
      refetchUnread();
    }
    wasOnActivityPageRef.current = isOnActivityPage;
  }, [isOnActivityPage, isStudent, refetchUnread]);

  // Debug logging for activity badge
  useEffect(() => {
    if (isStudent) {
      console.log("[Activity Badge] isStudent:", isStudent);
      console.log("[Activity Badge] unreadData:", unreadData);
      console.log("[Activity Badge] hasUnreadActivity:", hasUnreadActivity);
      console.log("[Activity Badge] unreadError:", unreadError);
    }
  }, [isStudent, unreadData, hasUnreadActivity, unreadError]);

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
    [t, userRoles],
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
      return {
        label: tUserTypes("admin"),
        color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      };
    if (isProfessor)
      return {
        label: tUserTypes("professor"),
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      };
    if (isStudent)
      return {
        label: tUserTypes("student"),
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      };
    return {
      label: tUserTypes("user"),
      color: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    };
  };

  const roleBadge = getRoleBadge();

  // Sidebar width classes
  const sidebarWidth = isCollapsed ? "w-16" : "w-64";
  const mainMargin = isCollapsed ? "ml-16" : "ml-64";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-700 dark:bg-gray-800 ${sidebarWidth}`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-4 dark:border-gray-700">
            <Layers className="h-8 w-8 flex-shrink-0 text-primary-600" />
            {!isCollapsed && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                TrackDev
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="border-b border-gray-200 px-3 py-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: user?.color || "#3b82f6" }}
                title={
                  isCollapsed ? user?.fullName || user?.username : undefined
                }
              >
                {user?.capitalLetters ||
                  user?.fullName?.slice(0, 2).toUpperCase() ||
                  user?.username?.slice(0, 2).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {user?.fullName || user?.username}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.color}`}
                >
                  <Shield className="h-3 w-3" />
                  {roleBadge.label}
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              const showBadge =
                item.showBadge && hasUnreadActivity && !isActive;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="relative flex-shrink-0">
                    {item.icon}
                    {showBadge && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                    )}
                  </span>
                  {!isCollapsed && (
                    <span className="flex items-center gap-2">
                      {item.label}
                      {showBadge && (
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
            <button
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              title={isCollapsed ? t("expandSidebar") : t("collapseSidebar")}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5" />
                  <span className="flex-1 text-left">{t("collapse")}</span>
                </>
              )}
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 p-2 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isCollapsed ? tAuth("logout") : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && tAuth("logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${mainMargin}`}>
        <div className="min-h-screen">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
