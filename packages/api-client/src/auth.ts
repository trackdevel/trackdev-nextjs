// ============================================
// Authentication API
// ============================================

import type {
  AuthCheckResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  PasswordChangeRequest,
  PasswordRecoveryCheckRequest,
  PasswordRecoveryRequest,
  PasswordRecoveryResetRequest,
  ResetPasswordRequest,
  TokenValidationResponse,
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
   * @deprecated Use forgotPassword instead for token-based reset
   */
  requestRecovery: (data: PasswordRecoveryRequest) =>
    api.post<void>("/auth/recovery", data),

  /**
   * Check if recovery code is valid
   * @deprecated Use validateResetToken instead
   */
  checkRecoveryCode: (email: string, data: PasswordRecoveryCheckRequest) =>
    api.post<{ valid: boolean }>(
      `/auth/recovery/${encodeURIComponent(email)}/check`,
      data,
    ),

  /**
   * Reset password using recovery code
   * @deprecated Use resetPasswordWithToken instead
   */
  resetPassword: (email: string, data: PasswordRecoveryResetRequest) =>
    api.post<void>(`/auth/recovery/${encodeURIComponent(email)}`, data),

  // ============ NEW TOKEN-BASED PASSWORD RESET ============

  /**
   * Request a password reset link to be sent to the email.
   * Always returns success for security (doesn't reveal if email exists).
   */
  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<void>("/auth/forgot-password", data),

  /**
   * Validate a password reset token.
   * @returns Whether the token is valid and not expired.
   */
  validateResetToken: (token: string) =>
    api.get<TokenValidationResponse>(
      `/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    ),

  /**
   * Reset password using a valid reset token.
   */
  resetPasswordWithToken: (data: ResetPasswordRequest) =>
    api.post<void>("/auth/reset-password", data),
};
