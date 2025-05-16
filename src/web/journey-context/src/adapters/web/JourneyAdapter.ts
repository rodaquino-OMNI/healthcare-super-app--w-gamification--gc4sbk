/**
 * Web-specific journey adapter that implements localStorage persistence for journey preferences,
 * synchronizes journey state with URL parameters, and integrates with Next.js navigation for
 * journey-specific routing.
 */

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Import from types
import { Journey, JourneyId } from '../../../types/journey.types';
import { WebJourneyContextType } from '../../../types/context.types';

// Import from constants
import { ALL_JOURNEYS, DEFAULT_JOURNEY_ID } from '../../../constants/journeys';

// Import from utils
import { isValidJourneyId, getJourneyById } from '../../../utils/validation';
import { extractJourneyFromPath } from '../../../utils/path';

// Import adapters
import { StorageAdapter } from './StorageAdapter';
import { NavigationAdapter } from './NavigationAdapter';

// Storage key for journey preferences
const JOURNEY_STORAGE_KEY = 'austa_journey_preferences';

/**
 * Interface for journey preferences stored in localStorage
 */
interface JourneyPreferences {
  currentJourneyId: JourneyId;
  lastVisited: Record<JourneyId, string>; // Timestamp of last visit for each journey
  visitCount: Record<JourneyId, number>; // Count of visits for each journey
}

/**
 * Default journey preferences
 */
const DEFAULT_JOURNEY_PREFERENCES: JourneyPreferences = {
  currentJourneyId: DEFAULT_JOURNEY_ID,
  lastVisited: {
    health: '',
    care: '',
    plan: ''
  },
  visitCount: {
    health: 0,
    care: 0,
    plan: 0
  }
};

/**
 * Web-specific journey adapter implementation
 * Handles localStorage persistence, URL synchronization, and Next.js integration
 */
export const JourneyAdapter = (): WebJourneyContextType => {
  // Initialize state with default journey
  const [currentJourney, setCurrentJourney] = useState<JourneyId>(DEFAULT_JOURNEY_ID);
  const [journeyData, setJourneyData] = useState<Journey | undefined>(
    getJourneyById(DEFAULT_JOURNEY_ID)
  );
  const [preferences, setPreferences] = useState<JourneyPreferences>(DEFAULT_JOURNEY_PREFERENCES);
  
  // Get Next.js router for navigation and URL parameter access
  const router = useRouter();
  
  // Initialize storage and navigation adapters
  const storage = StorageAdapter();
  const navigation = NavigationAdapter();

  /**
   * Load journey preferences from localStorage on initial mount
   */
  useEffect(() => {
    const loadJourneyPreferences = async () => {
      try {
        // Attempt to load preferences from localStorage
        const storedPreferences = await storage.getItem<JourneyPreferences>(JOURNEY_STORAGE_KEY);
        
        if (storedPreferences) {
          // Validate the stored journey ID before using it
          const validJourneyId = isValidJourneyId(storedPreferences.currentJourneyId) 
            ? storedPreferences.currentJourneyId 
            : DEFAULT_JOURNEY_ID;
          
          setPreferences({
            ...storedPreferences,
            currentJourneyId: validJourneyId
          });
          
          // Update current journey state
          setCurrentJourney(validJourneyId);
          setJourneyData(getJourneyById(validJourneyId));
        }
      } catch (error) {
        console.error('Failed to load journey preferences:', error);
        // Fall back to defaults on error
        setPreferences(DEFAULT_JOURNEY_PREFERENCES);
        setCurrentJourney(DEFAULT_JOURNEY_ID);
        setJourneyData(getJourneyById(DEFAULT_JOURNEY_ID));
      }
    };
    
    loadJourneyPreferences();
  }, []);

  /**
   * Synchronize journey state with URL parameters on route changes
   */
  useEffect(() => {
    if (!router.isReady) return;
    
    // Extract journey from current path
    const pathJourneyId = extractJourneyFromPath(router.asPath);
    
    if (pathJourneyId && isValidJourneyId(pathJourneyId) && pathJourneyId !== currentJourney) {
      // Update journey state based on URL
      handleSetCurrentJourney(pathJourneyId);
    } else if (currentJourney && !router.asPath.includes(`/${currentJourney}`)) {
      // If we're on a non-journey path (like root or auth), don't change the current journey
      // but also don't force navigation to the current journey
    }
  }, [router.asPath, router.isReady]);

  /**
   * Save journey preferences to localStorage whenever they change
   */
  useEffect(() => {
    const saveJourneyPreferences = async () => {
      try {
        await storage.setItem(JOURNEY_STORAGE_KEY, preferences);
      } catch (error) {
        console.error('Failed to save journey preferences:', error);
      }
    };
    
    saveJourneyPreferences();
  }, [preferences]);

  /**
   * Handle setting the current journey with validation and persistence
   * @param journeyId The ID of the journey to set as current
   */
  const handleSetCurrentJourney = (journeyId: string) => {
    // Validate that the journey ID is valid
    if (!isValidJourneyId(journeyId)) {
      console.error(`Invalid journey ID: ${journeyId}`);
      return;
    }
    
    const validJourneyId = journeyId as JourneyId;
    const journeyData = getJourneyById(validJourneyId);
    
    if (!journeyData) {
      console.error(`Journey data not found for ID: ${journeyId}`);
      return;
    }
    
    // Update state
    setCurrentJourney(validJourneyId);
    setJourneyData(journeyData);
    
    // Update preferences with new journey and tracking data
    const now = new Date().toISOString();
    setPreferences(prev => ({
      ...prev,
      currentJourneyId: validJourneyId,
      lastVisited: {
        ...prev.lastVisited,
        [validJourneyId]: now
      },
      visitCount: {
        ...prev.visitCount,
        [validJourneyId]: (prev.visitCount[validJourneyId] || 0) + 1
      }
    }));
    
    // Synchronize URL if needed
    const currentPath = router.asPath;
    const isAlreadyOnJourneyPath = currentPath.includes(`/${validJourneyId}`);
    
    if (!isAlreadyOnJourneyPath && router.isReady) {
      // Navigate to the journey's main route if not already there
      navigation.navigateToJourney(validJourneyId);
    }
  };

  /**
   * Get journey usage statistics
   * @returns Object with journey usage data
   */
  const getJourneyStats = () => {
    return {
      mostVisited: Object.entries(preferences.visitCount)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([id]) => id as JourneyId)[0] || DEFAULT_JOURNEY_ID,
      lastVisited: Object.entries(preferences.lastVisited)
        .filter(([, timestamp]) => timestamp)
        .sort(([, timeA], [, timeB]) => new Date(timeB).getTime() - new Date(timeA).getTime())
        .map(([id]) => id as JourneyId)[0] || DEFAULT_JOURNEY_ID,
      visitCounts: { ...preferences.visitCount }
    };
  };

  return {
    currentJourney,
    setCurrentJourney: handleSetCurrentJourney,
    journeyData,
    allJourneys: ALL_JOURNEYS,
    journeyStats: getJourneyStats()
  };
};