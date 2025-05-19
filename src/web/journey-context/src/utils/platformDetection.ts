/**
 * @file platformDetection.ts
 * @description Utility functions for detecting the current platform (web or mobile)
 */

/**
 * Detects the current platform based on environment variables and APIs
 * @returns 'web' or 'mobile' depending on the detected platform
 */
export const detectPlatform = (): 'web' | 'mobile' => {
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
};