// ============================================
// Project Analysis Types
// Based on ProjectAnalysisDTO.java
// ============================================

/**
 * Analysis status
 */
export type ProjectAnalysisStatus = "IN_PROGRESS" | "DONE" | "FAILED";

/**
 * Project analysis summary and status
 */
export interface ProjectAnalysis {
  id: string;
  projectId: number;
  projectName?: string;
  status: ProjectAnalysisStatus;
  startedAt?: string;
  completedAt?: string;
  startedByName?: string;
  startedById?: string;

  // Progress tracking
  totalPrs?: number;
  processedPrs?: number;
  progressPercent?: number;

  // Summary statistics
  totalFiles?: number;
  totalSurvivingLines?: number;
  totalDeletedLines?: number;
  survivalRate?: number;

  errorMessage?: string;
}

/**
 * Summary by author in analysis results
 */
export interface AnalysisAuthorSummary {
  authorId: string;
  authorName?: string;
  authorUsername?: string;
  survivingLines: number;
  deletedLines: number;
  fileCount: number;
  survivalRate?: number;
}

/**
 * Summary by sprint in analysis results
 */
export interface AnalysisSprintSummary {
  sprintId: number;
  sprintName?: string;
  survivingLines: number;
  deletedLines: number;
  fileCount: number;
  survivalRate?: number;
}

/**
 * File detail in analysis results
 */
export interface AnalysisFile {
  id: string;
  prId: string;
  prNumber?: number;
  prTitle?: string;
  taskId: number;
  taskName?: string;
  sprintId?: number;
  sprintName?: string;
  authorId?: string;
  authorName?: string;
  filePath: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  survivingLines: number;
  deletedLines?: number;
  currentLines?: number;
  survivalRate?: number;
}

/**
 * Full analysis results with summaries and file list
 */
export interface AnalysisResults {
  analysis: ProjectAnalysis;
  authorSummaries: AnalysisAuthorSummary[];
  sprintSummaries: AnalysisSprintSummary[];
  files: AnalysisFile[];
}
