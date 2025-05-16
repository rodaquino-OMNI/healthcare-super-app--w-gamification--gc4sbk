/**
 * Platform detection utilities for the journey context package.
 * These utilities help determine the current platform (web or mobile)
 * to enable platform-specific behavior while maintaining a unified API.
 */

/**
 * Type representing the supported platforms
 */
export type Platform = 'web' | 'mobile';

/**
 * Detects the current platform (web or mobile) based on environment checks.
 * 
 * @returns The detected platform: 'web' or 'mobile'
 */
export function detectPlatform(): Platform {
  try {
    // Primary check: React Native specific global
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'mobile';
    }
    
    // Secondary check: React Native specific APIs
    if (
      typeof global !== 'undefined' && 
      ((global as any).ReactNative || (global as any).__REACT_NATIVE_DEVTOOLS_GLOBAL_HOOK__)
    ) {
      return 'mobile';
    }
    
    // Tertiary check: Web-specific APIs that don't exist in React Native
    if (
      typeof window !== 'undefined' && 
      typeof document !== 'undefined' && 
      typeof window.localStorage !== 'undefined'
    ) {
      return 'web';
    }
    
    // Default to web platform if detection is inconclusive
    // This is a safer default for SSR environments
    return 'web';
  } catch (error) {
    // If any error occurs during detection, default to web
    console.warn('Platform detection failed, defaulting to web:', error);
    return 'web';
  }
}

/**
 * Checks if the current platform is web.
 * 
 * @returns True if the current platform is web, false otherwise
 */
export function isWeb(): boolean {
  return detectPlatform() === 'web';
}

/**
 * Checks if the current platform is mobile.
 * 
 * @returns True if the current platform is mobile, false otherwise
 */
export function isMobile(): boolean {
  return detectPlatform() === 'mobile';
}

/**
 * Executes platform-specific code based on the current platform.
 * 
 * @param webFn Function to execute if the platform is web
 * @param mobileFn Function to execute if the platform is mobile
 * @returns The result of the executed function
 * 
 * @example
 * // Execute platform-specific code
 * const result = executePlatformSpecific(
 *   () => webSpecificFunction(),
 *   () => mobileSpecificFunction()
 * );
 */
export function executePlatformSpecific<T>(
  webFn: () => T,
  mobileFn: () => T
): T {
  return detectPlatform() === 'web' ? webFn() : mobileFn();
}