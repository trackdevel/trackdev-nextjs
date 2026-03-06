"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Like useState but persists value in sessionStorage.
 * On mount, initializes from sessionStorage if a value exists.
 * On every state change, writes back to sessionStorage.
 */
export function useSessionState<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const saved = sessionStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // sessionStorage full or unavailable
    }
  }, [key, state]);

  const setSessionState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value);
    },
    []
  );

  return [state, setSessionState];
}

/**
 * Removes a sessionStorage key. Useful for cleanup on explicit close/submit.
 */
export function clearSessionState(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
