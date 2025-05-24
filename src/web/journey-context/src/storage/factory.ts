/**
 * Factory for creating the appropriate IJourneyStorage implementation
 * based on the runtime platform (web or mobile).
 */

import { Platform } from 'react-native';
import type { IJourneyStorage } from './interface';
import type { StorageOptions } from './types';

// Forward declarations of implementations to avoid circular dependencies
// These will be dynamically imported when needed
declare const WebJourneyStorage: {
  new (options?: StorageOptions): IJourneyStorage;
};

declare const MobileJourneyStorage: {
  new (options?: StorageOptions): IJourneyStorage;
};

/**
 * Configuration options for the storage factory
 */
export interface StorageFactoryOptions extends StorageOptions {
  /**
   * Force a specific platform implementation regardless of runtime detection
   * Useful for testing or specific override scenarios
   */
  forcePlatform?: 'web' | 'mobile';
}

/**
 * Detects whether the code is running in a web browser or React Native environment
 * @returns 'web' if running in a browser, 'mobile' if running in React Native
 */
export function detectPlatform(): 'web' | 'mobile' {
  // Primary detection using React Native's Platform API
  try {
    if (Platform.OS === 'web') {
      return 'web';
    } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
      return 'mobile';
    }
  } catch (e) {
    // Platform API not available, fall back to feature detection
  }

  // Fallback detection using global objects
  if (typeof document !== 'undefined') {
    return 'web';
  } else if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'mobile';
  }

  // Default to web if detection fails
  console.warn('Platform detection failed, defaulting to web storage implementation');
  return 'web';
}

/**
 * Creates the appropriate IJourneyStorage implementation based on the runtime platform
 * @param options Configuration options for the storage implementation
 * @returns An instance of IJourneyStorage appropriate for the current platform
 */
export async function createJourneyStorage(options?: StorageFactoryOptions): Promise<IJourneyStorage> {
  const platform = options?.forcePlatform || detectPlatform();

  try {
    if (platform === 'web') {
      // Dynamically import the web implementation to avoid circular dependencies
      const { WebJourneyStorage } = await import('./web');
      return new WebJourneyStorage(options);
    } else {
      // Dynamically import the mobile implementation to avoid circular dependencies
      const { MobileJourneyStorage } = await import('./mobile');
      return new MobileJourneyStorage(options);
    }
  } catch (error) {
    console.error(`Failed to create storage implementation for platform: ${platform}`, error);
    throw new Error(`Failed to initialize journey storage for platform: ${platform}`);
  }
}

/**
 * Synchronous version of createJourneyStorage that doesn't use dynamic imports
 * This is useful for contexts where async initialization isn't possible
 * Note: This requires both implementations to be bundled
 * @param options Configuration options for the storage implementation
 * @returns An instance of IJourneyStorage appropriate for the current platform
 */
export function createJourneyStorageSync(options?: StorageFactoryOptions): IJourneyStorage {
  const platform = options?.forcePlatform || detectPlatform();

  try {
    if (platform === 'web') {
      // Require the web implementation
      // Note: This relies on the bundler to include the implementation
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { WebJourneyStorage } = require('./web');
      return new WebJourneyStorage(options);
    } else {
      // Require the mobile implementation
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { MobileJourneyStorage } = require('./mobile');
      return new MobileJourneyStorage(options);
    }
  } catch (error) {
    console.error(`Failed to create storage implementation for platform: ${platform}`, error);
    throw new Error(`Failed to initialize journey storage for platform: ${platform}`);
  }
}

export default createJourneyStorage;