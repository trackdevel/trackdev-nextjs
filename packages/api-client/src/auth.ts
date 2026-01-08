// ============================================
// Authentication API
// ============================================

import type {
  AuthCheckResponse,
  LoginRequest,
  LoginResponse,
  PasswordChangeRequest,
  PasswordRecoveryCheckRequest,
  PasswordRecoveryRequest,
  PasswordRecoveryResetRequest,
  User,
} from "@trackdev/types";
import { api } from "./client";

export const authApi = {
  /**
   * Login user with email and password
   */
  login: (data: LoginRequest) => api.post<LoginResponse>("/auth/login", data),

  /**
   * Logout current user
   */
  logout: () => api.post<void>("/auth/logout"),

  /**
   * Check if session is still active
   */
  check: () => api.get<AuthCheckResponse>("/auth/check"),

  /**
   * Get current logged in user profile
   */
  self: () => api.get<User>("/auth/self"),

  /**
   * Change password for current user
   */
  changePassword: (data: PasswordChangeRequest) =>
    api.post<void>("/auth/password", data),

  /**
   * Request password recovery code via email
   */
  requestRecovery: (data: PasswordRecoveryRequest) =>
    api.post<void>("/auth/recovery", data),

  /**
   * Check if recovery code is valid
   */
  checkRecoveryCode: (email: string, data: PasswordRecoveryCheckRequest) =>
    api.post<{ valid: boolean }>(
      `/auth/recovery/${encodeURIComponent(email)}/check`,
      data
    ),

  /**
   * Reset password using recovery code
   */
  resetPassword: (email: string, data: PasswordRecoveryResetRequest) =>
    api.post<void>(`/auth/recovery/${encodeURIComponent(email)}`, data),
};
