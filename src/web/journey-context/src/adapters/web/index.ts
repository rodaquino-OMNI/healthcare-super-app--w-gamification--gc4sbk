/**
 * Web Platform Adapters
 * 
 * This file exports all web-specific adapter implementations for the journey context.
 * These adapters bridge the unified journey context API with Next.js web platform capabilities.
 * 
 * The adapters implement platform-specific functionality while adhering to common interfaces
 * defined in the @austa/interfaces package, enabling consistent usage patterns across platforms.
 */

// Authentication adapter for web platform (handles JWT tokens, OAuth flows, session management)
export { default as AuthAdapter } from './AuthAdapter';

// Navigation adapter for web platform (integrates with Next.js router)
export { default as NavigationAdapter } from './NavigationAdapter';

// Storage adapter for web platform (uses localStorage, sessionStorage, cookies)
export { default as StorageAdapter } from './StorageAdapter';

// Gamification adapter for web platform (connects to gamification engine API)
export { default as GamificationAdapter } from './GamificationAdapter';

// Journey-specific adapters for web platform
export { default as HealthJourneyAdapter } from './HealthJourneyAdapter';
export { default as CareJourneyAdapter } from './CareJourneyAdapter';
export { default as PlanJourneyAdapter } from './PlanJourneyAdapter';

// Notification adapter for web platform (handles web notifications, in-app messages)
export { default as NotificationAdapter } from './NotificationAdapter';