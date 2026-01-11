// ============================================
// Users API
// ============================================

import type {
  RegisterRequest,
  User,
  UserAdminUpdateRequest,
  UserPublic,
  UserUpdateRequest,
} from "@trackdev/types";
import { api } from "./client";

export interface UsersResponse {
  users: User[];
}

export interface AdminCheckResponse {
  isAdmin: boolean;
}

export const usersApi = {
  /**
   * Get all users (Admin only)
   */
  getAll: () => api.get<UsersResponse>("/users"),

  /**
   * Get user by UUID
   */
  getByUuid: (uuid: string) => api.get<UserPublic>(`/users/uuid/${uuid}`),

  /**
   * Get user by email
   */
  getByEmail: (email: string) =>
    api.get<UserPublic>(`/users/${encodeURIComponent(email)}`),

  /**
   * Register a new user
   */
  register: (data: RegisterRequest) => api.post<User>("/users/register", data),

  /**
   * Update current user settings
   */
  updateSelf: (data: UserUpdateRequest) => api.patch<User>("/users", data),

  /**
   * Update another user (Admin only)
   */
  update: (id: string, data: UserAdminUpdateRequest) =>
    api.patch<User>(`/users/${id}`, data),

  /**
   * Check if current user is admin
   */
  checkAdmin: () => api.get<AdminCheckResponse>("/users/checker/admin"),

  /**
   * Delete user (Admin only)
   */
  delete: (id: string) => api.delete<void>(`/users/${id}`),
};
