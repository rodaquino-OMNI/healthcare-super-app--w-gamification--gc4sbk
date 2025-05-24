/**
 * Utilities for restoring the Node.js process.env to its original state after tests
 * that mock environment variables. These utilities ensure test isolation by preventing
 * environment changes from leaking between tests.
 *
 * @module
 */

/**
 * Type representing a snapshot of the environment state
 * Maps environment variable names to their original values or undefined if they didn't exist
 */
type EnvSnapshot = Map<string, string | undefined>;

/**
 * Error thrown when attempting to restore environment without a snapshot
 */
export class NoEnvSnapshotError extends Error {
  constructor() {
    super('Cannot restore environment: No snapshot available. Did you forget to mock the environment first?');
    this.name = 'NoEnvSnapshotError';
  }
}

/**
 * Restores the entire process.env to its original state using a snapshot
 * 
 * @param snapshot - The environment snapshot to restore from
 * @throws {NoEnvSnapshotError} If the snapshot is undefined or null
 * @example
 * ```typescript
 * // In a test file
 * import { mockEnv } from './mock-env';
 * import { restoreEnv } from './restore-env';
 * 
 * const snapshot = mockEnv({ NODE_ENV: 'test' });
 * // Run your test...
 * restoreEnv(snapshot); // Restore original environment
 * ```
 */
export function restoreEnv(snapshot: EnvSnapshot | undefined | null): void {
  if (!snapshot) {
    throw new NoEnvSnapshotError();
  }

  // First, remove any keys that were added during testing
  const currentKeys = Object.keys(process.env);
  const originalKeys = Array.from(snapshot.keys());
  
  // Find keys that exist now but didn't exist in the snapshot
  const addedKeys = currentKeys.filter(key => !snapshot.has(key));
  
  // Remove keys that were added during testing
  for (const key of addedKeys) {
    delete process.env[key];
  }

  // Restore original values for keys that existed in the snapshot
  for (const [key, value] of snapshot.entries()) {
    if (value === undefined) {
      // This key didn't exist before, so remove it
      delete process.env[key];
    } else {
      // Restore the original value
      process.env[key] = value;
    }
  }
}

/**
 * Restores specific environment variables to their original values
 * 
 * @param snapshot - The environment snapshot to restore from
 * @param keys - Array of environment variable keys to restore
 * @throws {NoEnvSnapshotError} If the snapshot is undefined or null
 * @example
 * ```typescript
 * // In a test file
 * import { mockEnv } from './mock-env';
 * import { restoreEnvVars } from './restore-env';
 * 
 * const snapshot = mockEnv({ NODE_ENV: 'test', DEBUG: 'true' });
 * // Run your test...
 * restoreEnvVars(snapshot, ['NODE_ENV']); // Only restore NODE_ENV
 * ```
 */
export function restoreEnvVars(snapshot: EnvSnapshot | undefined | null, keys: string[]): void {
  if (!snapshot) {
    throw new NoEnvSnapshotError();
  }

  for (const key of keys) {
    if (snapshot.has(key)) {
      const originalValue = snapshot.get(key);
      if (originalValue === undefined) {
        // This key didn't exist before, so remove it
        delete process.env[key];
      } else {
        // Restore the original value
        process.env[key] = originalValue;
      }
    }
    // If the key wasn't in the snapshot, it means it wasn't changed by the test,
    // so we don't need to restore it
  }
}

/**
 * Creates a Jest afterEach hook that automatically restores the environment
 * 
 * @param snapshot - The environment snapshot to restore from
 * @returns A function that can be used with Jest's afterEach
 * @throws {NoEnvSnapshotError} If the snapshot is undefined or null
 * @example
 * ```typescript
 * // In a test file
 * import { mockEnv } from './mock-env';
 * import { createAfterEachEnvRestorer } from './restore-env';
 * 
 * describe('My environment tests', () => {
 *   const snapshot = mockEnv({ NODE_ENV: 'test' });
 *   afterEach(createAfterEachEnvRestorer(snapshot));
 *   
 *   // Your tests...
 * });
 * ```
 */
export function createAfterEachEnvRestorer(snapshot: EnvSnapshot | undefined | null): () => void {
  return () => restoreEnv(snapshot);
}

/**
 * Creates a Jest afterAll hook that automatically restores the environment
 * 
 * @param snapshot - The environment snapshot to restore from
 * @returns A function that can be used with Jest's afterAll
 * @throws {NoEnvSnapshotError} If the snapshot is undefined or null
 * @example
 * ```typescript
 * // In a test file
 * import { mockEnv } from './mock-env';
 * import { createAfterAllEnvRestorer } from './restore-env';
 * 
 * describe('My environment tests', () => {
 *   const snapshot = mockEnv({ NODE_ENV: 'test' });
 *   afterAll(createAfterAllEnvRestorer(snapshot));
 *   
 *   // Your tests...
 * });
 * ```
 */
export function createAfterAllEnvRestorer(snapshot: EnvSnapshot | undefined | null): () => void {
  return () => restoreEnv(snapshot);
}

/**
 * Verifies that the environment has been modified since the snapshot was taken
 * Useful for ensuring that your tests are actually modifying the environment as expected
 * 
 * @param snapshot - The environment snapshot to compare against
 * @param keys - Optional array of specific keys to check
 * @returns True if the environment has been modified, false otherwise
 * @throws {NoEnvSnapshotError} If the snapshot is undefined or null
 * @example
 * ```typescript
 * // In a test file
 * import { mockEnv } from './mock-env';
 * import { isEnvModified } from './restore-env';
 * 
 * test('should modify environment', () => {
 *   const snapshot = mockEnv({ NODE_ENV: 'test' });
 *   process.env.NODE_ENV = 'development';
 *   
 *   expect(isEnvModified(snapshot)).toBe(true);
 *   expect(isEnvModified(snapshot, ['NODE_ENV'])).toBe(true);
 *   expect(isEnvModified(snapshot, ['DEBUG'])).toBe(false);
 * });
 * ```
 */
export function isEnvModified(snapshot: EnvSnapshot | undefined | null, keys?: string[]): boolean {
  if (!snapshot) {
    throw new NoEnvSnapshotError();
  }

  if (keys) {
    // Check only specific keys
    return keys.some(key => {
      const originalValue = snapshot.get(key);
      const currentValue = process.env[key];
      
      // If the key didn't exist in the snapshot but exists now, it's modified
      if (originalValue === undefined && currentValue !== undefined) {
        return true;
      }
      
      // If the key existed in the snapshot but doesn't exist now, it's modified
      if (originalValue !== undefined && currentValue === undefined) {
        return true;
      }
      
      // If both exist but have different values, it's modified
      return originalValue !== currentValue;
    });
  } else {
    // Check all keys in the snapshot
    for (const [key, originalValue] of snapshot.entries()) {
      const currentValue = process.env[key];
      
      // If the key didn't exist in the snapshot but exists now, it's modified
      if (originalValue === undefined && currentValue !== undefined) {
        return true;
      }
      
      // If the key existed in the snapshot but doesn't exist now, it's modified
      if (originalValue !== undefined && currentValue === undefined) {
        return true;
      }
      
      // If both exist but have different values, it's modified
      if (originalValue !== currentValue) {
        return true;
      }
    }
    
    // Check if any new keys were added that weren't in the snapshot
    const currentKeys = Object.keys(process.env);
    const originalKeys = Array.from(snapshot.keys());
    const addedKeys = currentKeys.filter(key => !originalKeys.includes(key));
    
    return addedKeys.length > 0;
  }
  
  return false;
}

/**
 * Restores the environment and returns a boolean indicating if it was modified
 * Useful for tests that need to know if their actions modified the environment
 * 
 * @param snapshot - The environment snapshot to restore from
 * @param keys - Optional array of specific keys to check
 * @returns True if the environment was modified before restoration, false otherwise
 * @throws {NoEnvSnapshotError} If the snapshot is undefined or null
 * @example
 * ```typescript
 * // In a test file
 * import { mockEnv } from './mock-env';
 * import { restoreAndCheckModified } from './restore-env';
 * 
 * test('should modify and restore environment', () => {
 *   const snapshot = mockEnv({ NODE_ENV: 'test' });
 *   process.env.NODE_ENV = 'development';
 *   
 *   const wasModified = restoreAndCheckModified(snapshot);
 *   expect(wasModified).toBe(true);
 *   expect(process.env.NODE_ENV).toBe('test'); // Restored
 * });
 * ```
 */
export function restoreAndCheckModified(snapshot: EnvSnapshot | undefined | null, keys?: string[]): boolean {
  const modified = isEnvModified(snapshot, keys);
  restoreEnv(snapshot);
  return modified;
}