"use client";

import { BackButton } from "@/components/BackButton";
import { EntityAttributes } from "@/components/EntityAttributes";
import { EmptyState, PageContainer } from "@/components/ui";
import {
  pullRequestsApi,
  useAuth,
  useQuery,
} from "@trackdev/api-client";
import type { PullRequest } from "@trackdev/types";
import { BarChart3, GitPullRequest } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { PRActivity, PRHeader, PRSummaryModal } from "./components";

export default function PullRequestDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("pullRequestDetails");
  const params = useParams();
  const searchParams = useSearchParams();
  const prId = params.id as string;
  const fromSource = searchParams.get("from");
  const taskIdParam = searchParams.get("taskId");

  const [showSummary, setShowSummary] = useState(false);

  // Fetch PR details
  const { data: prDetails, isLoading } = useQuery(
    () => pullRequestsApi.getDetails(prId),
    [prId],
    { enabled: isAuthenticated && !!prId },
  );

  // Fetch PR history
  const { data: historyData } = useQuery(
    () => pullRequestsApi.getHistory(prId),
    [prId],
    { enabled: isAuthenticated && !!prId },
  );

  const isProfessor =
    user?.roles?.includes("PROFESSOR") ||
    user?.roles?.includes("ADMIN") ||
    false;

  // Build a PullRequest-like object for the activity timeline
  const prForTimeline: PullRequest | undefined = useMemo(() => {
    if (!prDetails) return undefined;
    return {
      id: prDetails.id,
      url: prDetails.url,
      prNumber: prDetails.prNumber,
      title: prDetails.title,
      state: prDetails.state,
      merged: prDetails.merged,
      repoFullName: prDetails.repoFullName,
      author: prDetails.author
        ? {
            username: prDetails.author.username,
            fullName: prDetails.author.fullName,
            githubInfo: undefined,
          }
        : undefined,
    } as PullRequest;
  }, [prDetails]);

  // Back navigation
  const backHref = useMemo(() => {
    if (fromSource === "task" && taskIdParam) {
      return `/dashboard/tasks/${taskIdParam}`;
    }
    return "/dashboard/analytics";
  }, [fromSource, taskIdParam]);

  return (
    <PageContainer>
      <BackButton fallbackHref={backHref} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600 dark:border-gray-700 dark:border-t-primary-400" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("loadingPR")}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("loadingPRHint")}
            </p>
          </div>
        </div>
      ) : !prDetails ? (
        <EmptyState
          icon={<GitPullRequest className="h-12 w-12" />}
          title={t("notFound")}
        />
      ) : (
        <>
          <PRHeader pr={prDetails} />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary button */}
              <button
                onClick={() => setShowSummary(true)}
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <BarChart3 className="h-4 w-4" />
                {t("viewSummary")}
              </button>

              {/* Activity Timeline */}
              {prForTimeline && (
                <PRActivity
                  pr={prForTimeline}
                  history={historyData?.history || []}
                />
              )}
            </div>

            {/* Right column - Attributes */}
            <div className="space-y-6">
              <EntityAttributes
                entityId={prId}
                fetchValues={() => pullRequestsApi.getAttributeValues(prId)}
                fetchAvailable={() =>
                  pullRequestsApi.getAvailableAttributes(prId)
                }
                setValue={(attrId, data) =>
                  pullRequestsApi.setAttributeValue(prId, attrId, data)
                }
                deleteValue={(attrId) =>
                  pullRequestsApi.deleteAttributeValue(prId, attrId)
                }
                fetchListValues={(attrId) =>
                  pullRequestsApi.getListAttributeValues(prId, attrId)
                }
                setListValues={(attrId, data) =>
                  pullRequestsApi.setListAttributeValues(prId, attrId, data)
                }
                deleteListValues={(attrId) =>
                  pullRequestsApi.deleteListAttributeValues(prId, attrId)
                }
                canEditScalar={() => isProfessor}
                isProfessor={isProfessor}
              />
            </div>
          </div>

          {/* Summary Modal */}
          <PRSummaryModal
            prId={prId}
            isOpen={showSummary}
            onClose={() => setShowSummary(false)}
          />
        </>
      )}
    </PageContainer>
  );
}
