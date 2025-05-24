/**
 * @file Notification Interfaces Barrel Export
 * 
 * This file serves as a centralized export point for all notification-related
 * TypeScript interfaces in the AUSTA SuperApp. It enables developers to import
 * all notification types, data structures, templates, and preferences through
 * a single import statement, ensuring consistent usage patterns across the
 * application while maintaining proper module organization.
 *
 * @module @austa/interfaces/notification
 */

/**
 * Core Notification Types
 * 
 * Basic notification type definitions including enums for notification types,
 * channels, statuses, priorities, and the base Notification interface.
 */
export type {
  Notification,
} from './types';

export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
} from './types';

/**
 * Notification Data Types
 * 
 * Journey-specific notification data interfaces that define the payload structure
 * for different notification types across health, care, and plan journeys.
 */
export type {
  AchievementNotificationData,
  LevelUpNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData,
} from './data';

/**
 * Notification Template Types
 * 
 * Interfaces for the notification templating system that enable consistent
 * notification formatting and localization across all journeys.
 */
export type {
  NotificationTemplate,
} from './templates';

/**
 * Notification Preference Types
 * 
 * Interfaces for user notification preferences, including global settings
 * and per-journey customization of notification channels.
 */
export type {
  NotificationPreference,
  JourneyNotificationPreference,
} from './preferences';

/**
 * Notification Request/Response Types
 * 
 * Interfaces for notification API requests, responses, and filtering.
 */
export type {
  SendNotificationRequest,
  NotificationFilter,
  NotificationCount,
} from './types';