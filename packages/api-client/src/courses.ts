// ============================================
// Courses API
// ============================================

import type {
  Course,
  CourseDetails,
  CourseInvite,
  CourseUpdateRequest,
  IdObject,
  InviteStudentsRequest,
  Project,
  ProjectCreateRequest,
  UserPublic,
} from "@trackdev/types";
import { api } from "./client";

export interface CoursesResponse {
  courses: Course[];
}

export interface CourseProjectsResponse {
  projects: Project[];
}

export interface CourseStudentsResponse {
  students: UserPublic[];
}

export interface CourseInvitesResponse {
  invites: CourseInvite[];
}

export const coursesApi = {
  /**
   * Get all enrolled/owned courses
   */
  getAll: () => api.get<CoursesResponse>("/courses"),

  /**
   * Get course by ID
   */
  getById: (id: number) => api.get<Course>(`/courses/${id}`),

  /**
   * Get course details with students and pending invites
   */
  getDetails: (id: number) => api.get<CourseDetails>(`/courses/${id}/details`),

  /**
   * Update a course
   */
  update: (id: number, data: CourseUpdateRequest) =>
    api.patch<Course>(`/courses/${id}`, data),

  /**
   * Delete a course
   */
  delete: (id: number) => api.delete<void>(`/courses/${id}`),

  /**
   * Get projects in a course
   */
  getProjects: (courseId: number) =>
    api.get<CourseProjectsResponse>(`/courses/${courseId}/projects`),

  /**
   * Create a project in a course
   */
  createProject: (courseId: number, data: ProjectCreateRequest) =>
    api.post<IdObject>(`/courses/${courseId}/projects`, data),

  /**
   * Get students enrolled in a course
   */
  getStudents: (courseId: number) =>
    api.get<CourseStudentsResponse>(`/courses/${courseId}/students`),

  /**
   * Send invitations to students
   */
  sendInvites: (courseId: number, data: InviteStudentsRequest) =>
    api.post<CourseInvitesResponse>(`/courses/${courseId}/invites`, data),

  /**
   * Get pending invites for a course
   */
  getPendingInvites: (courseId: number) =>
    api.get<CourseInvitesResponse>(`/courses/${courseId}/invites`),

  /**
   * Get all invites for a course (including accepted/expired)
   */
  getAllInvites: (courseId: number) =>
    api.get<CourseInvitesResponse>(`/courses/${courseId}/invites/all`),

  /**
   * Cancel an invitation
   */
  cancelInvite: (courseId: number, inviteId: number) =>
    api.delete<void>(`/courses/${courseId}/invites/${inviteId}`),

  /**
   * Remove a student from a course
   */
  removeStudent: (courseId: number, studentId: string) =>
    api.delete<void>(`/courses/${courseId}/students/${studentId}`),

  /**
   * Get reports assigned to a course
   */
  getReports: (courseId: number) =>
    api.get<{ reports: import("@trackdev/types").Report[]; courseId: number }>(
      `/courses/${courseId}/reports`,
    ),

  /**
   * Apply a profile to a course (Professor/Admin only)
   */
  applyProfile: (courseId: number, profileId: number) =>
    api.post<Course>(`/courses/${courseId}/apply-profile/${profileId}`, {}),
};
