// ============================================
// Pull Requests API
// ============================================

import type { PRDetailedAnalysis, PRFileDetail } from "@trackdev/types";
import { api } from "./client";

/**
 * Pull Requests API functions
 */
export const pullRequestsApi = {
  /**
   * Get detailed PR analysis with file information
   */
  getDetails: (prId: string): Promise<PRDetailedAnalysis> =>
    api.get(`/pull-requests/${prId}/details`),

  /**
   * Get file details for a PR
   */
  getFiles: (prId: string): Promise<PRFileDetail[]> =>
    api.get(`/pull-requests/${prId}/files`),
};
