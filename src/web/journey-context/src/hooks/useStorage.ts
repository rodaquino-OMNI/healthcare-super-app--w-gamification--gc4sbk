/**
 * useStorage Hook
 * 
 * A cross-platform storage hook that abstracts away the differences between
 * web localStorage and React Native AsyncStorage, offering a unified API for
 * persisting and retrieving data.
 * 
 * This utility hook is used internally by other hooks (particularly useAuth)
 * to manage persistent state like authentication sessions consistently across platforms.
 */

import { useState, useCallback, useEffect } from 'react';

// Type for the return value of the useStorage hook
export interface UseStorageReturn {
  /**
   * Get a value from storage by key
   * @param key - The storage key
   * @returns A promise resolving to the stored value or null if not found
   */
  getItem: <T>(key: string) => Promise<T | null>;
  
  /**
   * Set a value in storage
   * @param key - The storage key
   * @param value - The value to store
   * @returns A promise that resolves when the operation is complete
   */
  setItem: <T>(key: string, value: T) => Promise<void>;
  
  /**
   * Remove a value from storage
   * @param key - The storage key to remove
   * @returns A promise that resolves when the operation is complete
   */
  removeItem: (key: string) => Promise<void>;
  
  /**
   * Clear all values from storage
   * @returns A promise that resolves when the operation is complete
   */
  clear: () => Promise<void>;
  
  /**
   * Check if a key exists in storage
   * @param key - The storage key to check
   * @returns A promise resolving to true if the key exists, false otherwise
   */
  hasItem: (key: string) => Promise<boolean>;
  
  /**
   * Current error state if any storage operation failed
   */
  error: Error | null;
  
  /**
   * Clear the current error state
   */
  clearError: () => void;
  
  /**
   * Indicates if the storage system is ready to use
   */
  isReady: boolean;
}

/**
 * Detect if we're running in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * Detect if we're running in React Native
 * Note: This is a simple check that works for most cases, but might need adjustment
 * based on the specific React Native environment
 */
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';

/**
 * A hook that provides a unified storage API across platforms
 * @returns Storage methods and state
 */
export const useStorage = (): UseStorageReturn => {
  // Error state for storage operations
  const [error, setError] = useState<Error | null>(null);
  // Track if AsyncStorage is loaded in React Native environment
  const [asyncStorage, setAsyncStorage] = useState<any>(null);
  // Track if the storage system is ready to use
  const [isReady, setIsReady] = useState<boolean>(isBrowser);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get a value from storage
   */
  const getItem = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      if (isBrowser) {
        const item = localStorage.getItem(key);
        if (item === null) return null;
        return JSON.parse(item) as T;
      } else if (isReactNative && asyncStorage) {
        const item = await asyncStorage.getItem(key);
        if (item === null) return null;
        return JSON.parse(item) as T;
      }
      return null;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error(`Error getting item from storage (${key}):`, error);
      return null;
    }
  }, [asyncStorage]);

  /**
   * Set a value in storage
   */
  const setItem = useCallback(async <T>(key: string, value: T): Promise<void> => {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (isBrowser) {
        localStorage.setItem(key, serializedValue);
      } else if (isReactNative && asyncStorage) {
        await asyncStorage.setItem(key, serializedValue);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error(`Error setting item in storage (${key}):`, error);
      throw error;
    }
  }, [asyncStorage]);

  /**
   * Remove a value from storage
   */
  const removeItem = useCallback(async (key: string): Promise<void> => {
    try {
      if (isBrowser) {
        localStorage.removeItem(key);
      } else if (isReactNative && asyncStorage) {
        await asyncStorage.removeItem(key);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error(`Error removing item from storage (${key}):`, error);
      throw error;
    }
  }, [asyncStorage]);

  /**
   * Clear all values from storage
   */
  const clear = useCallback(async (): Promise<void> => {
    try {
      if (isBrowser) {
        localStorage.clear();
      } else if (isReactNative && asyncStorage) {
        await asyncStorage.clear();
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error clearing storage:', error);
      throw error;
    }
  }, [asyncStorage]);

  /**
   * Check if a key exists in storage
   */
  const hasItem = useCallback(async (key: string): Promise<boolean> => {
    try {
      if (isBrowser) {
        return localStorage.getItem(key) !== null;
      } else if (isReactNative && asyncStorage) {
        const value = await asyncStorage.getItem(key);
        return value !== null;
      }
      return false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error(`Error checking if item exists in storage (${key}):`, error);
      return false;
    }
  }, [asyncStorage]);

  // Load AsyncStorage module for React Native environment
  useEffect(() => {
    // Skip if we're in a browser or AsyncStorage is already loaded
    if (isBrowser || asyncStorage) {
      return;
    }

    // Only attempt to import AsyncStorage in React Native environment
    if (isReactNative) {
      const loadAsyncStorage = async () => {
        try {
          // Using dynamic import to avoid issues with SSR and bundling
          const module = await import('@react-native-async-storage/async-storage');
          setAsyncStorage(module.default);
          setIsReady(true);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          console.error('Failed to import AsyncStorage:', error);
        }
      };

      loadAsyncStorage();
    }
  }, [asyncStorage]);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    hasItem,
    error,
    clearError,
    isReady
  };
};