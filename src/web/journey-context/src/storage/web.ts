/**
 * Web implementation of the IJourneyStorage interface using localStorage and sessionStorage
 * Provides methods to persist, retrieve, and remove journey state with proper serialization,
 * error handling, and optional expiration support.
 */

/**
 * Storage options for configuring storage behavior
 */
interface StorageOptions {
  /**
   * Whether to use session storage instead of local storage
   * - true: Data persists only for the current session (sessionStorage)
   * - false: Data persists across sessions (localStorage)
   * @default false
   */
  session?: boolean;

  /**
   * Expiration time in milliseconds
   * If provided, the stored data will be considered expired after this time
   */
  expiresIn?: number;
}

/**
 * Stored item wrapper with metadata
 */
interface StoredItem<T> {
  /**
   * The actual data being stored
   */
  data: T;

  /**
   * When the data was stored (timestamp)
   */
  storedAt: number;

  /**
   * When the data expires (timestamp), if applicable
   */
  expiresAt?: number;
}

/**
 * Result of a storage operation
 */
interface StorageResult<T> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The data retrieved, if applicable
   */
  data?: T;

  /**
   * Error message if the operation failed
   */
  error?: string;
}

/**
 * Interface for journey storage operations
 */
interface IJourneyStorage {
  /**
   * Stores data with the given key
   * @param key - The key to store the data under
   * @param data - The data to store
   * @param options - Storage options
   * @returns A promise that resolves to the result of the operation
   */
  persist<T>(key: string, data: T, options?: StorageOptions): Promise<StorageResult<T>>;

  /**
   * Retrieves data for the given key
   * @param key - The key to retrieve data for
   * @returns A promise that resolves to the result of the operation
   */
  retrieve<T>(key: string): Promise<StorageResult<T>>;

  /**
   * Removes data for the given key
   * @param key - The key to remove data for
   * @returns A promise that resolves to the result of the operation
   */
  remove(key: string): Promise<StorageResult<void>>;
}

/**
 * Web implementation of the IJourneyStorage interface
 * Uses localStorage for persistent storage and sessionStorage for session storage
 */
export class WebJourneyStorage implements IJourneyStorage {
  /**
   * Stores data with the given key
   * @param key - The key to store the data under
   * @param data - The data to store
   * @param options - Storage options
   * @returns A promise that resolves to the result of the operation
   */
  async persist<T>(key: string, data: T, options?: StorageOptions): Promise<StorageResult<T>> {
    try {
      // Create the stored item with metadata
      const now = Date.now();
      const storedItem: StoredItem<T> = {
        data,
        storedAt: now,
      };

      // Add expiration if specified
      if (options?.expiresIn) {
        storedItem.expiresAt = now + options.expiresIn;
      }

      // Serialize the data
      const serializedData = JSON.stringify(storedItem);

      // Determine which storage to use
      const storage = options?.session ? sessionStorage : localStorage;

      // Store the data
      storage.setItem(key, serializedData);

      return { success: true, data };
    } catch (error) {
      // Handle storage errors (e.g., quota exceeded, private browsing mode)
      const errorMessage = error instanceof Error ? error.message : 'Unknown storage error';
      console.error(`Failed to persist data for key ${key}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retrieves data for the given key
   * @param key - The key to retrieve data for
   * @returns A promise that resolves to the result of the operation
   */
  async retrieve<T>(key: string): Promise<StorageResult<T>> {
    try {
      // Try localStorage first
      let serializedData = localStorage.getItem(key);

      // If not found in localStorage, try sessionStorage
      if (!serializedData) {
        serializedData = sessionStorage.getItem(key);
      }

      // If not found in either storage, return null
      if (!serializedData) {
        return { success: false, error: 'Item not found' };
      }

      // Parse the stored item
      const storedItem = JSON.parse(serializedData) as StoredItem<T>;

      // Check if the item has expired
      if (storedItem.expiresAt && storedItem.expiresAt < Date.now()) {
        // Remove the expired item
        this.remove(key);
        return { success: false, error: 'Item expired' };
      }

      return { success: true, data: storedItem.data };
    } catch (error) {
      // Handle parsing errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown retrieval error';
      console.error(`Failed to retrieve data for key ${key}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Removes data for the given key
   * @param key - The key to remove data for
   * @returns A promise that resolves to the result of the operation
   */
  async remove(key: string): Promise<StorageResult<void>> {
    try {
      // Remove from both storages to ensure it's completely removed
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      // Handle removal errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown removal error';
      console.error(`Failed to remove data for key ${key}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Checks if the browser supports storage APIs
   * @returns Whether storage is supported
   */
  private isStorageSupported(): boolean {
    try {
      // Check if localStorage is available
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Creates a new instance of WebJourneyStorage
 * @returns A new WebJourneyStorage instance
 */
export const createWebJourneyStorage = (): IJourneyStorage => {
  return new WebJourneyStorage();
};

export default WebJourneyStorage;