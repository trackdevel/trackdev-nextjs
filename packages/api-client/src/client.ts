// ============================================
// API Client Configuration and Base Fetch
// ============================================

import type { ApiError } from "@trackdev/types";

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  setToken?: (token: string) => void | Promise<void>;
  onUnauthorized?: () => void;
  onError?: (error: ApiError) => void;
}

let config: ApiClientConfig = {
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    "http://localhost:8080",
};

export function configureApiClient(newConfig: Partial<ApiClientConfig>) {
  config = { ...config, ...newConfig };
}

export function getApiConfig(): ApiClientConfig {
  return config;
}

export class ApiClientError extends Error {
  public isNetworkError: boolean;
  public isTimeout: boolean;
  public isAuthError: boolean;
  public isServerError: boolean;
  public errorCode: string | null;

  constructor(
    public status: number,
    public statusText: string,
    public body: ApiError | null,
    options?: { isNetworkError?: boolean; isTimeout?: boolean }
  ) {
    super(body?.message || statusText);
    this.name = "ApiClientError";
    this.isNetworkError = options?.isNetworkError ?? false;
    this.isTimeout = options?.isTimeout ?? false;
    this.isAuthError = status === 401 || status === 403;
    this.isServerError = status >= 500;
    this.errorCode = body?.code ?? null;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    // Network errors
    if (this.isNetworkError) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    if (this.isTimeout) {
      return "The request timed out. Please try again.";
    }

    // Authentication errors
    if (this.status === 401) {
      if (this.body?.message?.includes("JWT expired")) {
        return "Your session has expired. Please log in again.";
      }
      if (this.body?.message?.includes("Bad credentials")) {
        return "Invalid email or password.";
      }
      return "You need to log in to access this resource.";
    }

    if (this.status === 403) {
      if (this.body?.message?.includes("JWT expired")) {
        return "Your session has expired. Please log in again.";
      }
      return "You don't have permission to access this resource.";
    }

    // Client errors
    if (this.status === 400) {
      return this.body?.message || "Invalid request. Please check your input.";
    }

    if (this.status === 404) {
      return this.body?.message || "The requested resource was not found.";
    }

    if (this.status === 409) {
      return (
        this.body?.message ||
        "A conflict occurred. The resource may already exist."
      );
    }

    // Server errors
    if (this.status >= 500) {
      return "An unexpected server error occurred. Please try again later.";
    }

    // Default to API message or generic error
    return (
      this.body?.message || "An unexpected error occurred. Please try again."
    );
  }
}

/**
 * Error messages that indicate the user session is invalid and requires logout.
 * These are typically returned when:
 * - The user referenced in the JWT no longer exists (deleted or DB reset)
 * - The user account has been disabled
 * - The JWT token has expired
 */
const AUTH_SESSION_ERROR_PATTERNS = [
  "No user exists", // User was deleted or email not found
  "User does not exist", // User ID not found
  "User is not enabled", // User account disabled
  "JWT expired", // Token expired
  "User must be authenticated", // Not logged in
];

/**
 * Check if an error response indicates an invalid authentication session
 * that requires clearing the token and redirecting to login.
 */
function checkAuthSessionError(
  status: number,
  message: string | undefined
): boolean {
  // 401 Unauthorized always requires re-authentication
  if (status === 401) {
    return true;
  }

  // Check for specific error messages that indicate session invalidity
  if (message) {
    for (const pattern of AUTH_SESSION_ERROR_PATTERNS) {
      if (message.includes(pattern)) {
        return true;
      }
    }
  }

  return false;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!config.getToken) return {};

  const token = await config.getToken();
  if (!token) return {};

  return { Authorization: `Bearer ${token}` };
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeader = await getAuthHeader();

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
        ...options.headers,
      },
      credentials: "include", // For cookie-based auth support
    });
  } catch (error) {
    // Network error (connection refused, DNS failure, etc.)
    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("timeout"));

    throw new ApiClientError(
      0,
      isTimeout ? "Request timed out" : "Network error",
      null,
      { isNetworkError: true, isTimeout }
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Check for refreshed token and update it
  const refreshedToken = response.headers.get("X-Refreshed-Token");
  if (refreshedToken && config.setToken) {
    // Remove "Bearer " prefix if present
    const token = refreshedToken.startsWith("Bearer ")
      ? refreshedToken.slice(7)
      : refreshedToken;
    await config.setToken(token);
  }

  // Handle errors
  if (!response.ok) {
    let errorBody: ApiError | null = null;

    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // Response might not be JSON
    }

    // Check if this is an authentication/session error that requires logout
    const isAuthSessionError = checkAuthSessionError(
      response.status,
      errorBody?.message
    );
    if (isAuthSessionError && config.onUnauthorized) {
      config.onUnauthorized();
    }

    if (config.onError && errorBody) {
      config.onError(errorBody);
    }

    throw new ApiClientError(response.status, response.statusText, errorBody);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

// HTTP method helpers
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};
