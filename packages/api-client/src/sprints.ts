// ============================================
// Sprints API
// ============================================

import type {
  Sprint,
  SprintLog,
  SprintUpdateRequest,
  Task,
} from "@trackdev/types";
import { api } from "./client";

export interface SprintsResponse {
  sprints: Sprint[];
}

export interface SprintHistoryResponse {
  history: SprintLog[];
  entityId: number;
}

export interface SprintBoardResponse {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  statusText: string;
  project: {
    id: number;
    name: string;
  };
  tasks: Task[];
}

export const sprintsApi = {
  /**
   * Get all sprints
   */
  getAll: () => api.get<SprintsResponse>("/sprints"),

  /**
   * Get sprint by ID
   */
  getById: (id: number) => api.get<Sprint>(`/sprints/${id}`),

  /**
   * Get sprint board with tasks
   */
  getBoard: (id: number) =>
    api.get<SprintBoardResponse>(`/sprints/${id}/board`),

  /**
   * Update a sprint
   */
  update: (id: number, data: SprintUpdateRequest) =>
    api.patch<Sprint>(`/sprints/${id}`, data),

  /**
   * Delete a sprint
   */
  delete: (id: number) => api.delete<void>(`/sprints/${id}`),

  /**
   * Get sprint change logs
   */
  getLogs: (id: number) =>
    api.get<SprintHistoryResponse>(`/sprints/${id}/history`),
};
