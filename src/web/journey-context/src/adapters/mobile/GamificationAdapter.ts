/**
 * @file GamificationAdapter.ts
 * @description Mobile-specific implementation for gamification features that handles
 * React Native event processing, achievement tracking with offline support,
 * and optimized data fetching for mobile networks.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

import { 
  GameProfile, 
  GamificationEventType,
  BaseGamificationEvent,
  EventResponse,
  JourneyType
} from '@austa/interfaces/gamification';

// GraphQL queries and mutations
const GET_GAME_PROFILE = gql`
  query GetGameProfile($userId: ID!) {
    gameProfile(userId: $userId) {
      level
      xp
      xpToNextLevel
      achievements {
        id
        title
        description
        journey
        category
        icon
        badgeImageUrl
        lockedBadgeImageUrl
        progress {
          current
          target
          percentage
          lastUpdated
          inProgress
        }
        unlocked
        unlockedAt
        xpReward
        isSecret
      }
      quests {
        id
        title
        description
        journey
        category
        icon
        progress
        total
        status
        deadline
        xpReward
      }
      badges {
        id
        name
        description
        journey
        icon
        earnedAt
        isDisplayed
        rarity
      }
      streaks {
        type
        current
        best
        lastUpdated
        expiresAt
        milestones {
          count
          reached
          xpBonus
        }
      }
      statistics {
        achievementsUnlocked
        questsCompleted
        totalXpEarned
        loginStreak
        memberSince
        journeyStats {
          health {
            metricsRecorded
            goalsAchieved
            activeDays
          }
          care {
            appointmentsScheduled
            telemedicineSessions
            medicationAdherence
          }
          plan {
            claimsSubmitted
            benefitsUtilized
            planComparisons
          }
        }
        rankings {
          global
          regional
          friends
        }
      }
      preferredJourney
      lastUpdated
      gamificationEnabled
      title
      avatar {
        imageId
        frameId
        backgroundId
        animated
      }
    }
  }
`;

const TRIGGER_EVENT = gql`
  mutation TriggerGamificationEvent($event: GamificationEventInput!) {
    triggerGamificationEvent(event: $event) {
      success
      error
      unlockedAchievements {
        id
        title
        description
        xp
      }
      xpEarned
      leveledUp
      newLevel
      questProgress {
        id
        title
        progress
        total
        completed
      }
      earnedRewards {
        id
        title
        description
        xp
      }
    }
  }
`;

/**
 * Mobile-specific adapter for gamification functionality
 * Implements React Native optimized methods for interacting with the gamification system
 */
class GamificationAdapter {
  private apolloClient: ApolloClient<any>;
  private readonly STORAGE_KEY_PROFILE = '@austa/gamification/profile';
  private readonly STORAGE_KEY_EVENT_QUEUE = '@austa/gamification/eventQueue';
  
  // Queue for storing events that failed to send and need to be retried
  private eventQueue: Array<{
    eventType: GamificationEventType;
    journey: JourneyType;
    userId: string;
    eventData: any;
    timestamp: string;
  }> = [];
  
  constructor() {
    // Initialize Apollo Client for GraphQL requests
    this.apolloClient = new ApolloClient({
      uri: 'https://api.austa.health/graphql',
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only',
          nextFetchPolicy: 'cache-first',
        },
      },
    });
  }
  
  /**
   * Retrieves the user's game profile from the API
   * Implements caching for offline support and faster loading
   * @param userId - ID of the user whose profile to retrieve
   * @returns Promise resolving to the user's GameProfile
   */
  async getGameProfile(userId: string): Promise<GameProfile> {
    try {
      // Try to get the profile from the network
      const { data } = await this.apolloClient.query({
        query: GET_GAME_PROFILE,
        variables: { userId },
        fetchPolicy: 'network-only', // Always try network first
      });
      
      const profile = data.gameProfile;
      
      // Cache the profile for offline use
      await this.cacheGameProfile(userId, profile);
      
      return profile;
    } catch (error) {
      console.error('Error fetching game profile from network:', error);
      
      // If network request fails, try to get from cache
      try {
        const cachedProfile = await this.getCachedGameProfile(userId);
        if (cachedProfile) {
          return cachedProfile;
        }
      } catch (cacheError) {
        console.error('Error retrieving cached game profile:', cacheError);
      }
      
      // If both network and cache fail, throw the original error
      throw error;
    }
  }
  
  /**
   * Caches the game profile in AsyncStorage
   * @param userId - ID of the user whose profile to cache
   * @param profile - The profile data to cache
   */
  private async cacheGameProfile(userId: string, profile: GameProfile): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PROFILE}/${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        profile,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error caching game profile:', error);
    }
  }
  
  /**
   * Retrieves a cached game profile from AsyncStorage
   * @param userId - ID of the user whose profile to retrieve
   * @returns The cached profile or null if not found or expired
   */
  private async getCachedGameProfile(userId: string): Promise<GameProfile | null> {
    try {
      const key = `${this.STORAGE_KEY_PROFILE}/${userId}`;
      const cachedData = await AsyncStorage.getItem(key);
      
      if (!cachedData) {
        return null;
      }
      
      const { profile, timestamp } = JSON.parse(cachedData);
      
      // Check if cache is expired (older than 1 hour)
      const cacheTime = new Date(timestamp).getTime();
      const now = new Date().getTime();
      const cacheAge = now - cacheTime;
      const maxCacheAge = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (cacheAge > maxCacheAge) {
        // Cache is expired
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Error retrieving cached game profile:', error);
      return null;
    }
  }
  
  /**
   * Triggers a gamification event on the server
   * @param event - The event object to send to the server
   * @returns Promise resolving to the event response
   */
  async triggerEvent(event: BaseGamificationEvent): Promise<EventResponse> {
    try {
      const { data } = await this.apolloClient.mutate({
        mutation: TRIGGER_EVENT,
        variables: { event },
      });
      
      return data.triggerGamificationEvent;
    } catch (error) {
      console.error('Error triggering gamification event:', error);
      throw error;
    }
  }
  
  /**
   * Retries a failed event
   * @param eventType - The type of event to retry
   * @param journey - The journey context for the event
   * @param userId - ID of the user who triggered the event
   * @param eventData - Additional data related to the event
   * @returns Promise resolving to the event response
   */
  async retryEvent(
    eventType: GamificationEventType,
    journey: JourneyType,
    userId: string,
    eventData?: any
  ): Promise<EventResponse> {
    // Create a new event object for the retry
    const event: BaseGamificationEvent = {
      id: `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      journey,
      userId,
      timestamp: new Date().toISOString(),
      payload: eventData || {}
    };
    
    // Try to send the event again
    return this.triggerEvent(event);
  }
  
  /**
   * Queues an event for later synchronization
   * Used when an event fails to send and retry also fails
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
    // Add the event to the queue
    this.eventQueue.push({
      eventType,
      journey,
      userId,
      eventData: eventData || {},
      timestamp: new Date().toISOString()
    });
    
    // Store the queue in AsyncStorage for persistence
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY_EVENT_QUEUE, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Error storing event queue in AsyncStorage:', error);
    }
  }
  
  /**
   * Synchronizes queued events with the server
   * Called automatically when the adapter is initialized and when the app comes online
   */
  async syncQueuedEvents(): Promise<void> {
    // Load any queued events from AsyncStorage
    try {
      const storedQueue = await AsyncStorage.getItem(this.STORAGE_KEY_EVENT_QUEUE);
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
    
    for (let i = 0; i < this.eventQueue.length; i++) {
      const queuedEvent = this.eventQueue[i];
      
      try {
        // Create a new event object from the queued data
        const event: BaseGamificationEvent = {
          id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: queuedEvent.eventType,
          journey: queuedEvent.journey,
          userId: queuedEvent.userId,
          timestamp: queuedEvent.timestamp,
          payload: queuedEvent.eventData
        };
        
        // Try to send the event
        await this.triggerEvent(event);
        
        // If successful, mark for removal
        successfulEvents.push(i);
      } catch (error) {
        console.error('Error syncing queued event:', error);
        // Leave the event in the queue for future retry
      }
    }
    
    // Remove successfully processed events from the queue (in reverse order to avoid index issues)
    for (let i = successfulEvents.length - 1; i >= 0; i--) {
      this.eventQueue.splice(successfulEvents[i], 1);
    }
    
    // Update the stored queue
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY_EVENT_QUEUE, JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Error updating event queue in AsyncStorage:', error);
    }
  }
  
  /**
   * Initializes the adapter
   * Sets up event listeners for app state changes and syncs queued events
   */
  initialize(): void {
    // Sync any queued events on initialization
    this.syncQueuedEvents();
    
    // We would typically set up app state listeners here for React Native
    // but that requires importing AppState from react-native
    // This would be implemented in the actual mobile app
  }
}

// Create and export a singleton instance
const gamificationAdapter = new GamificationAdapter();
gamificationAdapter.initialize();

export default gamificationAdapter;