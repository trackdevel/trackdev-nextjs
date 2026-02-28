// ============================================
// Personal Access Tokens API
// ============================================

import { api } from "./client";

export interface PersonalAccessToken {
  id: string;
  name: string;
  tokenPrefix: string;
  expiresAt: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revoked: boolean;
}

export interface PersonalAccessTokenCreated {
  id: string;
  name: string;
  token: string;
  tokenPrefix: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface PersonalAccessTokensResponse {
  tokens: PersonalAccessToken[];
}

export interface CreateTokenRequest {
  name: string;
  expiresAt?: string | null;
}

export const tokensApi = {
  /**
   * Create a new personal access token.
   * The full token is returned ONLY in this response.
   */
  create: (data: CreateTokenRequest) =>
    api.post<PersonalAccessTokenCreated>("/auth/tokens", data),

  /**
   * List all active (non-revoked) tokens for the current user.
   */
  list: () => api.get<PersonalAccessTokensResponse>("/auth/tokens"),

  /**
   * Revoke a personal access token. This cannot be undone.
   */
  revoke: (id: string) => api.delete<void>(`/auth/tokens/${id}`),
};
