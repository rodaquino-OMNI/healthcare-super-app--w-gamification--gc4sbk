/**
 * @file JourneyAdapter.ts
 * @description Mobile-specific journey adapter that implements AsyncStorage persistence for journey preferences,
 * integrates with React Navigation for journey-based routing, and provides deep linking support for
 * journey-specific screens. This adapter ensures consistent journey state across app restarts and
 * maintains synchronization between navigation state and journey context.
 */

import { JourneyId, JOURNEY_IDS, isValidJourneyId, Journey, DEFAULT_JOURNEY_CONFIG } from '../../../types/journey.types';
import { MobileJourneyContextType } from '../../../types/context.types';
import { StorageAdapter } from './StorageAdapter';
import { NavigationAdapter, NavigationParams } from './NavigationAdapter';

/**
 * Storage key for journey preferences
 */
const JOURNEY_STORAGE_KEY = '@austa/journey-preferences';

/**
 * Journey preferences stored in AsyncStorage
 */
interface JourneyPreferences {
  /** The last selected journey ID */
  currentJourney: JourneyId;
  /** Timestamp when the journey was last selected */
  lastUpdated: number;
  /** User-specific journey preferences */
  preferences?: {
    /** Whether to show journey onboarding */
    showOnboarding?: boolean;
    /** User's preferred order of journeys */
    journeyOrder?: JourneyId[];
    /** Journey-specific user preferences */
    journeySettings?: Record<JourneyId, any>;
  };
}

/**
 * Error types specific to journey operations
 */
export enum JourneyErrorType {
  INVALID_JOURNEY = 'INVALID_JOURNEY',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
}

/**
 * Custom error class for journey operations
 */
export class JourneyError extends Error {
  type: JourneyErrorType;
  journeyId?: JourneyId;
  originalError?: Error;

  constructor(type: JourneyErrorType, message: string, journeyId?: JourneyId, originalError?: Error) {
    super(message);
    this.name = 'JourneyError';
    this.type = type;
    this.journeyId = journeyId;
    this.originalError = originalError;
  }
}

/**
 * Options for journey adapter initialization
 */
export interface JourneyAdapterOptions {
  /** Default journey to use if none is stored */
  defaultJourney?: JourneyId;
  /** Whether to persist journey selection between sessions */
  persistJourneySelection?: boolean;
  /** Storage adapter instance to use */
  storageAdapter?: StorageAdapter;
  /** Navigation adapter instance to use */
  navigationAdapter?: NavigationAdapter;
  /** Whether to validate journey IDs */
  validateJourneys?: boolean;
  /** Whether to automatically navigate when journey changes */
  autoNavigate?: boolean;
  /** Callback when journey changes */
  onJourneyChange?: (journeyId: JourneyId) => void;
}

/**
 * Default options for journey adapter
 */
const DEFAULT_OPTIONS: JourneyAdapterOptions = {
  defaultJourney: JOURNEY_IDS.HEALTH,
  persistJourneySelection: true,
  validateJourneys: true,
  autoNavigate: true,
};

/**
 * Mobile-specific journey adapter that implements AsyncStorage persistence for journey preferences,
 * integrates with React Navigation for journey-based routing, and provides deep linking support.
 */
export class JourneyAdapter {
  private options: JourneyAdapterOptions;
  private storageAdapter: StorageAdapter;
  private navigationAdapter?: NavigationAdapter;
  private currentJourney: JourneyId;
  private isInitialized: boolean = false;
  private isTransitioning: boolean = false;
  private error: Error | null = null;
  private journeyChangeListeners: Array<(journeyId: JourneyId) => void> = [];

  /**
   * Creates a new JourneyAdapter instance
   * 
   * @param options - Configuration options for the adapter
   */
  constructor(options: JourneyAdapterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.storageAdapter = options.storageAdapter || new StorageAdapter();
    this.navigationAdapter = options.navigationAdapter;
    this.currentJourney = this.options.defaultJourney || JOURNEY_IDS.HEALTH;

    // Add journey change listener if provided
    if (this.options.onJourneyChange) {
      this.journeyChangeListeners.push(this.options.onJourneyChange);
    }
  }

  /**
   * Initializes the journey adapter by loading stored preferences
   * 
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    try {
      this.isTransitioning = true;

      // Check if storage is available
      const isStorageAvailable = await this.storageAdapter.isStorageAvailable();
      if (!isStorageAvailable) {
        throw new JourneyError(
          JourneyErrorType.STORAGE_ERROR,
          'Storage is not available',
        );
      }

      // Load journey preferences from storage if persistence is enabled
      if (this.options.persistJourneySelection) {
        const preferences = await this.loadJourneyPreferences();
        if (preferences) {
          // Validate the journey ID if validation is enabled
          if (this.options.validateJourneys && !isValidJourneyId(preferences.currentJourney)) {
            console.warn(`Invalid journey ID loaded from storage: ${preferences.currentJourney}, using default journey instead`);
            this.currentJourney = this.options.defaultJourney || JOURNEY_IDS.HEALTH;
          } else {
            this.currentJourney = preferences.currentJourney;
          }
        }
      }

      // Set the current journey in the navigation adapter if available
      if (this.navigationAdapter) {
        this.navigationAdapter.setCurrentJourney(this.currentJourney);
      }

      this.isInitialized = true;
      this.error = null;
    } catch (error) {
      this.error = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize journey adapter:', error);
      throw new JourneyError(
        JourneyErrorType.INITIALIZATION_ERROR,
        'Failed to initialize journey adapter',
        undefined,
        this.error
      );
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Loads journey preferences from storage
   * 
   * @returns Promise that resolves with the loaded preferences or null if not found
   */
  private async loadJourneyPreferences(): Promise<JourneyPreferences | null> {
    try {
      return await this.storageAdapter.getItem<JourneyPreferences>(JOURNEY_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to load journey preferences:', error);
      return null;
    }
  }

  /**
   * Saves journey preferences to storage
   * 
   * @param preferences - The preferences to save
   * @returns Promise that resolves when the operation completes
   */
  private async saveJourneyPreferences(preferences: JourneyPreferences): Promise<void> {
    try {
      await this.storageAdapter.setItem(JOURNEY_STORAGE_KEY, preferences);
    } catch (error) {
      console.error('Failed to save journey preferences:', error);
      throw new JourneyError(
        JourneyErrorType.STORAGE_ERROR,
        'Failed to save journey preferences',
        preferences.currentJourney,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Sets the current journey
   * 
   * @param journeyId - The journey ID to set as current
   * @param navigate - Whether to navigate to the journey's main screen
   * @returns Promise that resolves when the operation completes
   * @throws JourneyError if the journey ID is invalid or the operation fails
   */
  public async setJourney(journeyId: JourneyId, navigate: boolean = true): Promise<void> {
    try {
      // Validate the journey ID if validation is enabled
      if (this.options.validateJourneys && !isValidJourneyId(journeyId)) {
        throw new JourneyError(
          JourneyErrorType.INVALID_JOURNEY,
          `Invalid journey ID: ${journeyId}`,
          journeyId
        );
      }

      // Skip if the journey is already set
      if (journeyId === this.currentJourney && this.isInitialized) {
        return;
      }

      this.isTransitioning = true;

      // Update the current journey
      const previousJourney = this.currentJourney;
      this.currentJourney = journeyId;

      // Save the journey preference if persistence is enabled
      if (this.options.persistJourneySelection) {
        const existingPreferences = await this.loadJourneyPreferences() || {
          currentJourney: journeyId,
          lastUpdated: Date.now(),
          preferences: {},
        };

        const updatedPreferences: JourneyPreferences = {
          ...existingPreferences,
          currentJourney: journeyId,
          lastUpdated: Date.now(),
        };

        await this.saveJourneyPreferences(updatedPreferences);
      }

      // Update the navigation adapter if available
      if (this.navigationAdapter) {
        this.navigationAdapter.setCurrentJourney(journeyId);

        // Navigate to the journey's main screen if requested
        if (navigate && this.options.autoNavigate) {
          try {
            // Determine the route name based on the journey ID
            const routeName = this.getJourneyMainRoute(journeyId);
            if (routeName) {
              await this.navigationAdapter.navigate(routeName);
            }
          } catch (error) {
            console.error(`Failed to navigate to journey ${journeyId}:`, error);
            throw new JourneyError(
              JourneyErrorType.NAVIGATION_ERROR,
              `Failed to navigate to journey ${journeyId}`,
              journeyId,
              error instanceof Error ? error : new Error(String(error))
            );
          }
        }
      }

      // Notify journey change listeners
      this.notifyJourneyChangeListeners(journeyId, previousJourney);

      this.error = null;
    } catch (error) {
      this.error = error instanceof Error ? error : new Error(String(error));
      throw error;
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Gets the main route name for a journey
   * 
   * @param journeyId - The journey ID
   * @returns The main route name for the journey
   */
  private getJourneyMainRoute(journeyId: JourneyId): string {
    // Map journey IDs to their main route names
    const routeMap: Record<JourneyId, string> = {
      [JOURNEY_IDS.HEALTH]: 'HealthHome',
      [JOURNEY_IDS.CARE]: 'CareHome',
      [JOURNEY_IDS.PLAN]: 'PlanHome',
    };

    return routeMap[journeyId] || `${journeyId.charAt(0).toUpperCase() + journeyId.slice(1)}Home`;
  }

  /**
   * Adds a journey change listener
   * 
   * @param listener - The listener function
   * @returns A function to remove the listener
   */
  public addJourneyChangeListener(listener: (journeyId: JourneyId) => void): () => void {
    this.journeyChangeListeners.push(listener);
    return () => {
      this.journeyChangeListeners = this.journeyChangeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifies all journey change listeners
   * 
   * @param journeyId - The new journey ID
   * @param previousJourneyId - The previous journey ID
   */
  private notifyJourneyChangeListeners(journeyId: JourneyId, previousJourneyId: JourneyId): void {
    this.journeyChangeListeners.forEach(listener => {
      try {
        listener(journeyId);
      } catch (error) {
        console.error('Error in journey change listener:', error);
      }
    });
  }

  /**
   * Gets the current journey ID
   * 
   * @returns The current journey ID
   */
  public getJourney(): JourneyId {
    return this.currentJourney;
  }

  /**
   * Gets journey-specific preferences
   * 
   * @param journeyId - The journey ID
   * @returns Promise that resolves with the journey preferences or null if not found
   */
  public async getJourneyPreferences(journeyId: JourneyId): Promise<any | null> {
    try {
      const preferences = await this.loadJourneyPreferences();
      if (!preferences || !preferences.preferences || !preferences.preferences.journeySettings) {
        return null;
      }

      return preferences.preferences.journeySettings[journeyId] || null;
    } catch (error) {
      console.warn(`Failed to get preferences for journey ${journeyId}:`, error);
      return null;
    }
  }

  /**
   * Sets journey-specific preferences
   * 
   * @param journeyId - The journey ID
   * @param preferences - The preferences to save
   * @returns Promise that resolves when the operation completes
   */
  public async setJourneyPreferences(journeyId: JourneyId, preferences: any): Promise<void> {
    try {
      // Validate the journey ID if validation is enabled
      if (this.options.validateJourneys && !isValidJourneyId(journeyId)) {
        throw new JourneyError(
          JourneyErrorType.INVALID_JOURNEY,
          `Invalid journey ID: ${journeyId}`,
          journeyId
        );
      }

      const existingPreferences = await this.loadJourneyPreferences() || {
        currentJourney: this.currentJourney,
        lastUpdated: Date.now(),
        preferences: {
          journeySettings: {},
        },
      };

      // Ensure the preferences structure exists
      if (!existingPreferences.preferences) {
        existingPreferences.preferences = {};
      }

      if (!existingPreferences.preferences.journeySettings) {
        existingPreferences.preferences.journeySettings = {};
      }

      // Update the journey-specific preferences
      existingPreferences.preferences.journeySettings[journeyId] = preferences;
      existingPreferences.lastUpdated = Date.now();

      await this.saveJourneyPreferences(existingPreferences);
    } catch (error) {
      console.error(`Failed to set preferences for journey ${journeyId}:`, error);
      throw new JourneyError(
        JourneyErrorType.STORAGE_ERROR,
        `Failed to set preferences for journey ${journeyId}`,
        journeyId,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Navigates to a journey-specific screen
   * 
   * @param journeyId - The journey ID
   * @param screenName - The screen name within the journey
   * @param params - Optional parameters to pass to the screen
   * @returns Promise that resolves when the operation completes
   */
  public async navigateToJourneyScreen(
    journeyId: JourneyId,
    screenName: string,
    params?: NavigationParams
  ): Promise<void> {
    try {
      // Validate the journey ID if validation is enabled
      if (this.options.validateJourneys && !isValidJourneyId(journeyId)) {
        throw new JourneyError(
          JourneyErrorType.INVALID_JOURNEY,
          `Invalid journey ID: ${journeyId}`,
          journeyId
        );
      }

      // Check if navigation adapter is available
      if (!this.navigationAdapter) {
        throw new JourneyError(
          JourneyErrorType.NAVIGATION_ERROR,
          'Navigation adapter is not available',
          journeyId
        );
      }

      // Set the current journey if it's different
      if (journeyId !== this.currentJourney) {
        await this.setJourney(journeyId, false);
      }

      // Format the screen name with journey prefix if needed
      const formattedScreenName = this.formatJourneyScreenName(journeyId, screenName);

      // Navigate to the screen
      await this.navigationAdapter.navigate(formattedScreenName, params);
    } catch (error) {
      console.error(`Failed to navigate to ${screenName} in journey ${journeyId}:`, error);
      throw new JourneyError(
        JourneyErrorType.NAVIGATION_ERROR,
        `Failed to navigate to ${screenName} in journey ${journeyId}`,
        journeyId,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Formats a screen name with journey prefix if needed
   * 
   * @param journeyId - The journey ID
   * @param screenName - The screen name
   * @returns The formatted screen name
   */
  private formatJourneyScreenName(journeyId: JourneyId, screenName: string): string {
    // If the screen name already starts with the journey name, return it as is
    const journeyPrefix = journeyId.charAt(0).toUpperCase() + journeyId.slice(1);
    if (screenName.startsWith(journeyPrefix)) {
      return screenName;
    }

    // Otherwise, add the journey prefix
    return `${journeyPrefix}${screenName}`;
  }

  /**
   * Handles a deep link URL
   * 
   * @param url - The deep link URL to handle
   * @returns Promise that resolves with true if the deep link was handled, false otherwise
   */
  public async handleDeepLink(url: string): Promise<boolean> {
    try {
      // Check if navigation adapter is available
      if (!this.navigationAdapter) {
        console.warn('Navigation adapter is not available for deep linking');
        return false;
      }

      // Try to handle the deep link with the navigation adapter
      return await this.navigationAdapter.handleDeepLink(url);
    } catch (error) {
      console.error('Error handling deep link:', error);
      return false;
    }
  }

  /**
   * Creates a journey context object for use with React context
   * 
   * @returns The journey context object
   */
  public createJourneyContext(): MobileJourneyContextType {
    return {
      isInitialized: this.isInitialized,
      isTransitioning: this.isTransitioning,
      error: this.error,
      journey: this.currentJourney,
      setJourney: this.setJourney.bind(this),
    };
  }

  /**
   * Resets journey preferences to defaults
   * 
   * @returns Promise that resolves when the operation completes
   */
  public async resetJourneyPreferences(): Promise<void> {
    try {
      // Remove the stored preferences
      await this.storageAdapter.removeItem(JOURNEY_STORAGE_KEY);

      // Reset to default journey
      this.currentJourney = this.options.defaultJourney || JOURNEY_IDS.HEALTH;

      // Update the navigation adapter if available
      if (this.navigationAdapter) {
        this.navigationAdapter.setCurrentJourney(this.currentJourney);
      }

      // Notify journey change listeners
      this.notifyJourneyChangeListeners(this.currentJourney, this.currentJourney);
    } catch (error) {
      console.error('Failed to reset journey preferences:', error);
      throw new JourneyError(
        JourneyErrorType.STORAGE_ERROR,
        'Failed to reset journey preferences',
        undefined,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Gets all available journeys
   * 
   * @returns Array of available journeys
   */
  public getAvailableJourneys(): Journey[] {
    return DEFAULT_JOURNEY_CONFIG.availableJourneys;
  }

  /**
   * Checks if a journey is available
   * 
   * @param journeyId - The journey ID to check
   * @returns True if the journey is available, false otherwise
   */
  public isJourneyAvailable(journeyId: JourneyId): boolean {
    return DEFAULT_JOURNEY_CONFIG.availableJourneys.some(journey => journey.id === journeyId && journey.enabled !== false);
  }

  /**
   * Sets the navigation adapter
   * 
   * @param navigationAdapter - The navigation adapter to use
   */
  public setNavigationAdapter(navigationAdapter: NavigationAdapter): void {
    this.navigationAdapter = navigationAdapter;
    
    // Update the current journey in the navigation adapter
    if (this.navigationAdapter) {
      this.navigationAdapter.setCurrentJourney(this.currentJourney);
    }
  }
}