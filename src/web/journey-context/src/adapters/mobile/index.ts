/**
 * Mobile Adapters Index
 * 
 * This file exports all mobile-specific adapter implementations for the journey context.
 * These adapters bridge the unified journey context API with React Native platform capabilities,
 * providing implementations for authentication, navigation, storage, gamification, journey state,
 * and notifications that are optimized for the mobile environment.
 */

// Authentication adapter for mobile (AsyncStorage token persistence, biometric auth)
export { default as AuthAdapter } from './AuthAdapter';

// Gamification adapter for mobile (offline support, optimized data fetching)
export { default as GamificationAdapter } from './GamificationAdapter';

// Journey adapter for mobile (AsyncStorage persistence, React Navigation integration)
export { default as JourneyAdapter } from './JourneyAdapter';

// Navigation adapter for mobile (React Navigation integration, deep linking)
export { default as NavigationAdapter } from './NavigationAdapter';

// Notification adapter for mobile (push notifications, local notifications)
export { default as NotificationAdapter } from './NotificationAdapter';

// Storage adapter for mobile (AsyncStorage wrapper with error handling)
export { default as StorageAdapter } from './StorageAdapter';