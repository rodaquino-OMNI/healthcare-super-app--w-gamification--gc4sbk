/**
 * Interfaces for event handlers and processors used by the gamification engine.
 * 
 * This file provides contract definitions for components that process events,
 * evaluate rules, and update user profiles, ensuring consistent implementation
 * across the system.
 */

import { IEvent } from './event.interface';
import { JourneyEvent } from './journey-events.interface';
import { IEventResponse, IAchievementUnlocked, IRewardEarned } from './event-response.interface';
import { IEventType } from './event-type.interface';

/**
 * Interface for event handlers
 * Defines the contract for components that process specific event types
 */
export interface IEventHandler<T extends IEvent = IEvent> {
  /**
   * Handles an event
   * @param event The event to handle
   * @returns A promise that resolves to the event response
   */
  handleEvent(event: T): Promise<IEventResponse>;

  /**
   * Checks if the handler can handle the given event
   * @param event The event to check
   * @returns True if the handler can handle the event
   */
  canHandle(event: T): boolean;

  /**
   * Gets the event types that this handler can process
   * @returns An array of event types
   */
  getSupportedEventTypes(): string[];
}

/**
 * Interface for journey-specific event handlers
 */
export interface IJourneyEventHandler<T extends JourneyEvent> extends IEventHandler<T> {
  /**
   * The journey this handler is responsible for
   */
  readonly journey: 'health' | 'care' | 'plan';

  /**
   * Gets the event types supported by this journey handler
   * @returns An array of event types for this journey
   */
  getSupportedEventTypes(): string[];
}

/**
 * Interface for the event processor pipeline
 * Orchestrates the processing of events through multiple handlers
 */
export interface IEventProcessor {
  /**
   * Processes an event through the appropriate handlers
   * @param event The event to process
   * @returns A promise that resolves to the event response
   */
  processEvent(event: IEvent): Promise<IEventResponse>;

  /**
   * Registers an event handler with the processor
   * @param handler The handler to register
   */
  registerHandler(handler: IEventHandler): void;

  /**
   * Gets a handler for a specific event
   * @param event The event to get a handler for
   * @returns The appropriate handler or undefined if none found
   */
  getHandlerForEvent(event: IEvent): IEventHandler | undefined;

  /**
   * Gets all registered handlers
   * @returns An array of all registered handlers
   */
  getHandlers(): IEventHandler[];
}

/**
 * Interface for rule evaluation
 * Defines the contract for components that evaluate rules against events
 */
export interface IRuleEvaluator {
  /**
   * Evaluates rules against an event
   * @param event The event to evaluate
   * @param eventType The event type definition
   * @returns A promise that resolves to the evaluation result
   */
  evaluateRules(event: IEvent, eventType: IEventType): Promise<IRuleEvaluationResult>;

  /**
   * Gets rules applicable to an event type
   * @param eventType The event type to get rules for
   * @returns A promise that resolves to an array of applicable rules
   */
  getApplicableRules(eventType: IEventType): Promise<IRule[]>;
}

/**
 * Interface for rule evaluation results
 */
export interface IRuleEvaluationResult {
  /**
   * Whether any rules were triggered
   */
  rulesTriggered: boolean;

  /**
   * The rules that were triggered
   */
  triggeredRules: IRule[];

  /**
   * The points awarded from rule evaluation
   */
  pointsAwarded: number;

  /**
   * The achievements unlocked from rule evaluation
   */
  achievementsUnlocked: IAchievementUnlocked[];

  /**
   * The rewards earned from rule evaluation
   */
  rewardsEarned: IRewardEarned[];

  /**
   * The quests progressed from rule evaluation
   */
  questsProgressed: IQuestProgress[];
}

/**
 * Interface for gamification rules
 */
export interface IRule {
  /**
   * The unique identifier of the rule
   */
  id: string;

  /**
   * The name of the rule
   */
  name: string;

  /**
   * The description of the rule
   */
  description: string;

  /**
   * The event types this rule applies to
   */
  eventTypes: string[];

  /**
   * The condition that must be met for the rule to trigger
   */
  condition: string | object;

  /**
   * The points to award when the rule triggers
   */
  pointsToAward: number;

  /**
   * The achievements to unlock when the rule triggers
   */
  achievementsToUnlock?: string[];

  /**
   * The rewards to grant when the rule triggers
   */
  rewardsToGrant?: string[];

  /**
   * The quests to progress when the rule triggers
   */
  questsToProgress?: string[];

  /**
   * Whether the rule is enabled
   */
  enabled: boolean;

  /**
   * The priority of the rule (lower numbers = higher priority)
   */
  priority: number;
}

/**
 * Interface for achievement tracking
 */
export interface IAchievementTracker {
  /**
   * Tracks progress towards achievements based on an event
   * @param event The event to track
   * @param userId The user ID to track achievements for
   * @returns A promise that resolves to the achievements unlocked
   */
  trackAchievements(event: IEvent, userId: string): Promise<IAchievementUnlocked[]>;

  /**
   * Unlocks an achievement for a user
   * @param achievementId The ID of the achievement to unlock
   * @param userId The ID of the user to unlock the achievement for
   * @returns A promise that resolves to the unlocked achievement
   */
  unlockAchievement(achievementId: string, userId: string): Promise<IAchievementUnlocked>;

  /**
   * Gets the achievements unlocked by a user
   * @param userId The ID of the user to get achievements for
   * @returns A promise that resolves to an array of unlocked achievements
   */
  getUserAchievements(userId: string): Promise<IAchievementUnlocked[]>;
}

/**
 * Interface for quest progress tracking
 */
export interface IQuestProgress {
  /**
   * The ID of the quest
   */
  questId: string;

  /**
   * The name of the quest
   */
  name: string;

  /**
   * The description of the quest
   */
  description: string;

  /**
   * The current progress towards completion (0-100)
   */
  progressPercentage: number;

  /**
   * The number of steps completed
   */
  stepsCompleted: number;

  /**
   * The total number of steps required
   */
  totalSteps: number;

  /**
   * Whether the quest is completed
   */
  completed: boolean;

  /**
   * The timestamp when the quest was completed, if applicable
   */
  completedAt?: Date;

  /**
   * The points awarded for completing the quest
   */
  pointsAwarded: number;

  /**
   * The journey associated with the quest
   */
  journey?: string;
}

/**
 * Interface for quest tracking
 */
export interface IQuestTracker {
  /**
   * Tracks progress towards quests based on an event
   * @param event The event to track
   * @param userId The user ID to track quests for
   * @returns A promise that resolves to the quest progress updates
   */
  trackQuestProgress(event: IEvent, userId: string): Promise<IQuestProgress[]>;

  /**
   * Gets the quests in progress for a user
   * @param userId The ID of the user to get quests for
   * @returns A promise that resolves to an array of quest progress
   */
  getUserQuests(userId: string): Promise<IQuestProgress[]>;

  /**
   * Completes a quest for a user
   * @param questId The ID of the quest to complete
   * @param userId The ID of the user to complete the quest for
   * @returns A promise that resolves to the completed quest progress
   */
  completeQuest(questId: string, userId: string): Promise<IQuestProgress>;
}

/**
 * Interface for notification delivery
 */
export interface INotificationDelivery {
  /**
   * Sends an achievement notification
   * @param achievement The achievement to notify about
   * @param userId The ID of the user to notify
   * @returns A promise that resolves when the notification is sent
   */
  sendAchievementNotification(achievement: IAchievementUnlocked, userId: string): Promise<void>;

  /**
   * Sends a quest completion notification
   * @param quest The completed quest to notify about
   * @param userId The ID of the user to notify
   * @returns A promise that resolves when the notification is sent
   */
  sendQuestCompletionNotification(quest: IQuestProgress, userId: string): Promise<void>;

  /**
   * Sends a reward earned notification
   * @param reward The earned reward to notify about
   * @param userId The ID of the user to notify
   * @returns A promise that resolves when the notification is sent
   */
  sendRewardEarnedNotification(reward: IRewardEarned, userId: string): Promise<void>;

  /**
   * Sends a level up notification
   * @param userId The ID of the user to notify
   * @param newLevel The new level achieved
   * @param pointsToNextLevel The points needed for the next level
   * @returns A promise that resolves when the notification is sent
   */
  sendLevelUpNotification(userId: string, newLevel: number, pointsToNextLevel: number): Promise<void>;
}

/**
 * Interface for retry policy
 */
export interface IRetryPolicy {
  /**
   * Gets the delay before the next retry attempt
   * @param attempt The current attempt number (1-based)
   * @returns The delay in milliseconds
   */
  getRetryDelay(attempt: number): number;

  /**
   * Checks if a retry should be attempted
   * @param attempt The current attempt number (1-based)
   * @param error The error that occurred
   * @returns True if a retry should be attempted
   */
  shouldRetry(attempt: number, error: Error): boolean;

  /**
   * Gets the maximum number of retry attempts
   * @returns The maximum number of retry attempts
   */
  getMaxAttempts(): number;
}

/**
 * Interface for exponential backoff retry policy
 */
export interface IExponentialBackoffRetryPolicy extends IRetryPolicy {
  /**
   * The base delay in milliseconds
   */
  readonly baseDelayMs: number;

  /**
   * The maximum delay in milliseconds
   */
  readonly maxDelayMs: number;

  /**
   * The jitter factor (0-1) to apply to the delay
   */
  readonly jitterFactor: number;
}

/**
 * Interface for dead letter queue handling
 */
export interface IDeadLetterQueueHandler {
  /**
   * Sends an event to the dead letter queue
   * @param event The event to send
   * @param error The error that occurred
   * @returns A promise that resolves when the event is sent
   */
  sendToDeadLetterQueue(event: IEvent, error: Error): Promise<void>;

  /**
   * Processes events from the dead letter queue
   * @param batchSize The number of events to process in a batch
   * @returns A promise that resolves to the number of events processed
   */
  processDeadLetterQueue(batchSize: number): Promise<number>;

  /**
   * Gets the count of events in the dead letter queue
   * @returns A promise that resolves to the count
   */
  getDeadLetterQueueCount(): Promise<number>;
}