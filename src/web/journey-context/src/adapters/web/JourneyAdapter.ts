/**
 * @file JourneyAdapter.ts
 * @description Web-specific journey adapter that implements localStorage persistence for journey preferences,
 * synchronizes journey state with URL parameters, and integrates with Next.js navigation for journey-specific routing.
 * This adapter ensures consistent journey state across page refreshes and browser sessions.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { StorageAdapter } from './StorageAdapter';
import { NavigationAdapter } from './NavigationAdapter';
import { 
  JourneyId, 
  Journey, 
  isValidJourneyId, 
  DEFAULT_JOURNEY_CONFIG,
  JOURNEY_IDS 
} from '../../../types/journey.types';
import { WebJourneyContextType } from '../../../types/context.types';

/**
 * Storage key for journey preferences
 */
const JOURNEY_STORAGE_KEY = 'journey_preferences';

/**
 * URL parameter name for journey
 */
const JOURNEY_URL_PARAM = 'journey';

/**
 * Journey adapter options interface
 */
export interface JourneyAdapterOptions {
  /** Initial journey ID to use if no stored preference exists */
  initialJourneyId?: JourneyId;
  /** Whether to synchronize journey state with URL parameters */
  syncWithUrl?: boolean;
  /** Whether to persist journey preferences to localStorage */
  persistPreferences?: boolean;
  /** Custom storage adapter instance */
  storageAdapter?: StorageAdapter;
  /** Custom navigation adapter instance */
  navigationAdapter?: NavigationAdapter;
}

/**
 * Default journey adapter options
 */
const DEFAULT_OPTIONS: JourneyAdapterOptions = {
  initialJourneyId: DEFAULT_JOURNEY_CONFIG.defaultJourney,
  syncWithUrl: true,
  persistPreferences: true,
};

/**
 * Journey preferences stored in localStorage
 */
interface JourneyPreferences {
  /** The last selected journey ID */
  currentJourney: JourneyId;
  /** Timestamp when the preference was last updated */
  lastUpdated: number;
  /** Additional journey-specific preferences */
  [key: string]: any;
}

/**
 * Web-specific journey adapter
 * Implements localStorage persistence and URL synchronization for journey state
 */
export class JourneyAdapter {
  private storageAdapter: StorageAdapter;
  private navigationAdapter: NavigationAdapter;
  private options: JourneyAdapterOptions;
  private journeyMap: Map<JourneyId, Journey>;

  // State
  private currentJourney: JourneyId;
  private isInitialized: boolean = false;
  private error: Error | null = null;

  /**
   * Creates a new JourneyAdapter instance
   * @param options - Configuration options
   */
  constructor(options: JourneyAdapterOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Initialize storage adapter
    this.storageAdapter = options.storageAdapter || new StorageAdapter('austa_');
    
    // Initialize navigation adapter
    this.navigationAdapter = options.navigationAdapter || new NavigationAdapter();
    
    // Initialize journey map for quick lookups
    this.journeyMap = new Map();
    DEFAULT_JOURNEY_CONFIG.availableJourneys.forEach(journey => {
      this.journeyMap.set(journey.id, journey);
    });
    
    // Set initial journey
    this.currentJourney = this.options.initialJourneyId || DEFAULT_JOURNEY_CONFIG.defaultJourney;
    
    // Initialize journey state
    this.initializeJourneyState();
  }

  /**
   * Initialize journey state from storage and URL
   */
  private initializeJourneyState(): void {
    try {
      // First check URL parameters if sync is enabled
      if (this.options.syncWithUrl && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const journeyParam = urlParams.get(JOURNEY_URL_PARAM);
        
        if (journeyParam && isValidJourneyId(journeyParam)) {
          this.currentJourney = journeyParam;
          this.isInitialized = true;
          return;
        }
        
        // Try to extract journey from URL path
        const pathJourney = this.navigationAdapter.getJourneyFromUrl(window.location.pathname);
        if (pathJourney) {
          this.currentJourney = pathJourney;
          this.isInitialized = true;
          return;
        }
      }
      
      // Then check localStorage if persistence is enabled
      if (this.options.persistPreferences) {
        const result = this.storageAdapter.get<JourneyPreferences>(JOURNEY_STORAGE_KEY);
        
        if (result.success && result.data && isValidJourneyId(result.data.currentJourney)) {
          this.currentJourney = result.data.currentJourney;
          this.isInitialized = true;
          return;
        }
      }
      
      // Fall back to default journey
      this.currentJourney = DEFAULT_JOURNEY_CONFIG.defaultJourney;
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing journey state:', error);
      this.error = error instanceof Error ? error : new Error('Unknown error initializing journey state');
      this.currentJourney = DEFAULT_JOURNEY_CONFIG.defaultJourney;
      this.isInitialized = true;
    }
  }

  /**
   * Get the current journey ID
   * @returns The current journey ID
   */
  public getCurrentJourney(): JourneyId {
    return this.currentJourney;
  }

  /**
   * Get the full journey data for the current journey
   * @returns The current journey data or undefined if not found
   */
  public getJourneyData(): Journey | undefined {
    return this.journeyMap.get(this.currentJourney);
  }

  /**
   * Set the current journey
   * @param journeyId - The journey ID to set
   * @returns Whether the operation was successful
   */
  public setCurrentJourney(journeyId: string): boolean {
    try {
      // Validate journey ID
      if (!isValidJourneyId(journeyId)) {
        console.error(`Invalid journey ID: ${journeyId}`);
        return false;
      }
      
      // Update current journey
      this.currentJourney = journeyId;
      
      // Persist to localStorage if enabled
      if (this.options.persistPreferences) {
        const preferences: JourneyPreferences = {
          currentJourney: journeyId,
          lastUpdated: Date.now(),
        };
        
        this.storageAdapter.set(JOURNEY_STORAGE_KEY, preferences);
      }
      
      // Sync with URL if enabled
      if (this.options.syncWithUrl && typeof window !== 'undefined') {
        this.syncJourneyWithUrl(journeyId);
      }
      
      return true;
    } catch (error) {
      console.error('Error setting current journey:', error);
      this.error = error instanceof Error ? error : new Error('Unknown error setting journey');
      return false;
    }
  }

  /**
   * Synchronize journey state with URL parameters
   * @param journeyId - The journey ID to sync
   */
  private syncJourneyWithUrl(journeyId: JourneyId): void {
    try {
      // Get current URL and params
      const url = new URL(window.location.href);
      
      // Update journey parameter
      url.searchParams.set(JOURNEY_URL_PARAM, journeyId);
      
      // Update URL without reloading page
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Error syncing journey with URL:', error);
    }
  }

  /**
   * Navigate to a journey route
   * @param journeyId - The journey ID to navigate to
   * @param subpath - Optional subpath within the journey
   * @returns Promise that resolves when navigation is complete
   */
  public navigateToJourney(journeyId: JourneyId, subpath?: string): Promise<boolean> {
    // Set the current journey
    this.setCurrentJourney(journeyId);
    
    // Use navigation adapter to perform the navigation
    return this.navigationAdapter.navigateToJourney(journeyId, subpath);
  }

  /**
   * Check if the adapter is initialized
   * @returns Whether the adapter is initialized
   */
  public isAdapterInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get any error that occurred during adapter operations
   * @returns The error or null if no error occurred
   */
  public getError(): Error | null {
    return this.error;
  }

  /**
   * Reset any error that occurred
   */
  public resetError(): void {
    this.error = null;
  }

  /**
   * Get all available journeys
   * @returns Array of all available journeys
   */
  public getAvailableJourneys(): Journey[] {
    return DEFAULT_JOURNEY_CONFIG.availableJourneys;
  }

  /**
   * Check if a journey is available
   * @param journeyId - The journey ID to check
   * @returns Whether the journey is available
   */
  public isJourneyAvailable(journeyId: string): boolean {
    if (!isValidJourneyId(journeyId)) return false;
    const journey = this.journeyMap.get(journeyId as JourneyId);
    return !!journey && (journey.enabled !== false);
  }

  /**
   * Create a hook-compatible journey context
   * @returns Web journey context type compatible with React hooks
   */
  public createJourneyContext(): WebJourneyContextType {
    return {
      currentJourney: this.currentJourney,
      setCurrentJourney: this.setCurrentJourney.bind(this),
      journeyData: this.getJourneyData(),
      isInitialized: this.isInitialized,
      isTransitioning: false,
      error: this.error,
    };
  }
}

/**
 * Hook that provides journey adapter functionality
 * @param options - Journey adapter options
 * @returns Journey context state and methods
 */
export function useJourneyAdapter(options: JourneyAdapterOptions = {}): WebJourneyContextType {
  // Create refs for adapters
  const [storageAdapter] = useState(() => options.storageAdapter || new StorageAdapter('austa_'));
  const [navigationAdapter] = useState(() => options.navigationAdapter || new NavigationAdapter());
  
  // Create journey adapter
  const [adapter] = useState(() => new JourneyAdapter({
    ...options,
    storageAdapter,
    navigationAdapter,
  }));
  
  // State for journey context
  const [currentJourney, setCurrentJourney] = useState<JourneyId>(adapter.getCurrentJourney());
  const [journeyData, setJourneyData] = useState<Journey | undefined>(adapter.getJourneyData());
  const [isInitialized, setIsInitialized] = useState<boolean>(adapter.isAdapterInitialized());
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(adapter.getError());
  
  // Handle journey changes
  const handleSetCurrentJourney = useCallback((journeyId: string) => {
    setIsTransitioning(true);
    const success = adapter.setCurrentJourney(journeyId);
    
    if (success) {
      setCurrentJourney(adapter.getCurrentJourney());
      setJourneyData(adapter.getJourneyData());
    }
    
    setError(adapter.getError());
    setIsTransitioning(false);
    return success;
  }, [adapter]);
  
  // Initialize journey state from URL on mount
  useEffect(() => {
    if (!isInitialized && typeof window !== 'undefined') {
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const journeyParam = urlParams.get(JOURNEY_URL_PARAM);
      
      if (journeyParam && isValidJourneyId(journeyParam)) {
        handleSetCurrentJourney(journeyParam);
      } else {
        // Try to extract journey from URL path
        const pathJourney = navigationAdapter.getJourneyFromUrl(window.location.pathname);
        if (pathJourney) {
          handleSetCurrentJourney(pathJourney);
        }
      }
      
      setIsInitialized(true);
    }
  }, [isInitialized, handleSetCurrentJourney, navigationAdapter]);
  
  // Return journey context
  return {
    currentJourney,
    setCurrentJourney: handleSetCurrentJourney,
    journeyData,
    isInitialized,
    isTransitioning,
    error,
  };
}

export default JourneyAdapter;