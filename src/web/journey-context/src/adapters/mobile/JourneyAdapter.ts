/**
 * @file JourneyAdapter.ts
 * @description Mobile-specific implementation of the Journey adapter
 * 
 * This adapter provides mobile-specific functionality for the journey context:
 * - AsyncStorage persistence for journey preferences
 * - React Navigation integration for journey-based routing
 * - Deep linking support for journey-specific screens
 * - Journey validation with improved error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { JourneyId, JOURNEY_IDS, DEFAULT_JOURNEY } from '../../types/journey.types';

// Storage keys
const STORAGE_KEYS = {
  CURRENT_JOURNEY: '@austa/journey/current',
  JOURNEY_PREFERENCES: '@austa/journey/preferences',
  LAST_VISITED_ROUTES: '@austa/journey/lastVisited',
};

/**
 * Interface for journey preferences that will be persisted
 */
interface JourneyPreferences {
  currentJourney: JourneyId;
  lastVisitedRoutes: Record<JourneyId, string>;
  favorites?: JourneyId[];
  recentJourneys?: JourneyId[];
}

/**
 * Default journey preferences
 */
const DEFAULT_PREFERENCES: JourneyPreferences = {
  currentJourney: DEFAULT_JOURNEY,
  lastVisitedRoutes: {
    [JOURNEY_IDS.HEALTH]: 'Health',
    [JOURNEY_IDS.CARE]: 'Care',
    [JOURNEY_IDS.PLAN]: 'Plan',
  },
  favorites: [],
  recentJourneys: [],
};

/**
 * Deep link pattern for journey-specific routes
 */
const DEEP_LINK_PATTERN = /^austa:\/\/journey\/(health|care|plan)(?:\/([\w-]+))?/;

/**
 * Mobile-specific Journey Adapter
 * 
 * Provides functionality for:
 * - Persisting journey state to AsyncStorage
 * - Integrating with React Navigation
 * - Supporting deep linking
 * - Validating journey selections
 */
class JourneyAdapter {
  private navigationRef: React.RefObject<NavigationContainerRef<any>> | null = null;
  private preferences: JourneyPreferences = DEFAULT_PREFERENCES;
  private isInitialized = false;

  /**
   * Initialize the adapter
   * Loads persisted journey preferences from AsyncStorage
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      // Load persisted journey preferences
      const storedPreferences = await AsyncStorage.getItem(STORAGE_KEYS.JOURNEY_PREFERENCES);
      
      if (storedPreferences) {
        this.preferences = {
          ...DEFAULT_PREFERENCES,
          ...JSON.parse(storedPreferences),
        };
      }

      // Set up deep link handling
      this.setupDeepLinkHandling();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize JourneyAdapter:', error);
      // Fall back to default preferences if there's an error
      this.preferences = DEFAULT_PREFERENCES;
      this.isInitialized = true;
    }
  }

  /**
   * Set up deep link handling for journey-specific routes
   */
  private setupDeepLinkHandling(): void {
    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        this.handleDeepLink(url);
      }
    }).catch(err => {
      console.error('Failed to get initial URL:', err);
    });

    // Listen for deep links while the app is running
    Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });
  }

  /**
   * Handle deep link URLs for journey-specific routes
   * 
   * @param url The deep link URL to handle
   * @returns true if the URL was handled, false otherwise
   */
  private handleDeepLink(url: string): boolean {
    const match = url.match(DEEP_LINK_PATTERN);
    
    if (match) {
      const journeyId = match[1] as JourneyId;
      const screenPath = match[2] || '';
      
      if (this.isValidJourney(journeyId)) {
        // Set the current journey
        this.setCurrentJourney(journeyId);
        
        // Navigate to the specific screen if provided
        if (screenPath && this.navigationRef?.current) {
          const routeName = this.getRouteNameForJourney(journeyId, screenPath);
          if (routeName) {
            this.navigationRef.current.navigate(routeName);
          }
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get the route name for a specific journey and screen path
   * 
   * @param journeyId The journey ID
   * @param screenPath The screen path from the deep link
   * @returns The route name to navigate to
   */
  private getRouteNameForJourney(journeyId: JourneyId, screenPath: string): string {
    // Map screen paths to route names based on journey
    const routeMappings: Record<JourneyId, Record<string, string>> = {
      [JOURNEY_IDS.HEALTH]: {
        'metrics': 'HealthMetrics',
        'goals': 'HealthGoals',
        'devices': 'HealthDevices',
        'profile': 'HealthProfile',
      },
      [JOURNEY_IDS.CARE]: {
        'appointments': 'CareAppointments',
        'telemedicine': 'CareTelemedicine',
        'medications': 'CareMedications',
        'providers': 'CareProviders',
      },
      [JOURNEY_IDS.PLAN]: {
        'coverage': 'PlanCoverage',
        'claims': 'PlanClaims',
        'benefits': 'PlanBenefits',
        'documents': 'PlanDocuments',
      },
    };
    
    // Return the mapped route name or the default route for the journey
    return routeMappings[journeyId][screenPath] || this.preferences.lastVisitedRoutes[journeyId];
  }

  /**
   * Set the navigation reference for programmatic navigation
   * 
   * @param ref React Navigation container reference
   */
  setNavigationRef(ref: React.RefObject<NavigationContainerRef<any>>): void {
    this.navigationRef = ref;
  }

  /**
   * Get the current journey ID
   * 
   * @returns The current journey ID
   */
  getCurrentJourney(): JourneyId {
    return this.preferences.currentJourney;
  }

  /**
   * Set the current journey ID and persist it to AsyncStorage
   * 
   * @param journeyId The journey ID to set as current
   * @returns Promise that resolves when the journey is set and persisted
   */
  async setCurrentJourney(journeyId: JourneyId): Promise<void> {
    if (!this.isValidJourney(journeyId)) {
      console.error(`Invalid journey ID: ${journeyId}`);
      return;
    }

    try {
      // Update the current journey
      this.preferences.currentJourney = journeyId;
      
      // Add to recent journeys if not already present
      if (this.preferences.recentJourneys) {
        this.preferences.recentJourneys = [
          journeyId,
          ...this.preferences.recentJourneys.filter(id => id !== journeyId),
        ].slice(0, 5); // Keep only the 5 most recent
      }
      
      // Persist the updated preferences
      await this.persistPreferences();
      
      // Navigate to the journey's last visited route if navigation is available
      if (this.navigationRef?.current) {
        const routeName = this.preferences.lastVisitedRoutes[journeyId];
        if (routeName) {
          this.navigationRef.current.navigate(routeName);
        }
      }
    } catch (error) {
      console.error('Failed to set current journey:', error);
    }
  }

  /**
   * Save the current route for a journey
   * 
   * @param journeyId The journey ID
   * @param routeName The route name to save
   * @returns Promise that resolves when the route is saved
   */
  async saveLastVisitedRoute(journeyId: JourneyId, routeName: string): Promise<void> {
    if (!this.isValidJourney(journeyId)) {
      console.error(`Invalid journey ID: ${journeyId}`);
      return;
    }

    try {
      // Update the last visited route for the journey
      this.preferences.lastVisitedRoutes[journeyId] = routeName;
      
      // Persist the updated preferences
      await this.persistPreferences();
    } catch (error) {
      console.error('Failed to save last visited route:', error);
    }
  }

  /**
   * Add a journey to favorites
   * 
   * @param journeyId The journey ID to add to favorites
   * @returns Promise that resolves when the journey is added to favorites
   */
  async addToFavorites(journeyId: JourneyId): Promise<void> {
    if (!this.isValidJourney(journeyId)) {
      console.error(`Invalid journey ID: ${journeyId}`);
      return;
    }

    try {
      if (!this.preferences.favorites) {
        this.preferences.favorites = [];
      }
      
      // Add to favorites if not already present
      if (!this.preferences.favorites.includes(journeyId)) {
        this.preferences.favorites.push(journeyId);
        
        // Persist the updated preferences
        await this.persistPreferences();
      }
    } catch (error) {
      console.error('Failed to add journey to favorites:', error);
    }
  }

  /**
   * Remove a journey from favorites
   * 
   * @param journeyId The journey ID to remove from favorites
   * @returns Promise that resolves when the journey is removed from favorites
   */
  async removeFromFavorites(journeyId: JourneyId): Promise<void> {
    if (!this.isValidJourney(journeyId)) {
      console.error(`Invalid journey ID: ${journeyId}`);
      return;
    }

    try {
      if (this.preferences.favorites) {
        // Remove from favorites
        this.preferences.favorites = this.preferences.favorites.filter(id => id !== journeyId);
        
        // Persist the updated preferences
        await this.persistPreferences();
      }
    } catch (error) {
      console.error('Failed to remove journey from favorites:', error);
    }
  }

  /**
   * Get the favorite journeys
   * 
   * @returns Array of favorite journey IDs
   */
  getFavorites(): JourneyId[] {
    return this.preferences.favorites || [];
  }

  /**
   * Get the recent journeys
   * 
   * @returns Array of recent journey IDs
   */
  getRecentJourneys(): JourneyId[] {
    return this.preferences.recentJourneys || [];
  }

  /**
   * Check if a journey ID is valid
   * 
   * @param journeyId The journey ID to validate
   * @returns true if the journey ID is valid, false otherwise
   */
  private isValidJourney(journeyId: any): journeyId is JourneyId {
    return Object.values(JOURNEY_IDS).includes(journeyId as JourneyId);
  }

  /**
   * Persist journey preferences to AsyncStorage
   * 
   * @returns Promise that resolves when preferences are persisted
   */
  private async persistPreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.JOURNEY_PREFERENCES,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Failed to persist journey preferences:', error);
    }
  }

  /**
   * Create a deep link URL for a specific journey and screen
   * 
   * @param journeyId The journey ID
   * @param screenPath Optional screen path
   * @returns Deep link URL
   */
  createDeepLink(journeyId: JourneyId, screenPath?: string): string {
    if (!this.isValidJourney(journeyId)) {
      console.error(`Invalid journey ID: ${journeyId}`);
      return '';
    }

    return screenPath
      ? `austa://journey/${journeyId}/${screenPath}`
      : `austa://journey/${journeyId}`;
  }

  /**
   * Check if the adapter is initialized
   * 
   * @returns true if the adapter is initialized, false otherwise
   */
  isAdapterInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset all journey preferences to defaults
   * 
   * @returns Promise that resolves when preferences are reset
   */
  async resetPreferences(): Promise<void> {
    try {
      this.preferences = DEFAULT_PREFERENCES;
      await this.persistPreferences();
    } catch (error) {
      console.error('Failed to reset journey preferences:', error);
    }
  }
}

// Export a singleton instance
const journeyAdapter = new JourneyAdapter();
export default journeyAdapter;