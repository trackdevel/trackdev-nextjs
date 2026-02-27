// ============================================
// Projects API
// ============================================

import type {
  IdObject,
  Project,
  ProjectUpdateRequest,
  PullRequest,
  SprintCreateRequest,
  Task,
  TaskCreateRequest,
} from "@trackdev/types";
import { api } from "./client";

export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectTasksResponse {
  tasks: Task[];
  projectId: number;
}

export interface ProjectSprintsResponse {
  sprints: SprintSummary[];
  projectId: number;
}

export interface SprintSummary {
  id: number;
  value: string;
  label: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface TaskWithPRStats {
  taskId: number;
  taskKey: string;
  taskName: string;
  assigneeFullName?: string;
  assigneeUsername?: string;
  pullRequests: PullRequest[];
}

export interface ProjectPRStatsResponse {
  projectId: number;
  tasks: TaskWithPRStats[];
}

export interface PagedProjectsResponse {
  projects: Project[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ProjectsParams {
  page?: number;
  size?: number;
  courseId?: number;
}

export interface ProjectQualificationResponse {
  projectId: number;
  qualifications: Record<string, UserQualification>;
}

export interface UserQualification {
  name: string;
  acronym: string;
  color: string;
  qualification: string;
}

export const projectsApi = {
  /**
   * Get all projects (non-paginated)
   */
  getAll: () => api.get<ProjectsResponse>("/projects"),

  /**
   * Get projects paginated and sorted alphabetically
   */
  getPaginated: async (params?: ProjectsParams) => {
    const searchParams = new URLSearchParams();
    if (params?.page !== undefined)
      searchParams.append("page", String(params.page));
    if (params?.size !== undefined)
      searchParams.append("size", String(params.size));
    if (params?.courseId !== undefined)
      searchParams.append("courseId", String(params.courseId));
    const queryString = searchParams.toString();
    const url = queryString
      ? `/projects/paged?${queryString}`
      : "/projects/paged";
    return api.get<PagedProjectsResponse>(url);
  },

  /**
   * Get project by ID
   */
  getById: (id: number) => api.get<Project>(`/projects/${id}`),

  /**
   * Get project qualifications
   */
  getQualification: (id: number) =>
    api.get<ProjectQualificationResponse>(`/projects/${id}/qualification`),

  /**
   * Update a project
   */
  update: (id: number, data: ProjectUpdateRequest) =>
    api.patch<Project>(`/projects/${id}`, data),

  /**
   * Delete a project (Admin only)
   */
  delete: (id: number) => api.delete<void>(`/projects/${id}`),

  /**
   * Get all tasks in a project
   */
  getTasks: (projectId: number) =>
    api.get<ProjectTasksResponse>(`/projects/${projectId}/tasks`),

  /**
   * Create a task in a project
   */
  createTask: (projectId: number, data: TaskCreateRequest) =>
    api.post<IdObject>(`/projects/${projectId}/tasks`, data),

  /**
   * Get all sprints in a project
   */
  getSprints: (projectId: number) =>
    api.get<ProjectSprintsResponse>(`/projects/${projectId}/sprints`),

  /**
   * Create a sprint in a project
   */
  createSprint: (projectId: number, data: SprintCreateRequest) =>
    api.post<IdObject>(`/projects/${projectId}/sprints`, data),

  /**
   * Update project members (Professor/Admin only)
   */
  updateMembers: (projectId: number, memberIds: string[]) =>
    api.patch<Project>(`/projects/${projectId}`, { members: memberIds }),

  /**
   * Apply a sprint pattern to a project, creating sprints from the pattern items (Professor/Admin only)
   */
  applySprintPattern: (projectId: number, patternId: number) =>
    api.post<Project>(`/projects/${projectId}/apply-pattern/${patternId}`, {}),

  /**
   * Fetch PR statistics for all completed tasks in a project.
   * Fetches additions, deletions, and changed files from GitHub API.
   * @param projectId - The project ID
   * @param sprintId - Optional sprint ID to filter by (undefined means all sprints)
   * @param assigneeId - Optional assignee ID to filter by (undefined means all team members)
   */
  fetchPRStats: (projectId: number, sprintId?: number, assigneeId?: string) => {
    const params = new URLSearchParams();
    if (sprintId) params.append("sprintId", String(sprintId));
    if (assigneeId) params.append("assigneeId", assigneeId);
    const queryString = params.toString();
    const url = queryString
      ? `/projects/${projectId}/pr-stats?${queryString}`
      : `/projects/${projectId}/pr-stats`;
    return api.post<ProjectPRStatsResponse>(url, {});
  },
};
