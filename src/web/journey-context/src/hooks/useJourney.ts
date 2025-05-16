import { useCallback, useEffect, useState } from 'react';
import { JourneyAdapter, NavigationAdapter, StorageAdapter, currentPlatform } from '../adapters';
import { JOURNEY_IDS, ALL_JOURNEYS } from '../constants/journeys';
import { DEFAULT_JOURNEY } from '../constants/defaults';
import { Journey, JourneyId } from '../types/journey.types';
import { JourneyPreferences } from '../types/context.types';

/**
 * Hook interface return type
 * Defines the shape of the object returned by the useJourney hook
 */
export interface UseJourneyReturn {
  /**
   * The current journey object with all metadata
   */
  journey: Journey | null;
  
  /**
   * The ID of the current journey
   */
  journeyId: JourneyId;
  
  /**
   * Function to set the current journey
   * @param journeyOrId A Journey object, journey ID string, or null (will use default)
   */
  setJourney: (journeyOrId: Journey | JourneyId | null) => void;
  
  /**
   * Whether the journey data is currently loading
   */
  isLoading: boolean;
  
  /**
   * Any error that occurred while loading journey data
   */
  error: Error | null;
  
  /**
   * All available journeys
   */
  availableJourneys: Journey[];
  
  /**
   * Journey preferences including history and settings
   */
  preferences: JourneyPreferences | null;
  
  /**
   * Check if the given journey ID is the current journey
   */
  isCurrentJourney: (journeyId: JourneyId) => boolean;
  
  /**
   * Get the theme color for the current journey
   */
  getJourneyColor: () => string;
}

/**
 * Custom hook that provides access to the current user journey in the AUSTA SuperApp.
 * It works consistently across web and mobile platforms, handling platform-specific
 * behaviors through adapters.
 * 
 * Features:
 * - Retrieves and updates the current journey
 * - Synchronizes journey state with URL on web platform
 * - Supports deep linking on mobile platform
 * - Validates journey selection against available journeys
 * - Provides journey metadata for theming and navigation
 * - Maintains journey history and preferences
 * - Supports journey-based theming integration
 * 
 * This hook consolidates functionality from both web and mobile journey context
 * implementations, creating a unified interface that works consistently across platforms.
 * It preserves the three distinct user journeys ("Minha Saúde", "Cuidar-me Agora", and
 * "Meu Plano & Benefícios") while ensuring platform independence.
 * 
 * @returns An object containing the current journey and methods to interact with it
 */
export const useJourney = (): UseJourneyReturn => {
  // State for the current journey ID
  const [journeyId, setJourneyId] = useState<JourneyId>(DEFAULT_JOURNEY);
  // State for loading status
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // State for any errors
  const [error, setError] = useState<Error | null>(null);
  // State for journey preferences
  const [preferences, setPreferences] = useState<JourneyPreferences | null>(null);

  /**
   * Initialize the journey state from the adapter
   */
  useEffect(() => {
    const initJourney = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the current journey from the adapter
        const currentJourney = await JourneyAdapter.getCurrentJourney();
        
        // Get journey preferences
        const journeyPrefs = await JourneyAdapter.getJourneyPreferences();
        if (journeyPrefs) {
          setPreferences(journeyPrefs);
        }
        
        if (currentJourney && ALL_JOURNEYS.some(journey => journey.id === currentJourney)) {
          setJourneyId(currentJourney as JourneyId);
        } else {
          // If no valid journey is found, use the default
          setJourneyId(DEFAULT_JOURNEY);
          // Save the default journey
          await JourneyAdapter.setCurrentJourney(DEFAULT_JOURNEY);
        }
        
        // For web platform: Check URL for journey parameter on initial load
        if (currentPlatform === 'web') {
          try {
            // Get the current route from the navigation adapter
            const currentRoute = NavigationAdapter.getCurrentRoute();
            
            // Extract journey ID from route (first path segment)
            const pathSegments = currentRoute.split('/').filter(Boolean);
            const journeyIdFromRoute = pathSegments.length > 0 ? pathSegments[0] : null;
            
            // If a valid journey ID is found in the route, prioritize it over stored journey
            if (
              journeyIdFromRoute && 
              ALL_JOURNEYS.some(journey => journey.id === journeyIdFromRoute)
            ) {
              setJourneyId(journeyIdFromRoute as JourneyId);
              await JourneyAdapter.setCurrentJourney(journeyIdFromRoute as JourneyId);
            }
          } catch (routeErr) {
            console.error('Failed to extract journey from URL:', routeErr);
            // Non-fatal error, continue with the journey from storage
          }
        }
      } catch (err) {
        console.error('Failed to initialize journey:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize journey'));
        // Fall back to default journey on error
        setJourneyId(DEFAULT_JOURNEY);
      } finally {
        setIsLoading(false);
      }
    };

    initJourney();
  }, []);

  /**
   * For web platform: Synchronize journey with URL path
   * This effect handles URL-based journey detection and updates
   */
  useEffect(() => {
    if (currentPlatform === 'web') {
      try {
        // Get the current route from the navigation adapter
        const currentRoute = NavigationAdapter.getCurrentRoute();
        
        // Extract journey ID from route (first path segment)
        const pathSegments = currentRoute.split('/').filter(Boolean);
        const journeyIdFromRoute = pathSegments.length > 0 ? pathSegments[0] : null;
        
        // If a valid journey ID is found in the route and it's different from the current journey,
        // update the current journey
        if (
          journeyIdFromRoute && 
          ALL_JOURNEYS.some(journey => journey.id === journeyIdFromRoute) && 
          journeyIdFromRoute !== journeyId
        ) {
          setJourneyId(journeyIdFromRoute as JourneyId);
          JourneyAdapter.setCurrentJourney(journeyIdFromRoute);
        }
      } catch (err) {
        console.error('Failed to synchronize journey with URL:', err);
      }
    }
  }, [journeyId]);

  /**
   * Function to set the current journey
   * Accepts a Journey object, journey ID string, or null (will use default)
   */
  const setJourney = useCallback(async (journeyOrId: Journey | JourneyId | null) => {
    try {
      let newJourneyId: JourneyId;
      
      if (!journeyOrId) {
        // Default to default journey if null is passed
        newJourneyId = DEFAULT_JOURNEY;
      } else if (typeof journeyOrId === 'string') {
        // Set by ID
        if (ALL_JOURNEYS.some(journey => journey.id === journeyOrId)) {
          newJourneyId = journeyOrId as JourneyId;
        } else {
          console.error(`Invalid journey ID: ${journeyOrId}`);
          return; // Don't update if invalid
        }
      } else {
        // Set by Journey object
        if (!ALL_JOURNEYS.some(journey => journey.id === journeyOrId.id)) {
          console.error(`Invalid journey object with ID: ${journeyOrId.id}`);
          return; // Don't update if invalid
        }
        newJourneyId = journeyOrId.id as JourneyId;
      }
      
      // Don't update if it's the same journey
      if (newJourneyId === journeyId) {
        return;
      }
      
      // Update local state
      setJourneyId(newJourneyId);
      
      // Persist journey selection through adapter
      await JourneyAdapter.setCurrentJourney(newJourneyId);
      
      // Save the last selected journey in preferences
      const updatedPreferences = { 
        ...preferences,
        lastJourney: newJourneyId,
        journeyHistory: [...(preferences?.journeyHistory || []), newJourneyId].slice(-5) // Keep last 5
      };
      setPreferences(updatedPreferences);
      await JourneyAdapter.saveJourneyPreferences(updatedPreferences);
      
      // For web platform: Update URL to reflect journey change
      if (currentPlatform === 'web') {
        const journey = ALL_JOURNEYS.find(j => j.id === newJourneyId);
        if (journey && journey.route) {
          NavigationAdapter.navigateTo(journey.route);
        }
      }
    } catch (err) {
      console.error('Failed to set journey:', err);
      setError(err instanceof Error ? err : new Error('Failed to set journey'));
    }
  }, [journeyId, preferences]);

  // Get the current journey data from the journey ID
  const journey = ALL_JOURNEYS.find(j => j.id === journeyId) || null;
  
  /**
   * Check if the given journey ID is the current journey
   */
  const isCurrentJourney = useCallback((id: JourneyId) => {
    return journeyId === id;
  }, [journeyId]);
  
  /**
   * Get the theme color for the current journey
   */
  const getJourneyColor = useCallback(() => {
    if (!journey) return '#000000'; // Default black
    return journey.color || '#000000';
  }, [journey]);

  return {
    journey,
    journeyId,
    setJourney,
    isLoading,
    error,
    availableJourneys: ALL_JOURNEYS,
    preferences,
    isCurrentJourney,
    getJourneyColor,
  };
};