// ============================================
// Projects API
// ============================================

import type {
  IdObject,
  Project,
  ProjectUpdateRequest,
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
   * Get all projects (Admin only)
   */
  getAll: () => api.get<ProjectsResponse>("/projects"),

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
};
