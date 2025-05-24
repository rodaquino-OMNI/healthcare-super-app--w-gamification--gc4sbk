import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { isPlatformWeb } from '../utils/platform';
import { Journey, JourneyId } from '../types/journey.types';
import { ALL_JOURNEYS, DEFAULT_JOURNEY } from '../constants/journeys';
import { JourneyAdapter } from '../adapters';

/**
 * Context interface for the JourneyContext
 * Provides a unified interface that works across platforms
 */
export interface JourneyContextType {
  // Web-specific properties
  currentJourney: JourneyId;
  setCurrentJourney: (journeyId: JourneyId) => void;
  journeyData?: Journey;
  
  // Mobile-specific properties
  journey: JourneyId;
  setJourney: (journey: JourneyId) => void;
}

/**
 * Default context values
 */
const defaultContextValue: JourneyContextType = {
  currentJourney: DEFAULT_JOURNEY,
  setCurrentJourney: () => {},
  journey: DEFAULT_JOURNEY,
  setJourney: () => {},
};

/**
 * Context for sharing journey state across components
 */
export const JourneyContext = createContext<JourneyContextType>(defaultContextValue);

/**
 * Props for the JourneyProvider component
 */
export interface JourneyProviderProps {
  children: ReactNode;
  initialJourney?: JourneyId;
}

/**
 * Provider component for the JourneyContext
 * Manages the current journey state and provides methods to update it
 */
export const JourneyProvider: React.FC<JourneyProviderProps> = ({ 
  children, 
  initialJourney = DEFAULT_JOURNEY 
}) => {
  // Initialize with the default or provided journey
  const [currentJourneyId, setCurrentJourneyId] = useState<JourneyId>(initialJourney);
  
  // Get the journey adapter
  const journeyAdapter = new JourneyAdapter();
  
  // Initialize journey from navigation on mount
  useEffect(() => {
    const journeyFromNavigation = journeyAdapter.getJourneyFromNavigation();
    if (journeyFromNavigation && journeyFromNavigation !== currentJourneyId) {
      setCurrentJourneyId(journeyFromNavigation);
    }
  }, []);
  
  // Get the current journey data
  const journeyData = ALL_JOURNEYS.find(journey => journey.id === currentJourneyId);
  
  // Handle journey changes with validation
  const handleSetJourney = (journeyId: JourneyId) => {
    // Validate that the journey ID is valid
    if (ALL_JOURNEYS.some(journey => journey.id === journeyId)) {
      setCurrentJourneyId(journeyId);
      journeyAdapter.persistJourneyPreference(journeyId);
    } else {
      console.error(`Invalid journey ID: ${journeyId}`);
    }
  };
  
  // Create the context value based on the platform
  const contextValue: JourneyContextType = {
    // Web-specific properties
    currentJourney: currentJourneyId,
    setCurrentJourney: handleSetJourney,
    journeyData,
    
    // Mobile-specific properties
    journey: currentJourneyId,
    setJourney: handleSetJourney,
  };
  
  return (
    <JourneyContext.Provider value={contextValue}>
      {children}
    </JourneyContext.Provider>
  );
};