import { useContext, useEffect } from 'react';
import { isPlatformWeb } from '../utils/platform';
import { JourneyContext } from '../providers/JourneyProvider';
import { Journey, JourneyId } from '../types/journey.types';
import { useJourneyAdapter } from './useJourneyAdapter';
import { ALL_JOURNEYS } from '../constants/journeys';

/**
 * Return type for the useJourney hook
 */
export interface UseJourneyReturn {
  /**
   * The current user journey object, or null if no journey is selected
   */
  journey: Journey | null;
  
  /**
   * The ID of the current journey
   */
  journeyId: JourneyId;
  
  /**
   * Function to set the current journey
   * @param journeyOrId A Journey object, journey ID string, or null (to reset to default)
   */
  setJourney: (journeyOrId: Journey | JourneyId | null) => void;
  
  /**
   * Checks if the given journey is currently active
   * @param journeyOrId A Journey object or journey ID string
   */
  isJourneyActive: (journeyOrId: Journey | JourneyId) => boolean;
  
  /**
   * Gets the theme colors for the current journey
   */
  getJourneyTheme: () => Journey['theme'];
  
  /**
   * List of all available journeys
   */
  availableJourneys: Journey[];
}

/**
 * Custom hook that provides access to the current user journey in the AUSTA SuperApp.
 * Works consistently across web and mobile platforms, providing a unified API for
 * journey-based state management, navigation, and theming.
 * 
 * @returns An object containing the current journey and methods to interact with journey state
 */
export const useJourney = (): UseJourneyReturn => {
  // Get the journey context from the provider
  const context = useContext(JourneyContext);
  
  if (!context) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }

  // Get the platform-specific journey adapter
  const adapter = useJourneyAdapter();
  
  // Extract values from context based on platform
  const currentJourneyId = isPlatformWeb() 
    ? context.currentJourney 
    : context.journey;

  const setJourneyState = isPlatformWeb()
    ? context.setCurrentJourney
    : context.setJourney;

  // Find the current journey data from ALL_JOURNEYS
  const journeyData = ALL_JOURNEYS.find(journey => journey.id === currentJourneyId);

  // Sync with URL path or deep link on mount and when journey changes
  useEffect(() => {
    adapter.syncJourneyWithNavigation(currentJourneyId);
  }, [adapter, currentJourneyId]);

  /**
   * Sets the current journey
   * @param journeyOrId A Journey object, journey ID string, or null (to reset to default)
   */
  const setJourney = (journeyOrId: Journey | JourneyId | null) => {
    if (!journeyOrId) {
      // Default to first journey if null is passed
      setJourneyState(ALL_JOURNEYS[0].id);
      return;
    }
    
    // Determine the journey ID based on input type
    const journeyId = typeof journeyOrId === 'string' 
      ? journeyOrId 
      : journeyOrId.id;
    
    // Validate the journey ID
    if (!ALL_JOURNEYS.some(journey => journey.id === journeyId)) {
      console.error(`Invalid journey ID: ${journeyId}`);
      return;
    }
    
    // Update the journey state
    setJourneyState(journeyId);
    
    // Update navigation (URL path or deep link)
    adapter.navigateToJourney(journeyId);
  };

  /**
   * Checks if the given journey is currently active
   * @param journeyOrId A Journey object or journey ID string
   * @returns True if the journey is active, false otherwise
   */
  const isJourneyActive = (journeyOrId: Journey | JourneyId): boolean => {
    const journeyId = typeof journeyOrId === 'string' 
      ? journeyOrId 
      : journeyOrId.id;
    
    return currentJourneyId === journeyId;
  };

  /**
   * Gets the theme colors for the current journey
   * @returns Theme colors for the current journey
   */
  const getJourneyTheme = () => {
    return journeyData?.theme || ALL_JOURNEYS[0].theme;
  };

  return {
  journey: journeyData || null,
  journeyId: currentJourneyId,
  setJourney,
  isJourneyActive,
  getJourneyTheme,
  availableJourneys: ALL_JOURNEYS,
};
};