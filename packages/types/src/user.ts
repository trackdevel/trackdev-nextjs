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
}

export interface UserPublic {
  id: string;
  username: string;
  fullName: string;
  email: string;
  color: string;
  capitalLetters: string;
}

// Role type no longer needed - API returns roles as string array
export type RoleName = "ADMIN" | "WORKSPACE_ADMIN" | "PROFESSOR" | "STUDENT";

export interface GithubInfo {
  id?: number;
  githubToken?: string;
  githubUsername?: string;
}

export interface UserUpdateRequest {
  username?: string;
  fullName?: string;
  email?: string;
  color?: string;
  currentProject?: number;
  githubInfo?: Partial<GithubInfo>;
}

export interface UserAdminUpdateRequest extends UserUpdateRequest {
  enabled?: boolean;
  roles?: RoleName[];
}
