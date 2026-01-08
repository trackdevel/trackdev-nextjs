// ============================================
// Invites API (Public endpoints)
// ============================================

import type {
  AcceptInviteRequest,
  CourseInviteInfo,
  InviteAcceptedResponse,
} from "@trackdev/types";
import { api } from "./client";

export const invitesApi = {
  /**
   * Get invite information by token (public endpoint)
   */
  getByToken: (token: string) => api.get<CourseInviteInfo>(`/invites/${token}`),

  /**
   * Accept an invitation (public endpoint)
   */
  accept: (token: string, data?: AcceptInviteRequest) =>
    api.post<InviteAcceptedResponse>(`/invites/${token}/accept`, data || {}),
};
