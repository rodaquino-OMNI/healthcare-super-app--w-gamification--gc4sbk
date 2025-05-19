/**
 * Context index file
 * 
 * This file exports all context providers and hooks from the @austa/journey-context package,
 * providing a centralized import location for the application's contexts.
 * This simplifies importing context-related components throughout the app.
 */

// Import from @austa/journey-context package instead of local files
import {
  // Authentication exports
  AuthContext,
  AuthProvider,
  useAuth,
  
  // Gamification exports
  GamificationContext,
  GamificationProvider,
  useGamification,
  
  // Journey exports
  JourneyContext,
  JourneyProvider,
  useJourney,
  
  // Notification exports
  NotificationContext,
  NotificationProvider,
  useNotification,
  
  // Journey-specific types
  JourneyId,
  Journey,
  JourneyConfig,
  
  // Journey constants
  ALL_JOURNEYS,
  JOURNEY_IDS,
  DEFAULT_JOURNEY,
} from '@austa/journey-context';

// Re-export all imported items for backward compatibility

// Authentication context exports
export { AuthContext, AuthProvider, useAuth };

// Gamification context exports
export { GamificationContext, GamificationProvider, useGamification };

// Journey context exports
export { JourneyContext, JourneyProvider, useJourney };

// Notification context exports - maintain backward compatibility with existing name
export { NotificationContext, NotificationProvider };
export { useNotification as useNotificationContext };

// Export journey-specific types and constants for convenience
export { JourneyId, Journey, JourneyConfig };
export { ALL_JOURNEYS, JOURNEY_IDS, DEFAULT_JOURNEY };