import { GamificationEvent, EventType, JourneyType } from '@austa/interfaces/gamification/events';

/**
 * Base interface for all event handlers in the gamification engine.
 * Event handlers are responsible for processing specific types of events
 * and performing the appropriate actions based on the event data.
 */
export interface IEventHandler<T extends GamificationEvent = GamificationEvent> {
  /**
   * Determines if this handler can process the given event.
   * 
   * @param event The event to check
   * @returns True if this handler can process the event, false otherwise
   */
  canHandle(event: GamificationEvent): boolean;
  
  /**
   * Processes the given event.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the result of the event processing
   */
  handle(event: T): Promise<IEventHandlerResult>;
}

/**
 * Interface for the result of event handler processing.
 * Contains information about the success or failure of the event processing,
 * as well as any additional data that may be relevant.
 */
export interface IEventHandlerResult {
  /**
   * Indicates whether the event was processed successfully.
   */
  success: boolean;
  
  /**
   * Optional error message if the event processing failed.
   */
  error?: string;
  
  /**
   * Optional error code if the event processing failed.
   */
  errorCode?: string;
  
  /**
   * Optional data returned by the event handler.
   */
  data?: Record<string, any>;
  
  /**
   * Optional metadata about the event processing.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for the event processor that orchestrates the event processing pipeline.
 * The event processor is responsible for routing events to the appropriate handlers,
 * managing retries, and handling errors.
 */
export interface IEventProcessor {
  /**
   * Processes a given event by routing it to the appropriate handler.
   * 
   * @param event The event to process
   * @returns A promise that resolves with the result of the event processing
   */
  processEvent(event: GamificationEvent): Promise<IEventProcessorResult>;
  
  /**
   * Registers an event handler with the processor.
   * 
   * @param handler The event handler to register
   */
  registerHandler(handler: IEventHandler): void;
  
  /**
   * Publishes an event to the appropriate topic.
   * 
   * @param event The event to publish
   * @returns A promise that resolves when the event is published
   */
  publishEvent(event: GamificationEvent): Promise<void>;
}

/**
 * Interface for the result of event processor processing.
 * Contains information about the success or failure of the event processing,
 * as well as any additional data that may be relevant.
 */
export interface IEventProcessorResult extends IEventHandlerResult {
  /**
   * The type of the event that was processed.
   */
  eventType: EventType;
  
  /**
   * The ID of the user associated with the event.
   */
  userId: string;
  
  /**
   * The journey associated with the event.
   */
  journey?: JourneyType;
  
  /**
   * The time it took to process the event in milliseconds.
   */
  processingTime?: number;
  
  /**
   * The handlers that processed the event.
   */
  handlers?: string[];
}

/**
 * Interface for rule evaluation in the gamification engine.
 * Rule evaluators determine if a rule should be triggered based on an event.
 */
export interface IRuleEvaluator {
  /**
   * Evaluates a rule against an event to determine if it should be triggered.
   * 
   * @param ruleId The ID of the rule to evaluate
   * @param event The event to evaluate against
   * @returns A promise that resolves with the result of the rule evaluation
   */
  evaluateRule(ruleId: string, event: GamificationEvent): Promise<IRuleEvaluationResult>;
  
  /**
   * Evaluates all applicable rules for an event.
   * 
   * @param event The event to evaluate rules against
   * @returns A promise that resolves with the results of all rule evaluations
   */
  evaluateRules(event: GamificationEvent): Promise<IRuleEvaluationResult[]>;
}

/**
 * Interface for the result of rule evaluation.
 * Contains information about whether the rule was triggered and any actions to take.
 */
export interface IRuleEvaluationResult {
  /**
   * The ID of the rule that was evaluated.
   */
  ruleId: string;
  
  /**
   * Indicates whether the rule was triggered.
   */
  triggered: boolean;
  
  /**
   * The actions to take if the rule was triggered.
   */
  actions?: IRuleAction[];
  
  /**
   * Optional context data for the rule evaluation.
   */
  context?: Record<string, any>;
}

/**
 * Interface for a rule action to be taken when a rule is triggered.
 */
export interface IRuleAction {
  /**
   * The type of action to take.
   */
  type: string;
  
  /**
   * The parameters for the action.
   */
  params: Record<string, any>;
}

/**
 * Interface for achievement tracking in the gamification engine.
 * Achievement trackers determine if an achievement should be awarded based on an event.
 */
export interface IAchievementTracker {
  /**
   * Tracks progress towards an achievement based on an event.
   * 
   * @param achievementId The ID of the achievement to track
   * @param userId The ID of the user to track progress for
   * @param event The event that may contribute to achievement progress
   * @returns A promise that resolves with the result of the achievement tracking
   */
  trackAchievement(achievementId: string, userId: string, event: GamificationEvent): Promise<IAchievementTrackingResult>;
  
  /**
   * Tracks progress towards all applicable achievements for an event.
   * 
   * @param userId The ID of the user to track progress for
   * @param event The event that may contribute to achievement progress
   * @returns A promise that resolves with the results of all achievement tracking
   */
  trackAchievements(userId: string, event: GamificationEvent): Promise<IAchievementTrackingResult[]>;
}

/**
 * Interface for the result of achievement tracking.
 * Contains information about whether the achievement was awarded or progressed.
 */
export interface IAchievementTrackingResult {
  /**
   * The ID of the achievement that was tracked.
   */
  achievementId: string;
  
  /**
   * The ID of the user that the achievement was tracked for.
   */
  userId: string;
  
  /**
   * Indicates whether the achievement was awarded.
   */
  awarded: boolean;
  
  /**
   * The current progress towards the achievement (0-100).
   */
  progress: number;
  
  /**
   * The previous progress towards the achievement (0-100).
   */
  previousProgress?: number;
  
  /**
   * Optional metadata about the achievement tracking.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for notification delivery in the gamification engine.
 * Notification senders are responsible for sending notifications about achievements,
 * rewards, and other gamification events to users.
 */
export interface INotificationSender {
  /**
   * Sends a notification about an achievement to a user.
   * 
   * @param userId The ID of the user to send the notification to
   * @param achievementId The ID of the achievement to notify about
   * @param metadata Optional metadata about the achievement
   * @returns A promise that resolves when the notification is sent
   */
  sendAchievementNotification(userId: string, achievementId: string, metadata?: Record<string, any>): Promise<void>;
  
  /**
   * Sends a notification about a reward to a user.
   * 
   * @param userId The ID of the user to send the notification to
   * @param rewardId The ID of the reward to notify about
   * @param metadata Optional metadata about the reward
   * @returns A promise that resolves when the notification is sent
   */
  sendRewardNotification(userId: string, rewardId: string, metadata?: Record<string, any>): Promise<void>;
  
  /**
   * Sends a notification about a level up to a user.
   * 
   * @param userId The ID of the user to send the notification to
   * @param level The new level of the user
   * @param metadata Optional metadata about the level up
   * @returns A promise that resolves when the notification is sent
   */
  sendLevelUpNotification(userId: string, level: number, metadata?: Record<string, any>): Promise<void>;
}

/**
 * Interface for retry policy in the gamification engine.
 * Retry policies determine how and when to retry failed operations.
 */
export interface IRetryPolicy {
  /**
   * The maximum number of retry attempts.
   */
  maxRetries: number;
  
  /**
   * The initial delay between retry attempts in milliseconds.
   */
  initialDelay: number;
  
  /**
   * The maximum delay between retry attempts in milliseconds.
   */
  maxDelay: number;
  
  /**
   * Whether to use exponential backoff for retry delays.
   */
  exponentialBackoff: boolean;
  
  /**
   * Whether to add jitter to retry delays to prevent thundering herd problem.
   */
  jitter: boolean;
  
  /**
   * Calculates the delay for a retry attempt.
   * 
   * @param attempt The current retry attempt (1-based)
   * @returns The delay in milliseconds
   */
  calculateDelay(attempt: number): number;
}

/**
 * Interface for external service integration in the gamification engine.
 * External service clients are responsible for communicating with external services
 * such as notification services, analytics services, and third-party APIs.
 */
export interface IExternalServiceClient {
  /**
   * Sends data to an external service.
   * 
   * @param data The data to send
   * @returns A promise that resolves with the response from the external service
   */
  send(data: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Retrieves data from an external service.
   * 
   * @param params The parameters for the request
   * @returns A promise that resolves with the data from the external service
   */
  retrieve(params: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Checks if the external service is available.
   * 
   * @returns A promise that resolves with the availability status
   */
  checkAvailability(): Promise<boolean>;
}