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
   * Expiration time in milliseconds from now
   * If provided, the stored data will be considered expired after this time
   */
  expiresIn?: number;

  /**
   * Absolute expiration timestamp in milliseconds (from epoch)
   * Takes precedence over expiresIn if both are provided
   */
  expiresAt?: number;

  /**
   * Whether to encrypt the stored data
   * Note: Implementation details of encryption are platform-specific
   */
  encrypt?: boolean;

  /**
   * Whether to use session storage instead of persistent storage
   * On web, this uses sessionStorage instead of localStorage
   * On mobile, this is ignored as AsyncStorage is always persistent
   */
  session?: boolean;
}

/**
 * Core interface for platform-agnostic storage operations
 * Implementations should handle platform-specific storage mechanisms
 * while providing a consistent API for both web and mobile platforms
 */
export interface IJourneyStorage {
  /**
   * Store data with the given key
   * @param key - Unique identifier for the stored data
   * @param data - Data to store (will be serialized)
   * @param options - Optional configuration for storage behavior
   * @returns Promise that resolves when storage is complete
   * @throws Error if storage operation fails
   */
  set<T>(key: string, data: T, options?: StorageOptions): Promise<void>;

  /**
   * Retrieve data for the given key
   * @param key - Unique identifier for the stored data
   * @returns Promise that resolves with the stored data, or null if not found or expired
   * @throws Error if retrieval operation fails
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Remove data for the given key
   * @param key - Unique identifier for the stored data
   * @returns Promise that resolves when removal is complete
   * @throws Error if removal operation fails
   */
  remove(key: string): Promise<void>;

  /**
   * Check if data exists for the given key and is not expired
   * @param key - Unique identifier for the stored data
   * @returns Promise that resolves with boolean indicating existence
   * @throws Error if check operation fails
   */
  has(key: string): Promise<boolean>;

  /**
   * Clear all stored data managed by this storage instance
   * @returns Promise that resolves when clear operation is complete
   * @throws Error if clear operation fails
   */
  clear(): Promise<void>;

  /**
   * Get all keys currently in storage
   * @returns Promise that resolves with array of keys
   * @throws Error if operation fails
   */
  keys(): Promise<string[]>;

  /**
   * Get multiple items at once
   * @param keys - Array of keys to retrieve
   * @returns Promise that resolves with map of key-value pairs (null for missing/expired items)
   * @throws Error if operation fails
   */
  multiGet<T>(keys: string[]): Promise<Map<string, T | null>>;

  /**
   * Store multiple items at once
   * @param items - Map of key-value pairs to store
   * @param options - Optional configuration for storage behavior
   * @returns Promise that resolves when storage is complete
   * @throws Error if operation fails
   */
  multiSet<T>(items: Map<string, T>, options?: StorageOptions): Promise<void>;

  /**
   * Remove multiple items at once
   * @param keys - Array of keys to remove
   * @returns Promise that resolves when removal is complete
   * @throws Error if operation fails
   */
  multiRemove(keys: string[]): Promise<void>;
}