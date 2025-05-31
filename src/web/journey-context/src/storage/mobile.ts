/**
 * @file Mobile Storage Implementation
 * @description Implements the IJourneyStorage interface for React Native mobile applications
 * using AsyncStorage with proper serialization, error handling, and mobile-specific optimizations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { IJourneyStorage, StorageOptions } from './interface';
import { StorageResult, StorageError, StorageValue } from './types';

/**
 * Default expiration time for stored items (24 hours in milliseconds)
 */
const DEFAULT_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Implementation of IJourneyStorage for React Native mobile applications
 * using AsyncStorage with proper serialization and error handling.
 */
export class MobileJourneyStorage implements IJourneyStorage {
  /**
   * Stores a value in AsyncStorage with the given key
   * @param key - The storage key
   * @param value - The value to store
   * @param options - Optional storage configuration
   * @returns A promise that resolves to a StorageResult
   */
  async set<T>(key: string, value: T, options?: StorageOptions): Promise<StorageResult<T>> {
    try {
      // Prepare the storage item with metadata
      const storageItem: StorageValue<T> = {
        value,
        timestamp: Date.now(),
        expiration: options?.expiration ?? DEFAULT_EXPIRATION,
      };

      // Serialize the storage item to a string
      const serializedItem = JSON.stringify(storageItem);

      // Store the serialized item in AsyncStorage
      await AsyncStorage.setItem(key, serializedItem);

      return {
        success: true,
        data: value,
      };
    } catch (error) {
      console.error(`[MobileJourneyStorage] Error storing value for key ${key}:`, error);
      return {
        success: false,
        error: {
          code: 'storage_set_error',
          message: `Failed to store value for key: ${key}`,
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Retrieves a value from AsyncStorage by key
   * @param key - The storage key
   * @returns A promise that resolves to a StorageResult
   */
  async get<T>(key: string): Promise<StorageResult<T>> {
    try {
      // Retrieve the serialized item from AsyncStorage
      const serializedItem = await AsyncStorage.getItem(key);

      // If no item exists for the key, return null
      if (serializedItem === null) {
        return {
          success: true,
          data: null as unknown as T,
        };
      }

      // Parse the serialized item
      const storageItem: StorageValue<T> = JSON.parse(serializedItem);

      // Check if the item has expired
      const now = Date.now();
      const expirationTime = storageItem.timestamp + storageItem.expiration;
      const isExpired = expirationTime < now;

      // If the item has expired, remove it and return null
      if (isExpired) {
        await this.remove(key);
        return {
          success: true,
          data: null as unknown as T,
        };
      }

      // Return the value
      return {
        success: true,
        data: storageItem.value,
      };
    } catch (error) {
      console.error(`[MobileJourneyStorage] Error retrieving value for key ${key}:`, error);
      return {
        success: false,
        error: {
          code: 'storage_get_error',
          message: `Failed to retrieve value for key: ${key}`,
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Removes a value from AsyncStorage by key
   * @param key - The storage key
   * @returns A promise that resolves to a StorageResult
   */
  async remove(key: string): Promise<StorageResult<void>> {
    try {
      await AsyncStorage.removeItem(key);
      return {
        success: true,
      };
    } catch (error) {
      console.error(`[MobileJourneyStorage] Error removing value for key ${key}:`, error);
      return {
        success: false,
        error: {
          code: 'storage_remove_error',
          message: `Failed to remove value for key: ${key}`,
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Checks if a key exists in AsyncStorage
   * @param key - The storage key
   * @returns A promise that resolves to a boolean indicating if the key exists
   */
  async has(key: string): Promise<boolean> {
    try {
      const result = await this.get(key);
      return result.success && result.data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clears all values from AsyncStorage with an optional prefix filter
   * @param prefix - Optional key prefix to limit which keys are cleared
   * @returns A promise that resolves to a StorageResult
   */
  async clear(prefix?: string): Promise<StorageResult<void>> {
    try {
      if (prefix) {
        // Get all keys from AsyncStorage
        const allKeys = await AsyncStorage.getAllKeys();
        
        // Filter keys that start with the prefix
        const keysToRemove = allKeys.filter(key => key.startsWith(prefix));
        
        // Remove the filtered keys
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
      } else {
        // Clear all keys if no prefix is provided
        await AsyncStorage.clear();
      }
      
      return {
        success: true,
      };
    } catch (error) {
      console.error(`[MobileJourneyStorage] Error clearing storage${prefix ? ` with prefix ${prefix}` : ''}:`, error);
      return {
        success: false,
        error: {
          code: 'storage_clear_error',
          message: `Failed to clear storage${prefix ? ` with prefix ${prefix}` : ''}`,
          details: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Gets all keys from AsyncStorage with an optional prefix filter
   * @param prefix - Optional key prefix to filter keys
   * @returns A promise that resolves to an array of keys
   */
  async getKeys(prefix?: string): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      if (prefix) {
        return allKeys.filter(key => key.startsWith(prefix));
      }
      
      return allKeys;
    } catch (error) {
      console.error(`[MobileJourneyStorage] Error getting keys${prefix ? ` with prefix ${prefix}` : ''}:`, error);
      return [];
    }
  }

  /**
   * Performs a cleanup of expired items in AsyncStorage
   * @param prefix - Optional key prefix to limit which keys are checked
   * @returns A promise that resolves to the number of removed items
   */
  async cleanupExpired(prefix?: string): Promise<number> {
    try {
      // Get all keys or keys with the specified prefix
      const keys = await this.getKeys(prefix);
      let removedCount = 0;

      // Check each key for expiration
      for (const key of keys) {
        try {
          const serializedItem = await AsyncStorage.getItem(key);
          
          if (serializedItem !== null) {
            const storageItem = JSON.parse(serializedItem) as StorageValue<unknown>;
            const now = Date.now();
            const expirationTime = storageItem.timestamp + storageItem.expiration;
            
            if (expirationTime < now) {
              await AsyncStorage.removeItem(key);
              removedCount++;
            }
          }
        } catch {
          // Skip keys that can't be parsed
          continue;
        }
      }

      return removedCount;
    } catch (error) {
      console.error(`[MobileJourneyStorage] Error cleaning up expired items:`, error);
      return 0;
    }
  }

  /**
   * Gets the total size of data stored in AsyncStorage (approximate)
   * @param prefix - Optional key prefix to limit which keys are included
   * @returns A promise that resolves to the approximate size in bytes
   */
  async getSize(prefix?: string): Promise<number> {
    try {
      const keys = await this.getKeys(prefix);
      let totalSize = 0;

      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            // Calculate size: key length + value length in bytes (approximate)
            totalSize += key.length + value.length;
          }
        } catch {
          // Skip keys that can't be retrieved
          continue;
        }
      }

      return totalSize;
    } catch (error) {
      console.error(`[MobileJourneyStorage] Error calculating storage size:`, error);
      return 0;
    }
  }
}

/**
 * Creates a new instance of MobileJourneyStorage
 * @returns A new MobileJourneyStorage instance
 */
export function createMobileStorage(): IJourneyStorage {
  return new MobileJourneyStorage();
}

export default MobileJourneyStorage;