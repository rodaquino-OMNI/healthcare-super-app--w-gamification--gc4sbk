/**
 * @austa/interfaces/notification
 * 
 * This barrel file re-exports all notification-related TypeScript interfaces
 * from the notification module, providing a centralized import point for the
 * AUSTA SuperApp. It enables developers to import all notification types,
 * data structures, templates, and preferences through a single import statement,
 * ensuring consistent usage patterns across the application while maintaining
 * proper module organization.
 *
 * @example
 * // Import all notification interfaces
 * import * as NotificationInterfaces from '@austa/interfaces/notification';
 * 
 * // Import specific notification interfaces
 * import { 
 *   NotificationType, 
 *   Notification,
 *   NotificationPreference 
 * } from '@austa/interfaces/notification';
 */

/**
 * Core Notification Types
 * 
 * Basic notification type definitions including enums for notification types,
 * channels, statuses, priorities, and the base Notification interface.
 */
export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  Notification,
  NotificationFilter,
  NotificationCount
} from './types';

/**
 * Notification Data Types
 * 
 * Journey-specific notification data interfaces that define the payload
 * structure for different notification types across health, care, and plan journeys.
 */
export {
  AchievementNotificationData,
  LevelUpNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData
} from './data';

/**
 * Notification Template Types
 * 
 * Interfaces for the notification templating system that enable consistent
 * notification formatting and localization across all journeys.
 */
export {
  NotificationTemplate
} from './templates';

/**
 * Notification Preference Types
 * 
 * Interfaces for user notification preferences, including global settings
 * and per-journey customization of notification channels.
 */
export {
  NotificationPreference,
  JourneyNotificationPreference
} from './preferences';

/**
 * Notification Request Types
 * 
 * Interfaces for sending notifications and interacting with the notification service.
 */
export {
  SendNotificationRequest
} from './types';