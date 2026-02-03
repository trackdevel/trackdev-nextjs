"use client";

import { PageContainer, PageHeader } from "@/components/ui";
import { useAuth } from "@trackdev/api-client";
import { FileSearch, GitPullRequest } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

interface AnalyticsCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  iconColor?: string;
}

function AnalyticsCard({
  href,
  icon: Icon,
  title,
  description,
  iconColor = "text-blue-600 dark:text-blue-400",
}: AnalyticsCardProps) {
  return (
    <Link
      href={href}
      className="card group flex items-start gap-4 p-6 transition-all hover:shadow-md hover:ring-2 hover:ring-blue-500/20"
    >
      <div
        className={`rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${iconColor}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <div className="text-gray-400 transition-transform group-hover:translate-x-1">
        →
      </div>
    </Link>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const t = useTranslations("analytics");

  // Check if user can access full project analysis (professors and admins)
  const userRoles = user?.roles || [];
  const canAccessFullAnalysis =
    userRoles.includes("PROFESSOR") ||
    userRoles.includes("ADMIN") ||
    userRoles.includes("WORKSPACE_ADMIN");

  return (
    <PageContainer>
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-4 md:grid-cols-2">
        {/* PR Code Analysis Card */}
        <AnalyticsCard
          href="/dashboard/analytics/pr-analysis"
          icon={GitPullRequest}
          title={t("prCodeAnalysis")}
          description={t("prCodeAnalysisDesc")}
          iconColor="text-purple-600 dark:text-purple-400"
        />

        {/* Full Project Analysis Card - Only for professors/admins */}
        {canAccessFullAnalysis && (
          <AnalyticsCard
            href="/dashboard/analytics/project-analysis"
            icon={FileSearch}
            title={t("fullProjectAnalysis")}
            description={t("fullProjectAnalysisDesc")}
            iconColor="text-green-600 dark:text-green-400"
          />
        )}
      </div>
    </PageContainer>
  );
}
