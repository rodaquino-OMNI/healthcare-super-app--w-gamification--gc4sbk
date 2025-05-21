/**
 * @file Notification Service Interfaces
 * 
 * This barrel file exports all interfaces from the notification service interfaces directory,
 * providing a centralized point of access for notification-related type definitions.
 * 
 * It also re-exports relevant interfaces from @austa/interfaces to ensure consistency
 * between the notification service and other components of the AUSTA SuperApp.
 */

// Import from local interface files
export * from './common.interface';
export * from './notification-payload.interface';
export * from './notification-channel.interface';
export * from './delivery-tracking.interface';
export * from './notification-preferences.interface';

// Re-export from @austa/interfaces package
import {
  // Core notification types
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  Notification,
  
  // Notification data structures
  AchievementNotificationData,
  LevelUpNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData,
  
  // Template interfaces
  NotificationTemplate,
  
  // Preference interfaces
  NotificationPreference,
  JourneyNotificationPreference
} from '@austa/interfaces/notification';

// Re-export all imported interfaces
export {
  // Core notification types
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  Notification,
  
  // Notification data structures
  AchievementNotificationData,
  LevelUpNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData,
  
  // Template interfaces
  NotificationTemplate,
  
  // Preference interfaces
  NotificationPreference,
  JourneyNotificationPreference
};