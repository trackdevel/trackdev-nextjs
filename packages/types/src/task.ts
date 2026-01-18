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

export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "INPROGRESS"
  | "VERIFY"
  | "DONE"
  | "DEFINED";

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
 * Task detail response - flat structure with all task properties plus pointsReview
 */
export interface TaskDetail extends Task {
  project?: {
    id: number;
    name: string;
    members?: Array<{ id: string; username: string; color?: string }>;
  };
  pointsReview: PointsReview[];
  /** Whether the current user can edit this task */
  canEdit: boolean;
}

/**
 * Base interface for PR change events
 */
export interface PullRequestChangeBase {
  id: number;
  pullRequestId: string;
  githubUser: string;
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
}

/**
 * PR reopened change event
 */
export interface PullRequestReopenedChange extends PullRequestChangeBase {
  type: "pr_reopened";
}

/**
 * Union type for all PR change events
 */
export type PullRequestChange =
  | PullRequestOpenedChange
  | PullRequestClosedChange
  | PullRequestMergedChange
  | PullRequestReopenedChange;
