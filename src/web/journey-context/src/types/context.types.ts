/**
 * @file context.types.ts
 * @description TypeScript interface definitions for journey context providers and hooks.
 * These types establish the contract for how journey context state is structured,
 * accessed, and modified across both web and mobile platforms.
 */

import { ReactNode } from 'react';

/**
 * Represents the possible journey IDs in the application.
 * These IDs are used to identify and switch between different user journeys.
 */
export type JourneyId = 'health' | 'care' | 'plan';

/**
 * Common props interface for journey provider components across platforms.
 * @template T Optional additional props that can be extended by platform-specific providers
 */
export interface JourneyProviderProps<T = {}> {
  /** React children to be wrapped by the provider */
  children: ReactNode;
  /** Optional initial journey ID */
  initialJourney?: JourneyId;
  /** Any additional props needed by platform-specific implementations */
  ...T;
}

/**
 * Base journey context properties shared across all platforms.
 * This interface defines the minimum contract that all journey contexts must implement.
 */
export interface BaseJourneyContextType {
  /** Indicates if the journey context has been initialized */
  isInitialized: boolean;
  /** Indicates if a journey transition is in progress */
  isTransitioning: boolean;
}

/**
 * Web-specific journey context properties.
 * Extends the base context with web-specific functionality.
 */
export interface WebJourneyContextType extends BaseJourneyContextType {
  /** The current journey ID */
  currentJourney: JourneyId;
  /** Function to set the current journey */
  setCurrentJourney: (journeyId: JourneyId) => void;
  /** The full data for the current journey */
  journeyData?: {
    id: JourneyId;
    name: string;
    description: string;
    icon: string;
    path: string;
    color: string;
  };
}

/**
 * Mobile-specific journey context properties.
 * Extends the base context with mobile-specific functionality.
 */
export interface MobileJourneyContextType extends BaseJourneyContextType {
  /** The current journey ID (named 'journey' in mobile implementation) */
  journey: JourneyId;
  /** Function to set the current journey */
  setJourney: (journey: JourneyId) => void;
}

/**
 * Platform-specific journey context type.
 * This type adapts based on the platform (web or mobile) to provide the appropriate context interface.
 * @template T The platform-specific context type (WebJourneyContextType or MobileJourneyContextType)
 */
export type PlatformJourneyContextType<T> = T extends 'web' ? WebJourneyContextType : MobileJourneyContextType;

/**
 * Generic journey context type that can be used across the application.
 * This type allows components to work with journey context regardless of platform.
 * @template P The platform identifier ('web' | 'mobile')
 */
export type JourneyContextType<P extends 'web' | 'mobile' = 'web'> = PlatformJourneyContextType<P>;

/**
 * Interface for journey-specific data that can be stored and retrieved.
 * This provides a consistent structure for journey data across the application.
 */
export interface JourneyData {
  /** Unique identifier for the journey */
  id: JourneyId;
  /** Display name of the journey */
  name: string;
  /** Brief description of the journey */
  description: string;
  /** Icon identifier for the journey */
  icon: string;
  /** Navigation path for the journey */
  path: string;
  /** Primary color associated with the journey */
  color: string;
  /** Additional metadata specific to each journey */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for journey transition options.
 * Provides configuration for how transitions between journeys should behave.
 */
export interface JourneyTransitionOptions {
  /** Whether to animate the transition between journeys */
  animate?: boolean;
  /** Duration of the transition animation in milliseconds */
  duration?: number;
  /** Whether to persist the previous journey's state */
  persistState?: boolean;
  /** Callback function to execute after the transition completes */
  onComplete?: () => void;
}