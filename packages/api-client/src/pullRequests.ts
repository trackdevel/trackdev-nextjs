// ============================================
// Pull Requests API
// ============================================

import type {
  PRDetailedAnalysis,
  PRFileDetail,
  ProfileAttribute,
  PullRequestAttributeValue,
  SetAttributeValueRequest,
} from "@trackdev/types";
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

  // ==================== Pull Request Attribute Values ====================

  /**
   * Get attribute values for a pull request
   */
  getAttributeValues: (prId: string) =>
    api.get<PullRequestAttributeValue[]>(
      `/pull-requests/${prId}/attributes`,
    ),

  /**
   * Get available attributes for a pull request
   */
  getAvailableAttributes: (prId: string) =>
    api.get<ProfileAttribute[]>(
      `/pull-requests/${prId}/available-attributes`,
    ),

  /**
   * Set or update an attribute value for a pull request
   */
  setAttributeValue: (
    prId: string,
    attributeId: number,
    data: SetAttributeValueRequest,
  ) =>
    api.put<PullRequestAttributeValue>(
      `/pull-requests/${prId}/attributes/${attributeId}`,
      data,
    ),

  /**
   * Delete an attribute value from a pull request
   */
  deleteAttributeValue: (prId: string, attributeId: number) =>
    api.delete<void>(
      `/pull-requests/${prId}/attributes/${attributeId}`,
    ),
};
