// ============================================
// Tasks API
// ============================================

import type {
  Comment,
  CommentCreateRequest,
  IdObject,
  ProfileAttribute,
  PullRequestChange,
  SetAttributeValueRequest,
  Task,
  TaskAttributeValue,
  TaskCreateRequest,
  TaskDetail,
  TaskLog,
  TaskUpdateRequest,
} from "@trackdev/types";
import { api } from "./client";

export interface TasksResponse {
  tasks: Task[];
}

export interface PagedTasksResponse {
  tasks: Task[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface TasksFilterParams {
  type?: string;
  status?: string;
  assigneeId?: string;
  sortOrder?: "asc" | "desc";
}

export interface StatusListResponse {
  statuses: Record<string, string>;
}

export interface TaskTypesResponse {
  types: Record<string, string>;
}

export interface CommentsResponse {
  comments: Comment[];
  taskId: number;
}

export interface TaskHistoryResponse {
  history: TaskLog[];
  entityId: number;
}

export interface PrHistoryResponse {
  history: PullRequestChange[];
  entityId: number;
}

export const tasksApi = {
  /**
   * Get all tasks (Admin only)
   */
  getAll: () => api.get<TasksResponse>("/tasks"),

  /**
   * Get available task statuses
   */
  getStatuses: () => api.get<StatusListResponse>("/tasks/status"),

  /**
   * Get user story statuses
   */
  getUsStatuses: () => api.get<StatusListResponse>("/tasks/usstatus"),

  /**
   * Get task statuses (subtasks)
   */
  getTaskStatuses: () => api.get<StatusListResponse>("/tasks/taskstatus"),

  /**
   * Get task types
   */
  getTypes: () => api.get<TaskTypesResponse>("/tasks/types"),

  /**
   * Get task by ID (returns task detail with project and points review)
   */
  getById: (id: number) => api.get<TaskDetail>(`/tasks/${id}`),

  /**
   * Create a subtask under a user story
   * @param parentId - The ID of the parent USER_STORY task
   * @param data - The subtask data
   * @param sprintId - Optional sprint ID to assign the subtask to
   */
  createSubtask: (
    parentId: number,
    data: TaskCreateRequest,
    sprintId?: number,
  ) => api.post<IdObject>(`/tasks/${parentId}/subtasks`, { ...data, sprintId }),

  /**
   * Update a task
   */
  update: (id: number, data: TaskUpdateRequest) => {
    // Transform sprintId to activeSprints for backend
    const { sprintId, ...rest } = data;
    const backendData: Record<string, unknown> = { ...rest };

    if (sprintId !== undefined) {
      // sprintId: null means remove from all sprints, sprintId: number means add to that sprint
      backendData.activeSprints = sprintId === null ? [] : [sprintId];
    }

    return api.patch<Task>(`/tasks/${id}`, backendData);
  },

  /**
   * Delete a task
   */
  delete: (id: number) => api.delete<void>(`/tasks/${id}`),

  /**
   * Get comments for a task
   */
  getComments: (taskId: number) =>
    api.get<CommentsResponse>(`/tasks/${taskId}/comments`),

  /**
   * Add a comment to a task
   */
  addComment: (taskId: number, data: CommentCreateRequest) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, data),

  /**
   * Update a comment
   * Students can only edit their own comments.
   * Professors owning the project can edit any comment.
   */
  updateComment: (
    taskId: number,
    commentId: number,
    data: CommentCreateRequest,
  ) => api.patch<Comment>(`/tasks/${taskId}/comments/${commentId}`, data),

  /**
   * Delete a comment
   * Only professors owning the project can delete comments.
   */
  deleteComment: (taskId: number, commentId: number) =>
    api.delete<void>(`/tasks/${taskId}/comments/${commentId}`),

  /**
   * Get task history/logs
   */
  getHistory: async (taskId: number) => {
    const response = await api.get<{ history: TaskLog[]; entityId: number }>(
      `/tasks/${taskId}/history`,
    );
    return response.history;
  },

  /**
   * Get pull request change history for a task
   */
  getPrHistory: (taskId: number) =>
    api.get<PrHistoryResponse>(`/tasks/${taskId}/pr-history`),

  /**
   * Get the 5 most recent tasks for the current user
   */
  getRecent: () => api.get<TasksResponse>("/tasks/recent"),

  /**
   * Get paginated tasks for the current user with optional filters
   */
  getMy: (page = 0, size = 10, filters?: TasksFilterParams) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("size", size.toString());

    if (filters?.type) {
      params.set("type", filters.type);
    }
    if (filters?.status) {
      params.set("status", filters.status);
    }
    if (filters?.assigneeId) {
      params.set("assigneeId", filters.assigneeId);
    }
    if (filters?.sortOrder) {
      params.set("sortOrder", filters.sortOrder);
    }

    return api.get<PagedTasksResponse>(`/tasks/my?${params.toString()}`);
  },

  /**
   * Freeze a task (PROFESSOR only)
   */
  freeze: (id: number) => api.post<Task>(`/tasks/${id}/freeze`, {}),

  /**
   * Unfreeze a task (PROFESSOR only)
   */
  unfreeze: (id: number) => api.post<Task>(`/tasks/${id}/unfreeze`, {}),

  /**
   * Self-assign task to current user
   */
  selfAssign: (id: number) => api.post<Task>(`/tasks/${id}/assign`, {}),

  /**
   * Unassign task from current user
   */
  unassign: (id: number) => api.delete<Task>(`/tasks/${id}/assign`),

  // ==================== Task Attribute Values ====================

  /**
   * Get attribute values set for a task
   */
  getAttributeValues: (taskId: number) =>
    api.get<TaskAttributeValue[]>(`/tasks/${taskId}/attributes`),

  /**
   * Get available attributes from the course profile that can be applied to this task
   */
  getAvailableAttributes: (taskId: number) =>
    api.get<ProfileAttribute[]>(`/tasks/${taskId}/available-attributes`),

  /**
   * Set or update an attribute value for a task
   */
  setAttributeValue: (
    taskId: number,
    attributeId: number,
    data: SetAttributeValueRequest,
  ) =>
    api.put<TaskAttributeValue>(
      `/tasks/${taskId}/attributes/${attributeId}`,
      data,
    ),

  /**
   * Delete an attribute value from a task
   */
  deleteAttributeValue: (taskId: number, attributeId: number) =>
    api.delete<void>(`/tasks/${taskId}/attributes/${attributeId}`),
};
