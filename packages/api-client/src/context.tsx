// ============================================
// Auth Context for React/React Native
// ============================================

import type { LoginRequest, User } from "@trackdev/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "./auth";
import { ApiClientError, configureApiClient } from "./client";

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  baseUrl?: string;
  onTokenChange?: (token: string | null) => void;
  onAuthExpired?: () => void;
  getStoredToken?: () => Promise<string | null>;
  setStoredToken?: (token: string | null) => Promise<void>;
  getLocale?: () => string;
  /** localStorage key used to store the token — enables cross-tab sync via the storage event */
  storageKey?: string;
}

export function AuthProvider({
  children,
  baseUrl,
  onTokenChange,
  onAuthExpired,
  getStoredToken,
  setStoredToken,
  getLocale,
  storageKey,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Use refs to avoid reconfiguring API client on every token/callback change
  const tokenRef = useRef(state.token);
  tokenRef.current = state.token;

  const setStoredTokenRef = useRef(setStoredToken);
  setStoredTokenRef.current = setStoredToken;

  const onTokenChangeRef = useRef(onTokenChange);
  onTokenChangeRef.current = onTokenChange;

  const onAuthExpiredRef = useRef(onAuthExpired);
  onAuthExpiredRef.current = onAuthExpired;

  const getLocaleRef = useRef(getLocale);
  getLocaleRef.current = getLocale;

  // Configure API client once on mount (baseUrl changes are rare)
  useEffect(() => {
    configureApiClient({
      baseUrl: baseUrl || "http://localhost:8080",
      apiPrefix: "/api",
      getToken: () => tokenRef.current,
      getLocale: () => getLocaleRef.current?.() || "en",
      setToken: async (newToken: string) => {
        // Update state with refreshed token (sliding session)
        setState((prev) => ({ ...prev, token: newToken }));
        await setStoredTokenRef.current?.(newToken);
        onTokenChangeRef.current?.(newToken);
      },
      onUnauthorized: () => {
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
        setStoredTokenRef.current?.(null);
        onTokenChangeRef.current?.(null);
        onAuthExpiredRef.current?.();
      },
    });
  }, [baseUrl]);

  // Initialize from stored token
  useEffect(() => {
    const init = async () => {
      try {
        const storedToken = await getStoredToken?.();
        if (storedToken) {
          // Update tokenRef BEFORE making API call so getToken() returns correct value
          tokenRef.current = storedToken;
          setState((prev) => ({ ...prev, token: storedToken }));

          const user = await authApi.self();
          setState({
            user,
            token: storedToken,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        // Token expired or invalid
        tokenRef.current = null;
        await setStoredToken?.(null);
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    init();
  }, [getStoredToken, setStoredToken]);

  // Cross-tab synchronization via the storage event.
  // When another tab updates or clears the token in localStorage,
  // this tab picks up the change so all tabs stay in sync.
  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;

      if (e.newValue) {
        // Another tab wrote a new token — adopt it
        tokenRef.current = e.newValue;
        setState((prev) => ({ ...prev, token: e.newValue }));
      } else {
        // Another tab cleared the token (logout or auth expired)
        tokenRef.current = null;
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
        onAuthExpiredRef.current?.();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  // Keep-alive: periodically ping the backend so the sliding session
  // doesn't expire while the user has the tab open but idle (e.g.
  // watching a sprint board via SSE, which is excluded from token refresh).
  // Runs every 15 minutes; only fires when the tab is authenticated.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const KEEP_ALIVE_MS = 15 * 60 * 1000; // 15 minutes

    const interval = setInterval(() => {
      if (tokenRef.current) {
        // Silent call — the response will carry X-Refreshed-Token
        authApi.self().catch(() => {
          // Ignore — if the token is truly dead, the next user-initiated
          // request will trigger onUnauthorized and redirect to login.
        });
      }
    }, KEEP_ALIVE_MS);

    return () => clearInterval(interval);
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response = await authApi.login(credentials);
        const { userdata, token } = response;

        // Update tokenRef immediately so subsequent API calls use the new token
        tokenRef.current = token;
        await setStoredToken?.(token);
        onTokenChange?.(token);

        setState({
          user: userdata,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [setStoredToken, onTokenChange],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      // Clear tokenRef immediately so no more authenticated requests are made
      tokenRef.current = null;
      await setStoredToken?.(null);
      onTokenChange?.(null);
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [setStoredToken, onTokenChange]);

  const refreshUser = useCallback(async () => {
    if (!state.token) return;

    try {
      const user = await authApi.self();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      // Handle error silently or logout
      if (error instanceof ApiClientError && error.status === 401) {
        await logout();
      }
    }
  }, [state.token, logout]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}
