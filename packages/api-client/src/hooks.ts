// ============================================
// React Hooks for API Client
// Works with both React and React Native
// ============================================

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiClientError } from "./client";

export interface UseQueryOptions<T> {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiClientError) => void;
}

export interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: ApiClientError | null;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const { enabled = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  // Track if we've fetched successfully at least once
  const hasFetchedRef = useRef(false);

  // Store queryFn in ref to avoid dependency issues and stale closures
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  // Store callbacks in refs to avoid recreating fetchData
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Store enabled in ref to always have current value
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const fetchData = useCallback(async () => {
    // Use ref to get the most current enabled value
    if (!enabledRef.current) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await queryFnRef.current();
      setData(result);
      hasFetchedRef.current = true;
      onSuccessRef.current?.(result);
    } catch (err) {
      const apiError =
        err instanceof ApiClientError
          ? err
          : new ApiClientError(
              0,
              err instanceof Error ? err.message : "Unknown error",
              null,
              { isNetworkError: true }
            );
      setIsError(true);
      setError(apiError);
      onErrorRef.current?.(apiError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for initial fetch and deps changes
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
    // deps are passed by the caller to control when to refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  return { data, isLoading, isError, error, refetch: fetchData };
}

export interface UseMutationOptions<T, V> {
  onSuccess?: (data: T, variables: V) => void;
  onError?: (error: ApiClientError, variables: V) => void;
  onSettled?: (
    data: T | null,
    error: ApiClientError | null,
    variables: V
  ) => void;
}

export interface UseMutationResult<T, V> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: ApiClientError | null;
  mutate: (variables: V) => void;
  mutateAsync: (variables: V) => Promise<T>;
  reset: () => void;
}

export function useMutation<T, V = void>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
): UseMutationResult<T, V> {
  const { onSuccess, onError, onSettled } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setIsError(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  const mutateAsync = useCallback(
    async (variables: V): Promise<T> => {
      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
      setError(null);

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsSuccess(true);
        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);
        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiClientError
            ? err
            : new ApiClientError(
                0,
                err instanceof Error ? err.message : "Unknown error",
                null,
                { isNetworkError: true }
              );
        setIsError(true);
        setError(apiError);
        onError?.(apiError, variables);
        onSettled?.(null, apiError, variables);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    (variables: V) => {
      mutateAsync(variables).catch(() => {
        // Error is already handled in mutateAsync
      });
    },
    [mutateAsync]
  );

  return {
    data,
    isLoading,
    isError,
    isSuccess,
    error,
    mutate,
    mutateAsync,
    reset,
  };
}
