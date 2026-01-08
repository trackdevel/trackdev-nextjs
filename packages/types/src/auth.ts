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
  email: string;
  password: string;
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

// Import User type for LoginResponse
import { User } from './user';
