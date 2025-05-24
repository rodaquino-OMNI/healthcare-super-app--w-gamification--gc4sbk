/**
 * Journey Context Types
 * 
 * This file centralizes exports of all journey-related type definitions through a barrel pattern,
 * making types from journey.types.ts, context.types.ts, and platform.types.ts available through
 * a single import path. This streamlines importing of journey context types throughout the
 * application, reducing import complexity and ensuring consistency.
 */

/**
 * Journey Types
 * Core type definitions for journey-related data structures
 */
export type { 
  JourneyId,
  JourneyTheme,
  Journey,
  JourneyConfig
} from './journey.types';

export { JOURNEY_IDS } from './journey.types';

/**
 * Context Types
 * Type definitions for journey context providers and hooks
 */
export type {
  JourneyProviderProps,
  BaseJourneyContextType,
  WebJourneyContextType,
  MobileJourneyContextType,
  JourneyContextType
} from './context.types';

/**
 * Platform Types
 * Platform-specific type adaptations for journey context
 */
export type {
  Platform,
  PlatformContextMap,
  PlatformJourneyContextType,
  PlatformJourneyStateMap,
  PlatformJourneyState
} from './platform.types';