/**
 * @austa/journey-context
 * 
 * Main entry point for the journey-context package, providing a unified API for
 * accessing journey context functionality across both web and mobile platforms.
 * 
 * This package centralizes the export of all journey context providers, hooks,
 * types, and utilities, ensuring that consumers have a single import point for
 * accessing journey context functionality.
 */

// Export providers
export { JourneyProvider } from './providers/JourneyProvider';
export { AuthProvider } from './providers/AuthProvider';
export { GamificationProvider } from './providers/GamificationProvider';
export { NotificationProvider } from './providers/NotificationProvider';

// Export hooks
export { useJourney } from './hooks/useJourney';
export { useAuth } from './hooks/useAuth';
export { useGamification } from './hooks/useGamification';
export { useNotification } from './hooks/useNotification';

// Export context types
export { JourneyContext } from './providers/JourneyProvider';
export { AuthContext } from './providers/AuthProvider';
export { GamificationContext } from './providers/GamificationProvider';
export { NotificationContext } from './providers/NotificationProvider';

// Export journey types
export type { JourneyId, Journey, JourneyConfig } from './types/journey.types';
export { JOURNEY_IDS } from './types/journey.types';

// Export context types
export type {
  JourneyProviderProps,
  BaseJourneyContextType,
  WebJourneyContextType,
  MobileJourneyContextType,
  JourneyContextType,
} from './types/context.types';

// Export platform types
export type {
  Platform,
  PlatformContextMap,
  PlatformJourneyContextType,
  PlatformJourneyStateMap,
  PlatformJourneyState,
} from './types/platform.types';

// Export constants
export { ALL_JOURNEYS, DEFAULT_JOURNEY } from './constants/journeys';
export { JOURNEY_ROUTES } from './constants/routes';
export { JOURNEY_COLORS } from './constants/colors';
export { DEFAULT_JOURNEY_CONFIG } from './constants/defaults';

// Export utilities
export {
  isValidJourneyId,
  isValidJourney,
  getValidJourneyId,
  getValidJourney,
} from './utils/validation';

export {
  journeyIdToJourney,
  journeyToJourneyId,
  getJourneyColor,
  getJourneyName,
} from './utils/conversion';

export {
  getJourneyFromPath,
  createJourneyPath,
  isJourneyPath,
  normalizeJourneyPath,
} from './utils/path';

// Export storage
export { createJourneyStorage } from './storage';
export type { IJourneyStorage, StorageOptions } from './storage/interface';

// Export adapters (for advanced usage)
export { default as adapters } from './adapters';