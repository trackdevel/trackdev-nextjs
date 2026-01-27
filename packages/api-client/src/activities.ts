// ============================================
// Activities API
// ============================================

import type { ActivitiesResponse, ActivityUnreadCount } from "@trackdev/types";
import { api } from "./client";

export interface ActivitiesParams {
  page?: number;
  size?: number;
  projectId?: number;
  sprintId?: number;
  actorId?: string;
}

export const activitiesApi = {
  /**
   * Get paginated activity feed for the logged-in user's projects
   * Supports optional filters: projectId, sprintId, actorId
   */
  getActivities: async (
    params?: ActivitiesParams,
  ): Promise<ActivitiesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params?.size !== undefined) {
      searchParams.set("size", params.size.toString());
    }
    if (params?.projectId !== undefined) {
      searchParams.set("projectId", params.projectId.toString());
    }
    if (params?.sprintId !== undefined) {
      searchParams.set("sprintId", params.sprintId.toString());
    }
    if (params?.actorId !== undefined) {
      searchParams.set("actorId", params.actorId);
    }
    const queryString = searchParams.toString();
    const url = `/activities${queryString ? `?${queryString}` : ""}`;
    return api.get<ActivitiesResponse>(url);
  },

  /**
   * Get count of unread activities since last access
   */
  getUnreadCount: async (): Promise<ActivityUnreadCount> => {
    return api.get<ActivityUnreadCount>("/activities/unread-count");
  },

  /**
   * Mark all activities as read
   */
  markAsRead: async (): Promise<void> => {
    return api.post<void>("/activities/mark-read", {});
  },
};
