import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ALL_JOURNEYS, JOURNEY_IDS } from '../constants/journeys';
import { DEFAULT_JOURNEY_ID } from '../constants/defaults';
import { Journey, JourneyId } from '../types/journey.types';
import { JourneyProviderProps, BaseJourneyContextType } from '../types/context.types';
import { isValidJourneyId } from '../utils/validation';
import { getJourneyById } from '../utils/conversion';
import { createJourneyStorage } from '../storage';

/**
 * Context for managing the current user journey
 * This is a platform-agnostic implementation that works on both web and mobile
 */
const JourneyContext = createContext<BaseJourneyContextType>({
  currentJourney: DEFAULT_JOURNEY_ID,
  setCurrentJourney: () => {},
  journeyData: getJourneyById(DEFAULT_JOURNEY_ID),
  availableJourneys: ALL_JOURNEYS,
});

/**
 * Platform-agnostic Journey Provider component
 * 
 * Manages the current journey state (Health, Care, Plan) across the application,
 * enabling journey-specific UI theming and business logic. It establishes a consistent
 * journey selection mechanism, validates journey IDs against the available journeys,
 * and provides a type-safe interface for accessing and updating the current journey.
 * 
 * @param children - React nodes to be wrapped by the provider
 * @param initialJourney - Optional initial journey ID to set (defaults to DEFAULT_JOURNEY_ID)
 * @param onJourneyChange - Optional callback when journey changes
 */
export const JourneyProvider: React.FC<JourneyProviderProps> = ({ 
  children, 
  initialJourney = DEFAULT_JOURNEY_ID,
  onJourneyChange,
}) => {
  // Initialize journey storage for persistence
  const journeyStorage = createJourneyStorage();
  
  // Initialize state with the initial journey or default
  const [currentJourney, setCurrentJourneyState] = useState<JourneyId>(() => {
    // Try to get the stored journey preference first
    try {
      const storedJourney = journeyStorage.getSync('journeyPreference');
      // Validate the stored journey ID
      if (storedJourney && isValidJourneyId(storedJourney)) {
        return storedJourney as JourneyId;
      }
    } catch (error) {
      console.error('Failed to retrieve stored journey preference:', error);
    }
    
    // Fall back to the provided initial journey or default
    return isValidJourneyId(initialJourney) ? initialJourney : DEFAULT_JOURNEY_ID;
  });

  // Get the current journey data
  const journeyData = getJourneyById(currentJourney);

  // Handle journey changes with validation and persistence
  const setCurrentJourney = (journeyId: JourneyId) => {
    // Validate that the journey ID is valid
    if (isValidJourneyId(journeyId)) {
      // Update state
      setCurrentJourneyState(journeyId);
      
      // Persist the journey preference
      try {
        journeyStorage.setSync('journeyPreference', journeyId);
      } catch (error) {
        console.error('Failed to store journey preference:', error);
      }
      
      // Call the onJourneyChange callback if provided
      if (onJourneyChange) {
        onJourneyChange(journeyId, getJourneyById(journeyId));
      }
    } else {
      console.error(`Invalid journey ID: ${journeyId}`);
    }
  };

  // Effect to handle initialization and cleanup
  useEffect(() => {
    // Validate current journey on mount
    if (!isValidJourneyId(currentJourney)) {
      setCurrentJourney(DEFAULT_JOURNEY_ID);
    }
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Create the context value
  const value: BaseJourneyContextType = {
    currentJourney,
    setCurrentJourney,
    journeyData,
    availableJourneys: ALL_JOURNEYS,
  };

  return (
    <JourneyContext.Provider value={value}>
      {children}
    </JourneyContext.Provider>
  );
};

/**
 * Hook to access the JourneyContext
 * 
 * Provides access to the current journey state and methods to update it.
 * This hook is platform-agnostic and works consistently on both web and mobile.
 * 
 * @returns The journey context value
 * @throws Error if used outside of a JourneyProvider
 */
export const useJourney = (): BaseJourneyContextType => {
  const context = useContext(JourneyContext);
  
  if (context === undefined) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  
  return context;
};

/**
 * Export the JourneyContext for advanced use cases
 * This allows for direct context consumption in class components or other scenarios
 */
export { JourneyContext };

/**
 * Re-export journey types and constants for convenience
 */
export { JOURNEY_IDS };
export type { Journey, JourneyId };