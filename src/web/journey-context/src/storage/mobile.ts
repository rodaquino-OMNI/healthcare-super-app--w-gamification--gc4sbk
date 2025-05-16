/**
 * Mobile Journey Storage Implementation
 * 
 * This module implements the IJourneyStorage interface for React Native mobile applications
 * using AsyncStorage. It handles persisting, retrieving, and removing journey state with
 * proper serialization, error handling, and mobile-specific optimizations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage options interface
 * Will be imported from interface.ts when it's available
 */
interface StorageOptions {
  /** Time in milliseconds after which the stored item should expire */
  expireIn?: number;
  /** Whether to encrypt the stored data (not implemented in this version) */
  encrypt?: boolean;
}

/**
 * Journey Storage interface
 * Will be imported from interface.ts when it's available
 */
interface IJourneyStorage {
  /**
   * Store a value with the given key
   */
  setItem<T>(key: string, value: T, options?: StorageOptions): Promise<void>;
  
  /**
   * Retrieve a value for the given key
   */
  getItem<T>(key: string): Promise<T | null>;
  
  /**
   * Remove a value with the given key
   */
  removeItem(key: string): Promise<void>;
  
  /**
   * Check if a key exists in storage
   */
  hasItem(key: string): Promise<boolean>;
  
  /**
   * Clear all stored values
   */
  clear(): Promise<void>;
}

/**
 * Storage item wrapper that includes metadata like expiration
 */
interface StorageItem<T> {
  /** The actual data being stored */
  value: T;
  /** When the item was stored */
  timestamp: number;
  /** When the item should expire (if applicable) */
  expireAt?: number;
}

/**
 * Mobile implementation of IJourneyStorage using AsyncStorage
 */
export class MobileJourneyStorage implements IJourneyStorage {
  /**
   * Maximum batch size for multi-operations to optimize performance
   * AsyncStorage performance can degrade with very large operations
   */
  private readonly BATCH_SIZE = 50;
  
  /**
   * Store a value with the given key
   * 
   * @param key - The storage key
   * @param value - The value to store
   * @param options - Storage options like expiration
   */
  async setItem<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    try {
      const now = Date.now();
      const storageItem: StorageItem<T> = {
        value,
        timestamp: now,
      };
      
      // Set expiration if provided
      if (options?.expireIn) {
        storageItem.expireAt = now + options.expireIn;
      }
      
      // AsyncStorage only accepts strings, so we need to serialize the data
      const serializedItem = JSON.stringify(storageItem);
      await AsyncStorage.setItem(key, serializedItem);
    } catch (error) {
      console.error(`Error storing item with key ${key}:`, error);
      throw new Error(`Failed to store item with key ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Retrieve a value for the given key
   * 
   * @param key - The storage key
   * @returns The stored value, or null if not found or expired
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const serializedItem = await AsyncStorage.getItem(key);
      
      if (!serializedItem) {
        return null;
      }
      
      const storageItem: StorageItem<T> = JSON.parse(serializedItem);
      
      // Check if the item has expired
      if (storageItem.expireAt && storageItem.expireAt < Date.now()) {
        // Item has expired, remove it and return null
        await this.removeItem(key);
        return null;
      }
      
      return storageItem.value;
    } catch (error) {
      console.error(`Error retrieving item with key ${key}:`, error);
      // Return null instead of throwing to make the API more resilient
      // This matches the behavior of AsyncStorage.getItem
      return null;
    }
  }
  
  /**
   * Remove a value with the given key
   * 
   * @param key - The storage key
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item with key ${key}:`, error);
      throw new Error(`Failed to remove item with key ${key}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if a key exists in storage and is not expired
   * 
   * @param key - The storage key
   * @returns True if the key exists and is not expired, false otherwise
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const serializedItem = await AsyncStorage.getItem(key);
      
      if (!serializedItem) {
        return false;
      }
      
      const storageItem: StorageItem<any> = JSON.parse(serializedItem);
      
      // Check if the item has expired
      if (storageItem.expireAt && storageItem.expireAt < Date.now()) {
        // Item has expired, remove it and return false
        await this.removeItem(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error checking item with key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Clear all stored values
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Clean up expired items to free up storage space
   * This method can be called periodically to remove expired items
   */
  async cleanupExpiredItems(): Promise<void> {
    try {
      const now = Date.now();
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Process keys in batches to avoid performance issues
      for (let i = 0; i < allKeys.length; i += this.BATCH_SIZE) {
        const batchKeys = allKeys.slice(i, i + this.BATCH_SIZE);
        const batchValues = await AsyncStorage.multiGet(batchKeys);
        
        const keysToRemove: string[] = [];
        
        for (const [key, value] of batchValues) {
          if (!value) continue;
          
          try {
            const storageItem: StorageItem<any> = JSON.parse(value);
            
            if (storageItem.expireAt && storageItem.expireAt < now) {
              keysToRemove.push(key);
            }
          } catch (parseError) {
            // Skip items that can't be parsed
            console.warn(`Skipping cleanup for key ${key} due to parse error:`, parseError);
          }
        }
        
        if (keysToRemove.length > 0) {
          await AsyncStorage.multiRemove(keysToRemove);
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired items:', error);
      throw new Error(`Failed to clean up expired items: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get all keys that match a specific prefix
   * Useful for retrieving all keys related to a specific journey
   * 
   * @param prefix - The key prefix to match
   * @returns Array of matching keys
   */
  async getKeysByPrefix(prefix: string): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter(key => key.startsWith(prefix));
    } catch (error) {
      console.error(`Error getting keys by prefix ${prefix}:`, error);
      throw new Error(`Failed to get keys by prefix ${prefix}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Remove all items with keys that match a specific prefix
   * Useful for clearing all data related to a specific journey
   * 
   * @param prefix - The key prefix to match
   */
  async removeItemsByPrefix(prefix: string): Promise<void> {
    try {
      const keysToRemove = await this.getKeysByPrefix(prefix);
      
      if (keysToRemove.length === 0) {
        return;
      }
      
      // Process keys in batches to avoid performance issues
      for (let i = 0; i < keysToRemove.length; i += this.BATCH_SIZE) {
        const batchKeys = keysToRemove.slice(i, i + this.BATCH_SIZE);
        await AsyncStorage.multiRemove(batchKeys);
      }
    } catch (error) {
      console.error(`Error removing items by prefix ${prefix}:`, error);
      throw new Error(`Failed to remove items by prefix ${prefix}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get multiple items at once
   * Optimized for mobile by using AsyncStorage.multiGet
   * 
   * @param keys - Array of storage keys
   * @returns Object with key-value pairs of retrieved items
   */
  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      const now = Date.now();
      const result: Record<string, T | null> = {};
      
      // Initialize all keys with null values
      keys.forEach(key => {
        result[key] = null;
      });
      
      // Process keys in batches to avoid performance issues
      for (let i = 0; i < keys.length; i += this.BATCH_SIZE) {
        const batchKeys = keys.slice(i, i + this.BATCH_SIZE);
        const batchValues = await AsyncStorage.multiGet(batchKeys);
        
        for (const [key, value] of batchValues) {
          if (!value) continue;
          
          try {
            const storageItem: StorageItem<T> = JSON.parse(value);
            
            // Check if the item has expired
            if (storageItem.expireAt && storageItem.expireAt < now) {
              // Item has expired, mark for removal
              result[key] = null;
              await this.removeItem(key);
            } else {
              result[key] = storageItem.value;
            }
          } catch (parseError) {
            // Skip items that can't be parsed
            console.warn(`Skipping item with key ${key} due to parse error:`, parseError);
            result[key] = null;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error retrieving multiple items:', error);
      throw new Error(`Failed to retrieve multiple items: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Set multiple items at once
   * Optimized for mobile by using AsyncStorage.multiSet
   * 
   * @param items - Object with key-value pairs to store
   * @param options - Storage options like expiration
   */
  async multiSet<T>(items: Record<string, T>, options?: StorageOptions): Promise<void> {
    try {
      const now = Date.now();
      const entries = Object.entries(items);
      
      // Process items in batches to avoid performance issues
      for (let i = 0; i < entries.length; i += this.BATCH_SIZE) {
        const batchEntries = entries.slice(i, i + this.BATCH_SIZE);
        const batchItems: [string, string][] = [];
        
        for (const [key, value] of batchEntries) {
          const storageItem: StorageItem<T> = {
            value,
            timestamp: now,
          };
          
          // Set expiration if provided
          if (options?.expireIn) {
            storageItem.expireAt = now + options.expireIn;
          }
          
          // AsyncStorage only accepts strings, so we need to serialize the data
          const serializedItem = JSON.stringify(storageItem);
          batchItems.push([key, serializedItem]);
        }
        
        await AsyncStorage.multiSet(batchItems);
      }
    } catch (error) {
      console.error('Error storing multiple items:', error);
      throw new Error(`Failed to store multiple items: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export a singleton instance for convenience
export const mobileJourneyStorage = new MobileJourneyStorage();

// Default export for the class
export default MobileJourneyStorage;