// ============================================
// Project Analysis API
// ============================================

import type {
  AnalysisResults,
  PRFileDetail,
  ProjectAnalysis,
} from "@trackdev/types";
import { api } from "./client";

export interface AnalysisListResponse {
  analyses: ProjectAnalysis[];
}

export const projectAnalysisApi = {
  /**
   * Start a new project analysis
   * @param projectId Project ID to analyze
   * @returns The created analysis (status: IN_PROGRESS)
   */
  startAnalysis: (projectId: number) =>
    api.post<ProjectAnalysis>(`/project-analyses/projects/${projectId}/start`),

  /**
   * Get status of a specific analysis
   * @param analysisId Analysis ID
   */
  getAnalysis: (analysisId: string) =>
    api.get<ProjectAnalysis>(`/project-analyses/${analysisId}`),

  /**
   * Get the latest analysis for a project
   * @param projectId Project ID
   */
  getLatestAnalysis: (projectId: number) =>
    api.get<ProjectAnalysis | null>(
      `/project-analyses/projects/${projectId}/latest`,
    ),

  /**
   * Get all analyses for a project
   * @param projectId Project ID
   */
  getProjectAnalyses: (projectId: number) =>
    api.get<ProjectAnalysis[]>(`/project-analyses/projects/${projectId}`),

  /**
   * Get analysis results with optional filters
   * @param analysisId Analysis ID
   * @param sprintId Optional sprint filter
   * @param authorId Optional author filter
   */
  getResults: (analysisId: string, sprintId?: number, authorId?: string) => {
    const params = new URLSearchParams();
    if (sprintId) params.append("sprintId", sprintId.toString());
    if (authorId) params.append("authorId", authorId);
    const queryString = params.toString();
    const url = `/project-analyses/${analysisId}/results${queryString ? `?${queryString}` : ""}`;
    return api.get<AnalysisResults>(url);
  },

  /**
   * Get precomputed file details for a specific PR in an analysis
   * @param analysisId Analysis ID
   * @param prId PR ID
   * @returns Precomputed file details with per-line analysis
   */
  getPrecomputedFileDetails: (analysisId: string, prId: string) =>
    api.get<PRFileDetail[]>(
      `/project-analyses/${analysisId}/prs/${prId}/files`,
    ),
};
