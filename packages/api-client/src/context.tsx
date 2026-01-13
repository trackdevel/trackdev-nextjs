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
}

export function AuthProvider({
  children,
  baseUrl,
  onTokenChange,
  onAuthExpired,
  getStoredToken,
  setStoredToken,
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

  // Configure API client once on mount (baseUrl changes are rare)
  useEffect(() => {
    configureApiClient({
      baseUrl:
        baseUrl ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.EXPO_PUBLIC_API_URL ||
        "http://localhost:8080",
      apiPrefix: "/api",
      getToken: () => tokenRef.current,
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
    [setStoredToken, onTokenChange]
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
