// ============================================
// User Types
// Based on User.java entity
// ============================================

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  color: string;
  capitalLetters: string;
  currentProject?: number;
  lastLogin?: string;
  roles: RoleName[];
  enabled: boolean;
  changePassword: boolean;
  githubInfo?: GithubInfo;
  workspaceId?: number;
  timezone: string;
}

export interface UserPublic {
  id: string;
  username: string;
  fullName: string;
  email: string;
  color: string;
  capitalLetters: string;
  githubInfo?: GithubInfo;
}

// Role type no longer needed - API returns roles as string array
export type RoleName = "ADMIN" | "WORKSPACE_ADMIN" | "PROFESSOR" | "STUDENT";

export interface GithubInfo {
  id?: number;
  githubToken?: string;
  login?: string;
  avatar_url?: string;
  html_url?: string;
}

export interface UserUpdateRequest {
  username?: string;
  fullName?: string;
  email?: string;
  color?: string;
  currentProject?: number;
  githubUsername?: string;
  timezone?: string;
}

export interface UserAdminUpdateRequest extends UserUpdateRequest {
  enabled?: boolean;
  roles?: RoleName[];
}
