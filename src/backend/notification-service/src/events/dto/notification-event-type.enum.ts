/**
 * Comprehensive enumeration of all notification event types used throughout the AUSTA SuperApp.
 * This enum ensures consistency of event type naming across all services and provides
 * TypeScript type safety for notification event processing.
 *
 * Events are categorized by purpose (delivery, status update, preference change) and
 * include journey-specific event types for Health, Care, and Plan journeys.
 */

// Import shared interfaces from @austa/interfaces package
import { NotificationType } from '@austa/interfaces/notification';
import { GamificationEventType } from '@austa/interfaces/gamification/events';

/**
 * Enum defining all notification event types used in the system.
 * This provides a centralized definition to ensure consistency across services.
 */
export enum NotificationEventType {
  // ===== Delivery Events =====
  // Events related to sending notifications
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_REQUESTED = 'notification.requested',
  NOTIFICATION_SCHEDULED = 'notification.scheduled',
  NOTIFICATION_BATCH_REQUESTED = 'notification.batch.requested',
  
  // ===== Status Update Events =====
  // Events related to notification delivery status
  NOTIFICATION_SENT = 'notification.sent',
  NOTIFICATION_DELIVERED = 'notification.delivered',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_FAILED = 'notification.failed',
  NOTIFICATION_RETRY = 'notification.retry',
  NOTIFICATION_CANCELLED = 'notification.cancelled',
  
  // ===== Preference Change Events =====
  // Events related to user notification preferences
  PREFERENCES_UPDATED = 'notification.preferences.updated',
  CHANNEL_ENABLED = 'notification.channel.enabled',
  CHANNEL_DISABLED = 'notification.channel.disabled',
  JOURNEY_PREFERENCES_UPDATED = 'notification.journey.preferences.updated',
  
  // ===== Health Journey Events =====
  // Events specific to the Health journey
  HEALTH_GOAL_ACHIEVED = 'health.goal.achieved',
  HEALTH_METRIC_RECORDED = 'health.metric.recorded',
  HEALTH_INSIGHT_GENERATED = 'health.insight.generated',
  HEALTH_DEVICE_CONNECTED = 'health.device.connected',
  HEALTH_REMINDER = 'health.reminder',
  
  // ===== Care Journey Events =====
  // Events specific to the Care journey
  APPOINTMENT_CREATED = 'care.appointment.created',
  APPOINTMENT_REMINDER = 'care.appointment.reminder',
  APPOINTMENT_UPDATED = 'care.appointment.updated',
  APPOINTMENT_CANCELLED = 'care.appointment.cancelled',
  MEDICATION_REMINDER = 'care.medication.reminder',
  MEDICATION_ADHERENCE = 'care.medication.adherence',
  TELEMEDICINE_SESSION_SCHEDULED = 'care.telemedicine.scheduled',
  TELEMEDICINE_SESSION_STARTED = 'care.telemedicine.started',
  TELEMEDICINE_SESSION_ENDED = 'care.telemedicine.ended',
  CARE_PLAN_PROGRESS = 'care.plan.progress',
  
  // ===== Plan Journey Events =====
  // Events specific to the Plan journey
  CLAIM_SUBMITTED = 'plan.claim.submitted',
  CLAIM_UPDATED = 'plan.claim.updated',
  CLAIM_APPROVED = 'plan.claim.approved',
  CLAIM_REJECTED = 'plan.claim.rejected',
  BENEFIT_ACTIVATED = 'plan.benefit.activated',
  BENEFIT_EXPIRING = 'plan.benefit.expiring',
  PLAN_SELECTED = 'plan.selected',
  PLAN_RENEWED = 'plan.renewed',
  
  // ===== Gamification Events =====
  // Events related to gamification that trigger notifications
  ACHIEVEMENT_UNLOCKED = 'gamification.achievement.unlocked',
  QUEST_COMPLETED = 'gamification.quest.completed',
  LEVEL_UP = 'gamification.level.up',
  REWARD_EARNED = 'gamification.reward.earned',
  REWARD_EXPIRING = 'gamification.reward.expiring',
  LEADERBOARD_POSITION_CHANGED = 'gamification.leaderboard.position.changed',
  STREAK_MILESTONE = 'gamification.streak.milestone',
  
  // ===== System Events =====
  // Events related to system operations
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_ALERT = 'system.alert',
  VERSION_UPDATE = 'system.version.update',
  SECURITY_ALERT = 'system.security.alert'
}

/**
 * Type guard to check if a string is a valid NotificationEventType
 * @param value - The string value to check
 * @returns True if the value is a valid NotificationEventType
 */
export const isNotificationEventType = (value: string): value is NotificationEventType => {
  return Object.values(NotificationEventType).includes(value as NotificationEventType);
};

/**
 * Maps NotificationType from @austa/interfaces to NotificationEventType
 * This ensures consistency between the shared interfaces and the notification service
 * @param type - The NotificationType from @austa/interfaces
 * @returns The corresponding NotificationEventType
 */
export const mapNotificationTypeToEventType = (type: NotificationType): NotificationEventType => {
  switch (type) {
    case NotificationType.ACHIEVEMENT:
      return NotificationEventType.ACHIEVEMENT_UNLOCKED;
    case NotificationType.APPOINTMENT:
      return NotificationEventType.APPOINTMENT_REMINDER;
    case NotificationType.MEDICATION:
      return NotificationEventType.MEDICATION_REMINDER;
    case NotificationType.HEALTH_GOAL:
      return NotificationEventType.HEALTH_GOAL_ACHIEVED;
    case NotificationType.CLAIM_STATUS:
      return NotificationEventType.CLAIM_UPDATED;
    case NotificationType.SYSTEM:
      return NotificationEventType.SYSTEM_ALERT;
    case NotificationType.REWARD:
      return NotificationEventType.REWARD_EARNED;
    default:
      return NotificationEventType.NOTIFICATION_REQUESTED;
  }
};

/**
 * Maps GamificationEventType from @austa/interfaces to NotificationEventType
 * This ensures consistency between gamification events and notification events
 * @param type - The GamificationEventType from @austa/interfaces
 * @returns The corresponding NotificationEventType
 */
export const mapGamificationEventToNotificationEvent = (type: GamificationEventType): NotificationEventType | null => {
  switch (type) {
    case GamificationEventType.ACHIEVEMENT_UNLOCKED:
      return NotificationEventType.ACHIEVEMENT_UNLOCKED;
    case GamificationEventType.QUEST_COMPLETED:
      return NotificationEventType.QUEST_COMPLETED;
    case GamificationEventType.LEVEL_UP:
      return NotificationEventType.LEVEL_UP;
    case GamificationEventType.REWARD_EARNED:
      return NotificationEventType.REWARD_EARNED;
    case GamificationEventType.STREAK_MILESTONE:
      return NotificationEventType.STREAK_MILESTONE;
    default:
      return null; // Not all gamification events trigger notifications
  }
};

/**
 * Groups notification event types by journey context
 * This helps with filtering and routing notifications based on journey
 */
export const JOURNEY_EVENT_TYPES = {
  HEALTH: [
    NotificationEventType.HEALTH_GOAL_ACHIEVED,
    NotificationEventType.HEALTH_METRIC_RECORDED,
    NotificationEventType.HEALTH_INSIGHT_GENERATED,
    NotificationEventType.HEALTH_DEVICE_CONNECTED,
    NotificationEventType.HEALTH_REMINDER,
  ],
  CARE: [
    NotificationEventType.APPOINTMENT_CREATED,
    NotificationEventType.APPOINTMENT_REMINDER,
    NotificationEventType.APPOINTMENT_UPDATED,
    NotificationEventType.APPOINTMENT_CANCELLED,
    NotificationEventType.MEDICATION_REMINDER,
    NotificationEventType.MEDICATION_ADHERENCE,
    NotificationEventType.TELEMEDICINE_SESSION_SCHEDULED,
    NotificationEventType.TELEMEDICINE_SESSION_STARTED,
    NotificationEventType.TELEMEDICINE_SESSION_ENDED,
    NotificationEventType.CARE_PLAN_PROGRESS,
  ],
  PLAN: [
    NotificationEventType.CLAIM_SUBMITTED,
    NotificationEventType.CLAIM_UPDATED,
    NotificationEventType.CLAIM_APPROVED,
    NotificationEventType.CLAIM_REJECTED,
    NotificationEventType.BENEFIT_ACTIVATED,
    NotificationEventType.BENEFIT_EXPIRING,
    NotificationEventType.PLAN_SELECTED,
    NotificationEventType.PLAN_RENEWED,
  ],
  GAMIFICATION: [
    NotificationEventType.ACHIEVEMENT_UNLOCKED,
    NotificationEventType.QUEST_COMPLETED,
    NotificationEventType.LEVEL_UP,
    NotificationEventType.REWARD_EARNED,
    NotificationEventType.REWARD_EXPIRING,
    NotificationEventType.LEADERBOARD_POSITION_CHANGED,
    NotificationEventType.STREAK_MILESTONE,
  ],
  SYSTEM: [
    NotificationEventType.SYSTEM_MAINTENANCE,
    NotificationEventType.SYSTEM_ALERT,
    NotificationEventType.VERSION_UPDATE,
    NotificationEventType.SECURITY_ALERT,
  ],
} as const;

/**
 * Type representing all journey contexts
 */
export type JourneyContext = keyof typeof JOURNEY_EVENT_TYPES;

/**
 * Determines the journey context for a given notification event type
 * @param eventType - The notification event type
 * @returns The journey context or null if not journey-specific
 */
export const getJourneyContextForEventType = (eventType: NotificationEventType): JourneyContext | null => {
  for (const [journey, events] of Object.entries(JOURNEY_EVENT_TYPES)) {
    if (events.includes(eventType)) {
      return journey as JourneyContext;
    }
  }
  return null;
};

/**
 * Groups notification event types by purpose/category
 * This helps with filtering and processing notifications based on their purpose
 */
export const EVENT_TYPE_CATEGORIES = {
  DELIVERY: [
    NotificationEventType.NOTIFICATION_CREATED,
    NotificationEventType.NOTIFICATION_REQUESTED,
    NotificationEventType.NOTIFICATION_SCHEDULED,
    NotificationEventType.NOTIFICATION_BATCH_REQUESTED,
  ],
  STATUS: [
    NotificationEventType.NOTIFICATION_SENT,
    NotificationEventType.NOTIFICATION_DELIVERED,
    NotificationEventType.NOTIFICATION_READ,
    NotificationEventType.NOTIFICATION_FAILED,
    NotificationEventType.NOTIFICATION_RETRY,
    NotificationEventType.NOTIFICATION_CANCELLED,
  ],
  PREFERENCES: [
    NotificationEventType.PREFERENCES_UPDATED,
    NotificationEventType.CHANNEL_ENABLED,
    NotificationEventType.CHANNEL_DISABLED,
    NotificationEventType.JOURNEY_PREFERENCES_UPDATED,
  ],
} as const;

/**
 * Type representing all event type categories
 */
export type EventTypeCategory = keyof typeof EVENT_TYPE_CATEGORIES;

/**
 * Determines the category for a given notification event type
 * @param eventType - The notification event type
 * @returns The event type category or null if not categorized
 */
export const getCategoryForEventType = (eventType: NotificationEventType): EventTypeCategory | null => {
  for (const [category, events] of Object.entries(EVENT_TYPE_CATEGORIES)) {
    if (events.includes(eventType)) {
      return category as EventTypeCategory;
    }
  }
  return null;
};

/**
 * Checks if a notification event type is related to a specific journey
 * @param eventType - The notification event type to check
 * @param journeyContext - The journey context to check against
 * @returns True if the event type is related to the specified journey
 */
export const isJourneyEvent = (eventType: NotificationEventType, journeyContext: JourneyContext): boolean => {
  return JOURNEY_EVENT_TYPES[journeyContext].includes(eventType);
};

/**
 * Checks if a notification event type is a delivery-related event
 * @param eventType - The notification event type to check
 * @returns True if the event type is related to notification delivery
 */
export const isDeliveryEvent = (eventType: NotificationEventType): boolean => {
  return EVENT_TYPE_CATEGORIES.DELIVERY.includes(eventType);
};

/**
 * Checks if a notification event type is a status-related event
 * @param eventType - The notification event type to check
 * @returns True if the event type is related to notification status
 */
export const isStatusEvent = (eventType: NotificationEventType): boolean => {
  return EVENT_TYPE_CATEGORIES.STATUS.includes(eventType);
};

/**
 * Checks if a notification event type is a preference-related event
 * @param eventType - The notification event type to check
 * @returns True if the event type is related to notification preferences
 */
export const isPreferenceEvent = (eventType: NotificationEventType): boolean => {
  return EVENT_TYPE_CATEGORIES.PREFERENCES.includes(eventType);
};

/**
 * Version information for notification event types
 * This helps track when event types were introduced or deprecated
 * and supports the event versioning strategy
 */
export interface EventTypeVersionInfo {
  /**
   * The version when this event type was introduced
   * Uses semantic versioning (major.minor.patch)
   */
  introducedIn: string;
  
  /**
   * The version when this event type was deprecated, if applicable
   * Uses semantic versioning (major.minor.patch)
   */
  deprecatedIn?: string;
  
  /**
   * The event type that replaces this one, if deprecated
   */
  replacedBy?: NotificationEventType;
  
  /**
   * Whether this event type is still supported
   */
  supported: boolean;
}

/**
 * Version information for all notification event types
 * This helps with backward compatibility and versioning strategy
 */
export const EVENT_TYPE_VERSIONS: Record<NotificationEventType, EventTypeVersionInfo> = {
  // Delivery Events
  [NotificationEventType.NOTIFICATION_CREATED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.NOTIFICATION_REQUESTED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.NOTIFICATION_SCHEDULED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.NOTIFICATION_BATCH_REQUESTED]: { introducedIn: '1.2.0', supported: true },
  
  // Status Update Events
  [NotificationEventType.NOTIFICATION_SENT]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.NOTIFICATION_DELIVERED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.NOTIFICATION_READ]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.NOTIFICATION_FAILED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.NOTIFICATION_RETRY]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.NOTIFICATION_CANCELLED]: { introducedIn: '1.1.0', supported: true },
  
  // Preference Change Events
  [NotificationEventType.PREFERENCES_UPDATED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.CHANNEL_ENABLED]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.CHANNEL_DISABLED]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.JOURNEY_PREFERENCES_UPDATED]: { introducedIn: '1.2.0', supported: true },
  
  // Health Journey Events
  [NotificationEventType.HEALTH_GOAL_ACHIEVED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.HEALTH_METRIC_RECORDED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.HEALTH_INSIGHT_GENERATED]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.HEALTH_DEVICE_CONNECTED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.HEALTH_REMINDER]: { introducedIn: '1.0.0', supported: true },
  
  // Care Journey Events
  [NotificationEventType.APPOINTMENT_CREATED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.APPOINTMENT_REMINDER]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.APPOINTMENT_UPDATED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.APPOINTMENT_CANCELLED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.MEDICATION_REMINDER]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.MEDICATION_ADHERENCE]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.TELEMEDICINE_SESSION_SCHEDULED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.TELEMEDICINE_SESSION_STARTED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.TELEMEDICINE_SESSION_ENDED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.CARE_PLAN_PROGRESS]: { introducedIn: '1.2.0', supported: true },
  
  // Plan Journey Events
  [NotificationEventType.CLAIM_SUBMITTED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.CLAIM_UPDATED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.CLAIM_APPROVED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.CLAIM_REJECTED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.BENEFIT_ACTIVATED]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.BENEFIT_EXPIRING]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.PLAN_SELECTED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.PLAN_RENEWED]: { introducedIn: '1.0.0', supported: true },
  
  // Gamification Events
  [NotificationEventType.ACHIEVEMENT_UNLOCKED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.QUEST_COMPLETED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.LEVEL_UP]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.REWARD_EARNED]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.REWARD_EXPIRING]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.LEADERBOARD_POSITION_CHANGED]: { introducedIn: '1.2.0', supported: true },
  [NotificationEventType.STREAK_MILESTONE]: { introducedIn: '1.2.0', supported: true },
  
  // System Events
  [NotificationEventType.SYSTEM_MAINTENANCE]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.SYSTEM_ALERT]: { introducedIn: '1.0.0', supported: true },
  [NotificationEventType.VERSION_UPDATE]: { introducedIn: '1.1.0', supported: true },
  [NotificationEventType.SECURITY_ALERT]: { introducedIn: '1.1.0', supported: true },
};

/**
 * Checks if a notification event type is supported in a specific version
 * @param eventType - The notification event type to check
 * @param version - The version to check against (defaults to latest)
 * @returns True if the event type is supported in the specified version
 */
export const isEventTypeSupportedInVersion = (
  eventType: NotificationEventType,
  version: string = '1.2.0' // Default to latest version
): boolean => {
  const versionInfo = EVENT_TYPE_VERSIONS[eventType];
  if (!versionInfo) return false;
  
  if (!versionInfo.supported) return false;
  
  // Parse versions into components for comparison
  const [majorIntroduced, minorIntroduced, patchIntroduced] = versionInfo.introducedIn.split('.').map(Number);
  const [majorCurrent, minorCurrent, patchCurrent] = version.split('.').map(Number);
  
  // Check if current version is greater than or equal to introduced version
  if (
    majorCurrent > majorIntroduced ||
    (majorCurrent === majorIntroduced && minorCurrent > minorIntroduced) ||
    (majorCurrent === majorIntroduced && minorCurrent === minorIntroduced && patchCurrent >= patchIntroduced)
  ) {
    // If event is deprecated, check if current version is less than deprecated version
    if (versionInfo.deprecatedIn) {
      const [majorDeprecated, minorDeprecated, patchDeprecated] = versionInfo.deprecatedIn.split('.').map(Number);
      
      return (
        majorCurrent < majorDeprecated ||
        (majorCurrent === majorDeprecated && minorCurrent < minorDeprecated) ||
        (majorCurrent === majorDeprecated && minorCurrent === minorDeprecated && patchCurrent < patchDeprecated)
      );
    }
    
    return true;
  }
  
  return false;
};