/**
 * @file quest-event.interface.ts
 * @description Defines standardized event interfaces for quest-related Kafka events.
 * These interfaces ensure consistent event schema across services, with proper versioning
 * and type validation. Each event includes userProfile information, quest details, timestamp,
 * and event-specific data like progress status.
 *
 * This file implements the following requirements from the technical specification:
 * - Standardized event schemas between journey services and the gamification engine
 * - Implementation of proper versioning for API changes
 * - Support backward compatibility for data formats
 * - Kafka.js consumers configured with dead-letter queues and exponential backoff retry strategies
 */

import { IBaseEvent, IEventPayload } from '../../events/interfaces/event.interface';
import { CommonEventType } from '../../events/interfaces/event-type.interface';
import { IVersionedEvent } from '../../events/interfaces/event-versioning.interface';

/**
 * Enum defining the types of quest events
 */
export enum QuestEventType {
  QUEST_STARTED = 'quest.started',
  QUEST_PROGRESSED = 'quest.progressed',
  QUEST_COMPLETED = 'quest.completed',
  QUEST_EXPIRED = 'quest.expired',
  QUEST_RESET = 'quest.reset'
}

/**
 * Interface for quest event metadata
 * Contains information about the event source and validation
 */
export interface IQuestEventMetadata {
  /**
   * Source service that generated the event
   */
  source: string;

  /**
   * Journey context for the quest
   */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * Correlation ID for tracking related events
   */
  correlationId?: string;

  /**
   * Additional context-specific metadata
   */
  [key: string]: any;
}

/**
 * Base interface for all quest-related events
 * Extends IBaseEvent with quest-specific properties
 */
export interface IQuestEvent extends IBaseEvent, IVersionedEvent {
  /**
   * Type of the quest event
   */
  type: CommonEventType.QUEST_COMPLETED | string;

  /**
   * User ID associated with the event
   */
  userId: string;

  /**
   * Timestamp when the event occurred
   * ISO 8601 format
   */
  timestamp: string;

  /**
   * Event schema version for backward compatibility
   * @default '1.0'
   */
  version: string;

  /**
   * Event payload containing quest-specific data
   */
  payload: IEventPayload<IQuestEventData>;
}

/**
 * Base interface for quest event data
 * Contains common properties for all quest events
 */
export interface IQuestEventData {
  /**
   * ID of the quest
   */
  questId: string;

  /**
   * Title of the quest (optional for backward compatibility)
   */
  questTitle?: string;

  /**
   * Journey associated with the quest
   */
  journey?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * Event-specific metadata
   */
  metadata?: IQuestEventMetadata;
}

/**
 * Interface for quest started event data
 * Contains data specific to when a user starts a quest
 */
export interface IQuestStartedEventData extends IQuestEventData {
  /**
   * Timestamp when the quest was started
   * ISO 8601 format
   */
  startedAt: string;

  /**
   * Initial progress value (typically 0)
   */
  initialProgress?: number;

  /**
   * Flag indicating if this is the first time the user has started this quest
   */
  isFirstStart?: boolean;

  /**
   * Optional deadline for the quest
   * ISO 8601 format
   */
  deadline?: string;
}

/**
 * Interface for quest progressed event data
 * Contains data specific to when a user makes progress on a quest
 */
export interface IQuestProgressedEventData extends IQuestEventData {
  /**
   * Current progress percentage (0-100)
   */
  progress: number;

  /**
   * Previous progress percentage
   */
  previousProgress?: number;

  /**
   * Timestamp when the progress was updated
   * ISO 8601 format
   */
  updatedAt: string;

  /**
   * Optional steps completed information
   */
  stepsCompleted?: number;

  /**
   * Optional total steps required for completion
   */
  totalSteps?: number;

  /**
   * Optional ID of the specific step that was completed
   */
  completedStepId?: string;
}

/**
 * Interface for quest completed event data
 * Contains data specific to when a user completes a quest
 */
export interface IQuestCompletedEventData extends IQuestEventData {
  /**
   * Timestamp when the quest was completed
   * ISO 8601 format
   */
  completedAt: string;

  /**
   * XP points awarded for completing the quest
   */
  xpAwarded: number;

  /**
   * Time taken to complete the quest in seconds
   */
  completionTimeSeconds?: number;

  /**
   * Flag indicating if this is the first time the user has completed this quest
   */
  isFirstCompletion?: boolean;

  /**
   * Optional rewards earned from completing the quest
   */
  rewards?: {
    id: string;
    type: string;
    value: number;
  }[];
}

/**
 * Interface for quest expired event data
 * Contains data specific to when a quest expires before completion
 */
export interface IQuestExpiredEventData extends IQuestEventData {
  /**
   * Timestamp when the quest expired
   * ISO 8601 format
   */
  expiredAt: string;

  /**
   * Progress achieved before expiration (0-100)
   */
  progressAchieved: number;

  /**
   * Deadline that was missed
   * ISO 8601 format
   */
  deadline: string;
}

/**
 * Interface for quest reset event data
 * Contains data specific to when a quest is reset for a user
 */
export interface IQuestResetEventData extends IQuestEventData {
  /**
   * Timestamp when the quest was reset
   * ISO 8601 format
   */
  resetAt: string;

  /**
   * Reason for resetting the quest
   */
  reason?: 'user_requested' | 'admin_action' | 'system_reset' | 'retry_allowed' | string;

  /**
   * Previous status before reset
   */
  previousStatus?: string;

  /**
   * Progress before reset (0-100)
   */
  previousProgress?: number;
}

/**
 * Interface for quest started event
 * Represents an event emitted when a user starts a quest
 */
export interface QuestStartedEvent extends IQuestEvent {
  type: QuestEventType.QUEST_STARTED;
  payload: IEventPayload<IQuestStartedEventData>;
}

/**
 * Interface for quest progressed event
 * Represents an event emitted when a user makes progress on a quest
 */
export interface QuestProgressedEvent extends IQuestEvent {
  type: QuestEventType.QUEST_PROGRESSED;
  payload: IEventPayload<IQuestProgressedEventData>;
}

/**
 * Interface for quest completed event
 * Represents an event emitted when a user completes a quest
 */
export interface QuestCompletedEvent extends IQuestEvent {
  type: QuestEventType.QUEST_COMPLETED;
  payload: IEventPayload<IQuestCompletedEventData>;
}

/**
 * Interface for quest expired event
 * Represents an event emitted when a quest expires before completion
 */
export interface QuestExpiredEvent extends IQuestEvent {
  type: QuestEventType.QUEST_EXPIRED;
  payload: IEventPayload<IQuestExpiredEventData>;
}

/**
 * Interface for quest reset event
 * Represents an event emitted when a quest is reset for a user
 */
export interface QuestResetEvent extends IQuestEvent {
  type: QuestEventType.QUEST_RESET;
  payload: IEventPayload<IQuestResetEventData>;
}

/**
 * Union type for all quest events
 */
export type QuestEvent =
  | QuestStartedEvent
  | QuestProgressedEvent
  | QuestCompletedEvent
  | QuestExpiredEvent
  | QuestResetEvent;

/**
 * Type guard to check if an event is a quest started event
 * @param event The event to check
 * @returns True if the event is a quest started event
 */
export function isQuestStartedEvent(event: IQuestEvent): event is QuestStartedEvent {
  return event.type === QuestEventType.QUEST_STARTED;
}

/**
 * Type guard to check if an event is a quest progressed event
 * @param event The event to check
 * @returns True if the event is a quest progressed event
 */
export function isQuestProgressedEvent(event: IQuestEvent): event is QuestProgressedEvent {
  return event.type === QuestEventType.QUEST_PROGRESSED;
}

/**
 * Type guard to check if an event is a quest completed event
 * @param event The event to check
 * @returns True if the event is a quest completed event
 */
export function isQuestCompletedEvent(event: IQuestEvent): event is QuestCompletedEvent {
  return event.type === QuestEventType.QUEST_COMPLETED;
}

/**
 * Type guard to check if an event is a quest expired event
 * @param event The event to check
 * @returns True if the event is a quest expired event
 */
export function isQuestExpiredEvent(event: IQuestEvent): event is QuestExpiredEvent {
  return event.type === QuestEventType.QUEST_EXPIRED;
}

/**
 * Type guard to check if an event is a quest reset event
 * @param event The event to check
 * @returns True if the event is a quest reset event
 */
export function isQuestResetEvent(event: IQuestEvent): event is QuestResetEvent {
  return event.type === QuestEventType.QUEST_RESET;
}

/**
 * Creates a quest started event
 * @param userId The ID of the user who started the quest
 * @param questId The ID of the quest that was started
 * @param questTitle The title of the quest
 * @param journey The journey associated with the quest
 * @param metadata Additional metadata for the event
 * @returns A QuestStartedEvent object
 */
export function createQuestStartedEvent(
  userId: string,
  questId: string,
  questTitle?: string,
  journey?: 'health' | 'care' | 'plan' | 'cross-journey',
  metadata?: Record<string, any>
): QuestStartedEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: QuestEventType.QUEST_STARTED,
    userId,
    timestamp: new Date().toISOString(),
    version: '1.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    data: {}, // Required by IEvent but not used directly
    payload: {
      data: {
        questId,
        questTitle,
        journey,
        startedAt: new Date().toISOString(),
        initialProgress: 0,
        isFirstStart: true,
        metadata: {
          source: 'gamification-engine',
          journey,
          correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          ...metadata
        }
      }
    }
  };
}

/**
 * Creates a quest completed event
 * @param userId The ID of the user who completed the quest
 * @param questId The ID of the quest that was completed
 * @param xpAwarded The amount of XP awarded for completing the quest
 * @param questTitle The title of the quest
 * @param journey The journey associated with the quest
 * @param metadata Additional metadata for the event
 * @returns A QuestCompletedEvent object
 */
export function createQuestCompletedEvent(
  userId: string,
  questId: string,
  xpAwarded: number,
  questTitle?: string,
  journey?: 'health' | 'care' | 'plan' | 'cross-journey',
  metadata?: Record<string, any>
): QuestCompletedEvent {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    type: QuestEventType.QUEST_COMPLETED,
    userId,
    timestamp: new Date().toISOString(),
    version: '1.0',
    correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    data: {}, // Required by IEvent but not used directly
    payload: {
      data: {
        questId,
        questTitle,
        journey,
        completedAt: new Date().toISOString(),
        xpAwarded,
        isFirstCompletion: true,
        metadata: {
          source: 'gamification-engine',
          journey,
          correlationId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          ...metadata
        }
      }
    }
  };
}