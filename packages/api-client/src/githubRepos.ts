// ============================================
// GitHub Repositories API
// ============================================

import type {
  AddGitHubRepoRequest,
  CreateWebhookRequest,
  GitHubRepoResponse,
  GitHubReposResponse,
  UpdateGitHubRepoRequest,
} from "@trackdev/types";
import { api } from "./client";

export const githubReposApi = {
  /**
   * Get all GitHub repositories for a project
   */
  getAll: (projectId: number) =>
    api.get<GitHubReposResponse>(`/projects/${projectId}/github-repos`),

  /**
   * Get a specific GitHub repository
   */
  getById: (projectId: number, repoId: number) =>
    api.get<GitHubRepoResponse>(
      `/projects/${projectId}/github-repos/${repoId}`
    ),

  /**
   * Add a GitHub repository to a project
   */
  add: (projectId: number, data: AddGitHubRepoRequest) =>
    api.post<GitHubRepoResponse>(`/projects/${projectId}/github-repos`, data),

  /**
   * Update a GitHub repository
   */
  update: (projectId: number, repoId: number, data: UpdateGitHubRepoRequest) =>
    api.patch<GitHubRepoResponse>(
      `/projects/${projectId}/github-repos/${repoId}`,
      data
    ),

  /**
   * Delete a GitHub repository from a project
   */
  delete: (projectId: number, repoId: number) =>
    api.delete<void>(`/projects/${projectId}/github-repos/${repoId}`),

  /**
   * Create a webhook for the repository
   */
  createWebhook: (
    projectId: number,
    repoId: number,
    data: CreateWebhookRequest
  ) =>
    api.post<GitHubRepoResponse>(
      `/projects/${projectId}/github-repos/${repoId}/webhook`,
      data
    ),

  /**
   * Delete the webhook from the repository
   */
  deleteWebhook: (projectId: number, repoId: number) =>
    api.delete<GitHubRepoResponse>(
      `/projects/${projectId}/github-repos/${repoId}/webhook`
    ),

  /**
   * Get repository information from GitHub
   */
  getInfo: (projectId: number, repoId: number) =>
    api.get<Record<string, unknown>>(
      `/projects/${projectId}/github-repos/${repoId}/info`
    ),

  /**
   * Get recent commits from the repository
   */
  getCommits: (projectId: number, repoId: number, limit = 30) =>
    api.get<Record<string, unknown>[]>(
      `/projects/${projectId}/github-repos/${repoId}/commits?limit=${limit}`
    ),

  /**
   * Get branches from the repository
   */
  getBranches: (projectId: number, repoId: number) =>
    api.get<Record<string, unknown>[]>(
      `/projects/${projectId}/github-repos/${repoId}/branches`
    ),
};
