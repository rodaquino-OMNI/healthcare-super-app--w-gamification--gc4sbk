/**
 * @file Environment Restoration Utilities
 * 
 * This module provides utilities for restoring the Node.js process.env to its
 * original state after tests that mock environment variables. These utilities
 * ensure test isolation by preventing environment changes from leaking between
 * tests.
 */

import { EnvSnapshot } from './mock-env';

/**
 * Error message constants
 */
const ERROR_MESSAGES = {
  INVALID_SNAPSHOT: 'Invalid environment snapshot provided for restoration',
  NO_CHANGES: 'No environment changes detected to restore',
  MISSING_SNAPSHOT: 'Environment snapshot is required for restoration',
};

/**
 * Options for environment restoration setup
 */
export interface EnvRestorationOptions {
  /**
   * Use Jest's afterEach hook for automatic restoration
   * @default false
   */
  useAfterEach?: boolean;
  
  /**
   * Use Jest's afterAll hook for automatic restoration
   * @default false
   */
  useAfterAll?: boolean;
  
  /**
   * Throw an error if no environment changes were detected
   * @default false
   */
  throwOnNoChanges?: boolean;
  
  /**
   * Verify that the environment was properly mocked before restoration
   * @default true
   */
  verifyMocked?: boolean;
}

/**
 * Verify that the environment has been properly mocked before restoration.
 * This helps prevent accidental restoration of an unmocked environment.
 *
 * @param snapshot - The environment snapshot to verify
 * @throws Error if the environment snapshot is invalid or not from a mocked environment
 */
export function verifyMockedEnvironment(snapshot: EnvSnapshot): void {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error(ERROR_MESSAGES.INVALID_SNAPSHOT);
  }
  
  if (!snapshot.originalEnv || typeof snapshot.originalEnv !== 'object') {
    throw new Error(ERROR_MESSAGES.INVALID_SNAPSHOT);
  }
  
  // Check if any changes were made to the environment
  const hasChanges = Object.keys(snapshot.originalEnv).length > 0;
  
  if (!hasChanges) {
    throw new Error(ERROR_MESSAGES.NO_CHANGES);
  }
}

/**
 * Restore the environment to its original state after testing.
 * This function will reset all environment variables that were modified
 * during testing to their original values.
 *
 * @param snapshot - The environment snapshot to restore from
 * @param options - Optional configuration for the restoration behavior
 * @throws Error if the snapshot is invalid or if verification fails
 */
export function restoreEnv(
  snapshot: EnvSnapshot,
  options: { throwOnNoChanges?: boolean; verifyMocked?: boolean } = {}
): void {
  if (!snapshot) {
    throw new Error(ERROR_MESSAGES.MISSING_SNAPSHOT);
  }
  
  const { throwOnNoChanges = false, verifyMocked = true } = options;
  
  // Verify the environment was properly mocked if required
  if (verifyMocked) {
    try {
      verifyMockedEnvironment(snapshot);
    } catch (error) {
      if (throwOnNoChanges || error.message !== ERROR_MESSAGES.NO_CHANGES) {
        throw error;
      }
      // If we're not throwing on no changes and that's the only issue, just return
      return;
    }
  }
  
  const { originalEnv } = snapshot;
  
  // Restore all environment variables to their original state
  Object.keys(originalEnv).forEach((key) => {
    const originalValue = originalEnv[key];
    
    if (originalValue === undefined) {
      // If the variable didn't exist before, delete it
      delete process.env[key];
    } else {
      // Otherwise restore it to its original value
      process.env[key] = originalValue;
    }
  });
}

/**
 * Restore specific environment variables to their original values.
 * This allows for selective restoration when only certain variables
 * need to be reset while keeping others modified.
 *
 * @param snapshot - The environment snapshot to restore from
 * @param keys - Array of environment variable names to restore
 * @param options - Optional configuration for the restoration behavior
 * @throws Error if the snapshot is invalid or if verification fails
 */
export function restoreEnvVariables(
  snapshot: EnvSnapshot,
  keys: string[],
  options: { throwOnNoChanges?: boolean; verifyMocked?: boolean } = {}
): void {
  if (!snapshot) {
    throw new Error(ERROR_MESSAGES.MISSING_SNAPSHOT);
  }
  
  const { throwOnNoChanges = false, verifyMocked = true } = options;
  
  // Verify the environment was properly mocked if required
  if (verifyMocked) {
    try {
      verifyMockedEnvironment(snapshot);
    } catch (error) {
      if (throwOnNoChanges || error.message !== ERROR_MESSAGES.NO_CHANGES) {
        throw error;
      }
      // If we're not throwing on no changes and that's the only issue, just return
      return;
    }
  }
  
  const { originalEnv } = snapshot;
  
  // Only restore the specified environment variables
  keys.forEach((key) => {
    // Skip keys that weren't in the original snapshot
    if (!(key in originalEnv)) {
      return;
    }
    
    const originalValue = originalEnv[key];
    
    if (originalValue === undefined) {
      // If the variable didn't exist before, delete it
      delete process.env[key];
    } else {
      // Otherwise restore it to its original value
      process.env[key] = originalValue;
    }
  });
}

/**
 * Set up automatic environment restoration with Jest afterEach/afterAll hooks.
 * This utility simplifies test setup by automatically restoring the environment
 * after each test or after all tests in a suite.
 *
 * @param options - Configuration options for the restoration behavior
 * @throws Error if both useAfterEach and useAfterAll are true
 */
export function setupEnvRestoration(options: EnvRestorationOptions = {}): void {
  const {
    useAfterEach = false,
    useAfterAll = false,
    throwOnNoChanges = false,
    verifyMocked = true,
  } = options;
  
  // Ensure we're in a Jest environment
  if (typeof afterEach !== 'function' || typeof afterAll !== 'function') {
    throw new Error('setupEnvRestoration requires Jest testing environment');
  }
  
  // Prevent setting up both hooks simultaneously
  if (useAfterEach && useAfterAll) {
    throw new Error('Cannot use both afterEach and afterAll hooks simultaneously');
  }
  
  // Set up a shared snapshot that will be updated by mock functions
  let currentSnapshot: EnvSnapshot | null = null;
  
  // Monkey patch the global process.env to capture changes
  const originalEnvDescriptor = Object.getOwnPropertyDescriptor(process, 'env');
  let envProxy = new Proxy(process.env, {
    set(target, prop, value) {
      // When a property is set, capture the original value if not already captured
      if (currentSnapshot && typeof prop === 'string' && !(prop in currentSnapshot.originalEnv)) {
        currentSnapshot.originalEnv[prop] = target[prop];
      }
      return Reflect.set(target, prop, value);
    },
    deleteProperty(target, prop) {
      // When a property is deleted, capture the original value if not already captured
      if (currentSnapshot && typeof prop === 'string' && !(prop in currentSnapshot.originalEnv)) {
        currentSnapshot.originalEnv[prop] = target[prop];
      }
      return Reflect.deleteProperty(target, prop);
    },
  });
  
  // Replace process.env with our proxy
  Object.defineProperty(process, 'env', {
    configurable: true,
    enumerable: true,
    get() {
      return envProxy;
    },
    set(value) {
      envProxy = new Proxy(value, envProxy);
    },
  });
  
  // Set up the appropriate Jest hook
  if (useAfterEach) {
    beforeEach(() => {
      // Create a new snapshot for each test
      currentSnapshot = { originalEnv: {} };
    });
    
    afterEach(() => {
      // Restore the environment after each test
      if (currentSnapshot) {
        restoreEnv(currentSnapshot, { throwOnNoChanges, verifyMocked });
        currentSnapshot = null;
      }
    });
  } else if (useAfterAll) {
    beforeAll(() => {
      // Create a single snapshot for the entire test suite
      currentSnapshot = { originalEnv: {} };
    });
    
    afterAll(() => {
      // Restore the environment after all tests
      if (currentSnapshot) {
        restoreEnv(currentSnapshot, { throwOnNoChanges, verifyMocked });
        currentSnapshot = null;
      }
      
      // Restore the original process.env descriptor
      if (originalEnvDescriptor) {
        Object.defineProperty(process, 'env', originalEnvDescriptor);
      }
    });
  }
}