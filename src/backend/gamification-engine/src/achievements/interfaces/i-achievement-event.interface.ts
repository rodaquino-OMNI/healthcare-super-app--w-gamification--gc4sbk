/**
 * Achievement event interfaces for the gamification system.
 * These interfaces define the structure of events related to achievements
 * that are processed by the gamification engine.
 * 
 * @module achievements/interfaces
 */

// Import standardized event interfaces from @austa/interfaces package
import { IEventVersion, IVersionedEvent } from '@austa/interfaces/gamification/events';
import { IAchievement } from '@austa/interfaces/gamification/achievements';

/**
 * Enum defining the types of achievement events in the gamification system.
 * These event types are used to categorize and route achievement-related events.
 * 
 * @remarks
 * This enum should match the corresponding enum in @austa/interfaces/gamification/events
 */
export enum AchievementEventType {
  /** Event triggered when an achievement is unlocked */
  UNLOCKED = 'achievement.unlocked',
  /** Event triggered when progress is made towards an achievement */
  PROGRESS = 'achievement.progress',
  /** Event triggered when an achievement's progress is reset */
  RESET = 'achievement.reset',
  /** Event triggered when multiple achievements are updated in batch */
  BATCH_UPDATE = 'achievement.batch_update',
  /** Event triggered when an achievement is created or updated in the system */
  DEFINITION_UPDATED = 'achievement.definition_updated'
}

/**
 * Base interface for all achievement-related events.
 * Provides common properties shared across all achievement event types.
 * Extends the standardized IVersionedEvent from @austa/interfaces.
 */
export interface IAchievementEventBase extends IVersionedEvent {
  /** The type of achievement event */
  eventType: AchievementEventType;
  /** The user ID associated with this achievement event */
  userId: string;
  /** The profile ID in the gamification system */
  profileId: string;
  /** The journey context in which this achievement event occurred (health, care, plan) */
  journey: string;
  /** Timestamp when the event was created (ISO format) */
  timestamp: string;
  /** Unique identifier for tracing this event through the system */
  correlationId: string;
  /** Unique identifier for the event itself */
  eventId: string;
  /** The service that generated this event */
  source: string;
  /** Optional metadata for debugging and tracking */
  metadata?: {
    /** The device that generated the event (web, mobile, etc.) */
    deviceType?: string;
    /** The application version that generated the event */
    appVersion?: string;
    /** The session ID associated with this event */
    sessionId?: string;
    /** Any additional debugging information */
    debug?: Record<string, any>;
    /** Tags for categorizing and filtering events */
    tags?: string[];
  };
}

/**
 * Interface for the payload of an achievement unlocked event.
 * Contains all necessary information about the unlocked achievement.
 */
export interface IAchievementUnlockedPayload {
  /** The ID of the achievement that was unlocked */
  achievementId: string;
  /** The title of the achievement */
  achievementTitle: string;
  /** The XP reward granted for unlocking this achievement */
  xpReward: number;
  /** Timestamp when the achievement was unlocked */
  unlockedAt: string;
  /** The journey this achievement belongs to (health, care, plan) */
  journey: string;
  /** Optional achievement data with additional details */
  achievementData?: Partial<IAchievement>;
  /** Optional additional rewards associated with this achievement */
  additionalRewards?: {
    /** IDs of any rewards unlocked by this achievement */
    rewardIds?: string[];
    /** Any special items unlocked */
    items?: Array<{ id: string; name: string; type: string }>;
  };
  /** Optional source that triggered the achievement unlock */
  source?: {
    /** The service that triggered the achievement */
    serviceName: string;
    /** The specific action that led to unlocking */
    action: string;
    /** Any contextual data related to the unlock */
    context?: Record<string, any>;
  };
}

/**
 * Interface for an event triggered when a user unlocks an achievement.
 */
export interface IAchievementUnlockedEvent extends IAchievementEventBase {
  eventType: AchievementEventType.UNLOCKED;
  /** The payload containing details about the unlocked achievement */
  payload: IAchievementUnlockedPayload;
  /** Version information for this event type */
  version: IEventVersion;
}

/**
 * Interface for the payload of an achievement progress event.
 * Contains information about progress made towards unlocking an achievement.
 */
export interface IAchievementProgressPayload {
  /** The ID of the achievement being progressed */
  achievementId: string;
  /** The title of the achievement */
  achievementTitle: string;
  /** The current progress value */
  currentProgress: number;
  /** The target progress value needed to unlock the achievement */
  targetProgress: number;
  /** The previous progress value before this update */
  previousProgress: number;
  /** The journey this achievement belongs to (health, care, plan) */
  journey: string;
  /** Whether this progress update unlocked the achievement */
  unlocked: boolean;
  /** Optional achievement data with additional details */
  achievementData?: Partial<IAchievement>;
  /** The action or event that triggered this progress update */
  triggeringAction?: string;
  /** Optional source information */
  source?: {
    /** The service that triggered the progress update */
    serviceName: string;
    /** The specific action that led to the progress */
    action: string;
    /** Any contextual data related to the progress */
    context?: Record<string, any>;
  };
  /** Optional progress history for tracking multiple updates */
  progressHistory?: Array<{
    /** Timestamp of the progress update */
    timestamp: string;
    /** Progress value at this point */
    value: number;
    /** Action that caused this progress update */
    action?: string;
  }>;
}

/**
 * Interface for an event triggered when progress is made towards an achievement.
 */
export interface IAchievementProgressEvent extends IAchievementEventBase {
  eventType: AchievementEventType.PROGRESS;
  /** The payload containing details about the achievement progress */
  payload: IAchievementProgressPayload;
  /** Version information for this event type */
  version: IEventVersion;
}

/**
 * Interface for the payload of an achievement reset event.
 * Contains information about an achievement whose progress has been reset.
 */
export interface IAchievementResetPayload {
  /** The ID of the achievement being reset */
  achievementId: string;
  /** The title of the achievement */
  achievementTitle: string;
  /** The previous progress value before reset */
  previousProgress: number;
  /** The reason for resetting the achievement progress */
  reason: string;
  /** Whether the achievement was previously unlocked */
  wasUnlocked: boolean;
  /** The journey this achievement belongs to (health, care, plan) */
  journey: string;
  /** Optional achievement data with additional details */
  achievementData?: Partial<IAchievement>;
  /** Timestamp when the achievement was previously unlocked (if applicable) */
  previousUnlockTime?: string;
  /** Optional source information */
  source?: {
    /** The service that triggered the reset */
    serviceName: string;
    /** The specific action that led to the reset */
    action: string;
    /** Any contextual data related to the reset */
    context?: Record<string, any>;
  };
  /** Optional administrative information if reset was manually triggered */
  adminInfo?: {
    /** ID of the administrator who performed the reset */
    adminId: string;
    /** Notes about why the reset was performed */
    notes?: string;
  };
}

/**
 * Interface for an event triggered when an achievement's progress is reset.
 */
export interface IAchievementResetEvent extends IAchievementEventBase {
  eventType: AchievementEventType.RESET;
  /** The payload containing details about the achievement reset */
  payload: IAchievementResetPayload;
  /** Version information for this event type */
  version: IEventVersion;
}

/**
 * Union type of all achievement event interfaces.
 * Use this type when handling any achievement-related event.
 */
export type AchievementEvent = 
  | IAchievementUnlockedEvent 
  | IAchievementProgressEvent 
  | IAchievementResetEvent;

/**
 * Type guard to check if an event is an achievement unlocked event.
 * 
 * @param event The event to check
 * @returns True if the event is an achievement unlocked event
 */
export function isAchievementUnlockedEvent(event: AchievementEvent): event is IAchievementUnlockedEvent {
  return event.eventType === AchievementEventType.UNLOCKED;
}

/**
 * Type guard to check if an event is an achievement progress event.
 * 
 * @param event The event to check
 * @returns True if the event is an achievement progress event
 */
export function isAchievementProgressEvent(event: AchievementEvent): event is IAchievementProgressEvent {
  return event.eventType === AchievementEventType.PROGRESS;
}

/**
 * Type guard to check if an event is an achievement reset event.
 * 
 * @param event The event to check
 * @returns True if the event is an achievement reset event
 */
export function isAchievementResetEvent(event: AchievementEvent): event is IAchievementResetEvent {
  return event.eventType === AchievementEventType.RESET;
}

/**
 * Type guard to check if an event is any type of achievement event.
 * 
 * @param event The event to check
 * @returns True if the event is an achievement event
 */
export function isAchievementEvent(event: any): event is AchievementEvent {
  return event && 
    typeof event === 'object' && 
    'eventType' in event && 
    Object.values(AchievementEventType).includes(event.eventType as AchievementEventType);
}

/**
 * Creates a base achievement event with default values.
 * 
 * @param userId The ID of the user associated with the event
 * @param profileId The ID of the user's game profile
 * @param journey The journey context (health, care, plan)
 * @param source The service generating the event
 * @returns A partial achievement event with common fields populated
 */
export function createBaseAchievementEvent(
  userId: string,
  profileId: string,
  journey: string,
  source: string
): Omit<IAchievementEventBase, 'eventType' | 'payload' | 'version'> {
  return {
    userId,
    profileId,
    journey,
    source,
    timestamp: new Date().toISOString(),
    correlationId: generateCorrelationId(),
    eventId: generateEventId(),
  };
}

/**
 * Generates a unique correlation ID for event tracking.
 * 
 * @returns A unique correlation ID string
 */
function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generates a unique event ID.
 * 
 * @returns A unique event ID string
 */
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * These interfaces define the standardized event schema for achievement-related events
 * in the AUSTA SuperApp gamification system. They ensure consistent communication between
 * journey services (Health, Care, Plan) and the gamification engine.
 * 
 * Usage examples:
 * 
 * 1. Creating an achievement unlocked event:
 * ```typescript
 * const unlockedEvent: IAchievementUnlockedEvent = {
 *   ...createBaseAchievementEvent(userId, profileId, 'health', 'health-service'),
 *   eventType: AchievementEventType.UNLOCKED,
 *   payload: {
 *     achievementId: 'achievement-123',
 *     achievementTitle: 'First Steps',
 *     xpReward: 50,
 *     unlockedAt: new Date().toISOString(),
 *     journey: 'health'
 *   },
 *   version: { major: 1, minor: 0 }
 * };
 * ```
 * 
 * 2. Creating an achievement progress event:
 * ```typescript
 * const progressEvent: IAchievementProgressEvent = {
 *   ...createBaseAchievementEvent(userId, profileId, 'care', 'care-service'),
 *   eventType: AchievementEventType.PROGRESS,
 *   payload: {
 *     achievementId: 'achievement-456',
 *     achievementTitle: 'Regular Checkups',
 *     currentProgress: 3,
 *     targetProgress: 5,
 *     previousProgress: 2,
 *     journey: 'care',
 *     unlocked: false
 *   },
 *   version: { major: 1, minor: 0 }
 * };
 * ```
 * 
 * 3. Type checking with type guards:
 * ```typescript
 * function handleEvent(event: unknown) {
 *   if (isAchievementEvent(event)) {
 *     if (isAchievementUnlockedEvent(event)) {
 *       // Handle unlocked event
 *     } else if (isAchievementProgressEvent(event)) {
 *       // Handle progress event
 *     } else if (isAchievementResetEvent(event)) {
 *       // Handle reset event
 *     }
 *   }
 * }
 * ```
 */