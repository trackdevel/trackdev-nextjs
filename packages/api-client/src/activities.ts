// ============================================
// Activities API
// ============================================

import type { ActivitiesResponse, ActivityUnreadCount } from "@trackdev/types";
import { api } from "./client";

export interface ActivitiesParams {
  page?: number;
  size?: number;
}

export const activitiesApi = {
  /**
   * Get paginated activity feed for the logged-in user's projects
   */
  getActivities: async (
    params?: ActivitiesParams
  ): Promise<ActivitiesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined) {
      searchParams.set("page", params.page.toString());
    }
    if (params?.size !== undefined) {
      searchParams.set("size", params.size.toString());
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
