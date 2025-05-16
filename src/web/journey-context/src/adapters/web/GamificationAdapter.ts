/**
 * @file GamificationAdapter.ts
 * @description Web-specific implementation for gamification features that handles browser-based
 * event triggering, achievement tracking, and progress calculation. This adapter implements
 * the fetch API for event processing and provides browser-optimized methods for gamification interactions.
 */

import { 
  GamificationEventType, 
  BaseGamificationEvent, 
  EventResponse,
  JourneyType
} from '@austa/interfaces/gamification/events';
import { GameProfile } from '@austa/interfaces/gamification/profiles';

/**
 * Error class for gamification-related errors
 */
export class GamificationError extends Error {
  public readonly code: string;
  public readonly httpStatus?: number;
  
  constructor(message: string, code: string = 'GAMIFICATION_ERROR', httpStatus?: number) {
    super(message);
    this.name = 'GamificationError';
    this.code = code;
    this.httpStatus = httpStatus;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, GamificationError.prototype);
  }
}

/**
 * Web-specific implementation of the Gamification adapter
 * Handles browser-based event triggering, achievement tracking, and progress calculation
 */
class GamificationAdapter {
  private readonly API_BASE_URL = '/api/gamification';
  private readonly EVENTS_ENDPOINT = '/events';
  private readonly PROFILE_ENDPOINT = '/profile';
  
  /**
   * Triggers a gamification event on the server
   * @param userId - The ID of the user triggering the event
   * @param eventType - The type of event being triggered (e.g., "COMPLETE_HEALTH_CHECK")
   * @param journeyType - The journey context for the event
   * @param eventData - Additional data related to the event
   * @returns Promise that resolves with the event response when the event is processed
   * @throws GamificationError if the event cannot be triggered
   */
  public async triggerGamificationEvent(
    userId: string,
    eventType: GamificationEventType,
    journeyType: JourneyType,
    eventData?: Record<string, any>
  ): Promise<EventResponse> {
    // Ensure the user is authenticated
    if (!userId) {
      throw new GamificationError(
        'User must be authenticated to trigger gamification events',
        'UNAUTHENTICATED',
        401
      );
    }
    
    try {
      // Create a unique event ID
      const eventId = this.generateEventId();
      
      // Create the event payload
      const event: BaseGamificationEvent = {
        id: eventId,
        type: eventType,
        journey: journeyType,
        userId,
        timestamp: new Date().toISOString(),
        payload: eventData || {}
      };
      
      // Make an API call to trigger the event with fetch API
      const response = await fetch(`${this.API_BASE_URL}${this.EVENTS_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(event),
      });
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new GamificationError(
          `Failed to trigger gamification event: ${errorText || response.statusText}`,
          'API_ERROR',
          response.status
        );
      }
      
      // Parse and return the response
      const eventResponse: EventResponse = await response.json();
      return eventResponse;
      
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new GamificationError(
          'Network error while triggering gamification event. Please check your connection.',
          'NETWORK_ERROR'
        );
      }
      
      // Re-throw GamificationError instances
      if (err instanceof GamificationError) {
        throw err;
      }
      
      // Handle other errors
      console.error('Error triggering gamification event:', err);
      throw new GamificationError(
        err instanceof Error ? err.message : 'Failed to trigger gamification event',
        'UNKNOWN_ERROR'
      );
    }
  }
  
  /**
   * Fetches the user's gamification profile
   * @param userId - The ID of the user
   * @returns Promise that resolves with the user's game profile
   * @throws GamificationError if the profile cannot be fetched
   */
  public async fetchGameProfile(userId: string): Promise<GameProfile> {
    // Ensure the user is authenticated
    if (!userId) {
      throw new GamificationError(
        'User must be authenticated to fetch gamification profile',
        'UNAUTHENTICATED',
        401
      );
    }
    
    try {
      // Make an API call to fetch the profile
      const response = await fetch(`${this.API_BASE_URL}${this.PROFILE_ENDPOINT}/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new GamificationError(
          `Failed to fetch gamification profile: ${errorText || response.statusText}`,
          'API_ERROR',
          response.status
        );
      }
      
      // Parse and return the profile
      const profile: GameProfile = await response.json();
      return profile;
      
    } catch (err) {
      // Handle network errors
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new GamificationError(
          'Network error while fetching gamification profile. Please check your connection.',
          'NETWORK_ERROR'
        );
      }
      
      // Re-throw GamificationError instances
      if (err instanceof GamificationError) {
        throw err;
      }
      
      // Handle other errors
      console.error('Error fetching gamification profile:', err);
      throw new GamificationError(
        err instanceof Error ? err.message : 'Failed to fetch gamification profile',
        'UNKNOWN_ERROR'
      );
    }
  }
  
  /**
   * Checks if the user has unlocked a specific achievement
   * @param gameProfile - The user's game profile
   * @param achievementId - ID of the achievement to check
   * @returns boolean indicating if the achievement is unlocked
   */
  public hasAchievement(gameProfile: GameProfile | undefined, achievementId: string): boolean {
    if (!gameProfile?.achievements) return false;
    
    const achievement = gameProfile.achievements.find(a => a.id === achievementId);
    return achievement ? achievement.unlocked : false;
  }
  
  /**
   * Checks if the user has completed a specific quest
   * @param gameProfile - The user's game profile
   * @param questId - ID of the quest to check
   * @returns boolean indicating if the quest is completed
   */
  public isQuestCompleted(gameProfile: GameProfile | undefined, questId: string): boolean {
    if (!gameProfile?.quests) return false;
    
    const quest = gameProfile.quests.find(q => q.id === questId);
    return quest ? quest.completed : false;
  }
  
  /**
   * Calculates the progress percentage for an achievement
   * @param gameProfile - The user's game profile
   * @param achievementId - ID of the achievement
   * @returns number between 0-100 representing completion percentage
   */
  public getAchievementProgress(gameProfile: GameProfile | undefined, achievementId: string): number {
    if (!gameProfile?.achievements) return 0;
    
    const achievement = gameProfile.achievements.find(a => a.id === achievementId);
    if (!achievement) return 0;
    
    if (achievement.unlocked) return 100;
    
    // Browser-optimized calculation with proper rounding
    return Math.min(100, Math.max(0, Math.round((achievement.progress / achievement.total) * 100)));
  }
  
  /**
   * Calculates the progress percentage for a quest
   * @param gameProfile - The user's game profile
   * @param questId - ID of the quest
   * @returns number between 0-100 representing completion percentage
   */
  public getQuestProgress(gameProfile: GameProfile | undefined, questId: string): number {
    if (!gameProfile?.quests) return 0;
    
    const quest = gameProfile.quests.find(q => q.id === questId);
    if (!quest) return 0;
    
    if (quest.completed) return 100;
    
    // Browser-optimized calculation with proper rounding and bounds checking
    return Math.min(100, Math.max(0, Math.round((quest.progress / quest.total) * 100)));
  }
  
  /**
   * Generates a unique event ID using browser-specific APIs
   * @returns A unique string ID for the event
   */
  private generateEventId(): string {
    // Use browser's crypto API for better randomness if available
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    
    // Fallback to timestamp + random number if crypto API is not available
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
  
  /**
   * Checks if the browser is online
   * @returns boolean indicating if the browser is online
   */
  public isOnline(): boolean {
    return navigator.onLine;
  }
  
  /**
   * Registers event listeners for online/offline status changes
   * @param onOnline - Callback function to execute when the browser goes online
   * @param onOffline - Callback function to execute when the browser goes offline
   * @returns A cleanup function to remove the event listeners
   */
  public registerConnectivityListeners(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    // Return a cleanup function
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
}

// Export a singleton instance of the adapter
const gamificationAdapter = new GamificationAdapter();
export default gamificationAdapter;