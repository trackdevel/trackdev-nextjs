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
  coursesApi,
  reportsApi,
  useAuth,
  useMutation,
  useQuery,
} from "@trackdev/api-client";
import type {
  ProfileAttribute,
  ReportAxisType,
  ReportElement,
  ReportMagnitude,
} from "@trackdev/types";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  // magnitude can be a built-in value or "attr_<id>" for profile attributes
  const [magnitudeValue, setMagnitudeValue] = useState<string>("");
  const [courseId, setCourseId] = useState<number | "">("");

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

  // Fetch courses for the dropdown (professor's courses)
  const { data: coursesData } = useQuery(() => coursesApi.getAll(), [], {
    enabled: isProfessor,
  });

  // Fetch available numeric profile attributes for the selected course
  const { data: profileAttributes } = useQuery(
    () =>
      courseId
        ? coursesApi.getReportMagnitudeAttributes(courseId as number)
        : Promise.resolve([]),
    [courseId],
    {
      enabled: isProfessor && !!courseId,
    },
  );

  // Update form when report loads
  useEffect(() => {
    if (report) {
      setName(report.name);
      setRowType(report.rowType || "");
      setColumnType(report.columnType || "");
      setElement(report.element || "TASK"); // Default to TASK
      // Set magnitude value: either built-in or profile attribute
      if (report.profileAttributeId) {
        setMagnitudeValue(`attr_${report.profileAttributeId}`);
      } else {
        setMagnitudeValue(report.magnitude || "");
      }
      setCourseId(report.course?.id || "");
    }
  }, [report]);

  // Get courses list
  const courses = coursesData?.courses || [];

  // Parse magnitude value to determine if it's built-in or profile attribute
  const { magnitude, profileAttributeId } = useMemo(() => {
    if (magnitudeValue.startsWith("attr_")) {
      const attrId = parseInt(magnitudeValue.substring(5), 10);
      return { magnitude: null, profileAttributeId: attrId };
    }
    return {
      magnitude: (magnitudeValue as ReportMagnitude) || null,
      profileAttributeId: null,
    };
  }, [magnitudeValue]);

  // Update mutation
  const { mutate: updateReport, isLoading: isPending } = useMutation(
    () =>
      reportsApi.update(reportId, {
        name,
        rowType: rowType || undefined,
        columnType: columnType || undefined,
        element: element || undefined,
        // When using profile attribute, explicitly send null to clear built-in magnitude
        magnitude: profileAttributeId ? null : magnitude || undefined,
        courseId: courseId || null,
        // When using built-in magnitude, explicitly send null to clear profile attribute
        profileAttributeId: magnitude ? null : profileAttributeId,
      }),
    {
      onSuccess: () => {
        toast.success(t("reportUpdated"));
        refetch();
      },
      onError: () => {
        toast.error(t("failedToUpdate"));
      },
    },
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
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-6 py-12 text-center text-red-600 dark:text-red-400">
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
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-6 py-12 text-center text-red-600 dark:text-red-400">
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("reportName")}
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="courseId"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("assignToCourse")}
            </label>
            <Select
              value={courseId.toString()}
              onChange={(value) => setCourseId(value ? Number(value) : "")}
              options={[
                { value: "", label: t("noCourseAssigned") },
                ...courses.map((course) => ({
                  value: course.id.toString(),
                  label: `${course.subject?.name || ""} (${course.startYear})`,
                })),
              ]}
              placeholder={t("selectCourse")}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("assignToCourseDescription")}
            </p>
          </div>

          <div>
            <label
              htmlFor="rowType"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t("magnitude")}
            </label>
            <Select
              value={magnitudeValue}
              onChange={(value) => setMagnitudeValue(value)}
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
                // Add profile attributes as magnitude options (grouped)
                ...(profileAttributes && profileAttributes.length > 0
                  ? [
                      {
                        value: "_separator",
                        label: `── ${t("profileAttributes")} ──`,
                        disabled: true,
                      },
                      ...profileAttributes.map((attr: ProfileAttribute) => ({
                        value: `attr_${attr.id}`,
                        label: attr.name,
                        disabled: element !== "TASK",
                      })),
                    ]
                  : []),
              ]}
              placeholder={t("selectMagnitude")}
              className="mt-1"
              disabled={!element}
            />
            {profileAttributes && profileAttributes.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("profileAttributesMagnitudeHint")}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
