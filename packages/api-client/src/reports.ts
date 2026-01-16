import type {
  Report,
  ReportAxisType,
  ReportElement,
  ReportMagnitude,
} from "@trackdev/types";
import { api } from "./client";

export const reportsApi = {
  /**
   * Get all reports (PROFESSOR only)
   */
  getAll: () => api.get<Report[]>("/reports"),

  /**
   * Get a report by ID (PROFESSOR only)
   */
  getById: (id: number) => api.get<Report>(`/reports/${id}`),

  /**
   * Create a new report (PROFESSOR only)
   */
  create: (name: string) => api.post<Report>("/reports", { name }),

  /**
   * Update a report (PROFESSOR only)
   */
  update: (
    id: number,
    data: {
      name?: string;
      rowType?: ReportAxisType;
      columnType?: ReportAxisType;
      element?: ReportElement;
      magnitude?: ReportMagnitude;
    }
  ) => api.patch<Report>(`/reports/${id}`, data),

  /**
   * Delete a report (PROFESSOR only)
   */
  delete: (id: number) => api.delete(`/reports/${id}`),
};
