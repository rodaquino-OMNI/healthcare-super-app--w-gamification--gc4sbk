/**
 * @file interface.ts
 * @description Defines the core abstraction layer for persistent storage operations
 * that is platform-agnostic, enabling consistent data persistence across both web
 * and mobile applications.
 */

/**
 * Options for configuring storage behavior
 */
export interface StorageOptions {
  /**
   * Optional expiration time in milliseconds
   * If provided, the stored data will be considered expired after this duration
   */
  expireAfter?: number;

  /**
   * Whether to encrypt the stored data
   * Note: Implementation details of encryption are platform-specific
   */
  encrypt?: boolean;

  /**
   * Whether to use session storage instead of persistent storage
   * On web, this uses sessionStorage instead of localStorage
   * On mobile, this is implementation-specific
   */
  useSessionStorage?: boolean;

  /**
   * Optional journey identifier to namespace the storage
   * Helps isolate data between different journeys
   */
  journeyId?: 'health' | 'care' | 'plan';
}

/**
 * Core interface for platform-agnostic storage operations
 * Implementations should handle platform-specific details while
 * maintaining this consistent API across platforms
 */
export interface IJourneyStorage {
  /**
   * Store data with the given key
   * @param key - The key to store the data under
   * @param data - The data to store (will be serialized)
   * @param options - Optional configuration for the storage operation
   * @returns A promise that resolves when the operation is complete
   * @throws If the storage operation fails
   */
  setItem<T>(key: string, data: T, options?: StorageOptions): Promise<void>;

  /**
   * Retrieve data for the given key
   * @param key - The key to retrieve data for
   * @param defaultValue - Optional default value if the key doesn't exist
   * @returns A promise that resolves with the retrieved data, or defaultValue if not found
   * @throws If the retrieval operation fails
   */
  getItem<T>(key: string, defaultValue?: T): Promise<T | null>;

  /**
   * Remove data for the given key
   * @param key - The key to remove data for
   * @returns A promise that resolves when the operation is complete
   * @throws If the removal operation fails
   */
  removeItem(key: string): Promise<void>;

  /**
   * Check if data exists for the given key
   * @param key - The key to check
   * @returns A promise that resolves with true if the key exists, false otherwise
   * @throws If the check operation fails
   */
  hasItem(key: string): Promise<boolean>;

  /**
   * Clear all stored data
   * @param options - Optional configuration for the clear operation
   * @returns A promise that resolves when the operation is complete
   * @throws If the clear operation fails
   */
  clear(options?: { journeyId?: 'health' | 'care' | 'plan' }): Promise<void>;

  /**
   * Get all keys that match a certain pattern
   * @param pattern - Optional pattern to match keys against
   * @returns A promise that resolves with an array of matching keys
   * @throws If the operation fails
   */
  getAllKeys(pattern?: string): Promise<string[]>;

  /**
   * Remove all expired items from storage
   * @returns A promise that resolves with the number of items removed
   * @throws If the cleanup operation fails
   */
  removeExpiredItems(): Promise<number>;
}