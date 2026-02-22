// ============================================
// Task Types
// Based on Task.java entity
// ============================================

import { Comment } from "./comment";
import { EnumValueEntry } from "./profile";
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

/**
 * Range of lines in a file
 */
export interface LineRange {
  startLine: number;
  endLine: number;
  lineCount: number;
  commitSha?: string;
}

/**
 * Status of a line
 * - SURVIVING: Current line that came from the PR (still exists)
 * - CURRENT: Current line that is NOT from the PR (context/other commits)
 * - DELETED: Line from PR that was modified or deleted since merge
 */
export type LineStatus = "SURVIVING" | "CURRENT" | "DELETED";

/**
 * Detailed line information with content.
 * Lines are ordered for display: current file lines with deleted lines interleaved.
 */
export interface LineDetail {
  lineNumber: number | null; // Current line number (null for deleted lines)
  originalLineNumber?: number | null; // Line number in the merge commit (for deleted lines)
  content: string;
  status: LineStatus;
  commitSha?: string;
  commitUrl?: string; // URL to the commit
  authorFullName?: string; // Full name of the author (from app user matched by GitHub username)
  authorGithubUsername?: string; // GitHub username of the commit author
  prFileUrl?: string; // URL to the file in the PR being analyzed
  originPrNumber?: number; // PR number that originally introduced this line (for CURRENT lines)
  originPrUrl?: string; // URL to the PR that originally introduced this line
}

/**
 * Detailed file information in a Pull Request
 */
export interface PRFileDetail {
  filePath: string;
  status: "added" | "modified" | "deleted" | "renamed";
  additions: number;
  deletions: number;
  survivingLines: number;
  deletedLines?: number;
  currentLines?: number; // Total lines in current file
  lines: LineDetail[];
}

/**
 * Detailed Pull Request analysis with file-level information
 */
export interface PRDetailedAnalysis {
  id: string;
  url: string;
  prNumber?: number;
  title?: string;
  state?: "open" | "closed";
  merged?: boolean;
  repoFullName?: string;
  author?: UserPublic;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  survivingLines?: number;
  files: PRFileDetail[];
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
  attributeAppliedBy: "STUDENT" | "PROFESSOR";
  value: string | null;
  enumValues?: EnumValueEntry[];
}

/**
 * Student attribute value - stores the value of a profile attribute for a student
 */
export interface StudentAttributeValue {
  id: number;
  userId: string;
  attributeId: number;
  attributeName: string;
  attributeType: "STRING" | "INTEGER" | "FLOAT" | "ENUM";
  attributeAppliedBy: "STUDENT" | "PROFESSOR";
  value: string | null;
  enumValues?: EnumValueEntry[];
}

/**
 * Pull request attribute value - stores the value of a profile attribute for a PR
 */
export interface PullRequestAttributeValue {
  id: number;
  pullRequestId: string;
  attributeId: number;
  attributeName: string;
  attributeType: "STRING" | "INTEGER" | "FLOAT" | "ENUM";
  attributeAppliedBy: "STUDENT" | "PROFESSOR";
  value: string | null;
  enumValues?: EnumValueEntry[];
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
    members?: UserPublic[];
    course?: {
      id: number;
    };
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

  // =============================================================================
  // POINTS REVIEW FLAGS
  // =============================================================================

  /** Whether the current user can start a points review conversation */
  canStartPointsReview: boolean;

  /** Whether the current user can view points review conversations */
  canViewPointsReviews: boolean;

  /** Number of points review conversations on this task */
  pointsReviewConversationCount: number;
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
