"use client";

import { BackButton } from "@/components/BackButton";
import {
  LoadingContainer,
  PageContainer,
  PageHeader,
  Select,
  useToast,
} from "@/components/ui";
import {
  reportsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  ReportAxisType,
  ReportElement,
  ReportMagnitude,
} from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditReportPage() {
  const { user } = useAuth();
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const params = useParams();
  const reportId = Number(params.id);
  const toast = useToast();

  const [name, setName] = useState("");
  const [rowType, setRowType] = useState<ReportAxisType | "">("");
  const [columnType, setColumnType] = useState<ReportAxisType | "">("");
  const [element, setElement] = useState<ReportElement | "">("");
  const [magnitude, setMagnitude] = useState<ReportMagnitude | "">("");

  // Check if user is professor
  const isProfessor = user?.roles?.includes("PROFESSOR") ?? false;

  // Fetch report data
  const {
    data: report,
    isLoading,
    refetch,
  } = useQuery(() => reportsApi.getById(reportId), [reportId], {
    enabled: isProfessor && !!reportId,
  });

  // Update form when report loads
  useEffect(() => {
    if (report) {
      setName(report.name);
      setRowType(report.rowType || "");
      setColumnType(report.columnType || "");
      setElement(report.element || "TASK"); // Default to TASK
      setMagnitude(report.magnitude || "");
    }
  }, [report]);

  // Update mutation
  const { mutate: updateReport, isLoading: isPending } = useMutation(
    () =>
      reportsApi.update(reportId, {
        name,
        rowType: rowType || undefined,
        columnType: columnType || undefined,
        element: element || undefined,
        magnitude: magnitude || undefined,
      }),
    {
      onSuccess: () => {
        toast.success(t("reportUpdated"));
        refetch();
      },
      onError: () => {
        toast.error(t("failedToUpdate"));
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("reportNameRequired"));
      return;
    }
    // Validate that rowType and columnType are different (if both are set)
    if (rowType && columnType && rowType === columnType) {
      toast.error(t("rowColumnMustDiffer"));
      return;
    }
    updateReport();
  };

  if (!user) {
    return (
      <PageContainer>
        <LoadingContainer />
      </PageContainer>
    );
  }

  if (!isProfessor) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600">
          {t("professorsOnly")}
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingContainer />
      </PageContainer>
    );
  }

  if (!report) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center text-red-600">
          {t("reportNotFound")}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackButton
        fallbackHref="/dashboard/reports"
        label={t("backToReports")}
        className="mb-4"
      />

      <PageHeader
        title={report.name}
        description={t("editReportDescription")}
      />

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              {t("reportName")}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="rowType"
              className="block text-sm font-medium text-gray-700"
            >
              {t("rowType")}
            </label>
            <Select
              value={rowType}
              onChange={(value) => setRowType(value as ReportAxisType | "")}
              options={[
                { value: "", label: t("selectRowType") },
                {
                  value: "STUDENTS",
                  label: t("students"),
                  disabled: columnType === "STUDENTS",
                },
                {
                  value: "SPRINTS",
                  label: t("sprints"),
                  disabled: columnType === "SPRINTS",
                },
              ]}
              placeholder={t("selectRowType")}
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="columnType"
              className="block text-sm font-medium text-gray-700"
            >
              {t("columnType")}
            </label>
            <Select
              value={columnType}
              onChange={(value) => setColumnType(value as ReportAxisType | "")}
              options={[
                { value: "", label: t("selectColumnType") },
                {
                  value: "STUDENTS",
                  label: t("students"),
                  disabled: rowType === "STUDENTS",
                },
                {
                  value: "SPRINTS",
                  label: t("sprints"),
                  disabled: rowType === "SPRINTS",
                },
              ]}
              placeholder={t("selectColumnType")}
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="element"
              className="block text-sm font-medium text-gray-700"
            >
              {t("element")}
            </label>
            <Select
              value={element}
              onChange={(value) => setElement(value as ReportElement | "")}
              options={[{ value: "TASK", label: t("task") }]}
              placeholder={t("selectElement")}
              className="mt-1"
            />
          </div>

          <div>
            <label
              htmlFor="magnitude"
              className="block text-sm font-medium text-gray-700"
            >
              {t("magnitude")}
            </label>
            <Select
              value={magnitude}
              onChange={(value) => setMagnitude(value as ReportMagnitude | "")}
              options={[
                { value: "", label: t("selectMagnitude") },
                {
                  value: "ESTIMATION_POINTS",
                  label: t("estimationPoints"),
                  disabled: element !== "TASK",
                },
                {
                  value: "PULL_REQUESTS",
                  label: t("pullRequests"),
                  disabled: element !== "TASK",
                },
              ]}
              placeholder={t("selectMagnitude")}
              className="mt-1"
              disabled={!element}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? tCommon("loading") : tCommon("save")}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}
