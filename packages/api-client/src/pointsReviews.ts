// ============================================
// Points Review Conversations API
// ============================================

import type {
  CreatePointsReviewMessageRequest,
  CreatePointsReviewRequest,
  PointsReviewConversation,
  PointsReviewConversationSummary,
  PointsReviewMessage,
  UpdatePointsReviewRequest,
} from "@trackdev/types";
import { api } from "./client";

export const pointsReviewsApi = {
  /**
   * List all points review conversations for a task (filtered by access)
   */
  list: (taskId: number) =>
    api.get<PointsReviewConversationSummary[]>(
      `/tasks/${taskId}/points-reviews`,
    ),

  /**
   * Get a specific conversation with all messages
   */
  get: (taskId: number, conversationId: number) =>
    api.get<PointsReviewConversation>(
      `/tasks/${taskId}/points-reviews/${conversationId}`,
    ),

  /**
   * Create a new points review conversation
   */
  create: (taskId: number, data: CreatePointsReviewRequest) =>
    api.post<PointsReviewConversation>(
      `/tasks/${taskId}/points-reviews`,
      data,
    ),

  /**
   * Update proposed points and/or similar tasks (initiator only)
   */
  update: (
    taskId: number,
    conversationId: number,
    data: UpdatePointsReviewRequest,
  ) =>
    api.patch<PointsReviewConversation>(
      `/tasks/${taskId}/points-reviews/${conversationId}`,
      data,
    ),

  /**
   * Add a message to a conversation
   */
  addMessage: (
    taskId: number,
    conversationId: number,
    data: CreatePointsReviewMessageRequest,
  ) =>
    api.post<PointsReviewMessage>(
      `/tasks/${taskId}/points-reviews/${conversationId}/messages`,
      data,
    ),

  /**
   * Edit a message
   */
  editMessage: (
    taskId: number,
    conversationId: number,
    messageId: number,
    data: CreatePointsReviewMessageRequest,
  ) =>
    api.patch<PointsReviewMessage>(
      `/tasks/${taskId}/points-reviews/${conversationId}/messages/${messageId}`,
      data,
    ),

  /**
   * Delete a message (professor only)
   */
  deleteMessage: (
    taskId: number,
    conversationId: number,
    messageId: number,
  ) =>
    api.delete<void>(
      `/tasks/${taskId}/points-reviews/${conversationId}/messages/${messageId}`,
    ),

  /**
   * Add a participant to a conversation (professor only)
   */
  addParticipant: (
    taskId: number,
    conversationId: number,
    userId: string,
  ) =>
    api.post<PointsReviewConversation>(
      `/tasks/${taskId}/points-reviews/${conversationId}/participants`,
      { userId },
    ),

  /**
   * Remove a participant from a conversation (professor only)
   */
  removeParticipant: (
    taskId: number,
    conversationId: number,
    userId: string,
  ) =>
    api.delete<void>(
      `/tasks/${taskId}/points-reviews/${conversationId}/participants/${userId}`,
    ),
};
