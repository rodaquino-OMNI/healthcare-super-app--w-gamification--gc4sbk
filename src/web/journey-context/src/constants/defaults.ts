/**
 * Default configurations and fallback values for journey state management in the AUSTA SuperApp.
 * This file provides standardized defaults to ensure consistent behavior across platforms
 * when no explicit journey is selected or when initializing new user sessions.
 */

import { JourneyId, JOURNEY_IDS, JourneyConfig, Journey } from '../types/journey.types';
import { ALL_JOURNEYS, JOURNEY_DISPLAY_ORDER } from './journeys';

/**
 * Default journey ID to use when none is explicitly selected
 * This ensures a consistent fallback journey across all platforms
 */
export const DEFAULT_JOURNEY_ID: JourneyId = JOURNEY_IDS.HEALTH;

/**
 * Default journey object to use when none is explicitly selected
 * Provides the complete journey data for the default journey
 */
export const DEFAULT_JOURNEY: Journey = ALL_JOURNEYS.find(
  (journey) => journey.id === DEFAULT_JOURNEY_ID
) || ALL_JOURNEYS[0];

/**
 * Default journey configuration for initializing journey context providers
 * Contains all necessary parameters for proper journey state management
 */
export const DEFAULT_JOURNEY_CONFIG: JourneyConfig = {
  availableJourneys: ALL_JOURNEYS,
  defaultJourney: DEFAULT_JOURNEY_ID,
  displayOrder: JOURNEY_DISPLAY_ORDER,
};

/**
 * Default journey provider initialization options
 * Used when creating new journey context providers
 */
export const DEFAULT_PROVIDER_OPTIONS = {
  /**
   * Whether to persist journey selection in storage
   */
  persistSelection: true,
  
  /**
   * Storage key for persisting journey selection
   */
  storageKey: 'austa_selected_journey',
  
  /**
   * Whether to restore the last selected journey on initialization
   */
  restoreLastJourney: true,
  
  /**
   * Whether to validate journey selection against available journeys
   */
  validateJourney: true,
};

/**
 * Default journey transition options
 * Controls how transitions between journeys are handled
 */
export const DEFAULT_TRANSITION_OPTIONS = {
  /**
   * Whether to animate journey transitions
   */
  animate: true,
  
  /**
   * Duration of journey transition animations in milliseconds
   */
  animationDuration: 300,
  
  /**
   * Whether to preserve journey state during transitions
   */
  preserveState: true,
};

/**
 * Fallback values for edge cases in journey state management
 * Used when encountering unexpected or invalid states
 */
export const FALLBACK_VALUES = {
  /**
   * Fallback journey ID when an invalid journey is selected
   */
  journeyId: DEFAULT_JOURNEY_ID,
  
  /**
   * Fallback journey object when an invalid journey is selected
   */
  journey: DEFAULT_JOURNEY,
  
  /**
   * Fallback journey display name when journey data is unavailable
   */
  journeyName: DEFAULT_JOURNEY.name,
  
  /**
   * Fallback journey color when theme data is unavailable
   */
  journeyColor: DEFAULT_JOURNEY.color,
};