// ============================================
// Authentication Types
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userdata: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
  userType: RoleName;
  workspaceId?: number;
  courseId?: number;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}

export interface PasswordRecoveryRequest {
  email: string;
}

export interface PasswordRecoveryCheckRequest {
  code: string;
}

export interface PasswordRecoveryResetRequest {
  code: string;
  newPassword: string;
}

export interface AuthCheckResponse {
  authenticated: boolean;
}

// ============ NEW TOKEN-BASED PASSWORD RESET TYPES ============

export interface ForgotPasswordRequest {
  email: string;
}

export interface TokenValidationResponse {
  valid: boolean;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Import User and RoleName types for LoginResponse and RegisterRequest
import { RoleName, User } from "./user";
