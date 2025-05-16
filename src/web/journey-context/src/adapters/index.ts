/**
 * Authentication Adapters
 * 
 * This file provides a unified entry point for platform-specific authentication adapters.
 * It automatically detects the current platform and initializes the appropriate adapter.
 */

// Platform detection function
const detectPlatform = (): 'web' | 'mobile' => {
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

/**
 * Initializes the appropriate authentication adapter based on the detected platform
 */
export function initAuthAdapter(): void {
  const platform = detectPlatform();
  
  if (platform === 'web') {
    // Dynamically import the web adapter to avoid bundling issues
    import('./web/authAdapter').then(({ initWebAuthAdapter }) => {
      initWebAuthAdapter();
    }).catch(error => {
      console.error('Failed to initialize web auth adapter:', error);
    });
  } else {
    // Dynamically import the mobile adapter to avoid bundling issues
    import('./mobile/authAdapter').then(({ initMobileAuthAdapter }) => {
      initMobileAuthAdapter();
    }).catch(error => {
      console.error('Failed to initialize mobile auth adapter:', error);
    });
  }
}

// Auto-initialize the adapter when this module is imported
initAuthAdapter();

// Re-export the adapters for direct access if needed
export { default as webAuthAdapter } from './web/authAdapter';
export { default as mobileAuthAdapter } from './mobile/authAdapter';