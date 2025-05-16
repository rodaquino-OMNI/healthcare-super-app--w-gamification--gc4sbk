import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageError } from '../../types/errors';
import { StorageAdapter as StorageAdapterInterface } from '../../types/storage';

/**
 * Maximum size for AsyncStorage items in bytes
 * AsyncStorage typically has a limit of 2MB per item
 */
const MAX_ITEM_SIZE = 1.8 * 1024 * 1024; // 1.8MB to leave some buffer

/**
 * Prefix for all storage keys to avoid conflicts with other app storage
 */
const STORAGE_KEY_PREFIX = '@AUSTA_JOURNEY:';

/**
 * Current schema version for stored data
 * Increment this when making breaking changes to data structure
 */
const SCHEMA_VERSION = 1;

/**
 * Key for storing schema version information
 */
const SCHEMA_VERSION_KEY = `${STORAGE_KEY_PREFIX}schema_version`;

/**
 * StorageAdapter for mobile platforms
 * 
 * Provides a wrapper around AsyncStorage with enhanced error handling,
 * automatic serialization/deserialization, storage limit detection,
 * and data migration capabilities.
 */
export class StorageAdapter implements StorageAdapterInterface {
  /**
   * Initializes the storage adapter and performs schema migration if needed
   */
  public async initialize(): Promise<void> {
    try {
      await this.migrateSchemaIfNeeded();
    } catch (error) {
      console.error('Failed to initialize storage adapter:', error);
      throw new StorageError('initialization_failed', 'Failed to initialize storage adapter', { cause: error });
    }
  }

  /**
   * Stores data with the given key
   * 
   * @param key - Storage key (will be prefixed automatically)
   * @param data - Data to store (will be serialized automatically)
   * @throws {StorageError} If storage operation fails
   */
  public async setItem<T>(key: string, data: T): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedData = this.serialize(data);
      
      // Check if data exceeds size limit
      if (serializedData.length > MAX_ITEM_SIZE) {
        throw new StorageError(
          'storage_limit_exceeded',
          `Data size exceeds storage limit of ${MAX_ITEM_SIZE} bytes`,
          { size: serializedData.length, limit: MAX_ITEM_SIZE }
        );
      }
      
      await AsyncStorage.setItem(prefixedKey, serializedData);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      console.error(`Failed to store data for key '${key}':`, error);
      throw new StorageError('set_failed', `Failed to store data for key '${key}'`, { cause: error, key });
    }
  }

  /**
   * Retrieves data for the given key
   * 
   * @param key - Storage key (will be prefixed automatically)
   * @returns The stored data, or null if not found
   * @throws {StorageError} If retrieval operation fails
   */
  public async getItem<T>(key: string): Promise<T | null> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serializedData = await AsyncStorage.getItem(prefixedKey);
      
      if (serializedData === null) {
        return null;
      }
      
      return this.deserialize<T>(serializedData);
    } catch (error) {
      console.error(`Failed to retrieve data for key '${key}':`, error);
      throw new StorageError('get_failed', `Failed to retrieve data for key '${key}'`, { cause: error, key });
    }
  }

  /**
   * Removes data for the given key
   * 
   * @param key - Storage key (will be prefixed automatically)
   * @throws {StorageError} If removal operation fails
   */
  public async removeItem(key: string): Promise<void> {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      await AsyncStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error(`Failed to remove data for key '${key}':`, error);
      throw new StorageError('remove_failed', `Failed to remove data for key '${key}'`, { cause: error, key });
    }
  }

  /**
   * Stores multiple items in a single batch operation for better performance
   * 
   * @param items - Array of key-value pairs to store
   * @throws {StorageError} If batch operation fails
   */
  public async multiSet(items: Array<[string, any]>): Promise<void> {
    try {
      const prefixedItems = items.map(([key, data]) => {
        const prefixedKey = this.getPrefixedKey(key);
        const serializedData = this.serialize(data);
        
        // Check if any item exceeds size limit
        if (serializedData.length > MAX_ITEM_SIZE) {
          throw new StorageError(
            'storage_limit_exceeded',
            `Data size for key '${key}' exceeds storage limit of ${MAX_ITEM_SIZE} bytes`,
            { size: serializedData.length, limit: MAX_ITEM_SIZE, key }
          );
        }
        
        return [prefixedKey, serializedData];
      });
      
      await AsyncStorage.multiSet(prefixedItems);
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      
      console.error('Failed to store multiple items:', error);
      throw new StorageError('multi_set_failed', 'Failed to store multiple items', { cause: error });
    }
  }

  /**
   * Retrieves multiple items in a single batch operation for better performance
   * 
   * @param keys - Array of keys to retrieve
   * @returns Array of key-value pairs with deserialized data
   * @throws {StorageError} If batch operation fails
   */
  public async multiGet(keys: string[]): Promise<Array<[string, any]>> {
    try {
      const prefixedKeys = keys.map(key => this.getPrefixedKey(key));
      const results = await AsyncStorage.multiGet(prefixedKeys);
      
      return results.map(([prefixedKey, serializedData]) => {
        const originalKey = this.getOriginalKey(prefixedKey);
        const data = serializedData ? this.deserialize(serializedData) : null;
        return [originalKey, data];
      });
    } catch (error) {
      console.error('Failed to retrieve multiple items:', error);
      throw new StorageError('multi_get_failed', 'Failed to retrieve multiple items', { cause: error });
    }
  }

  /**
   * Removes multiple items in a single batch operation for better performance
   * 
   * @param keys - Array of keys to remove
   * @throws {StorageError} If batch operation fails
   */
  public async multiRemove(keys: string[]): Promise<void> {
    try {
      const prefixedKeys = keys.map(key => this.getPrefixedKey(key));
      await AsyncStorage.multiRemove(prefixedKeys);
    } catch (error) {
      console.error('Failed to remove multiple items:', error);
      throw new StorageError('multi_remove_failed', 'Failed to remove multiple items', { cause: error });
    }
  }

  /**
   * Clears all journey-related data from storage
   * Only removes items with the journey prefix
   * 
   * @throws {StorageError} If clear operation fails
   */
  public async clear(): Promise<void> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter for journey-related keys
      const journeyKeys = allKeys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      
      // Remove all journey-related keys
      if (journeyKeys.length > 0) {
        await AsyncStorage.multiRemove(journeyKeys);
      }
    } catch (error) {
      console.error('Failed to clear journey storage:', error);
      throw new StorageError('clear_failed', 'Failed to clear journey storage', { cause: error });
    }
  }

  /**
   * Gets all keys for journey-related data
   * 
   * @returns Array of original keys (without prefix)
   * @throws {StorageError} If operation fails
   */
  public async getAllKeys(): Promise<string[]> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter for journey-related keys and remove prefix
      return allKeys
        .filter(key => key.startsWith(STORAGE_KEY_PREFIX))
        .map(key => this.getOriginalKey(key));
    } catch (error) {
      console.error('Failed to get all keys:', error);
      throw new StorageError('get_keys_failed', 'Failed to get all keys', { cause: error });
    }
  }

  /**
   * Checks if storage is available and working properly
   * 
   * @returns True if storage is available, false otherwise
   */
  public async isAvailable(): Promise<boolean> {
    try {
      const testKey = `${STORAGE_KEY_PREFIX}test`;
      const testValue = 'test';
      
      // Try to write and read a test value
      await AsyncStorage.setItem(testKey, testValue);
      const result = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      
      return result === testValue;
    } catch (error) {
      console.error('Storage availability check failed:', error);
      return false;
    }
  }

  /**
   * Gets the current schema version from storage
   * 
   * @returns The current schema version, or 0 if not set
   */
  private async getCurrentSchemaVersion(): Promise<number> {
    try {
      const versionString = await AsyncStorage.getItem(SCHEMA_VERSION_KEY);
      return versionString ? parseInt(versionString, 10) : 0;
    } catch (error) {
      console.error('Failed to get schema version:', error);
      return 0;
    }
  }

  /**
   * Updates the schema version in storage
   * 
   * @param version - The new schema version
   */
  private async updateSchemaVersion(version: number): Promise<void> {
    try {
      await AsyncStorage.setItem(SCHEMA_VERSION_KEY, version.toString());
    } catch (error) {
      console.error('Failed to update schema version:', error);
      throw new StorageError('schema_update_failed', 'Failed to update schema version', { cause: error });
    }
  }

  /**
   * Migrates data schema if needed
   * This is called during initialization to ensure data compatibility
   */
  private async migrateSchemaIfNeeded(): Promise<void> {
    const currentVersion = await this.getCurrentSchemaVersion();
    
    if (currentVersion < SCHEMA_VERSION) {
      console.log(`Migrating storage schema from version ${currentVersion} to ${SCHEMA_VERSION}`);
      
      // Perform migration based on version differences
      if (currentVersion === 0) {
        // Initial migration - no previous schema
        await this.migrateFromV0ToV1();
      }
      // Add more migration steps as needed for future versions
      // if (currentVersion === 1) {
      //   await this.migrateFromV1ToV2();
      // }
      
      // Update schema version after successful migration
      await this.updateSchemaVersion(SCHEMA_VERSION);
    }
  }

  /**
   * Migrates data from version 0 (no schema) to version 1
   * This handles the initial migration of legacy data
   */
  private async migrateFromV0ToV1(): Promise<void> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find legacy journey data (without proper prefix)
      const legacyKeys = allKeys.filter(key => 
        key.startsWith('@AUSTA:') && 
        !key.startsWith(STORAGE_KEY_PREFIX) &&
        (key.includes('journey') || key.includes('health') || 
         key.includes('care') || key.includes('plan'))
      );
      
      if (legacyKeys.length > 0) {
        console.log(`Found ${legacyKeys.length} legacy keys to migrate`);
        
        // Get all legacy data
        const legacyData = await AsyncStorage.multiGet(legacyKeys);
        
        // Transform and store with new prefix
        const migrationPromises = legacyData.map(async ([oldKey, value]) => {
          if (value) {
            try {
              // Parse the old data
              const data = JSON.parse(value);
              
              // Create a new key with proper prefix
              const newKey = oldKey.replace('@AUSTA:', STORAGE_KEY_PREFIX);
              
              // Store with new key
              await AsyncStorage.setItem(newKey, JSON.stringify(data));
              
              // Remove old key after successful migration
              await AsyncStorage.removeItem(oldKey);
              
              console.log(`Migrated ${oldKey} to ${newKey}`);
            } catch (error) {
              console.error(`Failed to migrate key ${oldKey}:`, error);
              // Continue with other keys even if one fails
            }
          }
        });
        
        await Promise.all(migrationPromises);
      }
    } catch (error) {
      console.error('Migration from v0 to v1 failed:', error);
      throw new StorageError('migration_failed', 'Failed to migrate from schema v0 to v1', { cause: error });
    }
  }

  /**
   * Prefixes a key with the storage prefix
   * 
   * @param key - Original key
   * @returns Prefixed key
   */
  private getPrefixedKey(key: string): string {
    return `${STORAGE_KEY_PREFIX}${key}`;
  }

  /**
   * Removes the prefix from a storage key
   * 
   * @param prefixedKey - Key with prefix
   * @returns Original key without prefix
   */
  private getOriginalKey(prefixedKey: string): string {
    return prefixedKey.replace(STORAGE_KEY_PREFIX, '');
  }

  /**
   * Serializes data to a string
   * 
   * @param data - Data to serialize
   * @returns Serialized string
   * @throws {StorageError} If serialization fails
   */
  private serialize(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('Failed to serialize data:', error);
      throw new StorageError('serialization_failed', 'Failed to serialize data', { cause: error });
    }
  }

  /**
   * Deserializes a string to data
   * 
   * @param serialized - Serialized string
   * @returns Deserialized data
   * @throws {StorageError} If deserialization fails
   */
  private deserialize<T>(serialized: string): T {
    try {
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error('Failed to deserialize data:', error);
      throw new StorageError('deserialization_failed', 'Failed to deserialize data', { cause: error });
    }
  }
}

/**
 * Creates and initializes a new StorageAdapter instance
 * 
 * @returns Initialized StorageAdapter
 */
export async function createStorageAdapter(): Promise<StorageAdapter> {
  const adapter = new StorageAdapter();
  await adapter.initialize();
  return adapter;
}

export default StorageAdapter;