import { EventEmitter } from 'events';

/**
 * Type representing a Redis key-value pair with optional expiration
 */
interface RedisCacheItem {
  value: string;
  expireAt?: number; // Timestamp when the key expires (milliseconds)
}

/**
 * Options for simulating Redis errors
 */
export interface RedisErrorOptions {
  /**
   * Simulate connection error
   */
  connectionError?: boolean;

  /**
   * Simulate command errors for specific commands
   */
  commandErrors?: {
    get?: boolean;
    set?: boolean;
    setex?: boolean;
    del?: boolean;
    exists?: boolean;
    ttl?: boolean;
    ping?: boolean;
  };

  /**
   * Error message to use for simulated errors
   */
  errorMessage?: string;
}

/**
 * Mock implementation of Redis client for testing purposes.
 * Simulates Redis operations with an in-memory store.
 */
export class RedisMock extends EventEmitter {
  private store: Map<string, RedisCacheItem> = new Map();
  private errorOptions: RedisErrorOptions = {};
  private connected: boolean = true;
  private expirationCheckInterval: NodeJS.Timeout | null = null;
  private subscribers: Map<string, Set<(channel: string, message: string) => void>> = new Map();

  /**
   * Creates a new RedisMock instance
   * 
   * @param errorOptions Options for simulating Redis errors
   */
  constructor(errorOptions: RedisErrorOptions = {}) {
    super();
    this.errorOptions = errorOptions;

    // Simulate connection error if configured
    if (errorOptions.connectionError) {
      this.connected = false;
      setTimeout(() => {
        this.emit('error', new Error(errorOptions.errorMessage || 'Redis connection error'));
      }, 0);
    } else {
      setTimeout(() => {
        this.emit('connect');
        this.emit('ready');
      }, 0);
    }

    // Start expiration check interval
    this.expirationCheckInterval = setInterval(() => this.checkExpirations(), 1000);
  }

  /**
   * Checks for expired keys and removes them from the store
   */
  private checkExpirations(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expireAt && item.expireAt <= now) {
        this.store.delete(key);
        this.emit('expired', key);
      }
    }
  }

  /**
   * Simulates Redis GET command
   * 
   * @param key Key to retrieve
   * @param callback Optional callback function
   * @returns Promise resolving to the value or null if not found
   */
  async get(key: string, callback?: (err: Error | null, result: string | null) => void): Promise<string | null> {
    try {
      this.checkConnection();
      
      if (this.errorOptions.commandErrors?.get) {
        const error = new Error(this.errorOptions.errorMessage || 'Redis GET error');
        if (callback) callback(error, null);
        throw error;
      }

      const item = this.store.get(key);
      const result = item ? item.value : null;
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error as Error, null);
      throw error;
    }
  }

  /**
   * Simulates Redis SET command
   * 
   * @param key Key to set
   * @param value Value to store
   * @param expiryMode Optional expiry mode (e.g., 'EX')
   * @param time Optional expiry time in seconds
   * @param callback Optional callback function
   * @returns Promise resolving to 'OK' if successful
   */
  async set(
    key: string,
    value: string,
    expiryMode?: string | ((err: Error | null, result: string) => void),
    time?: number | ((err: Error | null, result: string) => void),
    callback?: (err: Error | null, result: string) => void
  ): Promise<string> {
    try {
      this.checkConnection();

      if (this.errorOptions.commandErrors?.set) {
        const error = new Error(this.errorOptions.errorMessage || 'Redis SET error');
        if (typeof expiryMode === 'function') expiryMode(error, '');
        else if (typeof time === 'function') time(error, '');
        else if (callback) callback(error, '');
        throw error;
      }

      // Handle overloaded function signatures
      if (typeof expiryMode === 'function') {
        callback = expiryMode;
        expiryMode = undefined;
        time = undefined;
      } else if (typeof time === 'function') {
        callback = time;
        time = undefined;
      }

      const item: RedisCacheItem = { value };

      // Handle expiration if provided
      if (expiryMode === 'EX' && typeof time === 'number') {
        item.expireAt = Date.now() + (time * 1000);
      }

      this.store.set(key, item);
      
      if (callback) callback(null, 'OK');
      return 'OK';
    } catch (error) {
      if (callback) callback(error as Error, '');
      throw error;
    }
  }

  /**
   * Simulates Redis SETEX command (SET with expiration)
   * 
   * @param key Key to set
   * @param seconds Expiration time in seconds
   * @param value Value to store
   * @param callback Optional callback function
   * @returns Promise resolving to 'OK' if successful
   */
  async setex(
    key: string,
    seconds: number,
    value: string,
    callback?: (err: Error | null, result: string) => void
  ): Promise<string> {
    try {
      this.checkConnection();

      if (this.errorOptions.commandErrors?.setex) {
        const error = new Error(this.errorOptions.errorMessage || 'Redis SETEX error');
        if (callback) callback(error, '');
        throw error;
      }

      const item: RedisCacheItem = {
        value,
        expireAt: Date.now() + (seconds * 1000)
      };

      this.store.set(key, item);
      
      if (callback) callback(null, 'OK');
      return 'OK';
    } catch (error) {
      if (callback) callback(error as Error, '');
      throw error;
    }
  }

  /**
   * Simulates Redis DEL command
   * 
   * @param key Key to delete
   * @param callback Optional callback function
   * @returns Promise resolving to 1 if key was deleted, 0 if key didn't exist
   */
  async del(
    key: string,
    callback?: (err: Error | null, result: number) => void
  ): Promise<number> {
    try {
      this.checkConnection();

      if (this.errorOptions.commandErrors?.del) {
        const error = new Error(this.errorOptions.errorMessage || 'Redis DEL error');
        if (callback) callback(error, 0);
        throw error;
      }

      const existed = this.store.has(key);
      this.store.delete(key);
      
      const result = existed ? 1 : 0;
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error as Error, 0);
      throw error;
    }
  }

  /**
   * Simulates Redis EXISTS command
   * 
   * @param key Key to check
   * @param callback Optional callback function
   * @returns Promise resolving to 1 if key exists, 0 if not
   */
  async exists(
    key: string,
    callback?: (err: Error | null, result: number) => void
  ): Promise<number> {
    try {
      this.checkConnection();

      if (this.errorOptions.commandErrors?.exists) {
        const error = new Error(this.errorOptions.errorMessage || 'Redis EXISTS error');
        if (callback) callback(error, 0);
        throw error;
      }

      const result = this.store.has(key) ? 1 : 0;
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error as Error, 0);
      throw error;
    }
  }

  /**
   * Simulates Redis TTL command
   * 
   * @param key Key to check TTL for
   * @param callback Optional callback function
   * @returns Promise resolving to TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(
    key: string,
    callback?: (err: Error | null, result: number) => void
  ): Promise<number> {
    try {
      this.checkConnection();

      if (this.errorOptions.commandErrors?.ttl) {
        const error = new Error(this.errorOptions.errorMessage || 'Redis TTL error');
        if (callback) callback(error, 0);
        throw error;
      }

      const item = this.store.get(key);
      
      let result: number;
      if (!item) {
        result = -2; // Key doesn't exist
      } else if (!item.expireAt) {
        result = -1; // Key exists but has no expiry
      } else {
        // Calculate remaining time in seconds
        const remainingMs = item.expireAt - Date.now();
        result = Math.ceil(remainingMs / 1000);
        
        // If key has expired but hasn't been cleaned up yet
        if (result <= 0) {
          this.store.delete(key);
          result = -2;
        }
      }
      
      if (callback) callback(null, result);
      return result;
    } catch (error) {
      if (callback) callback(error as Error, 0);
      throw error;
    }
  }

  /**
   * Simulates Redis PING command
   * 
   * @param callback Optional callback function
   * @returns Promise resolving to 'PONG' if successful
   */
  async ping(callback?: (err: Error | null, result: string) => void): Promise<string> {
    try {
      this.checkConnection();

      if (this.errorOptions.commandErrors?.ping) {
        const error = new Error(this.errorOptions.errorMessage || 'Redis PING error');
        if (callback) callback(error, '');
        throw error;
      }
      
      if (callback) callback(null, 'PONG');
      return 'PONG';
    } catch (error) {
      if (callback) callback(error as Error, '');
      throw error;
    }
  }

  /**
   * Simulates Redis QUIT command
   * 
   * @param callback Optional callback function
   * @returns Promise resolving to 'OK' if successful
   */
  async quit(callback?: (err: Error | null, result: string) => void): Promise<string> {
    try {
      if (this.expirationCheckInterval) {
        clearInterval(this.expirationCheckInterval);
        this.expirationCheckInterval = null;
      }
      
      this.connected = false;
      this.emit('end');
      
      if (callback) callback(null, 'OK');
      return 'OK';
    } catch (error) {
      if (callback) callback(error as Error, '');
      throw error;
    }
  }

  /**
   * Simulates Redis SUBSCRIBE command
   * 
   * @param channel Channel to subscribe to
   * @param callback Optional callback function
   * @returns Promise resolving to number of subscribed channels
   */
  async subscribe(
    channel: string,
    callback?: (err: Error | null, count: number) => void
  ): Promise<number> {
    try {
      this.checkConnection();
      
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, new Set());
      }
      
      const count = this.subscribers.size;
      this.emit('subscribe', channel, count);
      
      if (callback) callback(null, count);
      return count;
    } catch (error) {
      if (callback) callback(error as Error, 0);
      throw error;
    }
  }

  /**
   * Simulates Redis PUBLISH command
   * 
   * @param channel Channel to publish to
   * @param message Message to publish
   * @param callback Optional callback function
   * @returns Promise resolving to number of clients that received the message
   */
  async publish(
    channel: string,
    message: string,
    callback?: (err: Error | null, count: number) => void
  ): Promise<number> {
    try {
      this.checkConnection();
      
      const subscribers = this.subscribers.get(channel);
      const count = subscribers ? subscribers.size : 0;
      
      if (subscribers) {
        // Emit message event to all subscribers
        this.emit('message', channel, message);
      }
      
      if (callback) callback(null, count);
      return count;
    } catch (error) {
      if (callback) callback(error as Error, 0);
      throw error;
    }
  }

  /**
   * Simulates Redis UNSUBSCRIBE command
   * 
   * @param channel Channel to unsubscribe from
   * @param callback Optional callback function
   * @returns Promise resolving to number of remaining subscribed channels
   */
  async unsubscribe(
    channel: string,
    callback?: (err: Error | null, count: number) => void
  ): Promise<number> {
    try {
      this.checkConnection();
      
      this.subscribers.delete(channel);
      const count = this.subscribers.size;
      
      this.emit('unsubscribe', channel, count);
      
      if (callback) callback(null, count);
      return count;
    } catch (error) {
      if (callback) callback(error as Error, 0);
      throw error;
    }
  }

  /**
   * Checks if the mock Redis client is connected
   * Throws an error if not connected
   */
  private checkConnection(): void {
    if (!this.connected) {
      throw new Error('Redis connection closed');
    }
  }

  /**
   * Test helper: Manually expire a key
   * 
   * @param key Key to expire
   * @returns true if the key was found and expired, false otherwise
   */
  forceExpire(key: string): boolean {
    const item = this.store.get(key);
    if (item) {
      this.store.delete(key);
      this.emit('expired', key);
      return true;
    }
    return false;
  }

  /**
   * Test helper: Manually set a key's expiration time
   * 
   * @param key Key to set expiration for
   * @param seconds Time in seconds until expiration
   * @returns true if the key was found and expiration was set, false otherwise
   */
  forceSetExpiry(key: string, seconds: number): boolean {
    const item = this.store.get(key);
    if (item) {
      item.expireAt = Date.now() + (seconds * 1000);
      return true;
    }
    return false;
  }

  /**
   * Test helper: Get all keys in the store
   * 
   * @returns Array of all keys
   */
  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Test helper: Clear all keys from the store
   */
  flushAll(): void {
    this.store.clear();
  }

  /**
   * Test helper: Simulate a connection error
   * 
   * @param message Error message
   */
  simulateConnectionError(message: string = 'Redis connection error'): void {
    this.connected = false;
    this.emit('error', new Error(message));
  }

  /**
   * Test helper: Simulate reconnection
   */
  simulateReconnection(): void {
    this.connected = true;
    this.emit('reconnecting');
    setTimeout(() => {
      this.emit('connect');
      this.emit('ready');
    }, 10);
  }

  /**
   * Test helper: Update error simulation options
   * 
   * @param options New error options
   */
  setErrorOptions(options: RedisErrorOptions): void {
    this.errorOptions = options;
  }
}

/**
 * Factory function to create a new RedisMock instance
 * 
 * @param errorOptions Options for simulating Redis errors
 * @returns New RedisMock instance
 */
export function createRedisMock(errorOptions: RedisErrorOptions = {}): RedisMock {
  return new RedisMock(errorOptions);
}