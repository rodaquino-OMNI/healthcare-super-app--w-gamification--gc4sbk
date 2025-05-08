/**
 * @file notification-event-type.interface.ts
 * @description Defines interfaces and TypeScript type utilities for notification event type categorization,
 * validation, and narrowing. This file provides a type-safe representation of notification event types
 * organized by journey and purpose, enabling proper static and runtime type checking throughout the
 * notification service.
 *
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Create standardized event type structure across the platform
 * - Integrate with @austa/interfaces for standardized notification payload schemas
 * - Establish event versioning strategy
 *
 * @example
 * // Using notification type enums for type safety
 * function processHealthNotification(eventType: HealthNotificationType) {
 *   if (eventType === HealthNotificationType.HEALTH_GOAL_ACHIEVED) {
 *     // Process health goal achievement notification
 *   } else if (eventType === HealthNotificationType.HEALTH_METRIC_ALERT) {
 *     // Process health metric alert notification
 *   }
 * }
 *
 * @example
 * // Using type guards for runtime validation
 * function processNotification(eventTypeId: string) {
 *   if (isHealthNotificationTypeId(eventTypeId)) {
 *     // It's a health notification
 *     processHealthNotification(eventTypeId);
 *   } else if (isCareNotificationTypeId(eventTypeId)) {
 *     // It's a care notification
 *     processCareNotification(eventTypeId);
 *   }
 * }
 */

// Import interfaces from @austa/interfaces package for standardized schema definitions
import { IBaseEvent } from '@austa/interfaces/common';
import { IHealthGoal, MetricType } from '@austa/interfaces/journey/health';
import { AppointmentType } from '@austa/interfaces/journey/care';
import { ClaimStatus } from '@austa/interfaces/journey/plan';
import { NotificationChannel, NotificationPriority } from '@austa/interfaces/notification/types';

/**
 * Base interface for all notification event types in the notification system.
 * Provides a standardized structure for notification event type identification and metadata.
 */
export interface INotificationEventType {
  /** Unique identifier for the notification event type */
  readonly id: string;
  
  /** Human-readable name of the notification event type */
  readonly name: string;
  
  /** Optional description of the notification event type */
  readonly description?: string;
  
  /** The journey this notification event type belongs to */
  readonly journey: 'health' | 'care' | 'plan' | 'system';
  
  /** Version of the notification event type schema */
  readonly version: string;
  
  /** Default priority for this notification type */
  readonly defaultPriority: NotificationPriority;
  
  /** Default channels for delivering this notification type */
  readonly defaultChannels: NotificationChannel[];
  
  /** Whether this notification event type is deprecated */
  readonly deprecated?: boolean;
  
  /** Whether this notification type requires user acknowledgment */
  readonly requiresAcknowledgment?: boolean;
  
  /** Time-to-live in seconds for this notification type (0 = no expiration) */
  readonly ttl?: number;
}

/**
 * Health journey notification event types.
 * These notifications are triggered by user actions in the Health journey.
 */
export interface IHealthNotificationEventType extends INotificationEventType {
  readonly journey: 'health';
}

/**
 * Care journey notification event types.
 * These notifications are triggered by user actions in the Care journey.
 */
export interface ICareNotificationEventType extends INotificationEventType {
  readonly journey: 'care';
}

/**
 * Plan journey notification event types.
 * These notifications are triggered by user actions in the Plan journey.
 */
export interface IPlanNotificationEventType extends INotificationEventType {
  readonly journey: 'plan';
}

/**
 * System notification event types that are not specific to any journey.
 * These notifications are typically system-generated or cross-journey notifications.
 */
export interface ISystemNotificationEventType extends INotificationEventType {
  readonly journey: 'system';
}

/**
 * Union type of all notification event types.
 * Use this type when you need to accept any valid notification event type.
 */
export type NotificationEventType = 
  | IHealthNotificationEventType 
  | ICareNotificationEventType 
  | IPlanNotificationEventType 
  | ISystemNotificationEventType;

/**
 * Interface for notification event type validation against notification events.
 * This interface ensures that notification event types are compatible with the notification processing pipeline.
 */
export interface INotificationEventTypeValidator {
  /**
   * Validates a notification event against its declared type.
   * @param eventType The notification event type to validate against
   * @param event The notification event data
   * @returns True if the notification event is valid for the given type
   */
  validate(eventType: NotificationEventType, event: {
    type: string;
    userId: string;
    data: object;
    journey?: string;
  }): boolean;
}

/**
 * Enum of all health journey notification event type IDs.
 * Use this for type-safe reference to health notification event types.
 */
export enum HealthNotificationType {
  HEALTH_GOAL_ACHIEVED = 'HEALTH_GOAL_ACHIEVED',
  HEALTH_GOAL_PROGRESS = 'HEALTH_GOAL_PROGRESS',
  HEALTH_METRIC_ALERT = 'HEALTH_METRIC_ALERT',
  HEALTH_INSIGHT_AVAILABLE = 'HEALTH_INSIGHT_AVAILABLE',
  DEVICE_SYNC_REMINDER = 'DEVICE_SYNC_REMINDER',
  DEVICE_SYNC_COMPLETED = 'DEVICE_SYNC_COMPLETED',
  HEALTH_CHECKUP_REMINDER = 'HEALTH_CHECKUP_REMINDER',
  HEALTH_TIP = 'HEALTH_TIP',
}

/**
 * Enum of all care journey notification event type IDs.
 * Use this for type-safe reference to care notification event types.
 */
export enum CareNotificationType {
  APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER',
  APPOINTMENT_CONFIRMATION = 'APPOINTMENT_CONFIRMATION',
  APPOINTMENT_CANCELLATION = 'APPOINTMENT_CANCELLATION',
  MEDICATION_REMINDER = 'MEDICATION_REMINDER',
  MEDICATION_REFILL = 'MEDICATION_REFILL',
  TELEMEDICINE_SESSION_REMINDER = 'TELEMEDICINE_SESSION_REMINDER',
  TELEMEDICINE_SESSION_READY = 'TELEMEDICINE_SESSION_READY',
  PROVIDER_MESSAGE = 'PROVIDER_MESSAGE',
  CARE_PLAN_UPDATED = 'CARE_PLAN_UPDATED',
  SYMPTOM_CHECKER_RESULT = 'SYMPTOM_CHECKER_RESULT',
}

/**
 * Enum of all plan journey notification event type IDs.
 * Use this for type-safe reference to plan notification event types.
 */
export enum PlanNotificationType {
  CLAIM_STATUS_UPDATED = 'CLAIM_STATUS_UPDATED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  CLAIM_ADDITIONAL_INFO_REQUIRED = 'CLAIM_ADDITIONAL_INFO_REQUIRED',
  BENEFIT_UTILIZATION_ALERT = 'BENEFIT_UTILIZATION_ALERT',
  PLAN_RENEWAL_REMINDER = 'PLAN_RENEWAL_REMINDER',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  DOCUMENT_VERIFICATION = 'DOCUMENT_VERIFICATION',
  COVERAGE_CHANGE = 'COVERAGE_CHANGE',
}

/**
 * Enum of all system notification event type IDs.
 * Use this for type-safe reference to system notification event types.
 */
export enum SystemNotificationType {
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  LEVEL_UP = 'LEVEL_UP',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  REWARD_EARNED = 'REWARD_EARNED',
  REWARD_EXPIRING = 'REWARD_EXPIRING',
  ACCOUNT_VERIFICATION = 'ACCOUNT_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SECURITY_ALERT = 'SECURITY_ALERT',
  MAINTENANCE_NOTIFICATION = 'MAINTENANCE_NOTIFICATION',
  APP_UPDATE_AVAILABLE = 'APP_UPDATE_AVAILABLE',
  WELCOME_MESSAGE = 'WELCOME_MESSAGE',
}

/**
 * Enum of all delivery status notification event type IDs.
 * These are used internally by the notification service to track delivery status.
 */
export enum DeliveryStatusNotificationType {
  NOTIFICATION_SENT = 'NOTIFICATION_SENT',
  NOTIFICATION_DELIVERED = 'NOTIFICATION_DELIVERED',
  NOTIFICATION_READ = 'NOTIFICATION_READ',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  NOTIFICATION_EXPIRED = 'NOTIFICATION_EXPIRED',
  NOTIFICATION_ACKNOWLEDGED = 'NOTIFICATION_ACKNOWLEDGED',
}

/**
 * Union type of all notification event type IDs.
 * Use this when you need a type that represents any valid notification event type ID.
 */
export type NotificationTypeId = 
  | HealthNotificationType 
  | CareNotificationType 
  | PlanNotificationType 
  | SystemNotificationType 
  | DeliveryStatusNotificationType;

/**
 * Type guard to check if a notification event type is a health notification event type.
 * @param eventType The notification event type to check
 * @returns True if the notification event type is a health notification event type
 */
export function isHealthNotificationEventType(eventType: INotificationEventType): eventType is IHealthNotificationEventType {
  return eventType.journey === 'health';
}

/**
 * Type guard to check if a notification event type is a care notification event type.
 * @param eventType The notification event type to check
 * @returns True if the notification event type is a care notification event type
 */
export function isCareNotificationEventType(eventType: INotificationEventType): eventType is ICareNotificationEventType {
  return eventType.journey === 'care';
}

/**
 * Type guard to check if a notification event type is a plan notification event type.
 * @param eventType The notification event type to check
 * @returns True if the notification event type is a plan notification event type
 */
export function isPlanNotificationEventType(eventType: INotificationEventType): eventType is IPlanNotificationEventType {
  return eventType.journey === 'plan';
}

/**
 * Type guard to check if a notification event type is a system notification event type.
 * @param eventType The notification event type to check
 * @returns True if the notification event type is a system notification event type
 */
export function isSystemNotificationEventType(eventType: INotificationEventType): eventType is ISystemNotificationEventType {
  return eventType.journey === 'system';
}

/**
 * Type guard to check if a string is a valid health notification event type ID.
 * @param type The string to check
 * @returns True if the string is a valid health notification event type ID
 */
export function isHealthNotificationTypeId(type: string): type is HealthNotificationType {
  return Object.values(HealthNotificationType).includes(type as HealthNotificationType);
}

/**
 * Type guard to check if a string is a valid care notification event type ID.
 * @param type The string to check
 * @returns True if the string is a valid care notification event type ID
 */
export function isCareNotificationTypeId(type: string): type is CareNotificationType {
  return Object.values(CareNotificationType).includes(type as CareNotificationType);
}

/**
 * Type guard to check if a string is a valid plan notification event type ID.
 * @param type The string to check
 * @returns True if the string is a valid plan notification event type ID
 */
export function isPlanNotificationTypeId(type: string): type is PlanNotificationType {
  return Object.values(PlanNotificationType).includes(type as PlanNotificationType);
}

/**
 * Type guard to check if a string is a valid system notification event type ID.
 * @param type The string to check
 * @returns True if the string is a valid system notification event type ID
 */
export function isSystemNotificationTypeId(type: string): type is SystemNotificationType {
  return Object.values(SystemNotificationType).includes(type as SystemNotificationType);
}

/**
 * Type guard to check if a string is a valid delivery status notification event type ID.
 * @param type The string to check
 * @returns True if the string is a valid delivery status notification event type ID
 */
export function isDeliveryStatusNotificationTypeId(type: string): type is DeliveryStatusNotificationType {
  return Object.values(DeliveryStatusNotificationType).includes(type as DeliveryStatusNotificationType);
}

/**
 * Type guard to check if a string is a valid notification event type ID.
 * @param type The string to check
 * @returns True if the string is a valid notification event type ID
 */
export function isNotificationTypeId(type: string): type is NotificationTypeId {
  return (
    isHealthNotificationTypeId(type) ||
    isCareNotificationTypeId(type) ||
    isPlanNotificationTypeId(type) ||
    isSystemNotificationTypeId(type) ||
    isDeliveryStatusNotificationTypeId(type)
  );
}

/**
 * Maps a journey name to its corresponding notification event type enum.
 * @param journey The journey name
 * @returns The notification event type enum for the journey
 */
export function getNotificationTypeEnumForJourney(
  journey: string
): typeof HealthNotificationType | typeof CareNotificationType | typeof PlanNotificationType | typeof SystemNotificationType {
  switch (journey) {
    case 'health':
      return HealthNotificationType;
    case 'care':
      return CareNotificationType;
    case 'plan':
      return PlanNotificationType;
    case 'system':
    default:
      return SystemNotificationType;
  }
}

/**
 * Gets the journey for a notification event type ID.
 * @param notificationTypeId The notification event type ID
 * @returns The journey for the notification event type ID
 */
export function getJourneyForNotificationTypeId(notificationTypeId: NotificationTypeId): 'health' | 'care' | 'plan' | 'system' {
  if (isHealthNotificationTypeId(notificationTypeId)) {
    return 'health';
  } else if (isCareNotificationTypeId(notificationTypeId)) {
    return 'care';
  } else if (isPlanNotificationTypeId(notificationTypeId)) {
    return 'plan';
  } else if (isDeliveryStatusNotificationTypeId(notificationTypeId)) {
    return 'system'; // Delivery status notifications are considered system notifications
  } else {
    return 'system';
  }
}

/**
 * Interface for health goal achieved notification payload.
 * This is used with the HEALTH_GOAL_ACHIEVED notification type.
 */
export interface IHealthGoalAchievedPayload {
  /** The ID of the goal that was achieved */
  goalId: string;
  /** The goal that was achieved */
  goal: IHealthGoal;
  /** The timestamp when the goal was achieved */
  achievedAt: string | Date;
  /** Optional congratulatory message */
  message?: string;
  /** Optional achievement points earned */
  points?: number;
}

/**
 * Interface for appointment reminder notification payload.
 * This is used with the APPOINTMENT_REMINDER notification type.
 */
export interface IAppointmentReminderPayload {
  /** The ID of the appointment */
  appointmentId: string;
  /** The type of appointment */
  appointmentType: AppointmentType;
  /** The ID of the provider for the appointment */
  providerId: string;
  /** The provider name */
  providerName: string;
  /** The scheduled date and time for the appointment */
  scheduledAt: string | Date;
  /** The location of the appointment (physical address or virtual) */
  location: string;
  /** Optional preparation instructions */
  instructions?: string;
  /** Optional contact information for questions */
  contactInfo?: string;
}

/**
 * Interface for claim status updated notification payload.
 * This is used with the CLAIM_STATUS_UPDATED notification type.
 */
export interface IClaimStatusUpdatedPayload {
  /** The ID of the claim */
  claimId: string;
  /** The previous status of the claim */
  previousStatus: ClaimStatus;
  /** The new status of the claim */
  newStatus: ClaimStatus;
  /** The timestamp when the status was updated */
  updatedAt: string | Date;
  /** Optional details about the status change */
  details?: string;
  /** Optional next steps for the user */
  nextSteps?: string;
}

/**
 * Interface for achievement unlocked notification payload.
 * This is used with the ACHIEVEMENT_UNLOCKED notification type.
 */
export interface IAchievementUnlockedPayload {
  /** The ID of the achievement */
  achievementId: string;
  /** The name of the achievement */
  achievementName: string;
  /** The description of the achievement */
  description: string;
  /** The timestamp when the achievement was unlocked */
  unlockedAt: string | Date;
  /** The badge image URL for the achievement */
  badgeUrl: string;
  /** The points earned for the achievement */
  points: number;
  /** Optional congratulatory message */
  message?: string;
  /** Optional reward information */
  reward?: {
    rewardId: string;
    rewardName: string;
    rewardDescription: string;
  };
}

/**
 * Interface for notification delivery status payload.
 * This is used with the delivery status notification types.
 */
export interface IDeliveryStatusPayload {
  /** The ID of the original notification */
  notificationId: string;
  /** The channel through which the notification was delivered */
  channel: NotificationChannel;
  /** The timestamp of the status update */
  timestamp: string | Date;
  /** Optional error information if delivery failed */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  /** Optional metadata specific to the delivery channel */
  channelMetadata?: Record<string, any>;
}

/**
 * Interface for a registry of notification event types.
 * This can be used to store and retrieve notification event type definitions.
 */
export interface INotificationEventTypeRegistry {
  /**
   * Gets a notification event type by its ID.
   * @param id The notification event type ID
   * @returns The notification event type, or undefined if not found
   */
  getNotificationEventType(id: NotificationTypeId): NotificationEventType | undefined;
  
  /**
   * Gets all notification event types for a journey.
   * @param journey The journey
   * @returns An array of notification event types for the journey
   */
  getNotificationEventTypesForJourney(journey: 'health' | 'care' | 'plan' | 'system'): NotificationEventType[];
  
  /**
   * Gets all notification event types.
   * @returns An array of all notification event types
   */
  getAllNotificationEventTypes(): NotificationEventType[];
  
  /**
   * Registers a notification event type.
   * @param eventType The notification event type to register
   */
  registerNotificationEventType(eventType: NotificationEventType): void;
  
  /**
   * Gets a notification event type by its ID and version.
   * @param id The notification event type ID
   * @param version The notification event type version
   * @returns The notification event type, or undefined if not found
   */
  getNotificationEventTypeVersion(id: NotificationTypeId, version: string): NotificationEventType | undefined;
}

/**
 * Semantic version interface for notification event types.
 * This is used to track and manage notification event type versions.
 */
export interface INotificationEventTypeVersion {
  /** Major version number (incremented for breaking changes) */
  major: number;
  /** Minor version number (incremented for backward-compatible additions) */
  minor: number;
  /** Patch version number (incremented for backward-compatible fixes) */
  patch: number;
  /** Full version string in semver format (e.g., "1.2.3") */
  toString(): string;
}

/**
 * Creates a new notification event type version object.
 * @param versionString The version string in semver format (e.g., "1.2.3")
 * @returns An INotificationEventTypeVersion object
 */
export function createNotificationEventTypeVersion(versionString: string): INotificationEventTypeVersion {
  const parts = versionString.split('.');
  const major = parseInt(parts[0] || '0', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '0', 10);
  
  return {
    major,
    minor,
    patch,
    toString: () => `${major}.${minor}.${patch}`
  };
}

/**
 * Compares two notification event type versions.
 * @param a The first version
 * @param b The second version
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareNotificationEventTypeVersions(
  a: INotificationEventTypeVersion, 
  b: INotificationEventTypeVersion
): -1 | 0 | 1 {
  if (a.major < b.major) return -1;
  if (a.major > b.major) return 1;
  if (a.minor < b.minor) return -1;
  if (a.minor > b.minor) return 1;
  if (a.patch < b.patch) return -1;
  if (a.patch > b.patch) return 1;
  return 0;
}

/**
 * Checks if a notification event type version is compatible with a required version.
 * @param actual The actual version
 * @param required The required version
 * @returns True if the actual version is compatible with the required version
 */
export function isCompatibleNotificationEventTypeVersion(
  actual: INotificationEventTypeVersion, 
  required: INotificationEventTypeVersion
): boolean {
  // Major version must match exactly for compatibility
  if (actual.major !== required.major) return false;
  
  // Actual minor version must be greater than or equal to required
  if (actual.minor < required.minor) return false;
  
  // If minor versions match, actual patch must be greater than or equal to required
  if (actual.minor === required.minor && actual.patch < required.patch) return false;
  
  return true;
}