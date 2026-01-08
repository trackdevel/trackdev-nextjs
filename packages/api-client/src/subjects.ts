// ============================================
// Subjects API
// ============================================

import type {
  CourseCreateRequest,
  IdObject,
  Subject,
  SubjectCreateRequest,
  SubjectUpdateRequest,
} from "@trackdev/types";
import { api } from "./client";

export interface SubjectsResponse {
  subjects: Subject[];
}

export const subjectsApi = {
  /**
   * Search subjects (Admin sees all, Professor sees own)
   */
  getAll: (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return api.get<SubjectsResponse>(`/subjects${params}`);
  },

  /**
   * Get subject by ID
   */
  getById: (id: number) => api.get<Subject>(`/subjects/${id}`),

  /**
   * Create a new subject (Admin only)
   */
  create: (data: SubjectCreateRequest) => api.post<IdObject>("/subjects", data),

  /**
   * Update a subject (Admin only)
   */
  update: (id: number, data: SubjectUpdateRequest) =>
    api.patch<Subject>(`/subjects/${id}`, data),

  /**
   * Delete a subject (Admin only)
   * Note: Cannot delete if subject has courses
   */
  delete: (id: number) => api.delete<void>(`/subjects/${id}`),

  /**
   * Create a course under a subject
   */
  createCourse: (subjectId: number, data: CourseCreateRequest) =>
    api.post<IdObject>(`/subjects/${subjectId}/courses`, data),
};
