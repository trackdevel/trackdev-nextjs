// ============================================
// Workspace Types
// Based on Workspace.java entity
// ============================================

import type { Subject } from "./subject";
import type { UserPublic } from "./user";

export interface Workspace {
  id: number;
  name: string;
}

export interface WorkspaceComplete extends Workspace {
  users: UserPublic[];
  subjects: Subject[];
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
}
