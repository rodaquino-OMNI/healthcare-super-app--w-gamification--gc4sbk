/**
 * @file Web Journey Storage Implementation
 * @description Implements the IJourneyStorage interface for web browsers using localStorage and sessionStorage
 */

import { StorageOptions, StorageResult, StorageError, StorageValue } from './types';
import { IJourneyStorage } from './interface';

/**
 * Web-specific storage implementation options
 */
export interface WebStorageOptions extends StorageOptions {
  /**
   * Use sessionStorage instead of localStorage for all operations
   * @default false
   */
  useSessionStorage?: boolean;

  /**
   * Default expiration time in milliseconds for items that don't specify their own
   * @default undefined (no expiration)
   */
  defaultExpirationMs?: number;
}

/**
 * Internal structure for stored items with metadata
 */
interface StoredItem<T = any> {
  /**
   * The actual data being stored
   */
  data: T;

  /**
   * Optional expiration timestamp in milliseconds since epoch
   */
  expiresAt?: number;

  /**
   * Timestamp when the item was stored
   */
  storedAt: number;
}

/**
 * Implementation of IJourneyStorage for web browsers using localStorage/sessionStorage
 */
export class WebJourneyStorage implements IJourneyStorage {
  private storage: Storage;
  private options: WebStorageOptions;

  /**
   * Creates a new WebJourneyStorage instance
   * @param options Configuration options
   */
  constructor(options: WebStorageOptions = {}) {
    this.options = {
      useSessionStorage: false,
      ...options
    };

    // Determine which storage to use based on options and availability
    if (typeof window === 'undefined') {
      throw new Error('WebJourneyStorage requires a browser environment with window object');
    }

    try {
      // Use the specified storage or fall back to localStorage
      this.storage = this.options.useSessionStorage ? window.sessionStorage : window.localStorage;
      
      // Verify storage is working by testing a write/read operation
      const testKey = `__storage_test_${Date.now()}`;
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
    } catch (error) {
      console.error('Storage not available:', error);
      throw new Error('Web storage is not available in this browser environment');
    }
  }

  /**
   * Stores a value with the specified key
   * @param key The key to store the value under
   * @param value The value to store
   * @param options Storage options including expiration
   * @returns A promise that resolves with the result of the operation
   */
  async set<T>(key: string, value: T, options?: StorageOptions): Promise<StorageResult<T>> {
    try {
      // Create the stored item with metadata
      const storedItem: StoredItem<T> = {
        data: value,
        storedAt: Date.now()
      };

      // Set expiration if specified in options or constructor
      const expirationMs = options?.expirationMs ?? this.options.defaultExpirationMs;
      if (expirationMs) {
        storedItem.expiresAt = Date.now() + expirationMs;
      }

      // Serialize and store the item
      const serialized = JSON.stringify(storedItem);
      this.storage.setItem(key, serialized);

      return {
        success: true,
        data: value
      };
    } catch (error) {
      // Handle storage errors (e.g., quota exceeded)
      const storageError: StorageError = {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown storage error',
        originalError: error
      };

      console.error(`Failed to store item with key '${key}':`, error);
      
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Retrieves a value by key
   * @param key The key to retrieve
   * @returns A promise that resolves with the result of the operation
   */
  async get<T>(key: string): Promise<StorageResult<T>> {
    try {
      // Get the serialized item from storage
      const serialized = this.storage.getItem(key);
      
      // If the key doesn't exist, return null
      if (serialized === null) {
        return {
          success: true,
          data: null as unknown as T
        };
      }

      // Parse the stored item
      const storedItem = JSON.parse(serialized) as StoredItem<T>;
      
      // Check if the item has expired
      if (storedItem.expiresAt && storedItem.expiresAt < Date.now()) {
        // Remove the expired item
        this.storage.removeItem(key);
        
        return {
          success: true,
          data: null as unknown as T
        };
      }

      // Return the data
      return {
        success: true,
        data: storedItem.data
      };
    } catch (error) {
      // Handle parsing errors
      const storageError: StorageError = {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown storage error',
        originalError: error
      };

      console.error(`Failed to retrieve item with key '${key}':`, error);
      
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Removes a value by key
   * @param key The key to remove
   * @returns A promise that resolves with the result of the operation
   */
  async remove(key: string): Promise<StorageResult<void>> {
    try {
      this.storage.removeItem(key);
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      // Handle storage errors
      const storageError: StorageError = {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown storage error',
        originalError: error
      };

      console.error(`Failed to remove item with key '${key}':`, error);
      
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Checks if a key exists in storage
   * @param key The key to check
   * @returns A promise that resolves with a boolean indicating if the key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      // Get the serialized item from storage
      const serialized = this.storage.getItem(key);
      
      // If the key doesn't exist, return false
      if (serialized === null) {
        return false;
      }

      // Parse the stored item to check expiration
      const storedItem = JSON.parse(serialized) as StoredItem;
      
      // Check if the item has expired
      if (storedItem.expiresAt && storedItem.expiresAt < Date.now()) {
        // Remove the expired item
        this.storage.removeItem(key);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error checking if key '${key}' exists:`, error);
      return false;
    }
  }

  /**
   * Clears all stored values
   * @returns A promise that resolves with the result of the operation
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      this.storage.clear();
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      // Handle storage errors
      const storageError: StorageError = {
        code: 'STORAGE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown storage error',
        originalError: error
      };

      console.error('Failed to clear storage:', error);
      
      return {
        success: false,
        error: storageError
      };
    }
  }

  /**
   * Gets all keys in storage
   * @returns A promise that resolves with an array of keys
   */
  async keys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      
      // Iterate through all keys in storage
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key !== null) {
          keys.push(key);
        }
      }
      
      return keys;
    } catch (error) {
      console.error('Failed to get storage keys:', error);
      return [];
    }
  }

  /**
   * Removes all expired items from storage
   * @returns A promise that resolves with the number of items removed
   */
  async cleanExpired(): Promise<number> {
    try {
      const keys = await this.keys();
      let removedCount = 0;
      
      // Check each key for expiration
      for (const key of keys) {
        const serialized = this.storage.getItem(key);
        
        if (serialized !== null) {
          try {
            const storedItem = JSON.parse(serialized) as StoredItem;
            
            // Remove if expired
            if (storedItem.expiresAt && storedItem.expiresAt < Date.now()) {
              this.storage.removeItem(key);
              removedCount++;
            }
          } catch (parseError) {
            // Skip items that can't be parsed
            console.warn(`Could not parse stored item with key '${key}':`, parseError);
          }
        }
      }
      
      return removedCount;
    } catch (error) {
      console.error('Failed to clean expired items:', error);
      return 0;
    }
  }

  /**
   * Gets the size of all stored data in bytes
   * @returns A promise that resolves with the size in bytes
   */
  async getSize(): Promise<number> {
    try {
      let totalSize = 0;
      
      // Calculate size of all items
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        
        if (key !== null) {
          const value = this.storage.getItem(key) || '';
          // Each character in JS is 2 bytes (UTF-16)
          totalSize += (key.length + value.length) * 2;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  }

  /**
   * Checks if web storage is available in the current environment
   * @returns True if storage is available, false otherwise
   */
  static isAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      // Try to use localStorage as a test
      const testKey = `__storage_test_${Date.now()}`;
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default WebJourneyStorage;