/**
 * Journey Context Providers
 * 
 * This file exports all context providers, hooks, and context objects from the providers directory
 * to simplify imports throughout the application. It serves as the central export point for
 * authentication, gamification, journey, and notification contexts, ensuring consistent
 * usage patterns across both web and mobile platforms.
 */

// Authentication Context - Provides secure authentication with OAuth 2.0, MFA, and biometric support
export { AuthProvider, useAuth, AuthContext } from './AuthProvider';

// Gamification Context - Processes user actions and assigns points/achievements based on rules
export { GamificationProvider, useGamification, GamificationContext } from './GamificationProvider';

// Journey Context - Manages navigation between different user journeys
export { JourneyProvider, useJourney, JourneyContext } from './JourneyProvider';

// Notification Context - Handles communication and notifications across the application
export { NotificationProvider, useNotificationContext, NotificationContext } from './NotificationProvider';