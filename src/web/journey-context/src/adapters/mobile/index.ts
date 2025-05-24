/**
 * Mobile Adapters Index
 * 
 * This file serves as a centralized export point for all mobile-specific adapters
 * in the journey context architecture. These adapters provide platform-specific
 * implementations for React Native that bridge the unified journey context API
 * with mobile platform capabilities.
 * 
 * @package @austa/journey-context
 */

// Authentication adapter for mobile (AsyncStorage token persistence, biometric auth)
export { AuthAdapter } from './AuthAdapter';

// Gamification adapter for mobile (offline support, optimized data fetching)
export { GamificationAdapter } from './GamificationAdapter';

// Journey adapter for mobile (AsyncStorage persistence, React Navigation integration)
export { JourneyAdapter } from './JourneyAdapter';

// Navigation adapter for mobile (React Navigation integration, deep linking)
export { NavigationAdapter } from './NavigationAdapter';

// Notification adapter for mobile (push notifications, local notifications)
export { NotificationAdapter } from './NotificationAdapter';

// Storage adapter for mobile (AsyncStorage wrapper with error handling)
export { StorageAdapter } from './StorageAdapter';