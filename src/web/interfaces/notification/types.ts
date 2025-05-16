/**
 * Notification Types for AUSTA SuperApp
 * 
 * This module defines the core notification type system for the AUSTA SuperApp with
 * strongly-typed enums and interfaces. These types provide type safety for notification
 * creation, delivery, display, and management across both web and mobile platforms.
 * 
 * @packageDocumentation
 */

/**
 * Defines the different types of notifications that can be sent in the system.
 * Used for categorizing and routing notifications appropriately.
 */
export enum NotificationType {
  /** System-level notifications about the app itself */
  SYSTEM = 'system',
  
  /** Notifications related to user achievements in the gamification system */
  ACHIEVEMENT = 'achievement',
  
  /** Notifications about level progression in the gamification system */
  LEVEL_UP = 'level_up',
  
  /** Appointment reminders from the Care journey */
  APPOINTMENT = 'appointment',
  
  /** Medication reminders from the Care journey */
  MEDICATION = 'medication',
  
  /** Health goal updates from the Health journey */
  HEALTH_GOAL = 'health_goal',
  
  /** Health metric alerts from the Health journey */
  HEALTH_METRIC = 'health_metric',
  
  /** Insurance claim status updates from the Plan journey */
  CLAIM_STATUS = 'claim_status',
  
  /** Benefit usage reminders from the Plan journey */
  BENEFIT_REMINDER = 'benefit_reminder',
}

/**
 * Defines the available channels through which notifications can be delivered.
 * Each channel has different capabilities and constraints.
 */
export enum NotificationChannel {
  /** Notifications displayed within the app's notification center */
  IN_APP = 'in-app',
  
  /** Push notifications delivered to the user's device */
  PUSH = 'push',
  
  /** Notifications delivered via email */
  EMAIL = 'email',
  
  /** Notifications delivered via SMS text message */
  SMS = 'sms',
}

/**
 * Defines the possible states of a notification in its lifecycle.
 */
export enum NotificationStatus {
  /** Notification has been created but not yet dispatched */
  PENDING = 'pending',
  
  /** Notification has been sent to the delivery channel */
  SENT = 'sent',
  
  /** Confirmation received that notification was delivered */
  DELIVERED = 'delivered',
  
  /** User has viewed or interacted with the notification */
  READ = 'read',
  
  /** Notification delivery failed */
  FAILED = 'failed',
}

/**
 * Defines priority levels for notifications to determine delivery urgency.
 */
export enum NotificationPriority {
  /** Informational notifications with no urgency */
  LOW = 'low',
  
  /** Standard notifications with normal delivery timing */
  MEDIUM = 'medium',
  
  /** Important notifications that should be delivered promptly */
  HIGH = 'high',
  
  /** Urgent notifications requiring immediate attention */
  CRITICAL = 'critical',
}

/**
 * Base interface for all notification data payloads.
 * Specific notification types extend this with their own data structures.
 */
export interface NotificationData {
  /** Unique identifier for the notification data */
  readonly id: string;
  
  /** Timestamp when the notification data was created */
  readonly createdAt: string;
}

/**
 * Data specific to achievement notifications.
 */
export interface AchievementNotificationData extends NotificationData {
  /** Unique identifier of the achievement */
  readonly achievementId: string;
  
  /** Name of the achievement */
  readonly achievementName: string;
  
  /** Description of the achievement */
  readonly achievementDescription: string;
  
  /** URL to the achievement badge image */
  readonly badgeImageUrl: string;
  
  /** XP points awarded for this achievement */
  readonly xpAwarded: number;
}

/**
 * Data specific to level up notifications.
 */
export interface LevelUpNotificationData extends NotificationData {
  /** New level the user has reached */
  readonly newLevel: number;
  
  /** Previous level the user was at */
  readonly previousLevel: number;
  
  /** URL to the level badge image */
  readonly levelBadgeUrl: string;
  
  /** New rewards unlocked at this level */
  readonly unlockedRewards: Array<{
    readonly id: string;
    readonly name: string;
    readonly description: string;
  }>;
}

/**
 * Data specific to appointment reminder notifications.
 */
export interface AppointmentReminderData extends NotificationData {
  /** Unique identifier of the appointment */
  readonly appointmentId: string;
  
  /** Type of appointment (e.g., 'checkup', 'specialist', 'telemedicine') */
  readonly appointmentType: string;
  
  /** Name of the healthcare provider */
  readonly providerName: string;
  
  /** Scheduled date and time of the appointment in ISO format */
  readonly scheduledAt: string;
  
  /** Location of the appointment (physical address or 'virtual') */
  readonly location: string;
  
  /** Deep link to view appointment details in the app */
  readonly deepLink: string;
}

/**
 * Data specific to claim status update notifications.
 */
export interface ClaimStatusUpdateData extends NotificationData {
  /** Unique identifier of the claim */
  readonly claimId: string;
  
  /** Type of claim (e.g., 'medical', 'dental', 'vision') */
  readonly claimType: string;
  
  /** Previous status of the claim */
  readonly previousStatus: string;
  
  /** New status of the claim */
  readonly newStatus: string;
  
  /** Amount approved for the claim (if applicable) */
  readonly approvedAmount?: number;
  
  /** Deep link to view claim details in the app */
  readonly deepLink: string;
}

/**
 * Union type of all possible notification data types.
 * This enables type narrowing based on notification type.
 */
export type NotificationDataUnion =
  | AchievementNotificationData
  | LevelUpNotificationData
  | AppointmentReminderData
  | ClaimStatusUpdateData
  | NotificationData;

/**
 * Core notification interface representing a notification in the system.
 */
export interface Notification {
  /** Unique identifier for the notification */
  readonly id: string;
  
  /** ID of the user who will receive this notification */
  readonly userId: string;
  
  /** Type of notification */
  readonly type: NotificationType;
  
  /** Notification title/headline */
  readonly title: string;
  
  /** Notification body content */
  readonly body: string;
  
  /** Delivery channel for the notification */
  readonly channel: NotificationChannel;
  
  /** Current status of the notification */
  readonly status: NotificationStatus;
  
  /** Priority level of the notification */
  readonly priority: NotificationPriority;
  
  /** Structured data specific to the notification type */
  readonly data?: NotificationDataUnion;
  
  /** Timestamp when the notification was created */
  readonly createdAt: string;
  
  /** Timestamp when the notification was last updated */
  readonly updatedAt: string;
  
  /** Timestamp when the notification was read (if applicable) */
  readonly readAt?: string;
}

/**
 * Interface for notification preferences that determine how users receive notifications.
 */
export interface NotificationPreference {
  /** Unique identifier for the preference */
  readonly id: string;
  
  /** ID of the user these preferences belong to */
  readonly userId: string;
  
  /** Whether all notifications are enabled */
  readonly enabled: boolean;
  
  /** Enabled notification channels */
  readonly enabledChannels: ReadonlyArray<NotificationChannel>;
  
  /** Journey-specific notification preferences */
  readonly journeyPreferences: JourneyNotificationPreference;
}

/**
 * Interface for journey-specific notification preferences.
 */
export interface JourneyNotificationPreference {
  /** Health journey notification preferences */
  readonly health: {
    readonly enabled: boolean;
    readonly enabledTypes: ReadonlyArray<NotificationType>;
  };
  
  /** Care journey notification preferences */
  readonly care: {
    readonly enabled: boolean;
    readonly enabledTypes: ReadonlyArray<NotificationType>;
  };
  
  /** Plan journey notification preferences */
  readonly plan: {
    readonly enabled: boolean;
    readonly enabledTypes: ReadonlyArray<NotificationType>;
  };
  
  /** Gamification notification preferences */
  readonly gamification: {
    readonly enabled: boolean;
    readonly enabledTypes: ReadonlyArray<NotificationType>;
  };
}

/**
 * Interface for sending a notification request.
 */
export interface SendNotificationRequest {
  /** ID of the user to receive the notification */
  readonly userId: string;
  
  /** Type of notification */
  readonly type: NotificationType;
  
  /** Notification title/headline */
  readonly title: string;
  
  /** Notification body content */
  readonly body: string;
  
  /** Priority level of the notification */
  readonly priority?: NotificationPriority;
  
  /** Preferred delivery channels (respects user preferences) */
  readonly preferredChannels?: ReadonlyArray<NotificationChannel>;
  
  /** Structured data specific to the notification type */
  readonly data?: NotificationDataUnion;
  
  /** ID of the notification template to use (if applicable) */
  readonly templateId?: string;
  
  /** Language code for the notification content */
  readonly language?: string;
}

/**
 * Interface for notification templates used for consistent messaging.
 */
export interface NotificationTemplate {
  /** Unique identifier for the template */
  readonly id: string;
  
  /** Type of notification this template is for */
  readonly type: NotificationType;
  
  /** Template name for administrative purposes */
  readonly name: string;
  
  /** Template title with variable placeholders */
  readonly titleTemplate: string;
  
  /** Template body with variable placeholders */
  readonly bodyTemplate: string;
  
  /** Available languages for this template */
  readonly availableLanguages: ReadonlyArray<string>;
  
  /** Default language if requested language is not available */
  readonly defaultLanguage: string;
}

/**
 * Interface for filtering notifications in queries.
 */
export interface NotificationFilter {
  /** Filter by notification types */
  readonly types?: ReadonlyArray<NotificationType>;
  
  /** Filter by notification status */
  readonly status?: NotificationStatus;
  
  /** Filter by notification channel */
  readonly channel?: NotificationChannel;
  
  /** Filter by read/unread status */
  readonly read?: boolean;
  
  /** Filter by date range (start) */
  readonly startDate?: string;
  
  /** Filter by date range (end) */
  readonly endDate?: string;
}

/**
 * Interface for notification counts by status.
 */
export interface NotificationCount {
  /** Total number of notifications */
  readonly total: number;
  
  /** Number of unread notifications */
  readonly unread: number;
  
  /** Counts by notification type */
  readonly byType: {
    readonly [key in NotificationType]?: number;
  };
}

/**
 * Type guard to check if a notification is an achievement notification.
 * @param notification The notification to check
 * @returns True if the notification is an achievement notification
 */
export function isAchievementNotification(
  notification: Notification
): notification is Notification & { data: AchievementNotificationData } {
  return (
    notification.type === NotificationType.ACHIEVEMENT &&
    notification.data !== undefined &&
    'achievementId' in notification.data
  );
}

/**
 * Type guard to check if a notification is a level up notification.
 * @param notification The notification to check
 * @returns True if the notification is a level up notification
 */
export function isLevelUpNotification(
  notification: Notification
): notification is Notification & { data: LevelUpNotificationData } {
  return (
    notification.type === NotificationType.LEVEL_UP &&
    notification.data !== undefined &&
    'newLevel' in notification.data
  );
}

/**
 * Type guard to check if a notification is an appointment reminder.
 * @param notification The notification to check
 * @returns True if the notification is an appointment reminder
 */
export function isAppointmentNotification(
  notification: Notification
): notification is Notification & { data: AppointmentReminderData } {
  return (
    notification.type === NotificationType.APPOINTMENT &&
    notification.data !== undefined &&
    'appointmentId' in notification.data
  );
}

/**
 * Type guard to check if a notification is a claim status update.
 * @param notification The notification to check
 * @returns True if the notification is a claim status update
 */
export function isClaimStatusNotification(
  notification: Notification
): notification is Notification & { data: ClaimStatusUpdateData } {
  return (
    notification.type === NotificationType.CLAIM_STATUS &&
    notification.data !== undefined &&
    'claimId' in notification.data
  );
}