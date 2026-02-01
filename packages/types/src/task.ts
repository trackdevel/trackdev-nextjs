// ============================================
// Task Types
// Based on Task.java entity
// ============================================

import { Comment } from "./comment";
import { Sprint } from "./sprint";
import { UserPublic } from "./user";

/**
 * Pull Request linked to a task
 */
export interface PullRequest {
  id: string;
  url: string;
  prNumber?: number;
  title?: string;
  state?: "open" | "closed";
  merged?: boolean;
  repoFullName?: string;
  author?: UserPublic;
  createdAt?: string;
  updatedAt?: string;
  /** Lines added (from GitHub API) */
  additions?: number;
  /** Lines deleted (from GitHub API) */
  deletions?: number;
  /** Files changed (from GitHub API) */
  changedFiles?: number;
  /** Lines from this PR still present in main branch (computed dynamically) */
  survivingLines?: number;
}

export interface Task {
  id: number;
  taskNumber?: number;
  taskKey?: string;
  name: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  frozen?: boolean;
  rank: number;
  estimationPoints: number;
  createdAt: string;
  reporter?: UserPublic;
  assignee?: UserPublic;
  parentTaskId?: number;
  childTasks?: Task[];
  activeSprints?: Sprint[];
  discussion?: Comment[];
  pullRequests?: PullRequest[];
}

export type TaskType = "USER_STORY" | "TASK" | "BUG";

export type TaskStatus = "BACKLOG" | "TODO" | "INPROGRESS" | "VERIFY" | "DONE";

export interface TaskCreateRequest {
  name: string;
  description?: string;
  type?: TaskType;
  estimationPoints?: number;
  assigneeId?: string;
}

export interface TaskUpdateRequest {
  name?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  rank?: number;
  estimationPoints?: number;
  assigneeId?: string | null;
  sprintId?: number | null;
}

export interface TaskLog {
  id: number;
  taskId: number;
  field: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  userId: string;
  username: string;
  fullName?: string;
}

export interface TaskStatusInfo {
  name: TaskStatus;
  displayName: string;
}

export interface TaskTypeInfo {
  name: TaskType;
  displayName: string;
}

export interface PointsReview {
  id: number;
  points: number;
  comment?: string;
  task?: { id: number };
  user?: { id: string; username: string };
}

/**
 * Task attribute value - stores the value of a profile attribute for a task
 */
export interface TaskAttributeValue {
  id: number;
  taskId: number;
  attributeId: number;
  attributeName: string;
  attributeType: "STRING" | "INTEGER" | "FLOAT" | "ENUM";
  value: string | null;
  enumValues?: string[];
}

/**
 * Request to set an attribute value on a task
 */
export interface SetAttributeValueRequest {
  value: string | null;
}

/**
 * Task detail response - flat structure with all task properties plus pointsReview
 * Includes computed permission flags based on current user context.
 */
export interface TaskDetail extends Task {
  project?: {
    id: number;
    name: string;
    members?: Array<{ id: string; username: string; color?: string }>;
  };
  pointsReview: PointsReview[];

  // =============================================================================
  // PERMISSION FLAGS (computed by backend based on current user context)
  // =============================================================================

  /** Whether the current user can edit this task (name, description, etc.) */
  canEdit: boolean;

  /** Whether the current user can change the task status */
  canEditStatus: boolean;

  /** Whether the current user can change the sprint assignment */
  canEditSprint: boolean;

  /** Whether the current user can change the task type */
  canEditType: boolean;

  /** Whether the current user can change estimation points */
  canEditEstimation: boolean;

  /** Whether the current user can delete this task */
  canDelete: boolean;

  /** Whether the current user can self-assign this task */
  canSelfAssign: boolean;

  /** Whether the current user can unassign the current assignee */
  canUnassign: boolean;

  /** Whether the current user can add subtasks to this task (only for USER_STORY) */
  canAddSubtask: boolean;

  /** Whether the current user can freeze/unfreeze this task */
  canFreeze: boolean;

  /** Whether the current user can add comments */
  canComment: boolean;
}

/**
 * Base interface for PR change events
 */
export interface PullRequestChangeBase {
  id: number;
  pullRequestId: string;
  githubUser: string;
  authorFullName?: string;
  changedAt: string;
  type: string;
}

/**
 * PR opened change event
 */
export interface PullRequestOpenedChange extends PullRequestChangeBase {
  type: "pr_opened";
  prTitle: string;
  prNumber: number;
  repoFullName: string;
}

/**
 * PR closed change event (closed without merge)
 */
export interface PullRequestClosedChange extends PullRequestChangeBase {
  type: "pr_closed";
  merged: boolean;
  mergedBy?: string;
}

/**
 * PR merged change event
 */
export interface PullRequestMergedChange extends PullRequestChangeBase {
  type: "pr_merged";
  mergedBy: string;
  mergedByFullName?: string;
}

/**
 * PR reopened change event
 */
export interface PullRequestReopenedChange extends PullRequestChangeBase {
  type: "pr_reopened";
}

/**
 * PR synchronize change event (new commits pushed)
 */
export interface PullRequestSynchronizeChange extends PullRequestChangeBase {
  type: "pr_synchronize";
}

/**
 * PR edited change event (title/body changed)
 */
export interface PullRequestEditedChange extends PullRequestChangeBase {
  type: "pr_edited";
  newTitle?: string;
}

/**
 * Union type for all PR change events
 */
export type PullRequestChange =
  | PullRequestOpenedChange
  | PullRequestClosedChange
  | PullRequestMergedChange
  | PullRequestReopenedChange
  | PullRequestSynchronizeChange
  | PullRequestEditedChange;
