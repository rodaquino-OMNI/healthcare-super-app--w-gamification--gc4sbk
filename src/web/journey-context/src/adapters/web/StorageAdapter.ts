import { IJourneyStorage, StorageOptions, StorageResult } from '../../storage/interface';
import { StorageError, StorageErrorType } from '../../storage/types';

/**
 * Maximum size for localStorage items in bytes
 * Most browsers limit localStorage to 5MB total, but individual items have lower limits
 */
const MAX_ITEM_SIZE = 2 * 1024 * 1024; // 2MB

/**
 * Web-specific storage adapter that uses localStorage with enhanced error handling
 * and cross-tab synchronization capabilities.
 */
export class StorageAdapter implements IJourneyStorage {
  private listeners: Map<string, Set<(value: any) => void>> = new Map();
  
  constructor() {
    // Set up storage event listener for cross-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  /**
   * Handles storage events from other tabs to synchronize state
   */
  private handleStorageEvent = (event: StorageEvent) => {
    if (!event.key || !event.newValue) return;
    
    // Notify all listeners for this key
    const keyListeners = this.listeners.get(event.key);
    if (keyListeners) {
      try {
        const parsedValue = JSON.parse(event.newValue);
        keyListeners.forEach(listener => {
          try {
            listener(parsedValue.value);
          } catch (error) {
            console.error(`Error in storage listener for key ${event.key}:`, error);
          }
        });
      } catch (error) {
        console.error(`Error parsing storage event value for key ${event.key}:`, error);
      }
    }
  };

  /**
   * Subscribes to changes for a specific storage key
   * @param key The storage key to subscribe to
   * @param listener Callback function that receives the updated value
   * @returns Unsubscribe function
   */
  public subscribe(key: string, listener: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    const keyListeners = this.listeners.get(key)!;
    keyListeners.add(listener);
    
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Stores a value in localStorage with proper serialization and error handling
   * @param key The storage key
   * @param value The value to store
   * @param options Storage options including expiration
   * @returns Promise resolving to a StorageResult
   */
  public async setItem<T>(key: string, value: T, options?: StorageOptions): Promise<StorageResult<T>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: {
          type: StorageErrorType.ENVIRONMENT_ERROR,
          message: 'localStorage is not available in this environment',
          key
        }
      };
    }

    try {
      // Create storage object with value and metadata
      const storageItem = {
        value,
        timestamp: Date.now(),
        expiration: options?.expiration ? Date.now() + options.expiration : null,
        version: options?.version || 1
      };

      // Serialize the storage item
      const serialized = JSON.stringify(storageItem);
      
      // Check if the serialized data exceeds the maximum size
      if (serialized.length > MAX_ITEM_SIZE) {
        return {
          success: false,
          error: {
            type: StorageErrorType.QUOTA_EXCEEDED,
            message: `Storage item exceeds maximum size of ${MAX_ITEM_SIZE} bytes`,
            key
          }
        };
      }

      // Attempt to store the item
      try {
        localStorage.setItem(key, serialized);
        return { success: true, data: value };
      } catch (error) {
        // Handle quota exceeded errors
        if (this.isQuotaExceededError(error)) {
          // Attempt to free up space by removing expired items
          this.clearExpiredItems();
          
          // Try again after cleanup
          try {
            localStorage.setItem(key, serialized);
            return { success: true, data: value };
          } catch (retryError) {
            // If still failing, return quota exceeded error
            return {
              success: false,
              error: {
                type: StorageErrorType.QUOTA_EXCEEDED,
                message: 'Storage quota exceeded even after cleanup',
                key,
                originalError: retryError
              }
            };
          }
        }
        
        // Handle other errors
        return {
          success: false,
          error: {
            type: StorageErrorType.WRITE_ERROR,
            message: 'Failed to write to localStorage',
            key,
            originalError: error
          }
        };
      }
    } catch (error) {
      // Handle serialization errors
      return {
        success: false,
        error: {
          type: StorageErrorType.SERIALIZATION_ERROR,
          message: 'Failed to serialize data',
          key,
          originalError: error
        }
      };
    }
  }

  /**
   * Retrieves a value from localStorage with proper deserialization and error handling
   * @param key The storage key
   * @param options Storage options
   * @returns Promise resolving to a StorageResult
   */
  public async getItem<T>(key: string, options?: StorageOptions): Promise<StorageResult<T>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: {
          type: StorageErrorType.ENVIRONMENT_ERROR,
          message: 'localStorage is not available in this environment',
          key
        }
      };
    }

    try {
      const serialized = localStorage.getItem(key);
      
      if (serialized === null) {
        return {
          success: false,
          error: {
            type: StorageErrorType.NOT_FOUND,
            message: 'Item not found in storage',
            key
          }
        };
      }

      try {
        const storageItem = JSON.parse(serialized);
        
        // Check if the item has expired
        if (storageItem.expiration && storageItem.expiration < Date.now()) {
          // Remove the expired item
          localStorage.removeItem(key);
          
          return {
            success: false,
            error: {
              type: StorageErrorType.EXPIRED,
              message: 'Storage item has expired',
              key
            }
          };
        }

        // Handle data migration if version doesn't match
        if (options?.version && storageItem.version !== options.version) {
          if (options.migrate) {
            try {
              // Attempt to migrate the data
              const migratedValue = options.migrate(storageItem.value, storageItem.version);
              
              // Store the migrated data with the new version
              await this.setItem(key, migratedValue, {
                ...options,
                version: options.version
              });
              
              return { success: true, data: migratedValue as T };
            } catch (migrationError) {
              return {
                success: false,
                error: {
                  type: StorageErrorType.MIGRATION_ERROR,
                  message: 'Failed to migrate data to new version',
                  key,
                  originalError: migrationError
                }
              };
            }
          } else {
            // No migration function provided, return version mismatch error
            return {
              success: false,
              error: {
                type: StorageErrorType.VERSION_MISMATCH,
                message: `Storage item version (${storageItem.version}) doesn't match expected version (${options.version})`,
                key
              }
            };
          }
        }

        return { success: true, data: storageItem.value as T };
      } catch (parseError) {
        // Handle corrupted data
        return {
          success: false,
          error: {
            type: StorageErrorType.DESERIALIZATION_ERROR,
            message: 'Failed to parse stored data',
            key,
            originalError: parseError
          }
        };
      }
    } catch (error) {
      // Handle other errors
      return {
        success: false,
        error: {
          type: StorageErrorType.READ_ERROR,
          message: 'Failed to read from localStorage',
          key,
          originalError: error
        }
      };
    }
  }

  /**
   * Removes an item from localStorage with error handling
   * @param key The storage key
   * @returns Promise resolving to a StorageResult
   */
  public async removeItem(key: string): Promise<StorageResult<void>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: {
          type: StorageErrorType.ENVIRONMENT_ERROR,
          message: 'localStorage is not available in this environment',
          key
        }
      };
    }

    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          type: StorageErrorType.DELETE_ERROR,
          message: 'Failed to remove item from localStorage',
          key,
          originalError: error
        }
      };
    }
  }

  /**
   * Clears all items from localStorage with error handling
   * @returns Promise resolving to a StorageResult
   */
  public async clear(): Promise<StorageResult<void>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: {
          type: StorageErrorType.ENVIRONMENT_ERROR,
          message: 'localStorage is not available in this environment',
          key: 'all'
        }
      };
    }

    try {
      localStorage.clear();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          type: StorageErrorType.DELETE_ERROR,
          message: 'Failed to clear localStorage',
          key: 'all',
          originalError: error
        }
      };
    }
  }

  /**
   * Gets all keys in localStorage with a specific prefix
   * @param prefix The key prefix to filter by
   * @returns Promise resolving to a StorageResult with an array of keys
   */
  public async getAllKeys(prefix?: string): Promise<StorageResult<string[]>> {
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: {
          type: StorageErrorType.ENVIRONMENT_ERROR,
          message: 'localStorage is not available in this environment',
          key: 'all'
        }
      };
    }

    try {
      const keys: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (!prefix || key.startsWith(prefix))) {
          keys.push(key);
        }
      }
      
      return { success: true, data: keys };
    } catch (error) {
      return {
        success: false,
        error: {
          type: StorageErrorType.READ_ERROR,
          message: 'Failed to get keys from localStorage',
          key: 'all',
          originalError: error
        }
      };
    }
  }

  /**
   * Checks if an error is a quota exceeded error
   * @param error The error to check
   * @returns True if the error is a quota exceeded error
   */
  private isQuotaExceededError(error: any): boolean {
    return (
      error instanceof DOMException &&
      // Firefox
      (error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
       // Chrome
       error.name === 'QuotaExceededError' ||
       // Safari
       error.name === 'QUOTA_EXCEEDED_ERR' ||
       // Generic fallback
       error.code === 22 ||
       error.code === 1014 ||
       // Also check the error message as a last resort
       error.message?.includes('quota') ||
       error.message?.includes('storage') ||
       error.message?.includes('limit'))
    );
  }

  /**
   * Clears all expired items from localStorage to free up space
   */
  private clearExpiredItems(): void {
    try {
      const keysToRemove: string[] = [];
      
      // Find all expired items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        try {
          const serialized = localStorage.getItem(key);
          if (!serialized) continue;
          
          const storageItem = JSON.parse(serialized);
          
          // Check if the item has an expiration and has expired
          if (storageItem.expiration && storageItem.expiration < Date.now()) {
            keysToRemove.push(key);
          }
        } catch (error) {
          // Skip items that can't be parsed
          console.error(`Error checking expiration for key ${key}:`, error);
        }
      }
      
      // Remove all expired items
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error(`Error removing expired key ${key}:`, error);
        }
      });
      
      console.log(`Cleared ${keysToRemove.length} expired items from localStorage`);
    } catch (error) {
      console.error('Error clearing expired items:', error);
    }
  }

  /**
   * Cleanup method to remove event listeners
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    this.listeners.clear();
  }
}

export default StorageAdapter;