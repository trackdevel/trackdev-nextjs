// ============================================
// Workspaces API
// ============================================

import type {
  CreateWorkspaceRequest,
  IdObject,
  UpdateWorkspaceRequest,
  Workspace,
  WorkspaceComplete,
} from "@trackdev/types";
import { api } from "./client";

export const workspacesApi = {
  /**
   * Get all workspaces (Admin only)
   */
  getAll: () => api.get<Workspace[]>("/workspaces"),

  /**
   * Get workspace by ID
   */
  getById: (id: number) => api.get<WorkspaceComplete>(`/workspaces/${id}`),

  /**
   * Create a new workspace (Admin only)
   */
  create: (data: CreateWorkspaceRequest) =>
    api.post<IdObject>("/workspaces", data),

  /**
   * Update a workspace
   */
  update: (id: number, data: UpdateWorkspaceRequest) =>
    api.patch<Workspace>(`/workspaces/${id}`, data),

  /**
   * Delete a workspace (Admin only)
   */
  delete: (id: number) => api.delete<void>(`/workspaces/${id}`),
};
