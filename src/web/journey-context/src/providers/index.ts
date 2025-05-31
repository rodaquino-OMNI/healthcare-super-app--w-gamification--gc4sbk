/**
 * Journey Context Providers
 * 
 * This file exports all context providers, hooks, and context objects from the providers directory
 * to simplify imports throughout the application. It serves as the central export point for
 * authentication, gamification, journey, and notification contexts.
 * 
 * This standardized export pattern supports both web and mobile platforms, allowing for
 * consistent import paths across the application.
 */

// Authentication Context - Provides secure authentication with OAuth 2.0, MFA, and biometric support
export { AuthContext, AuthProvider, useAuth } from './AuthProvider';

// Gamification Context - Processes user actions and assigns points/achievements based on rules
export { GamificationContext, GamificationProvider, useGamification } from './GamificationProvider';

// Journey Context - Manages navigation between different user journeys (Health, Care, Plan)
export { JourneyContext, JourneyProvider, useJourney } from './JourneyProvider';

// Notification Context - Handles communication and notifications across the application
export { NotificationContext, NotificationProvider, useNotificationContext } from './NotificationProvider';