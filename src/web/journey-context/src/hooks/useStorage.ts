/**
 * useStorage Hook
 * 
 * A cross-platform storage hook that abstracts away the differences between
 * web localStorage and React Native AsyncStorage, offering a unified API
 * for persisting and retrieving data.
 * 
 * This hook automatically detects the platform and uses the appropriate
 * storage mechanism, providing a consistent interface for both web and mobile.
 */

import { useState, useCallback, useEffect } from 'react';

// Define platform type
type Platform = 'web' | 'mobile';

/**
 * Detects the current platform (web or mobile) based on runtime environment.
 */
const detectPlatform = (): Platform => {
  try {
    // Primary check: React Native specific global
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'mobile';
    }
    
    // Secondary check: React Native specific APIs
    if (
      typeof global !== 'undefined' && 
      ((global as any).ReactNative || (global as any).__REACT_NATIVE_DEVTOOLS_GLOBAL_HOOK__)
    ) {
      return 'mobile';
    }
    
    // Tertiary check: Web-specific APIs that don't exist in React Native
    if (
      typeof window !== 'undefined' && 
      typeof document !== 'undefined' && 
      typeof window.localStorage !== 'undefined'
    ) {
      return 'web';
    }
    
    // Default to web platform if detection is inconclusive
    // This is a safer default for SSR environments
    return 'web';
  } catch (error) {
    // If any error occurs during detection, default to web
    console.warn('Platform detection failed, defaulting to web:', error);
    return 'web';
  }
};

/**
 * Storage interface that defines the methods available for both platforms
 */
interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<string[]>;
}

/**
 * Web storage implementation using localStorage
 */
class WebStorage implements StorageInterface {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // Handle QuotaExceededError
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Attempting to free space...');
        this.handleStorageFullError();
        // Try again after cleanup
        try {
          localStorage.setItem(key, value);
        } catch (retryError) {
          console.error(`Failed to set item ${key} after cleanup:`, retryError);
          throw retryError;
        }
      } else {
        console.error(`Error setting item ${key} in localStorage:`, error);
        throw error;
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting all keys from localStorage:', error);
      return [];
    }
  }

  /**
   * Handles storage full error by removing least recently used items
   */
  private handleStorageFullError(): void {
    try {
      // Get all keys and sort by last access time if available
      // For simplicity, we'll just remove the first few items
      const keys = Object.keys(localStorage);
      if (keys.length > 5) {
        // Remove oldest 20% of items
        const itemsToRemove = Math.max(1, Math.floor(keys.length * 0.2));
        for (let i = 0; i < itemsToRemove; i++) {
          localStorage.removeItem(keys[i]);
        }
      }
    } catch (error) {
      console.error('Error handling storage full condition:', error);
    }
  }
}

/**
 * Mobile storage implementation using AsyncStorage
 * This is loaded dynamically to prevent bundling issues on web
 */
class MobileStorage implements StorageInterface {
  private asyncStorage: any;

  constructor() {
    // Dynamic import to prevent bundling issues
    try {
      // In a real implementation, we would use dynamic import
      // but for simplicity, we'll use require here
      this.asyncStorage = require('@react-native-async-storage/async-storage').default;
    } catch (error) {
      console.error('Failed to load AsyncStorage:', error);
      throw new Error('AsyncStorage is required for mobile storage');
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.asyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key} from AsyncStorage:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.asyncStorage.setItem(key, value);
    } catch (error) {
      // Handle storage full error
      if (error instanceof Error && error.message.includes('storage_full')) {
        console.error('AsyncStorage is full. Attempting to free space...');
        await this.handleStorageFullError();
        // Try again after cleanup
        try {
          await this.asyncStorage.setItem(key, value);
        } catch (retryError) {
          console.error(`Failed to set item ${key} after cleanup:`, retryError);
          throw retryError;
        }
      } else {
        console.error(`Error setting item ${key} in AsyncStorage:`, error);
        throw error;
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.asyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from AsyncStorage:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.asyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      throw error;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await this.asyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys from AsyncStorage:', error);
      return [];
    }
  }

  /**
   * Handles storage full error by removing least recently used items
   */
  private async handleStorageFullError(): Promise<void> {
    try {
      // Get all keys
      const keys = await this.asyncStorage.getAllKeys();
      if (keys.length > 5) {
        // Remove oldest 20% of items
        const itemsToRemove = Math.max(1, Math.floor(keys.length * 0.2));
        const keysToRemove = keys.slice(0, itemsToRemove);
        await this.asyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.error('Error handling storage full condition:', error);
    }
  }
}

/**
 * Creates a storage instance based on the detected platform
 */
const createStorage = (): StorageInterface => {
  const platform = detectPlatform();
  
  if (platform === 'web') {
    return new WebStorage();
  } else {
    return new MobileStorage();
  }
};

/**
 * Hook return type
 */
interface UseStorageReturn<T> {
  value: T | null;
  setValue: (value: T | null) => Promise<void>;
  removeValue: () => Promise<void>;
  error: Error | null;
  isLoading: boolean;
}

/**
 * useStorage hook for persisting and retrieving data
 * 
 * @param key - The storage key to use
 * @param initialValue - Optional initial value to use if no value is stored
 * @returns Object with value, setValue, removeValue, error, and isLoading
 */
function useStorage<T>(key: string, initialValue: T | null = null): UseStorageReturn<T> {
  // Create storage instance
  const storage = createStorage();
  
  // State for the stored value, error, and loading status
  const [value, setValueState] = useState<T | null>(initialValue);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Load the value from storage on mount
   */
  useEffect(() => {
    const loadValue = async () => {
      try {
        setIsLoading(true);
        const storedValue = await storage.getItem(key);
        
        if (storedValue !== null) {
          try {
            // Parse the stored JSON string
            const parsedValue = JSON.parse(storedValue) as T;
            setValueState(parsedValue);
          } catch (parseError) {
            console.error(`Error parsing stored value for key ${key}:`, parseError);
            setError(new Error(`Failed to parse stored value: ${parseError.message}`));
            setValueState(initialValue);
          }
        } else {
          setValueState(initialValue);
        }
      } catch (loadError) {
        console.error(`Error loading value for key ${key}:`, loadError);
        setError(new Error(`Failed to load value: ${loadError.message}`));
        setValueState(initialValue);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key, initialValue]);

  /**
   * Set a new value in storage
   */
  const setValue = useCallback(async (newValue: T | null): Promise<void> => {
    try {
      setError(null);
      
      if (newValue === null) {
        await storage.removeItem(key);
        setValueState(null);
      } else {
        // Convert value to JSON string
        const valueToStore = JSON.stringify(newValue);
        await storage.setItem(key, valueToStore);
        setValueState(newValue);
      }
    } catch (setError) {
      console.error(`Error setting value for key ${key}:`, setError);
      setError(new Error(`Failed to save value: ${setError.message}`));
    }
  }, [key]);

  /**
   * Remove the value from storage
   */
  const removeValue = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await storage.removeItem(key);
      setValueState(null);
    } catch (removeError) {
      console.error(`Error removing value for key ${key}:`, removeError);
      setError(new Error(`Failed to remove value: ${removeError.message}`));
    }
  }, [key]);

  return { value, setValue, removeValue, error, isLoading };
}

export default useStorage;