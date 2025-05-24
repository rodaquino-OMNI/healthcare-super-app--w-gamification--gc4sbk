/**
 * Web-specific Gamification Adapter
 * 
 * This adapter implements browser-based event triggering, achievement tracking,
 * and progress calculation for gamification features. It provides a unified interface
 * for interacting with the gamification system from web applications.
 */

import {
  GamificationEvent,
  GamificationEventType,
  EventProcessingResponse,
  BaseGamificationEvent
} from '@austa/interfaces/gamification';

/**
 * Configuration options for the GamificationAdapter
 */
export interface GamificationAdapterConfig {
  /** Base URL for gamification API endpoints */
  apiBaseUrl: string;
  /** Custom fetch implementation (optional) */
  fetchImplementation?: typeof fetch;
  /** Timeout for API requests in milliseconds (default: 10000) */
  requestTimeoutMs?: number;
  /** Whether to enable debug logging (default: false) */
  enableDebugLogging?: boolean;
}

/**
 * Error class for gamification-specific errors
 */
export class GamificationError extends Error {
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Original error that caused this error */
  originalError?: Error;
  /** Additional error details */
  details?: Record<string, any>;

  constructor(message: string, options?: {
    statusCode?: number;
    originalError?: Error;
    details?: Record<string, any>;
  }) {
    super(message);
    this.name = 'GamificationError';
    this.statusCode = options?.statusCode;
    this.originalError = options?.originalError;
    this.details = options?.details;
  }
}

/**
 * Web-specific implementation of the Gamification Adapter
 * Handles browser-based event triggering, achievement tracking, and progress calculation
 */
class GamificationAdapter {
  private apiBaseUrl: string;
  private fetchImpl: typeof fetch;
  private requestTimeoutMs: number;
  private enableDebugLogging: boolean;

  /**
   * Creates a new instance of the GamificationAdapter
   * @param config Configuration options for the adapter
   */
  constructor(config: GamificationAdapterConfig) {
    this.apiBaseUrl = config.apiBaseUrl.endsWith('/')
      ? config.apiBaseUrl.slice(0, -1)
      : config.apiBaseUrl;
    this.fetchImpl = config.fetchImplementation || fetch;
    this.requestTimeoutMs = config.requestTimeoutMs || 10000;
    this.enableDebugLogging = config.enableDebugLogging || false;
  }

  /**
   * Logs debug messages if debug logging is enabled
   * @param message Message to log
   * @param data Additional data to log
   */
  private logDebug(message: string, data?: any): void {
    if (this.enableDebugLogging) {
      console.debug(`[GamificationAdapter] ${message}`, data);
    }
  }

  /**
   * Creates a timeout promise that rejects after the specified time
   * @param ms Timeout in milliseconds
   * @returns Promise that rejects after the timeout
   */
  private createTimeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new GamificationError(`Request timed out after ${ms}ms`));
      }, ms);
    });
  }

  /**
   * Performs a fetch request with timeout
   * @param url URL to fetch
   * @param options Fetch options
   * @returns Promise with the fetch response
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    try {
      const fetchPromise = this.fetchImpl(url, options);
      const timeoutPromise = this.createTimeoutPromise(this.requestTimeoutMs);

      // Race between the fetch and the timeout
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      // Handle network errors and timeouts
      if (error instanceof Error) {
        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('network')) {
          throw new GamificationError('Network error: Unable to connect to the gamification service', {
            originalError: error
          });
        }
        // If it's already a GamificationError (like our timeout), just rethrow it
        if (error instanceof GamificationError) {
          throw error;
        }
      }
      // For any other errors, wrap them in a GamificationError
      throw new GamificationError('Failed to communicate with gamification service', {
        originalError: error instanceof Error ? error : new Error(String(error))
      });
    }
  }

  /**
   * Processes the API response and handles errors
   * @param response Fetch response object
   * @returns Promise with the parsed response data
   */
  private async processResponse<T>(response: Response): Promise<T> {
    // Check if the response is OK (status in the range 200-299)
    if (!response.ok) {
      let errorDetails: Record<string, any> = {};
      
      try {
        // Try to parse the error response as JSON
        errorDetails = await response.json();
      } catch {
        // If parsing fails, use the status text
        errorDetails = { message: response.statusText };
      }

      throw new GamificationError(
        `API error: ${errorDetails.message || response.statusText}`,
        {
          statusCode: response.status,
          details: errorDetails
        }
      );
    }

    try {
      // Parse the response as JSON
      return await response.json() as T;
    } catch (error) {
      throw new GamificationError('Failed to parse API response', {
        originalError: error instanceof Error ? error : new Error('Unknown parsing error')
      });
    }
  }

  /**
   * Triggers a gamification event on the server
   * @param userId User ID for whom to trigger the event
   * @param eventType Type of event to trigger
   * @param eventData Additional data related to the event
   * @returns Promise with the event processing response
   */
  public async triggerEvent(
    userId: string,
    eventType: GamificationEventType,
    eventData?: Record<string, any>
  ): Promise<EventProcessingResponse> {
    if (!userId) {
      throw new GamificationError('User ID is required to trigger gamification events');
    }

    this.logDebug('Triggering event', { userId, eventType, eventData });

    // Create the event payload
    const event: Partial<BaseGamificationEvent> = {
      type: eventType,
      userId,
      timestamp: new Date().toISOString(),
      journey: this.determineJourneyFromEventType(eventType),
      client: {
        platform: 'web',
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      }
    };

    // Add the event-specific payload
    const fullEvent: GamificationEvent = {
      ...event,
      payload: eventData || {}
    } as GamificationEvent;

    try {
      const url = `${this.apiBaseUrl}/gamification/events`;
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fullEvent),
        credentials: 'include' // Include cookies for authentication
      });

      const result = await this.processResponse<EventProcessingResponse>(response);
      this.logDebug('Event processed successfully', result);
      return result;
    } catch (error) {
      // If it's already a GamificationError, just rethrow it
      if (error instanceof GamificationError) {
        this.logDebug('Error triggering event', error);
        throw error;
      }

      // Otherwise, wrap it in a GamificationError
      const gamificationError = new GamificationError(
        'Failed to trigger gamification event',
        { originalError: error instanceof Error ? error : new Error(String(error)) }
      );
      
      this.logDebug('Error triggering event', gamificationError);
      throw gamificationError;
    }
  }

  /**
   * Determines the journey from the event type
   * @param eventType Type of gamification event
   * @returns Journey identifier (health, care, plan, or system)
   */
  private determineJourneyFromEventType(
    eventType: GamificationEventType
  ): 'health' | 'care' | 'plan' | 'system' {
    // Health journey events
    if (
      eventType === GamificationEventType.HEALTH_METRIC_RECORDED ||
      eventType === GamificationEventType.HEALTH_GOAL_CREATED ||
      eventType === GamificationEventType.HEALTH_GOAL_COMPLETED ||
      eventType === GamificationEventType.HEALTH_GOAL_PROGRESS ||
      eventType === GamificationEventType.DEVICE_CONNECTED ||
      eventType === GamificationEventType.HEALTH_INSIGHT_VIEWED ||
      eventType === GamificationEventType.HEALTH_REPORT_GENERATED
    ) {
      return 'health';
    }

    // Care journey events
    if (
      eventType === GamificationEventType.APPOINTMENT_BOOKED ||
      eventType === GamificationEventType.APPOINTMENT_COMPLETED ||
      eventType === GamificationEventType.MEDICATION_ADDED ||
      eventType === GamificationEventType.MEDICATION_TAKEN ||
      eventType === GamificationEventType.TELEMEDICINE_SESSION_STARTED ||
      eventType === GamificationEventType.TELEMEDICINE_SESSION_COMPLETED ||
      eventType === GamificationEventType.SYMPTOM_CHECKED ||
      eventType === GamificationEventType.PROVIDER_RATED
    ) {
      return 'care';
    }

    // Plan journey events
    if (
      eventType === GamificationEventType.PLAN_VIEWED ||
      eventType === GamificationEventType.BENEFIT_EXPLORED ||
      eventType === GamificationEventType.CLAIM_SUBMITTED ||
      eventType === GamificationEventType.CLAIM_APPROVED ||
      eventType === GamificationEventType.DOCUMENT_UPLOADED ||
      eventType === GamificationEventType.COVERAGE_CHECKED
    ) {
      return 'plan';
    }

    // Default to system for gamification-specific events
    return 'system';
  }

  /**
   * Checks if a specific achievement is unlocked for a user
   * @param achievements Array of user achievements
   * @param achievementId ID of the achievement to check
   * @returns Boolean indicating if the achievement is unlocked
   */
  public hasAchievement(
    achievements: Array<{ id: string; unlocked: boolean }> | undefined,
    achievementId: string
  ): boolean {
    if (!achievements) return false;
    
    const achievement = achievements.find(a => a.id === achievementId);
    return achievement ? achievement.unlocked : false;
  }

  /**
   * Checks if a specific quest is completed for a user
   * @param quests Array of user quests
   * @param questId ID of the quest to check
   * @returns Boolean indicating if the quest is completed
   */
  public isQuestCompleted(
    quests: Array<{ id: string; completed: boolean }> | undefined,
    questId: string
  ): boolean {
    if (!quests) return false;
    
    const quest = quests.find(q => q.id === questId);
    return quest ? quest.completed : false;
  }

  /**
   * Calculates the progress percentage for an achievement
   * @param achievements Array of user achievements
   * @param achievementId ID of the achievement
   * @returns Number between 0-100 representing completion percentage
   */
  public getAchievementProgress(
    achievements: Array<{ id: string; unlocked: boolean; progress: number; total: number }> | undefined,
    achievementId: string
  ): number {
    if (!achievements) return 0;
    
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return 0;
    
    if (achievement.unlocked) return 100;
    
    // Ensure we don't divide by zero and the progress is within bounds
    if (achievement.total <= 0) return 0;
    const progress = Math.max(0, Math.min(achievement.progress, achievement.total));
    
    return Math.round((progress / achievement.total) * 100);
  }

  /**
   * Calculates the progress percentage for a quest
   * @param quests Array of user quests
   * @param questId ID of the quest
   * @returns Number between 0-100 representing completion percentage
   */
  public getQuestProgress(
    quests: Array<{ id: string; completed: boolean; progress: number; total: number }> | undefined,
    questId: string
  ): number {
    if (!quests) return 0;
    
    const quest = quests.find(q => q.id === questId);
    if (!quest) return 0;
    
    if (quest.completed) return 100;
    
    // Ensure we don't divide by zero and the progress is within bounds
    if (quest.total <= 0) return 0;
    const progress = Math.max(0, Math.min(quest.progress, quest.total));
    
    return Math.round((progress / quest.total) * 100);
  }

  /**
   * Retrieves the user's gamification profile
   * @param userId User ID to retrieve the profile for
   * @returns Promise with the user's gamification profile
   */
  public async getGameProfile(userId: string): Promise<any> {
    if (!userId) {
      throw new GamificationError('User ID is required to retrieve gamification profile');
    }

    this.logDebug('Retrieving game profile', { userId });

    try {
      const url = `${this.apiBaseUrl}/gamification/profiles/${userId}`;
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include' // Include cookies for authentication
      });

      const result = await this.processResponse<any>(response);
      this.logDebug('Profile retrieved successfully', result);
      return result;
    } catch (error) {
      // If it's already a GamificationError, just rethrow it
      if (error instanceof GamificationError) {
        this.logDebug('Error retrieving game profile', error);
        throw error;
      }

      // Otherwise, wrap it in a GamificationError
      const gamificationError = new GamificationError(
        'Failed to retrieve gamification profile',
        { originalError: error instanceof Error ? error : new Error(String(error)) }
      );
      
      this.logDebug('Error retrieving game profile', gamificationError);
      throw gamificationError;
    }
  }
}

export default GamificationAdapter;