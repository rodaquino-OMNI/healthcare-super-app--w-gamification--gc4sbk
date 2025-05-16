import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Platform } from '../types/platform.types';
import { JourneyId, Journey, JOURNEY_IDS } from '../types/journey.types';
import { JourneyProviderProps, JourneyContextType } from '../types/context.types';
import { createJourneyStorage } from '../storage';
import { ALL_JOURNEYS, DEFAULT_JOURNEY_ID } from '../constants/journeys';
import { useAuth } from '../hooks/useAuth';

/**
 * Context for managing the current user journey
 * This context is platform-agnostic and works for both web and mobile
 */
const JourneyContext = createContext<JourneyContextType>({
  currentJourney: DEFAULT_JOURNEY_ID,
  setCurrentJourney: () => {},
  journeyData: ALL_JOURNEYS.find(journey => journey.id === DEFAULT_JOURNEY_ID) || ALL_JOURNEYS[0],
});

/**
 * Platform-agnostic Journey Provider that manages and distributes the current journey state
 * across the application, enabling journey-specific UI theming and business logic.
 * 
 * Features:
 * - Establishes a consistent journey selection mechanism
 * - Validates journey IDs against available journeys
 * - Reacts to authentication status changes
 * - Persists journey selection with platform-agnostic storage
 * - Provides a type-safe interface for accessing and updating the current journey
 * 
 * @param props Provider props including children components
 * @returns Journey Provider component
 */
export const JourneyProvider: React.FC<JourneyProviderProps> = ({ children, initialJourney }) => {
  // Initialize storage adapter for the current platform
  const journeyStorage = createJourneyStorage();
  const { isAuthenticated } = useAuth();
  
  // Initialize state with provided initialJourney, stored preference, or default journey
  const [currentJourney, setCurrentJourneyState] = useState<JourneyId>(() => {
    // If initialJourney is provided and valid, use it
    if (initialJourney && isValidJourneyId(initialJourney)) {
      return initialJourney;
    }
    
    // Try to get stored journey preference
    try {
      const storedJourney = journeyStorage.getItem('currentJourney') as JourneyId | null;
      if (storedJourney && isValidJourneyId(storedJourney)) {
        return storedJourney;
      }
    } catch (error) {
      console.error('Failed to retrieve stored journey preference:', error);
    }
    
    // Fall back to default journey
    return DEFAULT_JOURNEY_ID;
  });

  // Get the current journey data
  const journeyData = ALL_JOURNEYS.find(journey => journey.id === currentJourney) || ALL_JOURNEYS[0];

  // Validate that a journey ID exists in available journeys
  function isValidJourneyId(journeyId: string): journeyId is JourneyId {
    return ALL_JOURNEYS.some(journey => journey.id === journeyId);
  }

  // Handle journey changes with validation and persistence
  const setCurrentJourney = (journeyId: string) => {
    if (isValidJourneyId(journeyId)) {
      setCurrentJourneyState(journeyId);
      
      // Persist journey preference
      try {
        journeyStorage.setItem('currentJourney', journeyId);
      } catch (error) {
        console.error('Failed to store journey preference:', error);
      }
    } else {
      console.error(`Invalid journey ID: ${journeyId}. Available journeys: ${ALL_JOURNEYS.map(j => j.id).join(', ')}`);
    }
  };

  // Set initial journey or handle authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      // Ensure we have a valid journey selected after authentication
      if (!currentJourney || !isValidJourneyId(currentJourney)) {
        setCurrentJourney(DEFAULT_JOURNEY_ID);
      }
    }
  }, [isAuthenticated]);

  // Context value with current journey state and methods
  const value: JourneyContextType = {
    currentJourney,
    setCurrentJourney,
    journeyData,
  };

  return (
    <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>
  );
};

/**
 * Hook to access the JourneyContext
 * @returns The journey context value
 * @throws Error if used outside of a JourneyProvider
 */
export const useJourney = (): JourneyContextType => {
  const context = useContext(JourneyContext);
  if (context === undefined) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
};