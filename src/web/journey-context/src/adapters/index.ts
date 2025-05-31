/**
 * Platform Adapter Selection
 * 
 * This file provides platform-specific adapters based on the runtime environment,
 * enabling the journey context package to be platform-agnostic while still
 * accessing platform-specific features. It dynamically selects the appropriate
 * adapters for web or mobile environments.
 *
 * The adapters bridge the unified journey context API with platform-specific
 * implementations, allowing for consistent usage patterns across platforms while
 * leveraging platform-specific capabilities.
 */

// Import platform detection utility
import { isPlatformWeb } from '../utils/platform';

// Import platform-specific adapters
import * as WebAdapters from './web/index';
import * as MobileAdapters from './mobile/index';

/**
 * Dynamically select the appropriate adapter based on the runtime platform.
 * This approach preserves tree-shaking capabilities by conditionally exporting
 * only the adapters needed for the current platform.
 */

// Auth adapter exports
export const AuthAdapter = isPlatformWeb()
  ? WebAdapters.AuthAdapter
  : MobileAdapters.AuthAdapter;

// Gamification adapter exports
export const GamificationAdapter = isPlatformWeb()
  ? WebAdapters.GamificationAdapter
  : MobileAdapters.GamificationAdapter;

// Journey adapter exports
export const JourneyAdapter = isPlatformWeb()
  ? WebAdapters.JourneyAdapter
  : MobileAdapters.JourneyAdapter;

// Navigation adapter exports
export const NavigationAdapter = isPlatformWeb()
  ? WebAdapters.NavigationAdapter
  : MobileAdapters.NavigationAdapter;

// Notification adapter exports
export const NotificationAdapter = isPlatformWeb()
  ? WebAdapters.NotificationAdapter
  : MobileAdapters.NotificationAdapter;

// Storage adapter exports
export const StorageAdapter = isPlatformWeb()
  ? WebAdapters.StorageAdapter
  : MobileAdapters.StorageAdapter;

/**
 * Export all adapters as a unified object for convenience when needing
 * access to multiple adapters at once.
 */
export const Adapters = {
  AuthAdapter,
  GamificationAdapter,
  JourneyAdapter,
  NavigationAdapter,
  NotificationAdapter,
  StorageAdapter,
};

/**
 * Re-export platform detection utility for consumers that need to perform
 * additional platform-specific logic.
 */
export { isPlatformWeb } from '../utils/platform';