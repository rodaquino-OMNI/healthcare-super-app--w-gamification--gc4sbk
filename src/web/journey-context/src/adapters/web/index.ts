/**
 * @file adapters/web/index.ts
 * @description Centralized export point for all web-specific adapters
 * 
 * This file exports all web-specific adapter implementations for the journey context.
 * These adapters bridge the unified journey context API with Next.js web platform capabilities.
 */

// Authentication adapter for web platform (uses localStorage/cookies for token storage)
import AuthAdapter from './AuthAdapter';

// Gamification adapter for web platform (handles web-specific event processing)
import GamificationAdapter from './GamificationAdapter';

// Journey adapter for web platform (integrates with Next.js routing)
import JourneyAdapter from './JourneyAdapter';

// Notification adapter for web platform (handles web notifications and websockets)
import NotificationAdapter from './NotificationAdapter';

// Storage adapter for web platform (uses localStorage/sessionStorage)
import StorageAdapter from './StorageAdapter';

// Navigation adapter for web platform (uses Next.js router)
import NavigationAdapter from './NavigationAdapter';

// Export all adapters individually for direct imports
export {
  AuthAdapter,
  GamificationAdapter,
  JourneyAdapter,
  NotificationAdapter,
  StorageAdapter,
  NavigationAdapter
};

// Export default object with all adapters for convenience
export default {
  auth: AuthAdapter,
  gamification: GamificationAdapter,
  journey: JourneyAdapter,
  notification: NotificationAdapter,
  storage: StorageAdapter,
  navigation: NavigationAdapter
};