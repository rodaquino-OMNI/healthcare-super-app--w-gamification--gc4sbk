/**
 * Platform-specific type adaptations for journey context.
 * 
 * This file defines types that bridge the differences between web and mobile implementations
 * of the journey context, enabling consistent usage across platforms while accommodating
 * their different implementation details.
 */

import { JourneyId, Journey } from './journey.types';

/**
 * Supported platforms in the application
 */
export type Platform = 'web' | 'mobile';

/**
 * Maps platform identifiers to their respective context property names
 */
export interface PlatformContextMap {
  web: {
    journeyIdProp: 'currentJourney';
    setJourneyProp: 'setCurrentJourney';
    journeyDataProp: 'journeyData';
  };
  mobile: {
    journeyIdProp: 'journey';
    setJourneyProp: 'setJourney';
    journeyDataProp?: undefined; // Mobile doesn't have journeyData
  };
}

/**
 * Generic helper type for platform-specific context type resolution
 * 
 * @template P - The platform ('web' | 'mobile')
 * @template T - The type to resolve based on platform
 */
export type PlatformJourneyContextType<
  P extends Platform,
  T extends PlatformContextMap
> = T[P];

/**
 * Maps platform-specific journey state property names to their common types
 */
export interface PlatformJourneyStateMap {
  web: {
    currentJourney: JourneyId;
    setCurrentJourney: (journeyId: JourneyId) => void;
    journeyData?: Journey;
  };
  mobile: {
    journey: JourneyId;
    setJourney: (journey: JourneyId) => void;
  };
}

/**
 * Platform-specific journey state type
 * 
 * @template P - The platform ('web' | 'mobile')
 */
export type PlatformJourneyState<P extends Platform> = PlatformJourneyStateMap[P];