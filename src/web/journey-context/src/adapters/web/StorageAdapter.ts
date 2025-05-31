/**
 * Web Storage Adapter
 * 
 * A comprehensive localStorage wrapper with error handling for web storage operations.
 * Provides a unified interface for storing and retrieving serialized data with
 * automatic error recovery, storage limit detection, and cross-tab synchronization.
 */

/**
 * Storage operation result interface
 * Represents the result of a storage operation with success status and optional error
 */
export interface StorageResult<T = unknown> {
  /** Whether the operation was successful */
  success: boolean;
  /** The data retrieved from storage (for get operations) */
  data?: T;
  /** Error message if the operation failed */
  error?: string;
  /** Whether the error was due to storage quota being exceeded */
  quotaExceeded?: boolean;
}

/**
 * Storage migration handler function type
 * Used to migrate data from one schema version to another
 */
export type MigrationHandler<T> = (oldData: any, oldVersion: number, newVersion: number) => T;

/**
 * Storage options interface
 * Configuration options for storage operations
 */
export interface StorageOptions<T> {
  /** Schema version for data migration */
  schemaVersion?: number;
  /** Migration handler for schema version changes */
  migrationHandler?: MigrationHandler<T>;
  /** Whether to enable cross-tab synchronization */
  enableSync?: boolean;
  /** Custom serialization function */
  serialize?: (data: T) => string;
  /** Custom deserialization function */
  deserialize?: (data: string) => T;
}

/**
 * Default storage options
 */
const DEFAULT_OPTIONS: StorageOptions<any> = {
  schemaVersion: 1,
  enableSync: true,
  serialize: (data: any) => JSON.stringify(data),
  deserialize: (data: string) => JSON.parse(data),
};

/**
 * Web Storage Adapter class
 * Provides methods for interacting with localStorage with comprehensive error handling
 */
export class StorageAdapter {
  private readonly prefix: string;
  private readonly fallbackStorage: Map<string, string>;
  private readonly listeners: Map<string, Set<(data: any) => void>>;
  private readonly options: StorageOptions<any>;
  private storageAvailable: boolean;

  /**
   * Creates a new StorageAdapter instance
   * @param prefix - Prefix for all storage keys to avoid collisions
   * @param options - Configuration options
   */
  constructor(prefix: string = 'austa_', options: StorageOptions<any> = {}) {
    this.prefix = prefix;
    this.fallbackStorage = new Map<string, string>();
    this.listeners = new Map<string, Set<(data: any) => void>>();
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.storageAvailable = this.checkStorageAvailability();

    // Set up storage event listener for cross-tab synchronization
    if (this.options.enableSync && typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  /**
   * Checks if localStorage is available and working
   * @returns Whether localStorage is available
   */
  private checkStorageAvailability(): boolean {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return false;
    }

    try {
      const testKey = `${this.prefix}storage_test`;
      localStorage.setItem(testKey, 'test');
      const result = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return result === 'test';
    } catch (error) {
      return false;
    }
  }

  /**
   * Handles storage events for cross-tab synchronization
   * @param event - Storage event
   */
  private handleStorageEvent = (event: StorageEvent): void => {
    if (!event.key || !event.newValue) return;

    // Check if the key belongs to our prefix
    if (event.key.startsWith(this.prefix)) {
      const key = event.key.substring(this.prefix.length);
      const listeners = this.listeners.get(key);

      if (listeners) {
        try {
          const data = this.options.deserialize!(event.newValue);
          listeners.forEach(listener => listener(data));
        } catch (error) {
          console.error(`Error processing storage event for key ${key}:`, error);
        }
      }
    }
  };

  /**
   * Gets the full storage key with prefix
   * @param key - The base key
   * @returns The prefixed key
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Retrieves data from storage
   * @param key - The key to retrieve
   * @param options - Storage options
   * @returns Storage operation result
   */
  public get<T>(key: string, options?: StorageOptions<T>): StorageResult<T> {
    const mergedOptions = { ...this.options, ...options };
    const fullKey = this.getFullKey(key);

    try {
      let rawData: string | null = null;

      // Try to get from localStorage first
      if (this.storageAvailable) {
        rawData = localStorage.getItem(fullKey);
      }

      // Fall back to in-memory storage if necessary
      if (rawData === null && this.fallbackStorage.has(fullKey)) {
        rawData = this.fallbackStorage.get(fullKey) || null;
      }

      // Return empty result if no data found
      if (rawData === null) {
        return { success: true, data: undefined };
      }

      // Parse the stored data which includes version information
      const parsedData = JSON.parse(rawData);
      const storedVersion = parsedData.__schemaVersion || 1;
      const currentVersion = mergedOptions.schemaVersion || 1;

      // Check if migration is needed
      if (storedVersion !== currentVersion && mergedOptions.migrationHandler) {
        const migratedData = mergedOptions.migrationHandler(
          parsedData.data,
          storedVersion,
          currentVersion
        );

        // Return the migrated data
        return { success: true, data: migratedData };
      }

      // Return the data without migration
      return { success: true, data: parsedData.data };
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during data retrieval',
      };
    }
  }

  /**
   * Stores data in storage
   * @param key - The key to store under
   * @param data - The data to store
   * @param options - Storage options
   * @returns Storage operation result
   */
  public set<T>(key: string, data: T, options?: StorageOptions<T>): StorageResult<T> {
    const mergedOptions = { ...this.options, ...options };
    const fullKey = this.getFullKey(key);

    try {
      // Prepare data with schema version
      const storageData = {
        __schemaVersion: mergedOptions.schemaVersion || 1,
        data,
      };

      // Serialize the data
      const serializedData = JSON.stringify(storageData);

      // Try to store in localStorage
      if (this.storageAvailable) {
        try {
          localStorage.setItem(fullKey, serializedData);
          // Clear from fallback if it exists there
          if (this.fallbackStorage.has(fullKey)) {
            this.fallbackStorage.delete(fullKey);
          }
          return { success: true, data };
        } catch (error) {
          // Check if it's a quota exceeded error
          const isQuotaExceeded = (
            error instanceof DOMException &&
            (error.code === 22 || // Chrome
              error.code === 1014 || // Firefox
              error.name === 'QuotaExceededError' || // Safari
              error.name === 'NS_ERROR_DOM_QUOTA_REACHED') // Firefox
          );

          if (isQuotaExceeded) {
            console.warn(`Storage quota exceeded for key ${key}, using fallback storage`);
            // Use fallback storage
            this.fallbackStorage.set(fullKey, serializedData);
            return { success: true, data, quotaExceeded: true };
          }

          throw error; // Re-throw if it's not a quota error
        }
      } else {
        // Use fallback storage directly if localStorage is not available
        this.fallbackStorage.set(fullKey, serializedData);
        return { success: true, data };
      }
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during data storage',
      };
    }
  }

  /**
   * Removes data from storage
   * @param key - The key to remove
   * @returns Storage operation result
   */
  public remove(key: string): StorageResult<void> {
    const fullKey = this.getFullKey(key);

    try {
      // Remove from localStorage if available
      if (this.storageAvailable) {
        localStorage.removeItem(fullKey);
      }

      // Remove from fallback storage if it exists there
      if (this.fallbackStorage.has(fullKey)) {
        this.fallbackStorage.delete(fullKey);
      }

      return { success: true };
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during data removal',
      };
    }
  }

  /**
   * Clears all data with the current prefix from storage
   * @returns Storage operation result
   */
  public clear(): StorageResult<void> {
    try {
      // Clear from localStorage if available
      if (this.storageAvailable) {
        // Only remove items with our prefix
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        }
      }

      // Clear all from fallback storage
      for (const key of this.fallbackStorage.keys()) {
        if (key.startsWith(this.prefix)) {
          this.fallbackStorage.delete(key);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error clearing storage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during storage clearing',
      };
    }
  }

  /**
   * Subscribes to changes for a specific key
   * @param key - The key to subscribe to
   * @param listener - The callback function to call when the value changes
   * @returns Unsubscribe function
   */
  public subscribe<T>(key: string, listener: (data: T | undefined) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    const listeners = this.listeners.get(key)!;
    listeners.add(listener as any);

    // Return unsubscribe function
    return () => {
      const listenerSet = this.listeners.get(key);
      if (listenerSet) {
        listenerSet.delete(listener as any);
        if (listenerSet.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Checks if a key exists in storage
   * @param key - The key to check
   * @returns Whether the key exists
   */
  public has(key: string): boolean {
    const fullKey = this.getFullKey(key);

    // Check localStorage if available
    if (this.storageAvailable) {
      const item = localStorage.getItem(fullKey);
      if (item !== null) {
        return true;
      }
    }

    // Check fallback storage
    return this.fallbackStorage.has(fullKey);
  }

  /**
   * Gets all keys in storage with the current prefix
   * @returns Array of keys
   */
  public keys(): string[] {
    const keys = new Set<string>();

    // Get keys from localStorage if available
    if (this.storageAvailable) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.add(key.substring(this.prefix.length));
        }
      }
    }

    // Get keys from fallback storage
    for (const key of this.fallbackStorage.keys()) {
      if (key.startsWith(this.prefix)) {
        keys.add(key.substring(this.prefix.length));
      }
    }

    return Array.from(keys);
  }

  /**
   * Cleans up event listeners when the adapter is no longer needed
   */
  public dispose(): void {
    if (this.options.enableSync && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    this.listeners.clear();
  }
}