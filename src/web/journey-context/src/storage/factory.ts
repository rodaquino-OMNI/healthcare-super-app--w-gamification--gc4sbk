/**
 * Journey Storage Factory
 * 
 * This module provides a factory function that creates the appropriate IJourneyStorage
 * implementation based on the runtime platform. It determines if the code is running
 * in a web or mobile environment and instantiates either WebJourneyStorage or
 * MobileJourneyStorage accordingly.
 * 
 * The factory supports configuration options for customizing storage behavior per platform.
 */

import { Platform } from 'react-native';
import { IJourneyStorage, StorageOptions } from './interface';
import { WebJourneyStorage } from './web';
import { MobileJourneyStorage } from './mobile';

/**
 * Platform detection options
 */
export interface PlatformDetectionOptions {
  /**
   * Force a specific platform regardless of detection
   * Useful for testing or specific environments
   */
  forcePlatform?: 'web' | 'mobile' | null;
  
  /**
   * Custom platform detection function
   * If provided, this function will be used instead of the default detection logic
   */
  detectPlatform?: () => 'web' | 'mobile';
}

/**
 * Factory options for creating a journey storage instance
 */
export interface JourneyStorageFactoryOptions extends StorageOptions, PlatformDetectionOptions {}

/**
 * Detects the current platform (web or mobile)
 * 
 * @returns The detected platform: 'web' or 'mobile'
 */
export function detectPlatform(): 'web' | 'mobile' {
  // First try using React Native's Platform API
  try {
    // If Platform.OS is defined, we're in a React Native environment
    if (Platform && Platform.OS) {
      return 'mobile';
    }
  } catch (e) {
    // Platform is not available, continue with other detection methods
  }
  
  // Check for React Native environment using navigator.product
  // This is a fallback for environments where Platform API might not be available
  if (
    typeof navigator !== 'undefined' && 
    navigator.product === 'ReactNative'
  ) {
    return 'mobile';
  }
  
  // Check for window object (browser environment)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web';
  }
  
  // Default to web for server-side rendering environments
  // This ensures Next.js SSR doesn't break
  return 'web';
}

/**
 * Creates a platform-appropriate journey storage implementation
 * 
 * @param options - Configuration options for the storage implementation
 * @returns An implementation of IJourneyStorage for the current platform
 */
export function createJourneyStorage(options: JourneyStorageFactoryOptions = {}): IJourneyStorage {
  // Determine which platform to use
  const platform = options.forcePlatform || 
    (options.detectPlatform ? options.detectPlatform() : detectPlatform());
  
  // Extract storage-specific options (excluding platform detection options)
  const storageOptions: StorageOptions = {
    namespace: options.namespace,
    defaultExpiration: options.defaultExpiration,
    encryptionKey: options.encryptionKey,
    useSessionStorage: options.useSessionStorage,
    persistenceLevel: options.persistenceLevel
  };
  
  // Create the appropriate storage implementation
  switch (platform) {
    case 'mobile':
      return new MobileJourneyStorage(storageOptions);
    case 'web':
    default:
      return new WebJourneyStorage(storageOptions);
  }
}

/**
 * Determines if the current environment is a web browser
 * Utility function for conditional logic based on platform
 * 
 * @returns True if running in a web browser, false otherwise
 */
export function isWebBrowser(): boolean {
  return detectPlatform() === 'web';
}

/**
 * Determines if the current environment is React Native
 * Utility function for conditional logic based on platform
 * 
 * @returns True if running in React Native, false otherwise
 */
export function isReactNative(): boolean {
  return detectPlatform() === 'mobile';
}

/**
 * Select a value based on the current platform
 * Similar to Platform.select but works across both web and mobile
 * 
 * @param obj - An object with platform-specific values
 * @returns The value for the current platform or undefined if not found
 */
export function selectByPlatform<T>(obj: { web?: T; mobile?: T; default?: T }): T | undefined {
  const platform = detectPlatform();
  return obj[platform] || obj.default;
}