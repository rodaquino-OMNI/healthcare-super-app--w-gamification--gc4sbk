/**
 * Platform detection utilities for the journey context package.
 * These utilities help determine the current runtime platform (web or mobile)
 * and provide platform-specific functionality.
 */

/**
 * Determines if the current runtime environment is web (browser)
 * @returns true if running in a web browser, false if running in React Native
 */
export const isPlatformWeb = (): boolean => {
  // Check if window is defined and if document is defined
  // This is a reliable way to detect if we're running in a browser environment
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Determines if the current runtime environment is mobile (React Native)
 * @returns true if running in React Native, false if running in a web browser
 */
export const isPlatformMobile = (): boolean => {
  return !isPlatformWeb();
};

/**
 * Platform type enum for strongly typed platform references
 */
export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile'
}

/**
 * Gets the current platform as a Platform enum value
 * @returns Platform.WEB or Platform.MOBILE
 */
export const getCurrentPlatform = (): Platform => {
  return isPlatformWeb() ? Platform.WEB : Platform.MOBILE;
};