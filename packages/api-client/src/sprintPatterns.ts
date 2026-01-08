// ============================================
// Sprint Patterns API
// ============================================

import type { SprintPattern, SprintPatternRequest } from "@trackdev/types";
import { api } from "./client";

export interface SprintPatternsResponse {
  sprintPatterns: SprintPattern[];
}

export const sprintPatternsApi = {
  /**
   * Get all sprint patterns for a course
   */
  getByCourse: (courseId: number) =>
    api.get<SprintPatternsResponse>(`/sprint-patterns/course/${courseId}`),

  /**
   * Get a specific sprint pattern by ID
   */
  getById: (id: number) => api.get<SprintPattern>(`/sprint-patterns/${id}`),

  /**
   * Create a new sprint pattern for a course
   */
  create: (courseId: number, data: SprintPatternRequest) =>
    api.post<SprintPattern>(`/sprint-patterns/course/${courseId}`, data),

  /**
   * Update an existing sprint pattern
   */
  update: (id: number, data: SprintPatternRequest) =>
    api.put<SprintPattern>(`/sprint-patterns/${id}`, data),

  /**
   * Delete a sprint pattern
   */
  delete: (id: number) => api.delete<void>(`/sprint-patterns/${id}`),
};
