/**
 * Journey Context Hooks
 * 
 * This file exports all hooks from the journey-context package, providing a
 * centralized import location for consumers. It simplifies imports and provides
 * a clean, organized API for accessing all journey-related hooks.
 * 
 * These hooks provide platform-agnostic access to journey context, authentication,
 * gamification, notifications, and storage across both web and mobile platforms.
 */

// Authentication hook - Provides secure authentication with OAuth 2.0, MFA, and biometric support
export { useAuth } from './useAuth';

// Journey hook - Manages navigation and state between different user journeys
export { useJourney } from './useJourney';

// Gamification hook - Processes user actions and assigns points/achievements based on rules
export { useGamification } from './useGamification';

// Notification hook - Handles communication and notifications across the application
export { useNotification } from './useNotification';

// Storage hook - Provides cross-platform storage abstraction (internal use primarily)
export { useStorage } from './useStorage';

// Export types for better developer experience
export type { UseAuthReturn } from './useAuth';
export type { UseJourneyReturn } from './useJourney';
export type { UseGamificationReturn } from './useGamification';
export type { UseNotificationReturn } from './useNotification';
export type { UseStorageReturn } from './useStorage';