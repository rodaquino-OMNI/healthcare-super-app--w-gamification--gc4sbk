/**
 * Platform-specific type adaptations for journey context
 * 
 * This file provides type definitions that enable consistent journey context usage
 * while accommodating the different implementation details between web and mobile platforms.
 */

/**
 * Supported platforms in the AUSTA SuperApp
 */
export type Platform = 'web' | 'mobile';

/**
 * Maps platform types to their respective context implementations
 */
export interface PlatformContextMap {
  /**
   * Web platform uses 'currentJourney' and 'setCurrentJourney'
   */
  web: {
    journeyProp: 'currentJourney';
    setJourneyProp: 'setCurrentJourney';
  };
  
  /**
   * Mobile platform uses 'journey' and 'setJourney'
   */
  mobile: {
    journeyProp: 'journey';
    setJourneyProp: 'setJourney';
  };
}

/**
 * Helper type to resolve platform-specific context types
 * @template T - The platform type ('web' | 'mobile')
 */
export type PlatformJourneyContextType<T extends Platform> = {
  [K in PlatformContextMap[T]['journeyProp']]: string;
} & {
  [K in PlatformContextMap[T]['setJourneyProp']]: (journeyId: string) => void;
} & {
  journeyData?: any; // Optional journey data that may be present in web context
};

/**
 * Maps platform types to their respective state property names
 */
export interface PlatformJourneyStateMap {
  web: {
    state: 'currentJourney';
    setState: 'setCurrentJourney';
  };
  mobile: {
    state: 'journey';
    setState: 'setJourney';
  };
}

/**
 * Platform-specific journey state type
 * @template T - The platform type ('web' | 'mobile')
 */
export type PlatformJourneyState<T extends Platform> = {
  [K in PlatformJourneyStateMap[T]['state']]: string;
} & {
  [K in PlatformJourneyStateMap[T]['setState']]: (journeyId: string) => void;
};