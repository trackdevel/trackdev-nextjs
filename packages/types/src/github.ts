// ============================================
// GitHub Repository Types
// ============================================

/**
 * Summary of a GitHub repository (for lists)
 */
export interface GitHubRepoSummary {
  id: number;
  name: string;
  fullName: string;
  webhookActive: boolean;
}

/**
 * Full GitHub repository details
 */
export interface GitHubRepo {
  id: number;
  name: string;
  url: string;
  owner: string;
  repoName: string;
  fullName: string;
  projectId: number;
  createdAt: string | null;
  lastSyncAt: string | null;
  webhookActive: boolean;
  webhookUrl: string | null;
}

/**
 * Response for listing GitHub repos in a project
 */
export interface GitHubReposResponse {
  repos: GitHubRepoSummary[];
  projectId: number;
  count: number;
}

/**
 * Response for a single GitHub repo
 */
export interface GitHubRepoResponse {
  id: number;
  name: string;
  url: string;
  owner: string;
  repoName: string;
  fullName: string;
  projectId: number;
  createdAt: string | null;
  lastSyncAt: string | null;
  webhookActive: boolean;
  webhookUrl: string | null;
}

/**
 * Request to add a GitHub repository
 */
export interface AddGitHubRepoRequest {
  name: string;
  url: string;
  accessToken: string;
}

/**
 * Request to update a GitHub repository
 */
export interface UpdateGitHubRepoRequest {
  name?: string;
  accessToken?: string;
}

/**
 * Request to create a webhook
 */
export interface CreateWebhookRequest {
  webhookUrl: string;
}
