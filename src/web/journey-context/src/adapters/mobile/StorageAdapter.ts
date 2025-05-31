import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Error types that can occur during storage operations
 */
export enum StorageErrorType {
  STORAGE_LIMIT_EXCEEDED = 'STORAGE_LIMIT_EXCEEDED',
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for storage operations
 */
export class StorageError extends Error {
  type: StorageErrorType;
  key?: string;
  originalError?: Error;

  constructor(type: StorageErrorType, message: string, key?: string, originalError?: Error) {
    super(message);
    this.name = 'StorageError';
    this.type = type;
    this.key = key;
    this.originalError = originalError;
  }
}

/**
 * Options for storage operations
 */
export interface StorageOptions {
  /** Version of the data schema, used for migrations */
  schemaVersion?: number;
  /** Function to migrate data from older schema versions */
  migrationFn?: (data: any, fromVersion: number, toVersion: number) => any;
  /** Maximum retry attempts for storage operations */
  maxRetries?: number;
  /** Whether to use batch operations when possible */
  useBatch?: boolean;
  /** Fallback storage keys to try if primary storage fails */
  fallbackKeys?: string[];
}

/**
 * Default storage options
 */
const DEFAULT_OPTIONS: StorageOptions = {
  schemaVersion: 1,
  maxRetries: 3,
  useBatch: true,
};

/**
 * Metadata stored with each value to support versioning and migrations
 */
interface StorageMetadata {
  schemaVersion: number;
  timestamp: number;
}

/**
 * Structure of data stored in AsyncStorage
 */
interface StorageData<T> {
  metadata: StorageMetadata;
  data: T;
}

/**
 * AsyncStorage wrapper with enhanced error handling and features
 * for mobile storage operations within the journey context.
 */
export class StorageAdapter {
  private options: StorageOptions;

  /**
   * Creates a new StorageAdapter instance
   * @param options Configuration options for the adapter
   */
  constructor(options: StorageOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Stores a value in AsyncStorage with metadata
   * @param key Storage key
   * @param value Value to store
   * @param options Operation-specific options (overrides instance options)
   * @returns Promise that resolves when the operation completes
   */
  async setItem<T>(key: string, value: T, options?: StorageOptions): Promise<void> {
    const mergedOptions = { ...this.options, ...options };
    const { schemaVersion, maxRetries = 3 } = mergedOptions;

    // Create storage data with metadata
    const storageData: StorageData<T> = {
      metadata: {
        schemaVersion: schemaVersion || 1,
        timestamp: Date.now(),
      },
      data: value,
    };

    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < maxRetries) {
      try {
        const serializedData = JSON.stringify(storageData);
        await AsyncStorage.setItem(key, serializedData);
        return;
      } catch (error) {
        attempts++;
        lastError = error as Error;

        // Check if error is due to storage limit
        if (error instanceof Error && error.message.includes('quota exceeded')) {
          // Try to store in fallback keys if available
          if (mergedOptions.fallbackKeys && mergedOptions.fallbackKeys.length > 0) {
            try {
              const fallbackKey = mergedOptions.fallbackKeys[0];
              const serializedData = JSON.stringify(storageData);
              await AsyncStorage.setItem(fallbackKey, serializedData);
              return;
            } catch (fallbackError) {
              // Continue with retry logic if fallback fails
            }
          }

          throw new StorageError(
            StorageErrorType.STORAGE_LIMIT_EXCEEDED,
            `Storage limit exceeded for key: ${key}`,
            key,
            error as Error
          );
        }

        // If this is the last attempt, throw the error
        if (attempts >= maxRetries) {
          break;
        }

        // Exponential backoff before retry
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempts)));
      }
    }

    // If we've exhausted all retries, throw the appropriate error
    if (lastError) {
      if (lastError.message.includes('serializing')) {
        throw new StorageError(
          StorageErrorType.SERIALIZATION_ERROR,
          `Failed to serialize data for key: ${key}`,
          key,
          lastError
        );
      } else {
        throw new StorageError(
          StorageErrorType.UNKNOWN_ERROR,
          `Failed to store data for key: ${key} after ${maxRetries} attempts`,
          key,
          lastError
        );
      }
    }
  }

  /**
   * Retrieves a value from AsyncStorage and handles migrations if needed
   * @param key Storage key
   * @param options Operation-specific options (overrides instance options)
   * @returns Promise that resolves with the stored value or null if not found
   */
  async getItem<T>(key: string, options?: StorageOptions): Promise<T | null> {
    const mergedOptions = { ...this.options, ...options };
    const { schemaVersion, migrationFn, fallbackKeys } = mergedOptions;

    try {
      const serializedData = await AsyncStorage.getItem(key);

      // If no data found, try fallback keys if available
      if (serializedData === null && fallbackKeys && fallbackKeys.length > 0) {
        for (const fallbackKey of fallbackKeys) {
          const fallbackData = await AsyncStorage.getItem(fallbackKey);
          if (fallbackData !== null) {
            return this.parseAndMigrate<T>(fallbackData, fallbackKey, mergedOptions);
          }
        }
        return null;
      }

      // If no data found in primary or fallback keys
      if (serializedData === null) {
        return null;
      }

      return this.parseAndMigrate<T>(serializedData, key, mergedOptions);
    } catch (error) {
      // Handle specific error cases
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        `Failed to retrieve data for key: ${key}`,
        key,
        error as Error
      );
    }
  }

  /**
   * Removes a value from AsyncStorage
   * @param key Storage key
   * @returns Promise that resolves when the operation completes
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        `Failed to remove data for key: ${key}`,
        key,
        error as Error
      );
    }
  }

  /**
   * Stores multiple values in AsyncStorage efficiently using batch operations
   * @param keyValuePairs Array of key-value pairs to store
   * @param options Operation-specific options (overrides instance options)
   * @returns Promise that resolves when the operation completes
   */
  async multiSet<T>(keyValuePairs: Array<[string, T]>, options?: StorageOptions): Promise<void> {
    const mergedOptions = { ...this.options, ...options };
    const { schemaVersion, useBatch = true } = mergedOptions;

    try {
      // Prepare data with metadata
      const storageItems = keyValuePairs.map(([key, value]) => {
        const storageData: StorageData<T> = {
          metadata: {
            schemaVersion: schemaVersion || 1,
            timestamp: Date.now(),
          },
          data: value,
        };
        return [key, JSON.stringify(storageData)];
      });

      if (useBatch) {
        // Use batch operation for better performance
        await AsyncStorage.multiSet(storageItems);
      } else {
        // Fall back to individual operations if batch is disabled
        await Promise.all(
          keyValuePairs.map(([key, value]) => this.setItem(key, value, mergedOptions))
        );
      }
    } catch (error) {
      // Check if error is due to storage limit
      if (error instanceof Error && error.message.includes('quota exceeded')) {
        throw new StorageError(
          StorageErrorType.STORAGE_LIMIT_EXCEEDED,
          'Storage limit exceeded during batch operation',
          undefined,
          error as Error
        );
      }

      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        'Failed to store multiple items',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Retrieves multiple values from AsyncStorage efficiently
   * @param keys Array of keys to retrieve
   * @param options Operation-specific options (overrides instance options)
   * @returns Promise that resolves with an array of key-value pairs
   */
  async multiGet<T>(keys: string[], options?: StorageOptions): Promise<Array<[string, T | null]>> {
    const mergedOptions = { ...this.options, ...options };
    const { useBatch = true } = mergedOptions;

    try {
      if (useBatch) {
        // Use batch operation for better performance
        const results = await AsyncStorage.multiGet(keys);
        return Promise.all(
          results.map(async ([key, serializedData]) => {
            if (serializedData === null) {
              return [key, null];
            }
            try {
              const value = await this.parseAndMigrate<T>(serializedData, key, mergedOptions);
              return [key, value];
            } catch (error) {
              // If we can't parse an individual item, return null for that item
              console.warn(`Failed to parse data for key: ${key}`, error);
              return [key, null];
            }
          })
        );
      } else {
        // Fall back to individual operations if batch is disabled
        return Promise.all(
          keys.map(async key => {
            try {
              const value = await this.getItem<T>(key, mergedOptions);
              return [key, value];
            } catch (error) {
              // If we can't retrieve an individual item, return null for that item
              console.warn(`Failed to retrieve data for key: ${key}`, error);
              return [key, null];
            }
          })
        );
      }
    } catch (error) {
      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        'Failed to retrieve multiple items',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Removes multiple values from AsyncStorage efficiently
   * @param keys Array of keys to remove
   * @returns Promise that resolves when the operation completes
   */
  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        'Failed to remove multiple items',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Clears all storage for the application
   * @returns Promise that resolves when the operation completes
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        'Failed to clear storage',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Gets all keys stored in AsyncStorage
   * @returns Promise that resolves with an array of keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        'Failed to get all keys',
        undefined,
        error as Error
      );
    }
  }

  /**
   * Checks if storage is available and working
   * @returns Promise that resolves with true if storage is available, false otherwise
   */
  async isStorageAvailable(): Promise<boolean> {
    const testKey = '__storage_test__';
    try {
      await AsyncStorage.setItem(testKey, 'test');
      await AsyncStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Helper method to parse serialized data and handle migrations
   * @param serializedData Serialized data from AsyncStorage
   * @param key Storage key (for error reporting)
   * @param options Storage options
   * @returns Parsed and migrated data
   */
  private async parseAndMigrate<T>(
    serializedData: string,
    key: string,
    options: StorageOptions
  ): Promise<T> {
    try {
      // Parse the serialized data
      const parsedData = JSON.parse(serializedData) as StorageData<T>;

      // Handle legacy data format (no metadata)
      if (!parsedData.metadata) {
        // Assume this is raw data from before we added metadata
        return serializedData as unknown as T;
      }

      // Check if migration is needed
      const currentVersion = options.schemaVersion || 1;
      const dataVersion = parsedData.metadata.schemaVersion;

      if (dataVersion < currentVersion && options.migrationFn) {
        // Migrate the data to the current version
        parsedData.data = options.migrationFn(parsedData.data, dataVersion, currentVersion);
        parsedData.metadata.schemaVersion = currentVersion;

        // Save the migrated data back to storage
        const updatedSerializedData = JSON.stringify(parsedData);
        await AsyncStorage.setItem(key, updatedSerializedData);
      }

      return parsedData.data;
    } catch (error) {
      throw new StorageError(
        StorageErrorType.DESERIALIZATION_ERROR,
        `Failed to parse data for key: ${key}`,
        key,
        error as Error
      );
    }
  }

  /**
   * Estimates the size of stored data for a key
   * @param key Storage key
   * @returns Promise that resolves with the estimated size in bytes, or null if key not found
   */
  async getItemSize(key: string): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      if (data === null) {
        return null;
      }
      // Rough estimate: 2 bytes per character in UTF-16
      return data.length * 2;
    } catch (error) {
      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        `Failed to get size for key: ${key}`,
        key,
        error as Error
      );
    }
  }

  /**
   * Attempts to recover corrupted data by applying a recovery function
   * @param key Storage key
   * @param recoveryFn Function that attempts to recover data from corrupted state
   * @returns Promise that resolves with recovered data or null if recovery failed
   */
  async recoverCorruptedData<T>(
    key: string,
    recoveryFn: (corruptedData: string) => T | null
  ): Promise<T | null> {
    try {
      // Get the raw data without parsing
      const rawData = await AsyncStorage.getItem(key);
      if (rawData === null) {
        return null;
      }

      // Try to parse normally first
      try {
        const parsedData = JSON.parse(rawData) as StorageData<T>;
        return parsedData.data;
      } catch (parseError) {
        // If parsing fails, try recovery function
        const recoveredData = recoveryFn(rawData);
        
        // If recovery successful, save the recovered data
        if (recoveredData !== null) {
          const storageData: StorageData<T> = {
            metadata: {
              schemaVersion: this.options.schemaVersion || 1,
              timestamp: Date.now(),
            },
            data: recoveredData,
          };
          
          await AsyncStorage.setItem(key, JSON.stringify(storageData));
        }
        
        return recoveredData;
      }
    } catch (error) {
      throw new StorageError(
        StorageErrorType.UNKNOWN_ERROR,
        `Failed to recover data for key: ${key}`,
        key,
        error as Error
      );
    }
  }
}