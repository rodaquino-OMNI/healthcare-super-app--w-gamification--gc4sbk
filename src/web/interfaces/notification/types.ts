/**
 * Core notification type system for the AUSTA SuperApp
 * 
 * This file defines the fundamental types, enums, and interfaces for the notification system
 * used across both web and mobile platforms. It provides type safety for notification creation,
 * delivery, display, and management throughout the application.
 */

/**
 * Defines the types of notifications that can be sent in the AUSTA SuperApp
 * Used for categorizing notifications and determining their visual presentation
 */
export enum NotificationType {
  /** System-level notifications about the app itself */
  SYSTEM = 'system',
  
  /** Notifications related to user achievements in the gamification system */
  ACHIEVEMENT = 'achievement',
  
  /** Notifications about level progression in the gamification system */
  LEVEL_UP = 'level_up',
  
  /** Reminders about upcoming appointments in the Care journey */
  APPOINTMENT = 'appointment',
  
  /** Notifications about medication schedules in the Care journey */
  MEDICATION = 'medication',
  
  /** Updates about health goals in the Health journey */
  HEALTH_GOAL = 'health_goal',
  
  /** Notifications about health metrics in the Health journey */
  HEALTH_METRIC = 'health_metric',
  
  /** Updates about insurance claims in the Plan journey */
  CLAIM_STATUS = 'claim_status',
  
  /** Notifications about benefit usage in the Plan journey */
  BENEFIT_UPDATE = 'benefit_update',
  
  /** Notifications about new features or updates to the app */
  FEATURE_UPDATE = 'feature_update',
}

/**
 * Defines the channels through which notifications can be delivered
 * Each channel represents a different delivery mechanism with its own capabilities and constraints
 */
export enum NotificationChannel {
  /** Notifications displayed within the app's notification center */
  IN_APP = 'in-app',
  
  /** Push notifications delivered to the user's device */
  PUSH = 'push',
  
  /** Notifications sent via email */
  EMAIL = 'email',
  
  /** Notifications sent via SMS text message */
  SMS = 'sms',
}

/**
 * Defines the possible states of a notification in its lifecycle
 * Used to track delivery and user interaction with notifications
 */
export enum NotificationStatus {
  /** Notification has been created but not yet sent */
  PENDING = 'pending',
  
  /** Notification has been sent to the delivery channel */
  SENT = 'sent',
  
  /** Notification has been successfully delivered to the user */
  DELIVERED = 'delivered',
  
  /** User has viewed or opened the notification */
  READ = 'read',
  
  /** Notification failed to be delivered */
  FAILED = 'failed',
}

/**
 * Defines the priority levels for notifications
 * Used to determine notification prominence, delivery urgency, and user interruption level
 */
export enum NotificationPriority {
  /** Informational notifications with minimal urgency */
  LOW = 'low',
  
  /** Standard notifications with moderate urgency */
  MEDIUM = 'medium',
  
  /** Important notifications that should be prominently displayed */
  HIGH = 'high',
  
  /** Urgent notifications that require immediate attention */
  CRITICAL = 'critical',
}

/**
 * Core notification interface representing a notification in the AUSTA SuperApp
 * Used as the foundation for all notification-related data structures
 */
export interface Notification {
  /** Unique identifier for the notification */
  readonly id: string;
  
  /** ID of the user who received this notification */
  readonly userId: string;
  
  /** Type of notification, determining its category and presentation */
  readonly type: NotificationType;
  
  /** Title/headline of the notification */
  readonly title: string;
  
  /** Main content of the notification */
  readonly body: string;
  
  /** Channel through which the notification was delivered */
  readonly channel: NotificationChannel;
  
  /** Current status of the notification */
  status: NotificationStatus;
  
  /** Priority level of the notification */
  readonly priority: NotificationPriority;
  
  /** Additional structured data specific to the notification type */
  readonly data?: Record<string, unknown>;
  
  /** Timestamp when the notification was created */
  readonly createdAt: Date;
  
  /** Timestamp when the notification was last updated */
  readonly updatedAt: Date;
}

/**
 * Type guard to check if a string is a valid NotificationType
 * @param value - The string value to check
 * @returns True if the value is a valid NotificationType
 */
export function isNotificationType(value: string): value is NotificationType {
  return Object.values(NotificationType).includes(value as NotificationType);
}

/**
 * Type guard to check if a string is a valid NotificationChannel
 * @param value - The string value to check
 * @returns True if the value is a valid NotificationChannel
 */
export function isNotificationChannel(value: string): value is NotificationChannel {
  return Object.values(NotificationChannel).includes(value as NotificationChannel);
}

/**
 * Type guard to check if a string is a valid NotificationStatus
 * @param value - The string value to check
 * @returns True if the value is a valid NotificationStatus
 */
export function isNotificationStatus(value: string): value is NotificationStatus {
  return Object.values(NotificationStatus).includes(value as NotificationStatus);
}

/**
 * Type guard to check if a string is a valid NotificationPriority
 * @param value - The string value to check
 * @returns True if the value is a valid NotificationPriority
 */
export function isNotificationPriority(value: string): value is NotificationPriority {
  return Object.values(NotificationPriority).includes(value as NotificationPriority);
}

/**
 * Type narrowing function to get a notification by type
 * @param notification - The notification to narrow
 * @param type - The specific notification type to check for
 * @returns The notification with a narrowed type if it matches, or null if it doesn't
 */
export function getNotificationByType<T extends NotificationType>(
  notification: Notification,
  type: T
): (Notification & { type: T }) | null {
  return notification.type === type
    ? notification as Notification & { type: T }
    : null;
}

/**
 * Creates a notification object with default values for optional properties
 * @param notification - Partial notification object with required properties
 * @returns A complete notification object with default values for missing properties
 */
export function createNotification(notification: Omit<Notification, 'status' | 'createdAt' | 'updatedAt'> & 
  Partial<Pick<Notification, 'status' | 'createdAt' | 'updatedAt'>>): Notification {
  const now = new Date();
  
  return {
    ...notification,
    status: notification.status ?? NotificationStatus.PENDING,
    createdAt: notification.createdAt ?? now,
    updatedAt: notification.updatedAt ?? now,
  };
}

/**
 * Determines if a notification should be delivered through a specific channel
 * based on its priority and type
 * 
 * @param notification - The notification to check
 * @param channel - The delivery channel to evaluate
 * @returns True if the notification should be delivered through the specified channel
 */
export function shouldDeliverThroughChannel(
  notification: Notification,
  channel: NotificationChannel
): boolean {
  // Critical notifications should be delivered through all channels
  if (notification.priority === NotificationPriority.CRITICAL) {
    return true;
  }
  
  // High priority notifications should be delivered through in-app and push
  if (notification.priority === NotificationPriority.HIGH) {
    return channel === NotificationChannel.IN_APP || 
           channel === NotificationChannel.PUSH;
  }
  
  // Medium priority notifications should be delivered through in-app
  if (notification.priority === NotificationPriority.MEDIUM) {
    return channel === NotificationChannel.IN_APP;
  }
  
  // Low priority notifications should only be delivered through in-app
  return channel === NotificationChannel.IN_APP;
}