// ============================================
// Points Review Conversation Types
// Based on PointsReviewConversation.java entity
// ============================================

import { Task } from "./task";
import { UserPublic } from "./user";

/**
 * Full conversation with messages and permission flags
 */
export interface PointsReviewConversation {
  id: number;
  initiator: UserPublic;
  proposedPoints: number;
  similarTasks: Task[];
  messages: PointsReviewMessage[];
  participants: UserPublic[];
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canAddParticipant: boolean;
}

/**
 * Summary view of a conversation (no messages)
 */
export interface PointsReviewConversationSummary {
  id: number;
  initiator: UserPublic;
  proposedPoints: number;
  messageCount: number;
  createdAt: string;
  lastMessageAt: string | null;
}

/**
 * A single message in a points review conversation
 */
export interface PointsReviewMessage {
  id: number;
  author: UserPublic;
  content: string;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Request to create a new points review conversation
 */
export interface CreatePointsReviewRequest {
  content: string;
  proposedPoints: number;
  similarTaskIds?: number[];
}

/**
 * Request to update a points review conversation
 */
export interface UpdatePointsReviewRequest {
  proposedPoints?: number;
  similarTaskIds?: number[];
}

/**
 * Request to add a message to a conversation
 */
export interface CreatePointsReviewMessageRequest {
  content: string;
}

/**
 * Request to add a participant to a conversation
 */
export interface AddPointsReviewParticipantRequest {
  userId: string;
}
