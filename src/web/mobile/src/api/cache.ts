/**
 * @file cache.ts
 * @description Simple in-memory cache implementation with TTL support
 * for improved API performance and reduced network requests.
 */

/**
 * Cache options interface
 */
export interface CacheOptions<K, V> {
  /** Time-to-live in milliseconds */
  ttlMs?: number;
  /** Maximum number of items to store in the cache */
  maxSize?: number;
  /** Name of the cache for debugging */
  name?: string;
  /** Optional function to determine cache key from complex objects */
  keyFn?: (key: K) => string;
  /** Optional callback when items are evicted from the cache */
  onEvict?: (key: K, value: V) => void;
}

/**
 * Cache entry with value and expiration time
 */
interface CacheEntry<V> {
  value: V;
  expiresAt: number;
  lastAccessed: number;
}

/**
 * Simple in-memory cache with TTL support
 */
export interface Cache<K, V> {
  /** Get a value from the cache */
  get(key: K): V | undefined;
  /** Set a value in the cache */
  set(key: K, value: V): void;
  /** Check if a key exists in the cache */
  has(key: K): boolean;
  /** Delete a key from the cache */
  delete(key: K): boolean;
  /** Clear all entries from the cache */
  clear(): void;
  /** Get the number of entries in the cache */
  size(): number;
  /** Get all keys in the cache */
  keys(): K[];
}

/**
 * Create a new cache instance
 */
export function createCache<K, V>(options: CacheOptions<K, V> = {}): Cache<K, V> {
  const {
    ttlMs = 60 * 1000, // Default: 1 minute
    maxSize = 100,     // Default: 100 items
    name = 'cache',    // Default: 'cache'
    keyFn = (key: K) => String(key), // Default: convert to string
    onEvict = () => {} // Default: no-op
  } = options;

  // Use Map for O(1) lookups
  const cache = new Map<string, CacheEntry<V>>();
  // Use Map for O(1) access time tracking (for LRU eviction)
  const accessOrder = new Map<string, number>();
  // Counter for access ordering
  let accessCounter = 0;

  /**
   * Clean expired entries from the cache
   */
  const cleanExpired = (): void => {
    const now = Date.now();
    for (const [cacheKey, entry] of cache.entries()) {
      if (entry.expiresAt <= now) {
        // Get the original key for the eviction callback
        const originalKey = Array.from(cache.keys())
          .find(k => keyFn(k as unknown as K) === cacheKey) as unknown as K;
        
        if (originalKey) {
          onEvict(originalKey, entry.value);
        }
        
        cache.delete(cacheKey);
        accessOrder.delete(cacheKey);
      }
    }
  };

  /**
   * Evict least recently used entries when cache exceeds maxSize
   */
  const evictLRU = (): void => {
    if (cache.size <= maxSize) return;

    // Sort by access time (ascending)
    const sortedEntries = Array.from(accessOrder.entries())
      .sort((a, b) => a[1] - b[1]);

    // Calculate how many entries to evict
    const entriesToEvict = Math.ceil(cache.size - maxSize);

    // Evict oldest entries
    for (let i = 0; i < entriesToEvict && i < sortedEntries.length; i++) {
      const [cacheKey] = sortedEntries[i];
      const entry = cache.get(cacheKey);
      
      if (entry) {
        // Get the original key for the eviction callback
        const originalKey = Array.from(cache.keys())
          .find(k => keyFn(k as unknown as K) === cacheKey) as unknown as K;
        
        if (originalKey) {
          onEvict(originalKey, entry.value);
        }
        
        cache.delete(cacheKey);
        accessOrder.delete(cacheKey);
      }
    }
  };

  return {
    get(key: K): V | undefined {
      const cacheKey = keyFn(key);
      const entry = cache.get(cacheKey);
      
      if (!entry) return undefined;
      
      const now = Date.now();
      
      // Check if entry has expired
      if (entry.expiresAt <= now) {
        cache.delete(cacheKey);
        accessOrder.delete(cacheKey);
        onEvict(key, entry.value);
        return undefined;
      }
      
      // Update last accessed time for LRU
      entry.lastAccessed = now;
      accessOrder.set(cacheKey, accessCounter++);
      
      return entry.value;
    },
    
    set(key: K, value: V): void {
      cleanExpired();
      evictLRU();
      
      const cacheKey = keyFn(key);
      const now = Date.now();
      
      cache.set(cacheKey, {
        value,
        expiresAt: now + ttlMs,
        lastAccessed: now
      });
      
      accessOrder.set(cacheKey, accessCounter++);
    },
    
    has(key: K): boolean {
      const cacheKey = keyFn(key);
      const entry = cache.get(cacheKey);
      
      if (!entry) return false;
      
      // Check if entry has expired
      if (entry.expiresAt <= Date.now()) {
        cache.delete(cacheKey);
        accessOrder.delete(cacheKey);
        onEvict(key, entry.value);
        return false;
      }
      
      return true;
    },
    
    delete(key: K): boolean {
      const cacheKey = keyFn(key);
      const entry = cache.get(cacheKey);
      
      if (entry) {
        cache.delete(cacheKey);
        accessOrder.delete(cacheKey);
        return true;
      }
      
      return false;
    },
    
    clear(): void {
      cache.clear();
      accessOrder.clear();
    },
    
    size(): number {
      cleanExpired();
      return cache.size;
    },
    
    keys(): K[] {
      cleanExpired();
      return Array.from(cache.keys()) as unknown as K[];
    }
  };
}

/**
 * Global cache registry for managing multiple caches
 */
const cacheRegistry = new Map<string, Cache<any, any>>();

/**
 * Get or create a cache with the given name
 */
export function getOrCreateCache<K, V>(
  name: string,
  options: Omit<CacheOptions<K, V>, 'name'> = {}
): Cache<K, V> {
  if (cacheRegistry.has(name)) {
    return cacheRegistry.get(name) as Cache<K, V>;
  }
  
  const cache = createCache<K, V>({ ...options, name });
  cacheRegistry.set(name, cache);
  return cache;
}

/**
 * Clear all caches in the registry
 */
export function clearAllCaches(): void {
  for (const cache of cacheRegistry.values()) {
    cache.clear();
  }
}

/**
 * Get all cache names in the registry
 */
export function getCacheNames(): string[] {
  return Array.from(cacheRegistry.keys());
}

/**
 * Get cache statistics
 */
export function getCacheStats(): Record<string, { size: number }> {
  const stats: Record<string, { size: number }> = {};
  
  for (const [name, cache] of cacheRegistry.entries()) {
    stats[name] = { size: cache.size() };
  }
  
  return stats;
}