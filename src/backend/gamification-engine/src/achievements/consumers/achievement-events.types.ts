/**
 * @file achievement-events.types.ts
 * @description Type-safe event schema interfaces for all achievement-related events processed by the gamification engine.
 * Ensures consistent event structure and versioning across all journey services.
 */

import { IVersionedEvent, EventVersion } from '@austa/interfaces/gamification/events';
import { JourneyType } from '@austa/interfaces/common/dto';
import { IAchievement, AchievementType } from '@austa/interfaces/gamification/achievements';

/**
 * Base interface for all achievement-related events
 * @interface IAchievementEvent
 * @extends {IVersionedEvent}
 */
export interface IAchievementEvent extends IVersionedEvent {
  /** Unique identifier for the event */
  eventId: string;
  
  /** Timestamp when the event was created (ISO-8601 format) */
  timestamp: string;
  
  /** User ID associated with this achievement event */
  userId: string;
  
  /** Journey context where this achievement event originated */
  journey: JourneyType;
  
  /** Version information for schema evolution */
  version: EventVersion;
  
  /** Source service that generated this event */
  source: string;
  
  /** Event type identifier */
  type: AchievementEventType;
  
  /** Event payload containing achievement-specific data */
  payload: AchievementEventPayload;
  
  /** Optional metadata for tracing and debugging */
  metadata?: Record<string, unknown>;
}

/**
 * Enum of all achievement event types supported by the gamification engine
 * @enum {string}
 */
export enum AchievementEventType {
  // Achievement lifecycle events
  ACHIEVEMENT_CREATED = 'achievement.created',
  ACHIEVEMENT_UPDATED = 'achievement.updated',
  ACHIEVEMENT_DELETED = 'achievement.deleted',
  
  // Achievement progress events
  ACHIEVEMENT_PROGRESS_UPDATED = 'achievement.progress.updated',
  ACHIEVEMENT_UNLOCKED = 'achievement.unlocked',
  ACHIEVEMENT_RESET = 'achievement.reset',
  
  // Journey-specific achievement events
  HEALTH_ACHIEVEMENT_TRIGGERED = 'health.achievement.triggered',
  CARE_ACHIEVEMENT_TRIGGERED = 'care.achievement.triggered',
  PLAN_ACHIEVEMENT_TRIGGERED = 'plan.achievement.triggered',
  
  // Cross-journey achievement events
  CROSS_JOURNEY_ACHIEVEMENT_TRIGGERED = 'cross_journey.achievement.triggered',
  
  // Achievement reward events
  ACHIEVEMENT_REWARD_GRANTED = 'achievement.reward.granted',
  ACHIEVEMENT_REWARD_CLAIMED = 'achievement.reward.claimed',
  
  // Achievement notification events
  ACHIEVEMENT_NOTIFICATION_SENT = 'achievement.notification.sent',
  ACHIEVEMENT_NOTIFICATION_READ = 'achievement.notification.read'
}

/**
 * Union type for all possible achievement event payloads
 * @type {AchievementEventPayload}
 */
export type AchievementEventPayload =
  | AchievementCreatedPayload
  | AchievementUpdatedPayload
  | AchievementDeletedPayload
  | AchievementProgressUpdatedPayload
  | AchievementUnlockedPayload
  | AchievementResetPayload
  | JourneyAchievementTriggeredPayload
  | CrossJourneyAchievementTriggeredPayload
  | AchievementRewardGrantedPayload
  | AchievementRewardClaimedPayload
  | AchievementNotificationPayload;

/**
 * Interface for achievement created event payload
 * @interface AchievementCreatedPayload
 */
export interface AchievementCreatedPayload {
  /** The newly created achievement */
  achievement: IAchievement;
  
  /** Timestamp when the achievement was created */
  createdAt: string;
  
  /** User ID of the creator (admin or system) */
  createdBy: string;
}

/**
 * Interface for achievement updated event payload
 * @interface AchievementUpdatedPayload
 */
export interface AchievementUpdatedPayload {
  /** The updated achievement */
  achievement: IAchievement;
  
  /** Previous state of the achievement before update */
  previousState?: Partial<IAchievement>;
  
  /** Timestamp when the achievement was updated */
  updatedAt: string;
  
  /** User ID of the updater (admin or system) */
  updatedBy: string;
  
  /** Fields that were changed in this update */
  changedFields: string[];
}

/**
 * Interface for achievement deleted event payload
 * @interface AchievementDeletedPayload
 */
export interface AchievementDeletedPayload {
  /** ID of the deleted achievement */
  achievementId: string;
  
  /** Timestamp when the achievement was deleted */
  deletedAt: string;
  
  /** User ID of the deleter (admin or system) */
  deletedBy: string;
  
  /** Reason for deletion (optional) */
  reason?: string;
}

/**
 * Interface for achievement progress updated event payload
 * @interface AchievementProgressUpdatedPayload
 */
export interface AchievementProgressUpdatedPayload {
  /** ID of the achievement being updated */
  achievementId: string;
  
  /** User ID whose progress is being updated */
  userId: string;
  
  /** Previous progress value (0-100) */
  previousProgress: number;
  
  /** New progress value (0-100) */
  newProgress: number;
  
  /** Timestamp when the progress was updated */
  updatedAt: string;
  
  /** Source of the progress update (e.g., 'health_metric', 'appointment', etc.) */
  source: string;
  
  /** Additional context about the progress update */
  context?: Record<string, unknown>;
}

/**
 * Interface for achievement unlocked event payload
 * @interface AchievementUnlockedPayload
 */
export interface AchievementUnlockedPayload {
  /** ID of the unlocked achievement */
  achievementId: string;
  
  /** Full achievement data */
  achievement: IAchievement;
  
  /** User ID who unlocked the achievement */
  userId: string;
  
  /** Timestamp when the achievement was unlocked */
  unlockedAt: string;
  
  /** XP points awarded for this achievement */
  xpAwarded: number;
  
  /** Journey where the achievement was unlocked */
  journey: JourneyType;
  
  /** Source event that triggered the unlock */
  triggerEvent?: string;
  
  /** Whether this is the first time the user unlocked this achievement */
  isFirstUnlock: boolean;
}

/**
 * Interface for achievement reset event payload
 * @interface AchievementResetPayload
 */
export interface AchievementResetPayload {
  /** ID of the achievement being reset */
  achievementId: string;
  
  /** User ID whose achievement is being reset */
  userId: string;
  
  /** Timestamp when the achievement was reset */
  resetAt: string;
  
  /** Reason for the reset */
  reason: string;
  
  /** User ID who initiated the reset (admin or system) */
  resetBy: string;
  
  /** Whether XP should be deducted */
  deductXp: boolean;
  
  /** Amount of XP to deduct if applicable */
  xpToDeduct?: number;
}

/**
 * Base interface for journey-specific achievement triggered events
 * @interface BaseJourneyAchievementTriggeredPayload
 */
export interface BaseJourneyAchievementTriggeredPayload {
  /** ID of the triggered achievement */
  achievementId: string;
  
  /** User ID who triggered the achievement */
  userId: string;
  
  /** Timestamp when the achievement was triggered */
  triggeredAt: string;
  
  /** Journey where the achievement was triggered */
  journey: JourneyType;
  
  /** Type of the achievement */
  achievementType: AchievementType;
  
  /** Event that triggered this achievement */
  triggerEvent: string;
  
  /** Current progress value (0-100) */
  progress: number;
  
  /** Whether this trigger resulted in unlocking the achievement */
  unlocked: boolean;
}

/**
 * Interface for health journey achievement triggered event payload
 * @interface HealthAchievementTriggeredPayload
 * @extends {BaseJourneyAchievementTriggeredPayload}
 */
export interface HealthAchievementTriggeredPayload extends BaseJourneyAchievementTriggeredPayload {
  journey: JourneyType.HEALTH;
  
  /** Health-specific context data */
  healthContext: {
    /** Type of health metric that triggered the achievement */
    metricType?: string;
    
    /** Health goal related to this achievement */
    goalId?: string;
    
    /** Device that provided the data */
    deviceId?: string;
    
    /** Additional health-specific data */
    additionalData?: Record<string, unknown>;
  };
}

/**
 * Interface for care journey achievement triggered event payload
 * @interface CareAchievementTriggeredPayload
 * @extends {BaseJourneyAchievementTriggeredPayload}
 */
export interface CareAchievementTriggeredPayload extends BaseJourneyAchievementTriggeredPayload {
  journey: JourneyType.CARE;
  
  /** Care-specific context data */
  careContext: {
    /** Appointment related to this achievement */
    appointmentId?: string;
    
    /** Medication related to this achievement */
    medicationId?: string;
    
    /** Telemedicine session related to this achievement */
    telemedicineSessionId?: string;
    
    /** Provider related to this achievement */
    providerId?: string;
    
    /** Additional care-specific data */
    additionalData?: Record<string, unknown>;
  };
}

/**
 * Interface for plan journey achievement triggered event payload
 * @interface PlanAchievementTriggeredPayload
 * @extends {BaseJourneyAchievementTriggeredPayload}
 */
export interface PlanAchievementTriggeredPayload extends BaseJourneyAchievementTriggeredPayload {
  journey: JourneyType.PLAN;
  
  /** Plan-specific context data */
  planContext: {
    /** Claim related to this achievement */
    claimId?: string;
    
    /** Benefit related to this achievement */
    benefitId?: string;
    
    /** Insurance plan related to this achievement */
    planId?: string;
    
    /** Additional plan-specific data */
    additionalData?: Record<string, unknown>;
  };
}

/**
 * Union type for all journey-specific achievement triggered payloads
 * @type {JourneyAchievementTriggeredPayload}
 */
export type JourneyAchievementTriggeredPayload =
  | HealthAchievementTriggeredPayload
  | CareAchievementTriggeredPayload
  | PlanAchievementTriggeredPayload;

/**
 * Interface for cross-journey achievement triggered event payload
 * @interface CrossJourneyAchievementTriggeredPayload
 */
export interface CrossJourneyAchievementTriggeredPayload {
  /** ID of the triggered achievement */
  achievementId: string;
  
  /** User ID who triggered the achievement */
  userId: string;
  
  /** Timestamp when the achievement was triggered */
  triggeredAt: string;
  
  /** Type of the achievement */
  achievementType: AchievementType.CROSS_JOURNEY;
  
  /** Events from different journeys that contributed to this achievement */
  contributingEvents: {
    /** Health journey events that contributed */
    healthEvents?: string[];
    
    /** Care journey events that contributed */
    careEvents?: string[];
    
    /** Plan journey events that contributed */
    planEvents?: string[];
  };
  
  /** Current progress value (0-100) */
  progress: number;
  
  /** Whether this trigger resulted in unlocking the achievement */
  unlocked: boolean;
  
  /** Cross-journey specific context data */
  crossJourneyContext?: Record<string, unknown>;
}

/**
 * Interface for achievement reward granted event payload
 * @interface AchievementRewardGrantedPayload
 */
export interface AchievementRewardGrantedPayload {
  /** ID of the achievement that granted the reward */
  achievementId: string;
  
  /** User ID who received the reward */
  userId: string;
  
  /** Timestamp when the reward was granted */
  grantedAt: string;
  
  /** Type of reward granted */
  rewardType: string;
  
  /** ID of the granted reward */
  rewardId: string;
  
  /** Value of the reward (XP, points, etc.) */
  rewardValue: number;
  
  /** Expiration date of the reward (if applicable) */
  expiresAt?: string;
  
  /** Additional reward metadata */
  rewardMetadata?: Record<string, unknown>;
}

/**
 * Interface for achievement reward claimed event payload
 * @interface AchievementRewardClaimedPayload
 */
export interface AchievementRewardClaimedPayload {
  /** ID of the achievement that granted the reward */
  achievementId: string;
  
  /** User ID who claimed the reward */
  userId: string;
  
  /** Timestamp when the reward was claimed */
  claimedAt: string;
  
  /** ID of the claimed reward */
  rewardId: string;
  
  /** Type of reward claimed */
  rewardType: string;
  
  /** Value of the reward (XP, points, etc.) */
  rewardValue: number;
  
  /** Additional claim metadata */
  claimMetadata?: Record<string, unknown>;
}

/**
 * Interface for achievement notification event payload
 * @interface AchievementNotificationPayload
 */
export interface AchievementNotificationPayload {
  /** ID of the achievement being notified */
  achievementId: string;
  
  /** User ID receiving the notification */
  userId: string;
  
  /** Timestamp when the notification was sent */
  sentAt: string;
  
  /** Type of notification (e.g., 'unlocked', 'progress', etc.) */
  notificationType: string;
  
  /** Notification channel (e.g., 'in_app', 'push', 'email', etc.) */
  channel: string;
  
  /** Notification content */
  content: {
    /** Notification title */
    title: string;
    
    /** Notification body */
    body: string;
    
    /** Deep link to the achievement (if applicable) */
    deepLink?: string;
    
    /** Additional content data */
    data?: Record<string, unknown>;
  };
  
  /** Timestamp when the notification was read (if applicable) */
  readAt?: string;
}

/**
 * Type guard to check if an event is an achievement event
 * @param event - The event to check
 * @returns {boolean} True if the event is an achievement event
 */
export function isAchievementEvent(event: unknown): event is IAchievementEvent {
  const achievementEvent = event as IAchievementEvent;
  return (
    achievementEvent !== null &&
    typeof achievementEvent === 'object' &&
    typeof achievementEvent.eventId === 'string' &&
    typeof achievementEvent.timestamp === 'string' &&
    typeof achievementEvent.userId === 'string' &&
    typeof achievementEvent.journey === 'string' &&
    typeof achievementEvent.type === 'string' &&
    Object.values(AchievementEventType).includes(achievementEvent.type as AchievementEventType) &&
    typeof achievementEvent.payload === 'object'
  );
}

/**
 * Type guard to check if a payload is a health achievement triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a health achievement triggered payload
 */
export function isHealthAchievementTriggeredPayload(
  payload: AchievementEventPayload
): payload is HealthAchievementTriggeredPayload {
  const healthPayload = payload as HealthAchievementTriggeredPayload;
  return (
    healthPayload !== null &&
    typeof healthPayload === 'object' &&
    healthPayload.journey === JourneyType.HEALTH &&
    typeof healthPayload.healthContext === 'object'
  );
}

/**
 * Type guard to check if a payload is a care achievement triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a care achievement triggered payload
 */
export function isCareAchievementTriggeredPayload(
  payload: AchievementEventPayload
): payload is CareAchievementTriggeredPayload {
  const carePayload = payload as CareAchievementTriggeredPayload;
  return (
    carePayload !== null &&
    typeof carePayload === 'object' &&
    carePayload.journey === JourneyType.CARE &&
    typeof carePayload.careContext === 'object'
  );
}

/**
 * Type guard to check if a payload is a plan achievement triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a plan achievement triggered payload
 */
export function isPlanAchievementTriggeredPayload(
  payload: AchievementEventPayload
): payload is PlanAchievementTriggeredPayload {
  const planPayload = payload as PlanAchievementTriggeredPayload;
  return (
    planPayload !== null &&
    typeof planPayload === 'object' &&
    planPayload.journey === JourneyType.PLAN &&
    typeof planPayload.planContext === 'object'
  );
}

/**
 * Type guard to check if a payload is a cross-journey achievement triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a cross-journey achievement triggered payload
 */
export function isCrossJourneyAchievementTriggeredPayload(
  payload: AchievementEventPayload
): payload is CrossJourneyAchievementTriggeredPayload {
  const crossJourneyPayload = payload as CrossJourneyAchievementTriggeredPayload;
  return (
    crossJourneyPayload !== null &&
    typeof crossJourneyPayload === 'object' &&
    crossJourneyPayload.achievementType === AchievementType.CROSS_JOURNEY &&
    typeof crossJourneyPayload.contributingEvents === 'object'
  );
}

/**
 * Validates an achievement event structure
 * @param event - The event to validate
 * @returns {boolean} True if the event is valid
 * @throws {Error} If the event is invalid
 */
export function validateAchievementEvent(event: IAchievementEvent): boolean {
  if (!isAchievementEvent(event)) {
    throw new Error('Invalid achievement event structure');
  }
  
  // Validate event type-specific payload structure
  switch (event.type) {
    case AchievementEventType.HEALTH_ACHIEVEMENT_TRIGGERED:
      if (!isHealthAchievementTriggeredPayload(event.payload)) {
        throw new Error('Invalid health achievement triggered payload');
      }
      break;
    case AchievementEventType.CARE_ACHIEVEMENT_TRIGGERED:
      if (!isCareAchievementTriggeredPayload(event.payload)) {
        throw new Error('Invalid care achievement triggered payload');
      }
      break;
    case AchievementEventType.PLAN_ACHIEVEMENT_TRIGGERED:
      if (!isPlanAchievementTriggeredPayload(event.payload)) {
        throw new Error('Invalid plan achievement triggered payload');
      }
      break;
    case AchievementEventType.CROSS_JOURNEY_ACHIEVEMENT_TRIGGERED:
      if (!isCrossJourneyAchievementTriggeredPayload(event.payload)) {
        throw new Error('Invalid cross-journey achievement triggered payload');
      }
      break;
    // Add validation for other event types as needed
  }
  
  return true;
}