// ============================================
// Shared React Hooks
// ============================================

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for managing form state
 */
export function useForm<T extends Record<string, unknown>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setError = useCallback(
    <K extends keyof T>(field: K, error: string | undefined) => {
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    []
  );

  const setFieldTouched = useCallback(
    <K extends keyof T>(field: K, isTouched = true) => {
      setTouched((prev) => ({ ...prev, [field]: isTouched }));
    },
    []
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleChange = useCallback(
    <K extends keyof T>(field: K) => {
      return (value: T[K]) => {
        setValue(field, value);
        if (errors[field]) {
          setError(field, undefined);
        }
      };
    },
    [errors, setValue, setError]
  );

  const handleBlur = useCallback(
    <K extends keyof T>(field: K) => {
      return () => {
        setFieldTouched(field, true);
      };
    },
    [setFieldTouched]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setFieldTouched,
    handleChange,
    handleBlur,
    reset,
  };
}

/**
 * Hook for debouncing a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for tracking previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * Hook for boolean toggle
 */
export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}

/**
 * Hook for tracking mounted state
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * Hook for localStorage (web only, returns null on native)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Handle error silently
        }
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
