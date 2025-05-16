/**
 * Journey Context Hooks
 * 
 * This file exports all hooks from the journey-context package, providing a
 * centralized import location for applications. It simplifies importing hooks
 * throughout both web and mobile applications by offering a unified API.
 * 
 * These hooks abstract away platform-specific implementations, ensuring consistent
 * behavior across web (Next.js) and mobile (React Native) platforms.
 */

// Authentication hook - Provides secure authentication with OAuth 2.0, MFA, and biometric support
export { useAuth } from './useAuth';
export type { UseAuthReturn } from './useAuth';

// Gamification hook - Processes user actions and assigns points/achievements based on rules
export { useGamification } from './useGamification';
export type { UseGamificationReturn } from './useGamification';

// Journey hook - Manages navigation between different user journeys
export { useJourney } from './useJourney';
export type { UseJourneyReturn } from './useJourney';

// Notification hook - Handles communication and notifications across the application
export { useNotification } from './useNotification';
export type { UseNotificationReturn } from './useNotification';

// Storage hook - Provides cross-platform storage abstraction
export { useStorage } from './useStorage';
export type { UseStorageReturn } from './useStorage';