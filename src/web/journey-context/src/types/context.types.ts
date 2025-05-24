/**
 * @file context.types.ts
 * @description Type definitions for journey context providers and hooks.
 * This file establishes the contract for how journey context state is structured,
 * accessed, and modified across both web and mobile platforms.
 */

import { ReactNode } from 'react';

/**
 * Common props interface for JourneyProvider components across platforms
 */
export interface JourneyProviderProps {
  /**
   * Child components that will have access to the journey context
   */
  children: ReactNode;

  /**
   * Optional initial journey ID to set
   */
  initialJourney?: string;
}

/**
 * Base journey context properties shared across platforms
 */
export interface BaseJourneyContextType {
  /**
   * Indicates whether the journey context has been initialized
   */
  isInitialized: boolean;

  /**
   * Indicates whether a journey transition is in progress
   */
  isTransitioning: boolean;

  /**
   * Error state for journey context operations
   */
  error?: Error | null;
}

/**
 * Web-specific journey context properties
 */
export interface WebJourneyContextType extends BaseJourneyContextType {
  /**
   * The current journey ID
   */
  currentJourney: string;
  
  /**
   * Function to set the current journey
   * @param journeyId The ID of the journey to set as current
   */
  setCurrentJourney: (journeyId: string) => void;
  
  /**
   * The full data for the current journey
   */
  journeyData?: {
    id: string;
    name: string;
    path: string;
    icon: string;
    color: string;
  };
}

/**
 * Mobile-specific journey context properties
 */
export interface MobileJourneyContextType extends BaseJourneyContextType {
  /**
   * The current journey ID
   */
  journey: string;
  
  /**
   * Function to set the current journey
   * @param journey The ID of the journey to set as current
   */
  setJourney: (journey: string) => void;
}

/**
 * Generic journey context type that adapts based on platform
 * T is a platform discriminator that defaults to 'web'
 */
export type JourneyContextType<T extends 'web' | 'mobile' = 'web'> = 
  T extends 'web' ? WebJourneyContextType : MobileJourneyContextType;

/**
 * Type for journey data object
 */
export interface JourneyData {
  /**
   * Unique identifier for the journey
   */
  id: string;
  
  /**
   * Display name of the journey
   */
  name: string;
  
  /**
   * Navigation path for the journey
   */
  path: string;
  
  /**
   * Icon identifier for the journey
   */
  icon: string;
  
  /**
   * Primary color for the journey theme
   */
  color: string;
  
  /**
   * Optional additional journey-specific properties
   */
  [key: string]: any;
}

/**
 * Type for journey ID constants
 */
export interface JourneyIds {
  HEALTH: string;
  CARE: string;
  PLAN: string;
  [key: string]: string;
}