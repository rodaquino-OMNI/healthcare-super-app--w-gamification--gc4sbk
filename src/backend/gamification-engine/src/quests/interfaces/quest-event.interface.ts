/**
 * @file quest-event.interface.ts
 * @description Defines standardized event interfaces for quest-related Kafka events,
 * including QuestStartedEvent and QuestCompletedEvent. These interfaces ensure consistent
 * event schema across services, with proper versioning and type validation.
 */

import { IBaseEvent, IEventPayload, IGamificationEventPayload } from '../../events/interfaces/event.interface';
import { IVersionedEvent } from '../../events/interfaces/event-versioning.interface';
import { SystemEventType } from '../../events/interfaces/event-type.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Enum defining the types of quest-related events in the system.
 * Used to categorize and route quest events to appropriate handlers.
 */
export enum QuestEventType {
  /** Event emitted when a user starts a quest */
  QUEST_STARTED = 'quest.started',
  
  /** Event emitted when a user completes a quest */
  QUEST_COMPLETED = 'quest.completed',
  
  /** Event emitted when a quest is updated */
  QUEST_UPDATED = 'quest.updated',
  
  /** Event emitted when a quest is created */
  QUEST_CREATED = 'quest.created',
  
  /** Event emitted when progress is made on a quest */
  QUEST_PROGRESS = 'quest.progress'
}

/**
 * Interface for user profile information included in quest events.
 * Contains essential user data needed for quest processing.
 */
export interface IQuestEventUserProfile {
  /** The unique identifier of the user */
  userId: string;
  
  /** The user's display name */
  displayName?: string;
  
  /** The user's current XP */
  currentXp?: number;
  
  /** The user's current level */
  currentLevel?: number;
}

/**
 * Interface for quest information included in quest events.
 * Contains essential quest data needed for event processing.
 */
export interface IQuestEventQuestInfo {
  /** The unique identifier of the quest */
  questId: string;
  
  /** The title of the quest */
  title?: string;
  
  /** The description of the quest */
  description?: string;
  
  /** The journey this quest belongs to */
  journey?: JourneyType;
  
  /** The XP reward for completing the quest */
  xpReward?: number;
}

/**
 * Base interface for all quest-related event payloads.
 * Provides common properties shared across all quest events.
 */
export interface IQuestEventPayload extends IGamificationEventPayload {
  /** The unique identifier of the quest */
  questId: string;
  
  /** The unique identifier of the user */
  userId: string;
  
  /** The journey this quest belongs to */
  journey?: JourneyType;
  
  /** Timestamp when the event occurred */
  timestamp: string;
  
  /** User profile information */
  userProfile?: IQuestEventUserProfile;
  
  /** Quest information */
  questInfo?: IQuestEventQuestInfo;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, any>;
}

/**
 * Interface for quest started event payloads.
 * Contains data specific to when a user starts a quest.
 */
export interface IQuestStartedPayload extends IQuestEventPayload {
  /** Initial progress value (typically 0) */
  initialProgress?: number;
  
  /** Whether this is the first time the user has started this quest */
  isFirstAttempt?: boolean;
  
  /** The action that triggered starting this quest */
  triggeringAction?: string;
}

/**
 * Interface for quest completed event payloads.
 * Contains data about a user completing a quest.
 */
export interface IQuestCompletedPayload extends IQuestEventPayload {
  /** The XP reward granted for completing the quest */
  xpAwarded: number;
  
  /** Time taken to complete the quest (in milliseconds) */
  completionTimeMs?: number;
  
  /** Any additional rewards granted */
  additionalRewards?: {
    /** Identifier of the reward */
    rewardId: string;
    /** Type of reward */
    rewardType: string;
    /** Value of the reward */
    value: any;
  }[];
  
  /** Whether this completion unlocked any achievements */
  unlockedAchievements?: string[];
}

/**
 * Interface for quest progress event payloads.
 * Contains data about a user's progress toward completing a quest.
 */
export interface IQuestProgressPayload extends IQuestEventPayload {
  /** Current progress value */
  currentValue: number;
  
  /** Target value needed to complete the quest */
  targetValue: number;
  
  /** Calculated percentage of completion (0-100) */
  percentComplete: number;
  
  /** Previous progress value before this update */
  previousValue?: number;
  
  /** The action that triggered this progress update */
  triggeringAction?: string;
}

/**
 * Interface for quest updated event payloads.
 * Contains data about updates to an existing quest.
 */
export interface IQuestUpdatedPayload extends IQuestEventPayload {
  /** Fields that were updated */
  updatedFields: string[];
  
  /** Previous values for updated fields */
  previousValues?: Record<string, any>;
}

/**
 * Interface for quest created event payloads.
 * Contains data about a newly created quest.
 */
export interface IQuestCreatedPayload extends IQuestEventPayload {
  /** Whether the quest is immediately available to users */
  isActive: boolean;
  
  /** Requirements to unlock this quest */
  requirements?: Record<string, any>;
}

/**
 * Type union of all quest event payload types.
 * Useful for discriminated unions in event handlers.
 */
export type QuestEventPayload =
  | IQuestStartedPayload
  | IQuestCompletedPayload
  | IQuestProgressPayload
  | IQuestUpdatedPayload
  | IQuestCreatedPayload;

/**
 * Interface for quest started events.
 * Represents the complete event when a user starts a quest.
 */
export interface IQuestStartedEvent extends IBaseEvent {
  /** The type of event */
  type: QuestEventType.QUEST_STARTED;
  
  /** The source service that generated this event */
  source: string;
  
  /** Version of the event schema */
  version: string;
  
  /** Event payload data */
  data: IQuestStartedPayload;
}

/**
 * Interface for quest completed events.
 * Represents the complete event when a user completes a quest.
 */
export interface IQuestCompletedEvent extends IBaseEvent {
  /** The type of event */
  type: QuestEventType.QUEST_COMPLETED;
  
  /** The source service that generated this event */
  source: string;
  
  /** Version of the event schema */
  version: string;
  
  /** Event payload data */
  data: IQuestCompletedPayload;
}

/**
 * Interface for quest progress events.
 * Represents the complete event when a user makes progress on a quest.
 */
export interface IQuestProgressEvent extends IBaseEvent {
  /** The type of event */
  type: QuestEventType.QUEST_PROGRESS;
  
  /** The source service that generated this event */
  source: string;
  
  /** Version of the event schema */
  version: string;
  
  /** Event payload data */
  data: IQuestProgressPayload;
}

/**
 * Interface for quest updated events.
 * Represents the complete event when a quest is updated.
 */
export interface IQuestUpdatedEvent extends IBaseEvent {
  /** The type of event */
  type: QuestEventType.QUEST_UPDATED;
  
  /** The source service that generated this event */
  source: string;
  
  /** Version of the event schema */
  version: string;
  
  /** Event payload data */
  data: IQuestUpdatedPayload;
}

/**
 * Interface for quest created events.
 * Represents the complete event when a new quest is created.
 */
export interface IQuestCreatedEvent extends IBaseEvent {
  /** The type of event */
  type: QuestEventType.QUEST_CREATED;
  
  /** The source service that generated this event */
  source: string;
  
  /** Version of the event schema */
  version: string;
  
  /** Event payload data */
  data: IQuestCreatedPayload;
}

/**
 * Type union of all quest event types.
 * Useful for discriminated unions in event handlers.
 */
export type QuestEvent =
  | IQuestStartedEvent
  | IQuestCompletedEvent
  | IQuestProgressEvent
  | IQuestUpdatedEvent
  | IQuestCreatedEvent;

/**
 * Interface for versioned quest events.
 * Provides version information for backward compatibility.
 */
export interface IVersionedQuestEvent extends IVersionedEvent<QuestEventPayload> {
  /** The type of quest event */
  type: QuestEventType;
}