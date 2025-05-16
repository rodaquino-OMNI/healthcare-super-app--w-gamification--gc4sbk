/**
 * @file GamificationAdapter.ts
 * @description Mobile-specific implementation for gamification features that handles
 * React Native event processing, achievement tracking with offline support, and
 * optimized data fetching for mobile networks.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

import { 
  GameProfile, 
  GamificationEventType,
  BaseGamificationEvent,
  EventResponse,
  JourneyType,
  AchievementEvent,
  isAchievementEvent
} from '@austa/interfaces/gamification';

// Storage keys
const GAME_PROFILE_STORAGE_KEY = '@austa/gamification/profile';
const EVENT_QUEUE_STORAGE_KEY = '@austa/gamification/eventQueue';
const ACHIEVEMENT_CACHE_KEY = '@austa/gamification/achievements';

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

// Maximum retry attempts for failed events
const MAX_RETRY_ATTEMPTS = 3;

// Exponential backoff base (in milliseconds)
const RETRY_BACKOFF_BASE = 2000;

/**
 * Interface for cached data with expiration
 */
interface CachedData<T> {
  data: T;
  timestamp: number;
  expiration: number;
}

/**
 * Interface for queued events
 */
interface QueuedEvent {
  eventType: GamificationEventType;
  journey: JourneyType;
  userId: string;
  eventData: any;
  timestamp: string;
  retryCount: number;
  id: string;
}

/**
 * Mobile-specific adapter for gamification functionality
 * Implements React Native optimized methods for interacting with the gamification system
 * with offline support and efficient data caching
 */
class GamificationAdapter {
  private readonly API_BASE_URL = '/api/gamification';
  private readonly EVENT_ENDPOINT = '/events';
  private readonly PROFILE_ENDPOINT = '/profile';
  
  // Apollo Client instance for GraphQL operations
  private apolloClient: ApolloClient<NormalizedCacheObject> | null = null;
  
  // Queue for storing events that failed to send and need to be retried
  private eventQueue: QueuedEvent[] = [];
  
  // Flag to track network status
  private isOnline: boolean = true;
  
  // Local cache for achievements to reduce network requests
  private achievementCache: Map<string, AchievementEvent> = new Map();
  
  /**
   * Sets the Apollo Client instance for GraphQL operations
   * @param client - Apollo Client instance
   */
  setApolloClient(client: ApolloClient<NormalizedCacheObject>): void {
    this.apolloClient = client;
  }
  
  /**
   * Retrieves the user's game profile from the API with offline support
   * @param userId - ID of the user whose profile to retrieve
   * @returns Promise resolving to the user's GameProfile
   */
  async getGameProfile(userId: string): Promise<GameProfile> {
    try {
      // First, try to get the profile from cache
      const cachedProfile = await this.getCachedProfile(userId);
      
      // If we're offline and have a cached profile, return it
      if (!this.isOnline && cachedProfile) {
        console.log('Using cached game profile (offline)');
        return cachedProfile;
      }
      
      // If we're online, try to fetch fresh data
      if (this.isOnline) {
        try {
          // Ensure Apollo Client is available
          if (!this.apolloClient) {
            throw new Error('Apollo Client not initialized');
          }
          
          // Fetch profile using REST API (could be replaced with GraphQL query)
          const response = await fetch(`${this.API_BASE_URL}${this.PROFILE_ENDPOINT}/${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch game profile: ${response.statusText}`);
          }
          
          const profile = await response.json();
          
          // Cache the fresh profile
          await this.cacheProfile(userId, profile);
          
          return profile as GameProfile;
        } catch (error) {
          console.error('Error fetching fresh game profile:', error);
          
          // If we have a cached profile, return it as fallback
          if (cachedProfile) {
            console.log('Using cached game profile as fallback');
            return cachedProfile;
          }
          
          // Otherwise, rethrow the error
          throw error;
        }
      }
      
      // If we're offline and don't have a cached profile, throw an error
      throw new Error('Cannot fetch game profile: offline and no cached data available');
    } catch (error) {
      console.error('Error in getGameProfile:', error);
      throw error;
    }
  }
  
  /**
   * Retrieves a cached game profile from AsyncStorage
   * @param userId - ID of the user whose profile to retrieve
   * @returns Promise resolving to the cached GameProfile or null if not found or expired
   */
  private async getCachedProfile(userId: string): Promise<GameProfile | null> {
    try {
      const cachedData = await AsyncStorage.getItem(`${GAME_PROFILE_STORAGE_KEY}_${userId}`);
      
      if (!cachedData) {
        return null;
      }
      
      const parsed = JSON.parse(cachedData) as CachedData<GameProfile>;
      
      // Check if the cached data has expired
      if (Date.now() > parsed.timestamp + parsed.expiration) {
        // Remove expired cache
        await AsyncStorage.removeItem(`${GAME_PROFILE_STORAGE_KEY}_${userId}`);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      console.error('Error retrieving cached profile:', error);
      return null;
    }
  }
  
  /**
   * Caches a game profile in AsyncStorage
   * @param userId - ID of the user whose profile to cache
   * @param profile - The GameProfile to cache
   */
  private async cacheProfile(userId: string, profile: GameProfile): Promise<void> {
    try {
      const cachedData: CachedData<GameProfile> = {
        data: profile,
        timestamp: Date.now(),
        expiration: CACHE_EXPIRATION
      };
      
      await AsyncStorage.setItem(
        `${GAME_PROFILE_STORAGE_KEY}_${userId}`,
        JSON.stringify(cachedData)
      );
    } catch (error) {
      console.error('Error caching profile:', error);
      // Non-critical error, can be ignored
    }
  }
  
  /**
   * Triggers a gamification event with offline support
   * @param event - The event object to send to the server
   * @returns Promise resolving to the event response
   */
  async triggerEvent(event: BaseGamificationEvent): Promise<EventResponse> {
    // If this is an achievement event, cache it locally
    if (isAchievementEvent(event)) {
      this.cacheAchievementEvent(event);
    }
    
    // If we're offline, queue the event for later and return a mock response
    if (!this.isOnline) {
      await this.queueEventForSync(
        event.type,
        event.journey,
        event.userId,
        event.payload
      );
      
      // Return a mock response for offline mode
      return this.createOfflineEventResponse(event);
    }
    
    // If we're online, try to send the event
    try {
      const response = await fetch(`${this.API_BASE_URL}${this.EVENT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger gamification event: ${response.statusText}`);
      }
      
      const eventResponse = await response.json();
      return eventResponse as EventResponse;
    } catch (error) {
      console.error('Error triggering gamification event:', error);
      
      // Queue the event for later synchronization
      await this.queueEventForSync(
        event.type,
        event.journey,
        event.userId,
        event.payload
      );
      
      // Return a mock response for the failed request
      return this.createOfflineEventResponse(event);
    }
  }
  
  /**
   * Creates a mock event response for offline mode
   * @param event - The event that was triggered
   * @returns A mock EventResponse
   */
  private createOfflineEventResponse(event: BaseGamificationEvent): EventResponse {
    return {
      success: true,
      xpEarned: 0, // We don't know the actual XP earned offline
      leveledUp: false,
      unlockedAchievements: [],
      questProgress: [],
      earnedRewards: []
    };
  }
  
  /**
   * Caches an achievement event locally
   * @param event - The achievement event to cache
   */
  private async cacheAchievementEvent(event: AchievementEvent): Promise<void> {
    try {
      // Add to in-memory cache
      this.achievementCache.set(event.payload.achievementId, event);
      
      // Also persist to AsyncStorage
      const cachedData: CachedData<Record<string, AchievementEvent>> = {
        data: Object.fromEntries(this.achievementCache),
        timestamp: Date.now(),
        expiration: CACHE_EXPIRATION
      };
      
      await AsyncStorage.setItem(
        `${ACHIEVEMENT_CACHE_KEY}_${event.userId}`,
        JSON.stringify(cachedData)
      );
    } catch (error) {
      console.error('Error caching achievement event:', error);
      // Non-critical error, can be ignored
    }
  }
  
  /**
   * Loads cached achievement events from AsyncStorage
   * @param userId - ID of the user whose achievements to load
   */
  private async loadCachedAchievements(userId: string): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(`${ACHIEVEMENT_CACHE_KEY}_${userId}`);
      
      if (!cachedData) {
        return;
      }
      
      const parsed = JSON.parse(cachedData) as CachedData<Record<string, AchievementEvent>>;
      
      // Check if the cached data has expired
      if (Date.now() > parsed.timestamp + parsed.expiration) {
        // Remove expired cache
        await AsyncStorage.removeItem(`${ACHIEVEMENT_CACHE_KEY}_${userId}`);
        return;
      }
      
      // Load into memory cache
      this.achievementCache = new Map(Object.entries(parsed.data));
    } catch (error) {
      console.error('Error loading cached achievements:', error);
      // Non-critical error, can be ignored
    }
  }
  
  /**
   * Queues an event for later synchronization
   * Used when an event fails to send or when offline
   * @param eventType - The type of event to queue
   * @param journey - The journey context for the event
   * @param userId - ID of the user who triggered the event
   * @param eventData - Additional data related to the event
   */
  async queueEventForSync(
    eventType: GamificationEventType,
    journey: JourneyType,
    userId: string,
    eventData?: any
  ): Promise<void> {
    // Create a unique ID for the queued event
    const eventId = uuidv4();
    
    // Add the event to the queue
    const queuedEvent: QueuedEvent = {
      eventType,
      journey,
      userId,
      eventData: eventData || {},
      timestamp: new Date().toISOString(),
      retryCount: 0,
      id: eventId
    };
    
    this.eventQueue.push(queuedEvent);
    
    // Store the queue in AsyncStorage for persistence
    try {
      await AsyncStorage.setItem(EVENT_QUEUE_STORAGE_KEY, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Error storing event queue in AsyncStorage:', error);
    }
  }
  
  /**
   * Synchronizes queued events with the server
   * Called automatically when the adapter is initialized and when the app comes online
   */
  async syncQueuedEvents(): Promise<void> {
    // If we're offline, don't attempt to sync
    if (!this.isOnline) {
      return;
    }
    
    // Load any queued events from AsyncStorage
    try {
      const storedQueue = await AsyncStorage.getItem(EVENT_QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.eventQueue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Error loading event queue from AsyncStorage:', error);
    }
    
    // If there are no queued events, return early
    if (this.eventQueue.length === 0) {
      return;
    }
    
    // Process each queued event
    const successfulEvents: number[] = [];
    const failedEvents: number[] = [];
    
    for (let i = 0; i < this.eventQueue.length; i++) {
      const queuedEvent = this.eventQueue[i];
      
      try {
        // Create a new event object from the queued data
        const event: BaseGamificationEvent = {
          id: `sync-${queuedEvent.id}`,
          type: queuedEvent.eventType,
          journey: queuedEvent.journey,
          userId: queuedEvent.userId,
          timestamp: queuedEvent.timestamp,
          payload: queuedEvent.eventData
        };
        
        // Try to send the event
        const response = await fetch(`${this.API_BASE_URL}${this.EVENT_ENDPOINT}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to sync event: ${response.statusText}`);
        }
        
        // If successful, mark for removal
        successfulEvents.push(i);
      } catch (error) {
        console.error('Error syncing queued event:', error);
        
        // Increment retry count
        this.eventQueue[i].retryCount++;
        
        // If we've exceeded max retries, mark for removal
        if (this.eventQueue[i].retryCount >= MAX_RETRY_ATTEMPTS) {
          failedEvents.push(i);
        }
      }
    }
    
    // Remove events from the queue (in reverse order to avoid index issues)
    // First remove failed events that exceeded retry attempts
    for (let i = failedEvents.length - 1; i >= 0; i--) {
      this.eventQueue.splice(failedEvents[i], 1);
    }
    
    // Then remove successful events
    for (let i = successfulEvents.length - 1; i >= 0; i--) {
      this.eventQueue.splice(successfulEvents[i], 1);
    }
    
    // Update the stored queue
    try {
      await AsyncStorage.setItem(EVENT_QUEUE_STORAGE_KEY, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Error updating event queue in AsyncStorage:', error);
    }
  }
  
  /**
   * Schedules a retry for failed events with exponential backoff
   * @param eventIndex - Index of the event in the queue
   */
  private scheduleRetry(eventIndex: number): void {
    const queuedEvent = this.eventQueue[eventIndex];
    const backoffTime = RETRY_BACKOFF_BASE * Math.pow(2, queuedEvent.retryCount);
    
    setTimeout(() => {
      // Only retry if we're online
      if (this.isOnline) {
        this.retryEvent(queuedEvent);
      }
    }, backoffTime);
  }
  
  /**
   * Retries a specific queued event
   * @param queuedEvent - The event to retry
   */
  private async retryEvent(queuedEvent: QueuedEvent): Promise<void> {
    try {
      // Create a new event object from the queued data
      const event: BaseGamificationEvent = {
        id: `retry-${queuedEvent.id}`,
        type: queuedEvent.eventType,
        journey: queuedEvent.journey,
        userId: queuedEvent.userId,
        timestamp: queuedEvent.timestamp,
        payload: queuedEvent.eventData
      };
      
      // Try to send the event
      await this.triggerEvent(event);
      
      // If successful, remove from queue
      const index = this.eventQueue.findIndex(e => e.id === queuedEvent.id);
      if (index !== -1) {
        this.eventQueue.splice(index, 1);
        
        // Update the stored queue
        await AsyncStorage.setItem(EVENT_QUEUE_STORAGE_KEY, JSON.stringify(this.eventQueue));
      }
    } catch (error) {
      console.error('Error retrying event:', error);
      // Retry will be scheduled again on next sync if needed
    }
  }
  
  /**
   * Initializes the adapter
   * Sets up network listeners and loads cached data
   */
  async initialize(): Promise<void> {
    // Set up network state listener
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came back online, sync queued events
      if (wasOffline && this.isOnline) {
        this.syncQueuedEvents();
      }
    });
    
    // Get initial network state
    const netInfoState = await NetInfo.fetch();
    this.isOnline = netInfoState.isConnected ?? false;
    
    // Load queued events from AsyncStorage
    try {
      const storedQueue = await AsyncStorage.getItem(EVENT_QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.eventQueue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Error loading event queue from AsyncStorage:', error);
    }
    
    // If we're online, sync any queued events
    if (this.isOnline && this.eventQueue.length > 0) {
      this.syncQueuedEvents();
    }
  }
  
  /**
   * Clears all cached gamification data
   * Useful for logout or testing scenarios
   */
  async clearCache(): Promise<void> {
    try {
      // Get all keys from AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter for gamification-related keys
      const gamificationKeys = keys.filter(key => 
        key.startsWith(GAME_PROFILE_STORAGE_KEY) || 
        key.startsWith(ACHIEVEMENT_CACHE_KEY) || 
        key === EVENT_QUEUE_STORAGE_KEY
      );
      
      // Remove all gamification-related keys
      if (gamificationKeys.length > 0) {
        await AsyncStorage.multiRemove(gamificationKeys);
      }
      
      // Clear in-memory caches
      this.eventQueue = [];
      this.achievementCache.clear();
      
      console.log('Gamification cache cleared successfully');
    } catch (error) {
      console.error('Error clearing gamification cache:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const gamificationAdapter = new GamificationAdapter();
// Initialize in the background
gamificationAdapter.initialize().catch(error => {
  console.error('Failed to initialize gamification adapter:', error);
});

export default gamificationAdapter;