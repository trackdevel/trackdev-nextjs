// ============================================
// Activity Types
// Based on Activity.java entity
// ============================================

/**
 * Activity types representing different events
 */
export type ActivityType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_ASSIGNED"
  | "TASK_UNASSIGNED"
  | "TASK_ESTIMATION_CHANGED"
  | "COMMENT_ADDED"
  | "PR_LINKED"
  | "PR_UNLINKED"
  | "PR_STATE_CHANGED"
  | "PR_MERGED"
  | "TASK_ADDED_TO_SPRINT"
  | "TASK_REMOVED_FROM_SPRINT";

/**
 * Single activity event
 */
export interface Activity {
  id: number;
  type: ActivityType;
  createdAt: string;
  message?: string;
  oldValue?: string;
  newValue?: string;

  // Actor info
  actorId?: string;
  actorUsername?: string;
  actorEmail?: string;

  // Project info
  projectId?: number;
  projectName?: string;

  // Task info (optional)
  taskId?: number;
  taskKey?: string;
  taskName?: string;
}

/**
 * Paginated response for activities
 */
export interface ActivitiesResponse {
  activities: Activity[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Unread count response
 */
export interface ActivityUnreadCount {
  unreadCount: number;
  hasUnread: boolean;
}
