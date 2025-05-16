/**
 * @file GamificationAdapter.ts
 * @description Web-specific implementation for gamification features that handles
 * browser-based event triggering, achievement tracking, and progress calculation.
 */

import { 
  GameProfile, 
  GamificationEventType,
  BaseGamificationEvent,
  EventResponse,
  JourneyType
} from '@austa/interfaces/gamification';

/**
 * Web-specific adapter for gamification functionality
 * Implements browser-optimized methods for interacting with the gamification system
 */
class GamificationAdapter {
  private readonly API_BASE_URL = '/api/gamification';
  private readonly EVENT_ENDPOINT = '/events';
  private readonly PROFILE_ENDPOINT = '/profile';
  
  // Queue for storing events that failed to send and need to be retried
  private eventQueue: Array<{
    eventType: GamificationEventType;
    journey: JourneyType;
    userId: string;
    eventData: any;
    timestamp: string;
  }> = [];
  
  /**
   * Retrieves the user's game profile from the API
   * @param userId - ID of the user whose profile to retrieve
   * @returns Promise resolving to the user's GameProfile
   */
  async getGameProfile(userId: string): Promise<GameProfile> {
    try {
      const response = await fetch(`${this.API_BASE_URL}${this.PROFILE_ENDPOINT}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch game profile: ${response.statusText}`);
      }
      
      const profile = await response.json();
      return profile as GameProfile;
    } catch (error) {
      console.error('Error fetching game profile:', error);
      throw error;
    }
  }
  
  /**
   * Triggers a gamification event on the server
   * @param event - The event object to send to the server
   * @returns Promise resolving to the event response
   */
  async triggerEvent(event: BaseGamificationEvent): Promise<EventResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}${this.EVENT_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger gamification event: ${response.statusText}`);
      }
      
      const eventResponse = await response.json();
      return eventResponse as EventResponse;
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
    
    // Store the queue in localStorage for persistence across page refreshes
    try {
      localStorage.setItem('gamificationEventQueue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Error storing event queue in localStorage:', error);
    }
  }
  
  /**
   * Synchronizes queued events with the server
   * Called automatically when the adapter is initialized and when the app comes online
   */
  async syncQueuedEvents(): Promise<void> {
    // Load any queued events from localStorage
    try {
      const storedQueue = localStorage.getItem('gamificationEventQueue');
      if (storedQueue) {
        this.eventQueue = JSON.parse(storedQueue);
      }
    } catch (error) {
      console.error('Error loading event queue from localStorage:', error);
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
      localStorage.setItem('gamificationEventQueue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Error updating event queue in localStorage:', error);
    }
  }
  
  /**
   * Initializes the adapter
   * Sets up event listeners for online/offline status and syncs queued events
   */
  initialize(): void {
    // Set up online listener to sync events when the app comes back online
    window.addEventListener('online', () => {
      this.syncQueuedEvents();
    });
    
    // Sync any queued events on initialization
    if (navigator.onLine) {
      this.syncQueuedEvents();
    }
  }
}

// Create and export a singleton instance
const gamificationAdapter = new GamificationAdapter();
gamificationAdapter.initialize();

export default gamificationAdapter;