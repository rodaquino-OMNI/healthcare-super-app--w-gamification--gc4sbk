/**
 * @file GamificationAdapter.ts
 * @description Mobile-specific implementation for gamification features that handles React Native event processing,
 * achievement tracking with offline support, and optimized data fetching for mobile networks.
 */

import { ApolloClient, ApolloError, NormalizedCacheObject } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import {
  Achievement,
  GameProfile,
  GamificationEvent,
  GamificationEventType,
  EventProcessingResponse,
  Quest,
  Reward,
  UpdateGameProfileRequest
} from '@austa/interfaces/gamification';

// Storage keys for caching
const STORAGE_KEYS = {
  GAME_PROFILE: 'austa_gamification_profile',
  PENDING_EVENTS: 'austa_gamification_pending_events',
  ACHIEVEMENTS: 'austa_gamification_achievements',
  QUESTS: 'austa_gamification_quests',
  REWARDS: 'austa_gamification_rewards',
  LAST_SYNC: 'austa_gamification_last_sync'
};

// Default cache expiration time (24 hours in milliseconds)
const DEFAULT_CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

/**
 * Interface for the GamificationAdapter configuration
 */
export interface GamificationAdapterConfig {
  /** Apollo Client instance for GraphQL operations */
  apolloClient: ApolloClient<NormalizedCacheObject>;
  /** Base API URL for REST endpoints */
  apiUrl?: string;
  /** Cache expiration time in milliseconds */
  cacheExpiration?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Mobile-specific implementation for gamification features
 */
export class GamificationAdapter {
  private apolloClient: ApolloClient<NormalizedCacheObject>;
  private apiUrl: string;
  private cacheExpiration: number;
  private debug: boolean;
  private pendingEvents: GamificationEvent[] = [];
  private syncInProgress: boolean = false;
  private lastError: Error | null = null;
  
  /**
   * Creates a new instance of the GamificationAdapter
   * @param config Configuration options for the adapter
   */
  constructor(config: GamificationAdapterConfig) {
    this.apolloClient = config.apolloClient;
    this.apiUrl = config.apiUrl || 'https://api.austa.health';
    this.cacheExpiration = config.cacheExpiration || DEFAULT_CACHE_EXPIRATION;
    this.debug = config.debug || false;
    
    // Initialize by loading pending events from storage
    this.loadPendingEvents();
    
    // Set up network change listener to sync when connection is restored
    this.setupNetworkListener();
  }
  
  /**
   * Logs debug messages if debug mode is enabled
   * @param message Message to log
   * @param data Optional data to include in the log
   */
  private logDebug(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[GamificationAdapter] ${message}`, data || '');
    }
  }
  
  /**
   * Sets up a network change listener to sync pending events when connection is restored
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      if (state.isConnected && this.pendingEvents.length > 0) {
        this.logDebug('Network connection restored, syncing pending events');
        this.syncPendingEvents();
      }
    });
  }
  
  /**
   * Loads pending events from AsyncStorage
   */
  private async loadPendingEvents(): Promise<void> {
    try {
      const pendingEventsJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_EVENTS);
      if (pendingEventsJson) {
        this.pendingEvents = JSON.parse(pendingEventsJson);
        this.logDebug(`Loaded ${this.pendingEvents.length} pending events from storage`);
      }
    } catch (error) {
      this.logDebug('Error loading pending events', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  /**
   * Saves pending events to AsyncStorage
   */
  private async savePendingEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_EVENTS, JSON.stringify(this.pendingEvents));
      this.logDebug(`Saved ${this.pendingEvents.length} pending events to storage`);
    } catch (error) {
      this.logDebug('Error saving pending events', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  /**
   * Checks if the device is currently online
   * @returns Promise that resolves to a boolean indicating online status
   */
  private async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected === true;
    } catch (error) {
      this.logDebug('Error checking network status', error);
      return false;
    }
  }
  
  /**
   * Retrieves the user's game profile
   * @param userId User ID to fetch the profile for
   * @param forceRefresh Whether to force a refresh from the server
   * @returns Promise that resolves to the user's game profile
   */
  public async getGameProfile(userId: string, forceRefresh: boolean = false): Promise<GameProfile | null> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedProfile = await this.getCachedGameProfile(userId);
        if (cachedProfile) {
          this.logDebug('Returning cached game profile');
          return cachedProfile;
        }
      }
      
      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        this.logDebug('Device is offline, returning cached profile only');
        return await this.getCachedGameProfile(userId);
      }
      
      // Fetch from server
      const response = await fetch(`${this.apiUrl}/gamification/profiles/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `AUSTA-App/${Platform.OS}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch game profile: ${response.status} ${response.statusText}`);
      }
      
      const profile = await response.json();
      
      // Cache the profile
      await this.cacheGameProfile(userId, profile);
      
      return profile;
    } catch (error) {
      this.logDebug('Error fetching game profile', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
      
      // Return cached profile as fallback
      return await this.getCachedGameProfile(userId);
    }
  }
  
  /**
   * Retrieves the cached game profile from AsyncStorage
   * @param userId User ID to fetch the profile for
   * @returns Promise that resolves to the cached game profile or null if not found
   */
  private async getCachedGameProfile(userId: string): Promise<GameProfile | null> {
    try {
      const cacheKey = `${STORAGE_KEYS.GAME_PROFILE}_${userId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      const { profile, timestamp } = JSON.parse(cachedData);
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.cacheExpiration) {
        this.logDebug('Cached game profile is expired');
        return null;
      }
      
      return profile;
    } catch (error) {
      this.logDebug('Error retrieving cached game profile', error);
      return null;
    }
  }
  
  /**
   * Caches the game profile in AsyncStorage
   * @param userId User ID to cache the profile for
   * @param profile Game profile to cache
   */
  private async cacheGameProfile(userId: string, profile: GameProfile): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.GAME_PROFILE}_${userId}`;
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      this.logDebug('Game profile cached successfully');
      
      // Update last sync timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      this.logDebug('Error caching game profile', error);
    }
  }
  
  /**
   * Triggers a gamification event
   * @param event The event to trigger
   * @returns Promise that resolves to the event processing response
   */
  public async triggerEvent(event: GamificationEvent): Promise<EventProcessingResponse> {
    try {
      // Add device info to the event
      const enrichedEvent = {
        ...event,
        client: {
          ...event.client,
          platform: Platform.OS as 'ios' | 'android',
          deviceId: await this.getDeviceId()
        }
      };
      
      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        // Store event for later processing
        this.pendingEvents.push(enrichedEvent);
        await this.savePendingEvents();
        
        this.logDebug('Device is offline, event queued for later processing', enrichedEvent);
        
        // Return a placeholder response
        return {
          success: true,
          results: {
            xpEarned: 0,
            achievementsUnlocked: [],
            questsProgressed: [],
            rewardsEarned: [],
            leveledUp: undefined
          }
        };
      }
      
      // Process event online
      const response = await fetch(`${this.apiUrl}/gamification/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `AUSTA-App/${Platform.OS}`
        },
        body: JSON.stringify(enrichedEvent)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process event: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // If the event unlocked achievements or progressed quests, update the cache
      if (result.success && result.results) {
        if (result.results.achievementsUnlocked && result.results.achievementsUnlocked.length > 0) {
          await this.updateCachedAchievements(event.userId, result.results.achievementsUnlocked);
        }
        
        if (result.results.questsProgressed && result.results.questsProgressed.length > 0) {
          await this.updateCachedQuests(event.userId, result.results.questsProgressed);
        }
        
        if (result.results.rewardsEarned && result.results.rewardsEarned.length > 0) {
          await this.updateCachedRewards(event.userId, result.results.rewardsEarned);
        }
        
        // If user leveled up, update the cached profile
        if (result.results.leveledUp) {
          const cachedProfile = await this.getCachedGameProfile(event.userId);
          if (cachedProfile) {
            cachedProfile.level = result.results.leveledUp.newLevel;
            await this.cacheGameProfile(event.userId, cachedProfile);
          }
        }
      }
      
      return result;
    } catch (error) {
      this.logDebug('Error triggering event', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
      
      // Store event for later processing
      this.pendingEvents.push(event);
      await this.savePendingEvents();
      
      // Return an error response
      return {
        success: false,
        error: this.lastError.message
      };
    }
  }
  
  /**
   * Gets or generates a device ID for event tracking
   * @returns Promise that resolves to the device ID
   */
  private async getDeviceId(): Promise<string> {
    try {
      const deviceId = await AsyncStorage.getItem('austa_device_id');
      if (deviceId) {
        return deviceId;
      }
      
      // Generate a new device ID
      const newDeviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem('austa_device_id', newDeviceId);
      return newDeviceId;
    } catch (error) {
      this.logDebug('Error getting device ID', error);
      // Return a temporary device ID
      return `temp-${Date.now()}`;
    }
  }
  
  /**
   * Syncs pending events to the server
   * @returns Promise that resolves when sync is complete
   */
  public async syncPendingEvents(): Promise<void> {
    // Prevent multiple syncs from running simultaneously
    if (this.syncInProgress || this.pendingEvents.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    this.logDebug(`Starting sync of ${this.pendingEvents.length} pending events`);
    
    try {
      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        this.logDebug('Device is offline, cannot sync pending events');
        this.syncInProgress = false;
        return;
      }
      
      // Process events in batches of 10
      const batchSize = 10;
      const eventsCopy = [...this.pendingEvents];
      
      while (eventsCopy.length > 0) {
        const batch = eventsCopy.splice(0, batchSize);
        
        // Send batch to server
        const response = await fetch(`${this.apiUrl}/gamification/events/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': `AUSTA-App/${Platform.OS}`
          },
          body: JSON.stringify({ events: batch })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to sync events: ${response.status} ${response.statusText}`);
        }
        
        // Remove processed events from the pending list
        this.pendingEvents = this.pendingEvents.filter(event => 
          !batch.some(batchEvent => 
            batchEvent.userId === event.userId && 
            batchEvent.timestamp === event.timestamp && 
            batchEvent.type === event.type
          )
        );
        
        // Save updated pending events
        await this.savePendingEvents();
        
        this.logDebug(`Processed batch of ${batch.length} events, ${this.pendingEvents.length} remaining`);
      }
      
      this.logDebug('All pending events synced successfully');
    } catch (error) {
      this.logDebug('Error syncing pending events', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Updates cached achievements with newly unlocked ones
   * @param userId User ID to update achievements for
   * @param newAchievements Newly unlocked achievements
   */
  private async updateCachedAchievements(userId: string, newAchievements: any[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.ACHIEVEMENTS}_${userId}`;
      const cachedAchievementsJson = await AsyncStorage.getItem(cacheKey);
      let cachedAchievements: Achievement[] = [];
      
      if (cachedAchievementsJson) {
        cachedAchievements = JSON.parse(cachedAchievementsJson);
      }
      
      // Update existing achievements or add new ones
      for (const newAchievement of newAchievements) {
        const existingIndex = cachedAchievements.findIndex(a => a.id === newAchievement.id);
        
        if (existingIndex >= 0) {
          cachedAchievements[existingIndex] = {
            ...cachedAchievements[existingIndex],
            ...newAchievement,
            unlockedAt: new Date().toISOString()
          };
        } else {
          cachedAchievements.push({
            ...newAchievement,
            unlockedAt: new Date().toISOString()
          } as Achievement);
        }
      }
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedAchievements));
      this.logDebug(`Updated cached achievements for user ${userId}`);
    } catch (error) {
      this.logDebug('Error updating cached achievements', error);
    }
  }
  
  /**
   * Updates cached quests with progressed ones
   * @param userId User ID to update quests for
   * @param progressedQuests Quests with updated progress
   */
  private async updateCachedQuests(userId: string, progressedQuests: any[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.QUESTS}_${userId}`;
      const cachedQuestsJson = await AsyncStorage.getItem(cacheKey);
      let cachedQuests: Quest[] = [];
      
      if (cachedQuestsJson) {
        cachedQuests = JSON.parse(cachedQuestsJson);
      }
      
      // Update existing quests or add new ones
      for (const progressedQuest of progressedQuests) {
        const existingIndex = cachedQuests.findIndex(q => q.id === progressedQuest.id);
        
        if (existingIndex >= 0) {
          cachedQuests[existingIndex] = {
            ...cachedQuests[existingIndex],
            progress: progressedQuest.progress,
            completed: progressedQuest.completed,
            updatedAt: new Date().toISOString()
          };
        } else {
          cachedQuests.push({
            ...progressedQuest,
            updatedAt: new Date().toISOString()
          } as Quest);
        }
      }
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedQuests));
      this.logDebug(`Updated cached quests for user ${userId}`);
    } catch (error) {
      this.logDebug('Error updating cached quests', error);
    }
  }
  
  /**
   * Updates cached rewards with newly earned ones
   * @param userId User ID to update rewards for
   * @param newRewards Newly earned rewards
   */
  private async updateCachedRewards(userId: string, newRewards: any[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.REWARDS}_${userId}`;
      const cachedRewardsJson = await AsyncStorage.getItem(cacheKey);
      let cachedRewards: Reward[] = [];
      
      if (cachedRewardsJson) {
        cachedRewards = JSON.parse(cachedRewardsJson);
      }
      
      // Update existing rewards or add new ones
      for (const newReward of newRewards) {
        const existingIndex = cachedRewards.findIndex(r => r.id === newReward.id);
        
        if (existingIndex >= 0) {
          cachedRewards[existingIndex] = {
            ...cachedRewards[existingIndex],
            ...newReward,
            earnedAt: new Date().toISOString()
          };
        } else {
          cachedRewards.push({
            ...newReward,
            earnedAt: new Date().toISOString()
          } as Reward);
        }
      }
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedRewards));
      this.logDebug(`Updated cached rewards for user ${userId}`);
    } catch (error) {
      this.logDebug('Error updating cached rewards', error);
    }
  }
  
  /**
   * Gets all achievements for a user
   * @param userId User ID to get achievements for
   * @param forceRefresh Whether to force a refresh from the server
   * @returns Promise that resolves to an array of achievements
   */
  public async getAchievements(userId: string, forceRefresh: boolean = false): Promise<Achievement[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedAchievements = await this.getCachedAchievements(userId);
        if (cachedAchievements && cachedAchievements.length > 0) {
          this.logDebug('Returning cached achievements');
          return cachedAchievements;
        }
      }
      
      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        this.logDebug('Device is offline, returning cached achievements only');
        return await this.getCachedAchievements(userId) || [];
      }
      
      // Fetch from server
      const response = await fetch(`${this.apiUrl}/gamification/achievements?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `AUSTA-App/${Platform.OS}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.status} ${response.statusText}`);
      }
      
      const achievements = await response.json();
      
      // Cache the achievements
      await this.cacheAchievements(userId, achievements);
      
      return achievements;
    } catch (error) {
      this.logDebug('Error fetching achievements', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
      
      // Return cached achievements as fallback
      return await this.getCachedAchievements(userId) || [];
    }
  }
  
  /**
   * Gets cached achievements from AsyncStorage
   * @param userId User ID to get achievements for
   * @returns Promise that resolves to cached achievements or null if not found
   */
  private async getCachedAchievements(userId: string): Promise<Achievement[] | null> {
    try {
      const cacheKey = `${STORAGE_KEYS.ACHIEVEMENTS}_${userId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      return JSON.parse(cachedData);
    } catch (error) {
      this.logDebug('Error retrieving cached achievements', error);
      return null;
    }
  }
  
  /**
   * Caches achievements in AsyncStorage
   * @param userId User ID to cache achievements for
   * @param achievements Achievements to cache
   */
  private async cacheAchievements(userId: string, achievements: Achievement[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.ACHIEVEMENTS}_${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(achievements));
      this.logDebug(`Cached ${achievements.length} achievements for user ${userId}`);
    } catch (error) {
      this.logDebug('Error caching achievements', error);
    }
  }
  
  /**
   * Gets all quests for a user
   * @param userId User ID to get quests for
   * @param forceRefresh Whether to force a refresh from the server
   * @returns Promise that resolves to an array of quests
   */
  public async getQuests(userId: string, forceRefresh: boolean = false): Promise<Quest[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedQuests = await this.getCachedQuests(userId);
        if (cachedQuests && cachedQuests.length > 0) {
          this.logDebug('Returning cached quests');
          return cachedQuests;
        }
      }
      
      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        this.logDebug('Device is offline, returning cached quests only');
        return await this.getCachedQuests(userId) || [];
      }
      
      // Fetch from server
      const response = await fetch(`${this.apiUrl}/gamification/quests?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `AUSTA-App/${Platform.OS}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quests: ${response.status} ${response.statusText}`);
      }
      
      const quests = await response.json();
      
      // Cache the quests
      await this.cacheQuests(userId, quests);
      
      return quests;
    } catch (error) {
      this.logDebug('Error fetching quests', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
      
      // Return cached quests as fallback
      return await this.getCachedQuests(userId) || [];
    }
  }
  
  /**
   * Gets cached quests from AsyncStorage
   * @param userId User ID to get quests for
   * @returns Promise that resolves to cached quests or null if not found
   */
  private async getCachedQuests(userId: string): Promise<Quest[] | null> {
    try {
      const cacheKey = `${STORAGE_KEYS.QUESTS}_${userId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      return JSON.parse(cachedData);
    } catch (error) {
      this.logDebug('Error retrieving cached quests', error);
      return null;
    }
  }
  
  /**
   * Caches quests in AsyncStorage
   * @param userId User ID to cache quests for
   * @param quests Quests to cache
   */
  private async cacheQuests(userId: string, quests: Quest[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.QUESTS}_${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(quests));
      this.logDebug(`Cached ${quests.length} quests for user ${userId}`);
    } catch (error) {
      this.logDebug('Error caching quests', error);
    }
  }
  
  /**
   * Gets all rewards for a user
   * @param userId User ID to get rewards for
   * @param forceRefresh Whether to force a refresh from the server
   * @returns Promise that resolves to an array of rewards
   */
  public async getRewards(userId: string, forceRefresh: boolean = false): Promise<Reward[]> {
    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cachedRewards = await this.getCachedRewards(userId);
        if (cachedRewards && cachedRewards.length > 0) {
          this.logDebug('Returning cached rewards');
          return cachedRewards;
        }
      }
      
      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        this.logDebug('Device is offline, returning cached rewards only');
        return await this.getCachedRewards(userId) || [];
      }
      
      // Fetch from server
      const response = await fetch(`${this.apiUrl}/gamification/rewards?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `AUSTA-App/${Platform.OS}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rewards: ${response.status} ${response.statusText}`);
      }
      
      const rewards = await response.json();
      
      // Cache the rewards
      await this.cacheRewards(userId, rewards);
      
      return rewards;
    } catch (error) {
      this.logDebug('Error fetching rewards', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
      
      // Return cached rewards as fallback
      return await this.getCachedRewards(userId) || [];
    }
  }
  
  /**
   * Gets cached rewards from AsyncStorage
   * @param userId User ID to get rewards for
   * @returns Promise that resolves to cached rewards or null if not found
   */
  private async getCachedRewards(userId: string): Promise<Reward[] | null> {
    try {
      const cacheKey = `${STORAGE_KEYS.REWARDS}_${userId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (!cachedData) {
        return null;
      }
      
      return JSON.parse(cachedData);
    } catch (error) {
      this.logDebug('Error retrieving cached rewards', error);
      return null;
    }
  }
  
  /**
   * Caches rewards in AsyncStorage
   * @param userId User ID to cache rewards for
   * @param rewards Rewards to cache
   */
  private async cacheRewards(userId: string, rewards: Reward[]): Promise<void> {
    try {
      const cacheKey = `${STORAGE_KEYS.REWARDS}_${userId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(rewards));
      this.logDebug(`Cached ${rewards.length} rewards for user ${userId}`);
    } catch (error) {
      this.logDebug('Error caching rewards', error);
    }
  }
  
  /**
   * Updates a user's game profile
   * @param userId User ID to update the profile for
   * @param updateRequest Update request with changes to apply
   * @returns Promise that resolves to the updated game profile
   */
  public async updateGameProfile(userId: string, updateRequest: UpdateGameProfileRequest): Promise<GameProfile | null> {
    try {
      // Check if online
      const isOnline = await this.isOnline();
      if (!isOnline) {
        this.logDebug('Device is offline, cannot update game profile');
        throw new Error('Cannot update game profile while offline');
      }
      
      // Send update to server
      const response = await fetch(`${this.apiUrl}/gamification/profiles/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `AUSTA-App/${Platform.OS}`
        },
        body: JSON.stringify(updateRequest)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update game profile: ${response.status} ${response.statusText}`);
      }
      
      const updatedProfile = await response.json();
      
      // Update cache
      await this.cacheGameProfile(userId, updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      this.logDebug('Error updating game profile', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
      return null;
    }
  }
  
  /**
   * Clears all cached gamification data for a user
   * @param userId User ID to clear data for
   * @returns Promise that resolves when clearing is complete
   */
  public async clearCachedData(userId: string): Promise<void> {
    try {
      const keys = [
        `${STORAGE_KEYS.GAME_PROFILE}_${userId}`,
        `${STORAGE_KEYS.ACHIEVEMENTS}_${userId}`,
        `${STORAGE_KEYS.QUESTS}_${userId}`,
        `${STORAGE_KEYS.REWARDS}_${userId}`
      ];
      
      await AsyncStorage.multiRemove(keys);
      this.logDebug(`Cleared cached gamification data for user ${userId}`);
    } catch (error) {
      this.logDebug('Error clearing cached data', error);
      this.lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  
  /**
   * Gets the last error that occurred in the adapter
   * @returns The last error or null if no error has occurred
   */
  public getLastError(): Error | null {
    return this.lastError;
  }
  
  /**
   * Gets the count of pending events
   * @returns The number of pending events
   */
  public getPendingEventCount(): number {
    return this.pendingEvents.length;
  }
  
  /**
   * Gets the timestamp of the last successful sync
   * @returns Promise that resolves to the timestamp or null if no sync has occurred
   */
  public async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return lastSync ? parseInt(lastSync, 10) : null;
    } catch (error) {
      this.logDebug('Error getting last sync timestamp', error);
      return null;
    }
  }
}