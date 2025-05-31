import { EventEmitter } from 'events';

/**
 * Interface for Redis mock storage entry
 */
interface RedisMockEntry {
  value: string;
  expireAt?: number;
}

/**
 * Interface for Redis mock configuration
 */
export interface RedisMockOptions {
  /**
   * Whether to simulate network delays
   * @default false
   */
  simulateNetworkDelay?: boolean;

  /**
   * Network delay in milliseconds
   * @default 10
   */
  networkDelay?: number;

  /**
   * Whether to simulate random errors
   * @default false
   */
  simulateErrors?: boolean;

  /**
   * Error rate (0-1) - probability of an operation failing
   * @default 0.1
   */
  errorRate?: number;

  /**
   * Whether to log operations
   * @default false
   */
  enableLogging?: boolean;
}

/**
 * Mock implementation of Redis client for testing
 * 
 * This class simulates Redis operations with an in-memory store,
 * allowing for testing of Redis-dependent code without an actual Redis instance.
 */
export class RedisMock extends EventEmitter {
  private store: Map<string, RedisMockEntry> = new Map();
  private options: RedisMockOptions;
  private subscriptions: Map<string, Set<(message: string, channel: string) => void>> = new Map();
  private connected: boolean = true;
  private expirationCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Creates an instance of RedisMock
   * @param options Configuration options for the mock
   */
  constructor(options: RedisMockOptions = {}) {
    super();
    this.options = {
      simulateNetworkDelay: false,
      networkDelay: 10,
      simulateErrors: false,
      errorRate: 0.1,
      enableLogging: false,
      ...options,
    };

    // Start expiration check interval
    this.startExpirationCheck();

    // Emit connect event on next tick
    process.nextTick(() => {
      this.emit('connect');
    });
  }

  /**
   * Starts the interval to check for expired keys
   * @private
   */
  private startExpirationCheck(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
    }

    // Check for expired keys every second
    this.expirationCheckInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.expireAt && entry.expireAt <= now) {
          this.store.delete(key);
          this.log(`Key expired: ${key}`);
        }
      }
    }, 1000);
  }

  /**
   * Stops the expiration check interval
   * @private
   */
  private stopExpirationCheck(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = null;
    }
  }

  /**
   * Logs a message if logging is enabled
   * @param message Message to log
   * @private
   */
  private log(message: string): void {
    if (this.options.enableLogging) {
      console.log(`[RedisMock] ${message}`);
    }
  }

  /**
   * Simulates a network delay if configured
   * @returns Promise that resolves after the delay
   * @private
   */
  private async simulateDelay(): Promise<void> {
    if (this.options.simulateNetworkDelay) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, this.options.networkDelay);
      });
    }
  }

  /**
   * Simulates a random error if configured
   * @param operation Name of the operation
   * @throws Error if simulation triggers an error
   * @private
   */
  private simulateError(operation: string): void {
    if (this.options.simulateErrors && Math.random() < this.options.errorRate) {
      const error = new Error(`Simulated Redis error during ${operation}`);
      this.log(`Simulated error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Checks if the client is connected
   * @throws Error if not connected
   * @private
   */
  private checkConnection(): void {
    if (!this.connected) {
      const error = new Error('Connection is closed');
      this.log(`Connection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sets a key-value pair in the store
   * @param key Key to set
   * @param value Value to set
   * @param expiryMode Expiry mode (EX, PX, etc.)
   * @param time Time until expiration
   * @returns Promise resolving to 'OK'
   */
  async set(key: string, value: string, expiryMode?: string, time?: number): Promise<'OK'> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('set');

    const entry: RedisMockEntry = { value };

    // Handle expiration
    if (expiryMode && time) {
      let expireAt: number;

      switch (expiryMode.toUpperCase()) {
        case 'EX': // Seconds
          expireAt = Date.now() + time * 1000;
          break;
        case 'PX': // Milliseconds
          expireAt = Date.now() + time;
          break;
        default:
          expireAt = Date.now() + time * 1000; // Default to seconds
      }

      entry.expireAt = expireAt;
      this.log(`Set key ${key} with expiration in ${time} ${expiryMode}`);
    } else {
      this.log(`Set key ${key} without expiration`);
    }

    this.store.set(key, entry);
    return 'OK';
  }

  /**
   * Gets a value from the store
   * @param key Key to get
   * @returns Promise resolving to the value or null if not found
   */
  async get(key: string): Promise<string | null> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('get');

    const entry = this.store.get(key);
    if (!entry) {
      this.log(`Get key ${key}: not found`);
      return null;
    }

    // Check if the key has expired
    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      this.log(`Get key ${key}: expired`);
      return null;
    }

    this.log(`Get key ${key}: found`);
    return entry.value;
  }

  /**
   * Checks if a key exists in the store
   * @param key Key to check
   * @returns Promise resolving to 1 if the key exists, 0 otherwise
   */
  async exists(key: string): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('exists');

    const entry = this.store.get(key);
    if (!entry) {
      this.log(`Exists key ${key}: not found`);
      return 0;
    }

    // Check if the key has expired
    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      this.log(`Exists key ${key}: expired`);
      return 0;
    }

    this.log(`Exists key ${key}: found`);
    return 1;
  }

  /**
   * Deletes keys from the store
   * @param keys Keys to delete
   * @returns Promise resolving to the number of keys deleted
   */
  async del(...keys: string[]): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('del');

    let deletedCount = 0;
    for (const key of keys) {
      if (this.store.has(key)) {
        this.store.delete(key);
        deletedCount++;
      }
    }

    this.log(`Deleted ${deletedCount} keys`);
    return deletedCount;
  }

  /**
   * Gets all keys matching a pattern
   * @param pattern Pattern to match (supports * wildcard)
   * @returns Promise resolving to an array of matching keys
   */
  async keys(pattern: string): Promise<string[]> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('keys');

    const now = Date.now();
    const matchingKeys: string[] = [];

    // Convert Redis pattern to RegExp
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\[([^\]]*)\]/g, (match, chars) => `[${chars}]`);
    const regex = new RegExp(`^${regexPattern}$`);

    for (const [key, entry] of this.store.entries()) {
      // Skip expired keys
      if (entry.expireAt && entry.expireAt <= now) {
        this.store.delete(key);
        continue;
      }

      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }

    this.log(`Keys matching ${pattern}: found ${matchingKeys.length} keys`);
    return matchingKeys;
  }

  /**
   * Sets a key's time to live in seconds
   * @param key Key to set expiration for
   * @param seconds Time to live in seconds
   * @returns Promise resolving to 1 if the timeout was set, 0 otherwise
   */
  async expire(key: string, seconds: number): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('expire');

    const entry = this.store.get(key);
    if (!entry) {
      this.log(`Expire key ${key}: not found`);
      return 0;
    }

    // Check if the key has already expired
    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      this.log(`Expire key ${key}: already expired`);
      return 0;
    }

    // Set new expiration
    entry.expireAt = Date.now() + seconds * 1000;
    this.log(`Expire key ${key}: set to ${seconds} seconds`);
    return 1;
  }

  /**
   * Sets a key's time to live in milliseconds
   * @param key Key to set expiration for
   * @param milliseconds Time to live in milliseconds
   * @returns Promise resolving to 1 if the timeout was set, 0 otherwise
   */
  async pexpire(key: string, milliseconds: number): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('pexpire');

    const entry = this.store.get(key);
    if (!entry) {
      this.log(`PExpire key ${key}: not found`);
      return 0;
    }

    // Check if the key has already expired
    if (entry.expireAt && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      this.log(`PExpire key ${key}: already expired`);
      return 0;
    }

    // Set new expiration
    entry.expireAt = Date.now() + milliseconds;
    this.log(`PExpire key ${key}: set to ${milliseconds} milliseconds`);
    return 1;
  }

  /**
   * Gets the time to live for a key in seconds
   * @param key Key to get TTL for
   * @returns Promise resolving to TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('ttl');

    const entry = this.store.get(key);
    if (!entry) {
      this.log(`TTL key ${key}: not found`);
      return -2;
    }

    if (!entry.expireAt) {
      this.log(`TTL key ${key}: no expiry`);
      return -1;
    }

    const ttlMs = entry.expireAt - Date.now();
    if (ttlMs <= 0) {
      this.store.delete(key);
      this.log(`TTL key ${key}: expired`);
      return -2;
    }

    const ttlSeconds = Math.ceil(ttlMs / 1000);
    this.log(`TTL key ${key}: ${ttlSeconds} seconds`);
    return ttlSeconds;
  }

  /**
   * Gets the time to live for a key in milliseconds
   * @param key Key to get TTL for
   * @returns Promise resolving to TTL in milliseconds, -1 if no expiry, -2 if key doesn't exist
   */
  async pttl(key: string): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('pttl');

    const entry = this.store.get(key);
    if (!entry) {
      this.log(`PTTL key ${key}: not found`);
      return -2;
    }

    if (!entry.expireAt) {
      this.log(`PTTL key ${key}: no expiry`);
      return -1;
    }

    const ttlMs = entry.expireAt - Date.now();
    if (ttlMs <= 0) {
      this.store.delete(key);
      this.log(`PTTL key ${key}: expired`);
      return -2;
    }

    this.log(`PTTL key ${key}: ${ttlMs} milliseconds`);
    return ttlMs;
  }

  /**
   * Subscribes to a channel
   * @param channel Channel to subscribe to
   * @param callback Callback to call when a message is received
   * @returns Promise resolving to number of subscriptions
   */
  async subscribe(channel: string, callback?: (message: string, channel: string) => void): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('subscribe');

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }

    if (callback) {
      this.subscriptions.get(channel)!.add(callback);
    }

    this.log(`Subscribed to channel ${channel}`);
    this.emit('subscribe', channel, this.subscriptions.size);
    return this.subscriptions.size;
  }

  /**
   * Unsubscribes from a channel
   * @param channel Channel to unsubscribe from
   * @param callback Specific callback to remove (if not provided, removes all callbacks)
   * @returns Promise resolving to number of remaining subscriptions
   */
  async unsubscribe(channel: string, callback?: (message: string, channel: string) => void): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('unsubscribe');

    if (!this.subscriptions.has(channel)) {
      this.log(`Unsubscribe from channel ${channel}: not subscribed`);
      return this.subscriptions.size;
    }

    if (callback) {
      this.subscriptions.get(channel)!.delete(callback);
      if (this.subscriptions.get(channel)!.size === 0) {
        this.subscriptions.delete(channel);
      }
    } else {
      this.subscriptions.delete(channel);
    }

    this.log(`Unsubscribed from channel ${channel}`);
    this.emit('unsubscribe', channel, this.subscriptions.size);
    return this.subscriptions.size;
  }

  /**
   * Publishes a message to a channel
   * @param channel Channel to publish to
   * @param message Message to publish
   * @returns Promise resolving to number of clients that received the message
   */
  async publish(channel: string, message: string): Promise<number> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('publish');

    const subscribers = this.subscriptions.get(channel);
    if (!subscribers || subscribers.size === 0) {
      this.log(`Publish to channel ${channel}: no subscribers`);
      return 0;
    }

    for (const callback of subscribers) {
      try {
        callback(message, channel);
      } catch (error) {
        this.log(`Error in subscriber callback: ${error}`);
      }
    }

    this.log(`Published to channel ${channel}: ${subscribers.size} subscribers`);
    this.emit('message', channel, message);
    return subscribers.size;
  }

  /**
   * Flushes all data from the store
   * @returns Promise resolving to 'OK'
   */
  async flushall(): Promise<'OK'> {
    await this.simulateDelay();
    this.checkConnection();
    this.simulateError('flushall');

    const keyCount = this.store.size;
    this.store.clear();
    this.log(`Flushed all keys (${keyCount} keys)`);
    return 'OK';
  }

  /**
   * Simulates a connection error
   */
  simulateConnectionError(): void {
    this.connected = false;
    this.emit('error', new Error('Simulated connection error'));
  }

  /**
   * Simulates a connection recovery
   */
  simulateConnectionRecovery(): void {
    this.connected = true;
    this.emit('connect');
  }

  /**
   * Closes the Redis connection
   * @returns Promise resolving when closed
   */
  async quit(): Promise<'OK'> {
    this.connected = false;
    this.stopExpirationCheck();
    this.emit('end');
    this.log('Connection closed');
    return 'OK';
  }

  /**
   * Gets the current state of the store (for testing/debugging)
   * @returns Map of all keys and values in the store
   */
  getStore(): Map<string, RedisMockEntry> {
    return new Map(this.store);
  }

  /**
   * Gets all keys in the store (for testing/debugging)
   * @returns Array of all keys in the store
   */
  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Gets all values in the store (for testing/debugging)
   * @returns Array of all values in the store
   */
  getAllValues(): string[] {
    return Array.from(this.store.values()).map(entry => entry.value);
  }

  /**
   * Updates the mock options
   * @param options New options to apply
   */
  updateOptions(options: Partial<RedisMockOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
    this.log('Updated options');
  }

  /**
   * Simulates a specific error on the next operation
   * @param operation Operation to fail (or 'any' for any operation)
   * @param error Error to throw
   */
  failNextOperation(operation: string = 'any', error: Error = new Error('Simulated error')): void {
    const originalSimulateError = this.simulateError.bind(this);
    let hasExecuted = false;

    this.simulateError = (op: string) => {
      if (!hasExecuted && (operation === 'any' || operation === op)) {
        hasExecuted = true;
        // Restore original function
        this.simulateError = originalSimulateError;
        this.log(`Failing operation ${op} with error: ${error.message}`);
        throw error;
      }
    };
  }

  /**
   * Simulates a slow operation
   * @param operation Operation to slow down (or 'any' for any operation)
   * @param delayMs Delay in milliseconds
   */
  slowDownNextOperation(operation: string = 'any', delayMs: number = 1000): void {
    const originalSimulateDelay = this.simulateDelay.bind(this);
    let hasExecuted = false;

    this.simulateDelay = async (op?: string) => {
      if (!hasExecuted && (operation === 'any' || operation === op)) {
        hasExecuted = true;
        // Restore original function
        this.simulateDelay = originalSimulateDelay;
        this.log(`Slowing down operation ${op || 'any'} by ${delayMs}ms`);
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      } else {
        await originalSimulateDelay();
      }
    };
  }
}

/**
 * Factory function to create a Redis mock instance
 * @param options Configuration options for the mock
 * @returns Redis mock instance
 */
export function createRedisMock(options: RedisMockOptions = {}): RedisMock {
  return new RedisMock(options);
}

/**
 * Default export for compatibility with ioredis
 */
export default RedisMock;