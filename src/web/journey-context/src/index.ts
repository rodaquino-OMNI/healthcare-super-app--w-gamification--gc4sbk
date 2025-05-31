/**
 * Journey Context Package
 * 
 * This is the main entry point for the journey-context package, which provides
 * a unified API for accessing journey context across both web and mobile platforms.
 * It centralizes the export of all journey context providers, hooks, types, and utilities.
 * 
 * The package supports the three distinct user journeys (Health, Care, Plan) that form
 * the foundation of the AUSTA SuperApp's user experience model.
 */

// Re-export providers
export { 
  AuthProvider,
  GamificationProvider, 
  JourneyProvider,
  NotificationProvider 
} from './providers';

// Re-export hooks
export {
  useAuth,
  useGamification,
  useJourney,
  useNotification,
  useStorage
} from './hooks';

// Re-export contexts for direct access if needed
export { 
  JourneyContext 
} from './providers/JourneyContext';

// Re-export types
export type {
  JourneyId,
  Journey,
  JourneyConfig,
  JourneyContextType,
  JourneyProviderProps
} from './types';

// Re-export constants
export {
  JOURNEY_IDS,
  ALL_JOURNEYS,
  DEFAULT_JOURNEY,
  JOURNEY_ROUTES
} from './constants';

// Re-export utilities
export {
  isValidJourneyId,
  isValidJourney,
  getJourneyById,
  getJourneyColor,
  getJourneyName,
  getJourneyPath,
  extractJourneyFromPath
} from './utils';

// Export storage for advanced usage
export {
  createJourneyStorage,
  type IJourneyStorage
} from './storage';

// Export adapters for platform-specific implementations
export { getAdapter } from './adapters';