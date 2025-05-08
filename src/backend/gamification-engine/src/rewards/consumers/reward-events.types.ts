/**
 * @file reward-events.types.ts
 * @description Type-safe event schema interfaces for all reward-related events processed by the gamification engine.
 * Ensures consistent event structure and versioning across all journey services.
 * 
 * This file defines the contract for reward events exchanged between journey services and the gamification engine.
 * It provides comprehensive type definitions, validation utilities, and helper functions for creating and
 * processing reward events in a type-safe manner.
 * 
 * Example usage:
 * 
 * ```typescript
 * // Creating a reward event
 * const rewardEvent = createRewardEvent(
 *   RewardEventType.REWARD_GRANTED,
 *   'user-123',
 *   JourneyType.HEALTH,
 *   {
 *     rewardId: 'reward-456',
 *     reward: { id: 'reward-456', title: 'Health Champion', xpValue: 100, ... },
 *     userId: 'user-123',
 *     grantedAt: new Date().toISOString(),
 *     xpValue: 100,
 *     journey: JourneyType.HEALTH,
 *     source: 'achievement',
 *     sourceId: 'achievement-789'
 *   },
 *   'health-service'
 * );
 * 
 * // Validating an event
 * if (isRewardEvent(incomingEvent)) {
 *   // Process the event
 *   validateRewardEvent(incomingEvent);
 *   // Handle based on event type
 *   switch (incomingEvent.type) {
 *     case RewardEventType.HEALTH_METRIC_REWARD:
 *       // Handle health metric reward
 *       break;
 *     // ...
 *   }
 * }
 * ```
 */

import { IVersionedEvent, EventVersion } from '@austa/interfaces/gamification/events';
import { JourneyType } from '@austa/interfaces/common/dto';
import { IReward } from '@austa/interfaces/gamification/rewards';

/**
 * Base interface for all reward-related events
 * @interface IRewardEvent
 * @extends {IVersionedEvent}
 */
export interface IRewardEvent extends IVersionedEvent {
  /** Unique identifier for the event */
  eventId: string;
  
  /** Timestamp when the event was created (ISO-8601 format) */
  timestamp: string;
  
  /** User ID associated with this reward event */
  userId: string;
  
  /** Journey context where this reward event originated */
  journey: JourneyType;
  
  /** Version information for schema evolution */
  version: EventVersion;
  
  /** Source service that generated this event */
  source: string;
  
  /** Event type identifier */
  type: RewardEventType;
  
  /** Event payload containing reward-specific data */
  payload: RewardEventPayload;
  
  /** Optional metadata for tracing and debugging */
  metadata?: Record<string, unknown>;
}

/**
 * Enum of all reward event types supported by the gamification engine
 * @enum {string}
 */
export enum RewardEventType {
  // Reward lifecycle events
  REWARD_CREATED = 'reward.created',
  REWARD_UPDATED = 'reward.updated',
  REWARD_DELETED = 'reward.deleted',
  
  // Reward granting events
  REWARD_GRANTED = 'reward.granted',
  REWARD_CLAIMED = 'reward.claimed',
  REWARD_EXPIRED = 'reward.expired',
  REWARD_REVOKED = 'reward.revoked',
  
  // Journey-specific reward events
  HEALTH_REWARD_TRIGGERED = 'health.reward.triggered',
  CARE_REWARD_TRIGGERED = 'care.reward.triggered',
  PLAN_REWARD_TRIGGERED = 'plan.reward.triggered',
  
  // Health journey specific events
  HEALTH_METRIC_REWARD = 'health.metric.reward',
  HEALTH_GOAL_REWARD = 'health.goal.reward',
  HEALTH_DEVICE_SYNC_REWARD = 'health.device.sync.reward',
  HEALTH_INSIGHT_REWARD = 'health.insight.reward',
  
  // Care journey specific events
  CARE_APPOINTMENT_REWARD = 'care.appointment.reward',
  CARE_MEDICATION_REWARD = 'care.medication.reward',
  CARE_TELEMEDICINE_REWARD = 'care.telemedicine.reward',
  CARE_PLAN_PROGRESS_REWARD = 'care.plan.progress.reward',
  
  // Plan journey specific events
  PLAN_CLAIM_REWARD = 'plan.claim.reward',
  PLAN_BENEFIT_REWARD = 'plan.benefit.reward',
  PLAN_SELECTION_REWARD = 'plan.selection.reward',
  PLAN_DOCUMENT_REWARD = 'plan.document.reward',
  
  // Cross-journey reward events
  CROSS_JOURNEY_REWARD_TRIGGERED = 'cross_journey.reward.triggered',
  
  // Reward notification events
  REWARD_NOTIFICATION_SENT = 'reward.notification.sent',
  REWARD_NOTIFICATION_READ = 'reward.notification.read'
}

/**
 * Union type for all possible reward event payloads
 * @type {RewardEventPayload}
 */
export type RewardEventPayload =
  | RewardCreatedPayload
  | RewardUpdatedPayload
  | RewardDeletedPayload
  | RewardGrantedPayload
  | RewardClaimedPayload
  | RewardExpiredPayload
  | RewardRevokedPayload
  | JourneyRewardTriggeredPayload
  | CrossJourneyRewardTriggeredPayload
  | RewardNotificationPayload;

/**
 * Interface for reward created event payload
 * @interface RewardCreatedPayload
 */
export interface RewardCreatedPayload {
  /** The newly created reward */
  reward: IReward;
  
  /** Timestamp when the reward was created */
  createdAt: string;
  
  /** User ID of the creator (admin or system) */
  createdBy: string;
}

/**
 * Interface for reward updated event payload
 * @interface RewardUpdatedPayload
 */
export interface RewardUpdatedPayload {
  /** The updated reward */
  reward: IReward;
  
  /** Previous state of the reward before update */
  previousState?: Partial<IReward>;
  
  /** Timestamp when the reward was updated */
  updatedAt: string;
  
  /** User ID of the updater (admin or system) */
  updatedBy: string;
  
  /** Fields that were changed in this update */
  changedFields: string[];
}

/**
 * Interface for reward deleted event payload
 * @interface RewardDeletedPayload
 */
export interface RewardDeletedPayload {
  /** ID of the deleted reward */
  rewardId: string;
  
  /** Timestamp when the reward was deleted */
  deletedAt: string;
  
  /** User ID of the deleter (admin or system) */
  deletedBy: string;
  
  /** Reason for deletion (optional) */
  reason?: string;
}

/**
 * Interface for reward granted event payload
 * @interface RewardGrantedPayload
 */
export interface RewardGrantedPayload {
  /** ID of the reward being granted */
  rewardId: string;
  
  /** Full reward data */
  reward: IReward;
  
  /** User ID who received the reward */
  userId: string;
  
  /** Timestamp when the reward was granted */
  grantedAt: string;
  
  /** XP points associated with this reward */
  xpValue: number;
  
  /** Journey where the reward was granted */
  journey: JourneyType;
  
  /** Source that triggered the reward (achievement, quest, etc.) */
  source: string;
  
  /** ID of the source entity (achievementId, questId, etc.) */
  sourceId?: string;
  
  /** Expiration date of the reward (if applicable) */
  expiresAt?: string;
  
  /** Additional context about the reward granting */
  context?: Record<string, unknown>;
}

/**
 * Interface for reward claimed event payload
 * @interface RewardClaimedPayload
 */
export interface RewardClaimedPayload {
  /** ID of the reward being claimed */
  rewardId: string;
  
  /** User ID who claimed the reward */
  userId: string;
  
  /** Timestamp when the reward was claimed */
  claimedAt: string;
  
  /** Journey where the reward was claimed */
  journey: JourneyType;
  
  /** Additional context about the reward claiming */
  context?: Record<string, unknown>;
}

/**
 * Interface for reward expired event payload
 * @interface RewardExpiredPayload
 */
export interface RewardExpiredPayload {
  /** ID of the expired reward */
  rewardId: string;
  
  /** User ID who had the reward */
  userId: string;
  
  /** Timestamp when the reward expired */
  expiredAt: string;
  
  /** Whether the reward was claimed before expiration */
  wasClaimed: boolean;
  
  /** Additional context about the reward expiration */
  context?: Record<string, unknown>;
}

/**
 * Interface for reward revoked event payload
 * @interface RewardRevokedPayload
 */
export interface RewardRevokedPayload {
  /** ID of the revoked reward */
  rewardId: string;
  
  /** User ID who had the reward */
  userId: string;
  
  /** Timestamp when the reward was revoked */
  revokedAt: string;
  
  /** User ID who revoked the reward (admin or system) */
  revokedBy: string;
  
  /** Reason for revocation */
  reason: string;
  
  /** Whether XP should be deducted */
  deductXp: boolean;
  
  /** Amount of XP to deduct if applicable */
  xpToDeduct?: number;
}

/**
 * Base interface for journey-specific reward triggered events
 * @interface BaseJourneyRewardTriggeredPayload
 */
export interface BaseJourneyRewardTriggeredPayload {
  /** ID of the triggered reward */
  rewardId: string;
  
  /** User ID who triggered the reward */
  userId: string;
  
  /** Timestamp when the reward was triggered */
  triggeredAt: string;
  
  /** Journey where the reward was triggered */
  journey: JourneyType;
  
  /** Event that triggered this reward */
  triggerEvent: string;
  
  /** Whether this trigger resulted in granting the reward */
  granted: boolean;
  
  /** XP value of the reward */
  xpValue: number;
}

/**
 * Interface for health journey reward triggered event payload
 * @interface HealthRewardTriggeredPayload
 * @extends {BaseJourneyRewardTriggeredPayload}
 */
export interface HealthRewardTriggeredPayload extends BaseJourneyRewardTriggeredPayload {
  journey: JourneyType.HEALTH;
  
  /** Health-specific context data */
  healthContext: {
    /** Type of health metric that triggered the reward */
    metricType?: string;
    
    /** Health goal related to this reward */
    goalId?: string;
    
    /** Device that provided the data */
    deviceId?: string;
    
    /** Achievement that triggered this reward (if applicable) */
    achievementId?: string;
    
    /** Additional health-specific data */
    additionalData?: Record<string, unknown>;
  };
}

/**
 * Interface for care journey reward triggered event payload
 * @interface CareRewardTriggeredPayload
 * @extends {BaseJourneyRewardTriggeredPayload}
 */
export interface CareRewardTriggeredPayload extends BaseJourneyRewardTriggeredPayload {
  journey: JourneyType.CARE;
  
  /** Care-specific context data */
  careContext: {
    /** Appointment related to this reward */
    appointmentId?: string;
    
    /** Medication related to this reward */
    medicationId?: string;
    
    /** Telemedicine session related to this reward */
    telemedicineSessionId?: string;
    
    /** Provider related to this reward */
    providerId?: string;
    
    /** Achievement that triggered this reward (if applicable) */
    achievementId?: string;
    
    /** Additional care-specific data */
    additionalData?: Record<string, unknown>;
  };
}

/**
 * Interface for plan journey reward triggered event payload
 * @interface PlanRewardTriggeredPayload
 * @extends {BaseJourneyRewardTriggeredPayload}
 */
export interface PlanRewardTriggeredPayload extends BaseJourneyRewardTriggeredPayload {
  journey: JourneyType.PLAN;
  
  /** Plan-specific context data */
  planContext: {
    /** Claim related to this reward */
    claimId?: string;
    
    /** Benefit related to this reward */
    benefitId?: string;
    
    /** Insurance plan related to this reward */
    planId?: string;
    
    /** Achievement that triggered this reward (if applicable) */
    achievementId?: string;
    
    /** Additional plan-specific data */
    additionalData?: Record<string, unknown>;
  };
}

/**
 * Union type for all journey-specific reward triggered payloads
 * @type {JourneyRewardTriggeredPayload}
 */
export type JourneyRewardTriggeredPayload =
  | HealthRewardTriggeredPayload
  | CareRewardTriggeredPayload
  | PlanRewardTriggeredPayload;

/**
 * Interface for cross-journey reward triggered event payload
 * @interface CrossJourneyRewardTriggeredPayload
 */
export interface CrossJourneyRewardTriggeredPayload {
  /** ID of the triggered reward */
  rewardId: string;
  
  /** User ID who triggered the reward */
  userId: string;
  
  /** Timestamp when the reward was triggered */
  triggeredAt: string;
  
  /** Events from different journeys that contributed to this reward */
  contributingEvents: {
    /** Health journey events that contributed */
    healthEvents?: string[];
    
    /** Care journey events that contributed */
    careEvents?: string[];
    
    /** Plan journey events that contributed */
    planEvents?: string[];
  };
  
  /** Whether this trigger resulted in granting the reward */
  granted: boolean;
  
  /** XP value of the reward */
  xpValue: number;
  
  /** Cross-journey specific context data */
  crossJourneyContext?: Record<string, unknown>;
}

/**
 * Interface for reward notification event payload
 * @interface RewardNotificationPayload
 */
export interface RewardNotificationPayload {
  /** ID of the reward being notified */
  rewardId: string;
  
  /** User ID receiving the notification */
  userId: string;
  
  /** Timestamp when the notification was sent */
  sentAt: string;
  
  /** Type of notification (e.g., 'granted', 'claimed', 'expiring', etc.) */
  notificationType: string;
  
  /** Notification channel (e.g., 'in_app', 'push', 'email', etc.) */
  channel: string;
  
  /** Notification content */
  content: {
    /** Notification title */
    title: string;
    
    /** Notification body */
    body: string;
    
    /** Deep link to the reward (if applicable) */
    deepLink?: string;
    
    /** Additional content data */
    data?: Record<string, unknown>;
  };
  
  /** Timestamp when the notification was read (if applicable) */
  readAt?: string;
}

/**
 * Type guard to check if an event is a reward event
 * @param event - The event to check
 * @returns {boolean} True if the event is a reward event
 */
export function isRewardEvent(event: unknown): event is IRewardEvent {
  const rewardEvent = event as IRewardEvent;
  return (
    rewardEvent !== null &&
    typeof rewardEvent === 'object' &&
    typeof rewardEvent.eventId === 'string' &&
    typeof rewardEvent.timestamp === 'string' &&
    typeof rewardEvent.userId === 'string' &&
    typeof rewardEvent.journey === 'string' &&
    typeof rewardEvent.type === 'string' &&
    Object.values(RewardEventType).includes(rewardEvent.type as RewardEventType) &&
    typeof rewardEvent.payload === 'object'
  );
}

/**
 * Type guard to check if a payload is a health reward triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a health reward triggered payload
 */
export function isHealthRewardTriggeredPayload(
  payload: RewardEventPayload
): payload is HealthRewardTriggeredPayload {
  const healthPayload = payload as HealthRewardTriggeredPayload;
  return (
    healthPayload !== null &&
    typeof healthPayload === 'object' &&
    healthPayload.journey === JourneyType.HEALTH &&
    typeof healthPayload.healthContext === 'object'
  );
}

/**
 * Type guard to check if a payload is a care reward triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a care reward triggered payload
 */
export function isCareRewardTriggeredPayload(
  payload: RewardEventPayload
): payload is CareRewardTriggeredPayload {
  const carePayload = payload as CareRewardTriggeredPayload;
  return (
    carePayload !== null &&
    typeof carePayload === 'object' &&
    carePayload.journey === JourneyType.CARE &&
    typeof carePayload.careContext === 'object'
  );
}

/**
 * Type guard to check if a payload is a plan reward triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a plan reward triggered payload
 */
export function isPlanRewardTriggeredPayload(
  payload: RewardEventPayload
): payload is PlanRewardTriggeredPayload {
  const planPayload = payload as PlanRewardTriggeredPayload;
  return (
    planPayload !== null &&
    typeof planPayload === 'object' &&
    planPayload.journey === JourneyType.PLAN &&
    typeof planPayload.planContext === 'object'
  );
}

/**
 * Type guard to check if a payload is a cross-journey reward triggered payload
 * @param payload - The payload to check
 * @returns {boolean} True if the payload is a cross-journey reward triggered payload
 */
export function isCrossJourneyRewardTriggeredPayload(
  payload: RewardEventPayload
): payload is CrossJourneyRewardTriggeredPayload {
  const crossJourneyPayload = payload as CrossJourneyRewardTriggeredPayload;
  return (
    crossJourneyPayload !== null &&
    typeof crossJourneyPayload === 'object' &&
    typeof crossJourneyPayload.contributingEvents === 'object' &&
    typeof crossJourneyPayload.granted === 'boolean'
  );
}

/**
 * Validates a reward event structure
 * @param event - The event to validate
 * @returns {boolean} True if the event is valid
 * @throws {Error} If the event is invalid
 */
export function validateRewardEvent(event: IRewardEvent): boolean {
  if (!isRewardEvent(event)) {
    throw new Error('Invalid reward event structure');
  }
  
  // Validate event type-specific payload structure
  switch (event.type) {
    case RewardEventType.HEALTH_REWARD_TRIGGERED:
      if (!isHealthRewardTriggeredPayload(event.payload)) {
        throw new Error('Invalid health reward triggered payload');
      }
      break;
    case RewardEventType.CARE_REWARD_TRIGGERED:
      if (!isCareRewardTriggeredPayload(event.payload)) {
        throw new Error('Invalid care reward triggered payload');
      }
      break;
    case RewardEventType.PLAN_REWARD_TRIGGERED:
      if (!isPlanRewardTriggeredPayload(event.payload)) {
        throw new Error('Invalid plan reward triggered payload');
      }
      break;
    case RewardEventType.CROSS_JOURNEY_REWARD_TRIGGERED:
      if (!isCrossJourneyRewardTriggeredPayload(event.payload)) {
        throw new Error('Invalid cross-journey reward triggered payload');
      }
      break;
    case RewardEventType.REWARD_GRANTED:
      if (!event.payload || typeof event.payload !== 'object' || !('rewardId' in event.payload)) {
        throw new Error('Invalid reward granted payload');
      }
      break;
    case RewardEventType.REWARD_CLAIMED:
      if (!event.payload || typeof event.payload !== 'object' || !('rewardId' in event.payload)) {
        throw new Error('Invalid reward claimed payload');
      }
      break;
    case RewardEventType.REWARD_EXPIRED:
      if (!event.payload || typeof event.payload !== 'object' || !('rewardId' in event.payload)) {
        throw new Error('Invalid reward expired payload');
      }
      break;
    case RewardEventType.REWARD_REVOKED:
      if (!event.payload || typeof event.payload !== 'object' || !('rewardId' in event.payload)) {
        throw new Error('Invalid reward revoked payload');
      }
      break;
    // Add validation for other event types as needed
  }
  
  return true;
}

/**
 * Migrates an event from an older version to the current version
 * @param event - The event to migrate
 * @returns {IRewardEvent} The migrated event
 */
export function migrateRewardEvent(event: IRewardEvent): IRewardEvent {
  // Clone the event to avoid modifying the original
  const migratedEvent = JSON.parse(JSON.stringify(event)) as IRewardEvent;
  
  // Handle version migrations
  if (!migratedEvent.version) {
    // If no version, assume it's the oldest version (1.0.0)
    migratedEvent.version = { major: 1, minor: 0, patch: 0 };
  }
  
  // Example migration from v1.0.0 to v1.1.0
  if (migratedEvent.version.major === 1 && migratedEvent.version.minor === 0) {
    // Migrate payload structure if needed
    if (migratedEvent.type === RewardEventType.REWARD_GRANTED) {
      const payload = migratedEvent.payload as RewardGrantedPayload;
      
      // Add new fields that were introduced in v1.1.0
      if (!('source' in payload)) {
        payload.source = 'system';
      }
      
      // Update version
      migratedEvent.version.minor = 1;
    }
  }
  
  // Example migration from v1.1.0 to v1.2.0
  if (migratedEvent.version.major === 1 && migratedEvent.version.minor === 1) {
    // Migrate payload structure if needed
    if (migratedEvent.type === RewardEventType.REWARD_GRANTED) {
      const payload = migratedEvent.payload as RewardGrantedPayload;
      
      // Add new fields that were introduced in v1.2.0
      if (!('context' in payload)) {
        payload.context = {};
      }
      
      // Update version
      migratedEvent.version.minor = 2;
    }
  }
  
  return migratedEvent;
}

/**
 * Creates a new reward event with the specified type and payload
 * @param type - The event type
 * @param userId - The user ID associated with the event
 * @param journey - The journey context
 * @param payload - The event payload
 * @param source - The source service
 * @param metadata - Optional metadata
 * @returns {IRewardEvent} The created reward event
 */
export function createRewardEvent(
  type: RewardEventType,
  userId: string,
  journey: JourneyType,
  payload: RewardEventPayload,
  source: string,
  metadata?: Record<string, unknown>
): IRewardEvent {
  const event: IRewardEvent = {
    eventId: crypto.randomUUID ? crypto.randomUUID() : `reward-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    userId,
    journey,
    version: {
      major: 1,
      minor: 0,
      patch: 0
    },
    source,
    type,
    payload,
    metadata
  };
  
  // Validate the event before returning
  validateRewardEvent(event);
  
  return event;
}

/**
 * Creates a health journey reward event
 * @param type - The specific health reward event type
 * @param userId - The user ID associated with the event
 * @param payload - The health-specific payload
 * @param source - The source service
 * @param metadata - Optional metadata
 * @returns {IRewardEvent} The created health reward event
 */
export function createHealthRewardEvent(
  type: RewardEventType.HEALTH_METRIC_REWARD | 
        RewardEventType.HEALTH_GOAL_REWARD | 
        RewardEventType.HEALTH_DEVICE_SYNC_REWARD | 
        RewardEventType.HEALTH_INSIGHT_REWARD,
  userId: string,
  payload: HealthRewardTriggeredPayload,
  source: string,
  metadata?: Record<string, unknown>
): IRewardEvent {
  return createRewardEvent(
    type,
    userId,
    JourneyType.HEALTH,
    payload,
    source,
    metadata
  );
}

/**
 * Creates a care journey reward event
 * @param type - The specific care reward event type
 * @param userId - The user ID associated with the event
 * @param payload - The care-specific payload
 * @param source - The source service
 * @param metadata - Optional metadata
 * @returns {IRewardEvent} The created care reward event
 */
export function createCareRewardEvent(
  type: RewardEventType.CARE_APPOINTMENT_REWARD | 
        RewardEventType.CARE_MEDICATION_REWARD | 
        RewardEventType.CARE_TELEMEDICINE_REWARD | 
        RewardEventType.CARE_PLAN_PROGRESS_REWARD,
  userId: string,
  payload: CareRewardTriggeredPayload,
  source: string,
  metadata?: Record<string, unknown>
): IRewardEvent {
  return createRewardEvent(
    type,
    userId,
    JourneyType.CARE,
    payload,
    source,
    metadata
  );
}

/**
 * Creates a plan journey reward event
 * @param type - The specific plan reward event type
 * @param userId - The user ID associated with the event
 * @param payload - The plan-specific payload
 * @param source - The source service
 * @param metadata - Optional metadata
 * @returns {IRewardEvent} The created plan reward event
 */
export function createPlanRewardEvent(
  type: RewardEventType.PLAN_CLAIM_REWARD | 
        RewardEventType.PLAN_BENEFIT_REWARD | 
        RewardEventType.PLAN_SELECTION_REWARD | 
        RewardEventType.PLAN_DOCUMENT_REWARD,
  userId: string,
  payload: PlanRewardTriggeredPayload,
  source: string,
  metadata?: Record<string, unknown>
): IRewardEvent {
  return createRewardEvent(
    type,
    userId,
    JourneyType.PLAN,
    payload,
    source,
    metadata
  );
}

/**
 * Creates a cross-journey reward event
 * @param userId - The user ID associated with the event
 * @param payload - The cross-journey payload
 * @param source - The source service
 * @param metadata - Optional metadata
 * @returns {IRewardEvent} The created cross-journey reward event
 */
export function createCrossJourneyRewardEvent(
  userId: string,
  payload: CrossJourneyRewardTriggeredPayload,
  source: string,
  metadata?: Record<string, unknown>
): IRewardEvent {
  return createRewardEvent(
    RewardEventType.CROSS_JOURNEY_REWARD_TRIGGERED,
    userId,
    JourneyType.GLOBAL,
    payload,
    source,
    metadata
  );
}

/**
 * Extracts journey type from a reward event type
 * @param eventType - The reward event type
 * @returns {JourneyType} The corresponding journey type
 */
export function getJourneyFromRewardEventType(eventType: RewardEventType): JourneyType {
  if (eventType.startsWith('health.')) {
    return JourneyType.HEALTH;
  } else if (eventType.startsWith('care.')) {
    return JourneyType.CARE;
  } else if (eventType.startsWith('plan.')) {
    return JourneyType.PLAN;
  } else if (eventType.startsWith('cross_journey.')) {
    return JourneyType.GLOBAL;
  }
  
  // Default to global for general reward events
  return JourneyType.GLOBAL;
}