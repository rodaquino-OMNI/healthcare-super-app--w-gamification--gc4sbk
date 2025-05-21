/**
 * Enumeration of all notification event types used throughout the AUSTA SuperApp.
 * This ensures consistency of event type naming across all services and provides
 * TypeScript type safety for notification event processing.
 *
 * Events are categorized by purpose (delivery, status update, preference change)
 * and integrate with the @austa/interfaces package for shared definitions.
 */

// Import shared interfaces from @austa/interfaces package
import { JourneyType } from '@austa/interfaces/journey';

/**
 * Notification delivery event types for different channels
 */
export enum NotificationDeliveryEventType {
  // Email notification events
  EMAIL_QUEUED = 'notification.delivery.email.queued',
  EMAIL_SENT = 'notification.delivery.email.sent',
  EMAIL_DELIVERED = 'notification.delivery.email.delivered',
  EMAIL_FAILED = 'notification.delivery.email.failed',
  
  // SMS notification events
  SMS_QUEUED = 'notification.delivery.sms.queued',
  SMS_SENT = 'notification.delivery.sms.sent',
  SMS_DELIVERED = 'notification.delivery.sms.delivered',
  SMS_FAILED = 'notification.delivery.sms.failed',
  
  // Push notification events
  PUSH_QUEUED = 'notification.delivery.push.queued',
  PUSH_SENT = 'notification.delivery.push.sent',
  PUSH_DELIVERED = 'notification.delivery.push.delivered',
  PUSH_FAILED = 'notification.delivery.push.failed',
  
  // In-app notification events
  IN_APP_QUEUED = 'notification.delivery.in-app.queued',
  IN_APP_DELIVERED = 'notification.delivery.in-app.delivered',
  IN_APP_READ = 'notification.delivery.in-app.read',
  IN_APP_FAILED = 'notification.delivery.in-app.failed',
}

/**
 * Notification status update event types
 */
export enum NotificationStatusEventType {
  CREATED = 'notification.status.created',
  UPDATED = 'notification.status.updated',
  DELIVERED = 'notification.status.delivered',
  READ = 'notification.status.read',
  FAILED = 'notification.status.failed',
  RETRY = 'notification.status.retry',
  CANCELLED = 'notification.status.cancelled',
  EXPIRED = 'notification.status.expired',
}

/**
 * Notification preference event types
 */
export enum NotificationPreferenceEventType {
  UPDATED = 'notification.preference.updated',
  CHANNEL_ENABLED = 'notification.preference.channel.enabled',
  CHANNEL_DISABLED = 'notification.preference.channel.disabled',
  JOURNEY_ENABLED = 'notification.preference.journey.enabled',
  JOURNEY_DISABLED = 'notification.preference.journey.disabled',
  TYPE_ENABLED = 'notification.preference.type.enabled',
  TYPE_DISABLED = 'notification.preference.type.disabled',
  SCHEDULE_UPDATED = 'notification.preference.schedule.updated',
  QUIET_HOURS_UPDATED = 'notification.preference.quiet-hours.updated',
}

/**
 * Journey-specific notification event types
 */
export enum JourneyNotificationEventType {
  // Health journey notification events
  HEALTH_GOAL_ACHIEVED = 'notification.journey.health.goal.achieved',
  HEALTH_GOAL_PROGRESS = 'notification.journey.health.goal.progress',
  HEALTH_METRIC_ALERT = 'notification.journey.health.metric.alert',
  HEALTH_DEVICE_CONNECTED = 'notification.journey.health.device.connected',
  HEALTH_DEVICE_DISCONNECTED = 'notification.journey.health.device.disconnected',
  HEALTH_INSIGHT_GENERATED = 'notification.journey.health.insight.generated',
  
  // Care journey notification events
  CARE_APPOINTMENT_CREATED = 'notification.journey.care.appointment.created',
  CARE_APPOINTMENT_UPDATED = 'notification.journey.care.appointment.updated',
  CARE_APPOINTMENT_REMINDER = 'notification.journey.care.appointment.reminder',
  CARE_APPOINTMENT_CANCELLED = 'notification.journey.care.appointment.cancelled',
  CARE_MEDICATION_REMINDER = 'notification.journey.care.medication.reminder',
  CARE_TELEMEDICINE_READY = 'notification.journey.care.telemedicine.ready',
  CARE_PROVIDER_MESSAGE = 'notification.journey.care.provider.message',
  
  // Plan journey notification events
  PLAN_CLAIM_SUBMITTED = 'notification.journey.plan.claim.submitted',
  PLAN_CLAIM_UPDATED = 'notification.journey.plan.claim.updated',
  PLAN_CLAIM_APPROVED = 'notification.journey.plan.claim.approved',
  PLAN_CLAIM_REJECTED = 'notification.journey.plan.claim.rejected',
  PLAN_BENEFIT_ACTIVATED = 'notification.journey.plan.benefit.activated',
  PLAN_BENEFIT_EXPIRING = 'notification.journey.plan.benefit.expiring',
  PLAN_DOCUMENT_AVAILABLE = 'notification.journey.plan.document.available',
}

/**
 * Gamification notification event types
 */
export enum GamificationNotificationEventType {
  ACHIEVEMENT_UNLOCKED = 'notification.gamification.achievement.unlocked',
  QUEST_COMPLETED = 'notification.gamification.quest.completed',
  QUEST_AVAILABLE = 'notification.gamification.quest.available',
  QUEST_EXPIRING = 'notification.gamification.quest.expiring',
  REWARD_EARNED = 'notification.gamification.reward.earned',
  REWARD_REDEEMED = 'notification.gamification.reward.redeemed',
  LEVEL_UP = 'notification.gamification.level.up',
  LEADERBOARD_POSITION = 'notification.gamification.leaderboard.position',
}

/**
 * Combined notification event type enum that includes all categories
 */
export enum NotificationEventType {
  // Delivery events
  EMAIL_QUEUED = NotificationDeliveryEventType.EMAIL_QUEUED,
  EMAIL_SENT = NotificationDeliveryEventType.EMAIL_SENT,
  EMAIL_DELIVERED = NotificationDeliveryEventType.EMAIL_DELIVERED,
  EMAIL_FAILED = NotificationDeliveryEventType.EMAIL_FAILED,
  SMS_QUEUED = NotificationDeliveryEventType.SMS_QUEUED,
  SMS_SENT = NotificationDeliveryEventType.SMS_SENT,
  SMS_DELIVERED = NotificationDeliveryEventType.SMS_DELIVERED,
  SMS_FAILED = NotificationDeliveryEventType.SMS_FAILED,
  PUSH_QUEUED = NotificationDeliveryEventType.PUSH_QUEUED,
  PUSH_SENT = NotificationDeliveryEventType.PUSH_SENT,
  PUSH_DELIVERED = NotificationDeliveryEventType.PUSH_DELIVERED,
  PUSH_FAILED = NotificationDeliveryEventType.PUSH_FAILED,
  IN_APP_QUEUED = NotificationDeliveryEventType.IN_APP_QUEUED,
  IN_APP_DELIVERED = NotificationDeliveryEventType.IN_APP_DELIVERED,
  IN_APP_READ = NotificationDeliveryEventType.IN_APP_READ,
  IN_APP_FAILED = NotificationDeliveryEventType.IN_APP_FAILED,
  
  // Status events
  STATUS_CREATED = NotificationStatusEventType.CREATED,
  STATUS_UPDATED = NotificationStatusEventType.UPDATED,
  STATUS_DELIVERED = NotificationStatusEventType.DELIVERED,
  STATUS_READ = NotificationStatusEventType.READ,
  STATUS_FAILED = NotificationStatusEventType.FAILED,
  STATUS_RETRY = NotificationStatusEventType.RETRY,
  STATUS_CANCELLED = NotificationStatusEventType.CANCELLED,
  STATUS_EXPIRED = NotificationStatusEventType.EXPIRED,
  
  // Preference events
  PREFERENCE_UPDATED = NotificationPreferenceEventType.UPDATED,
  PREFERENCE_CHANNEL_ENABLED = NotificationPreferenceEventType.CHANNEL_ENABLED,
  PREFERENCE_CHANNEL_DISABLED = NotificationPreferenceEventType.CHANNEL_DISABLED,
  PREFERENCE_JOURNEY_ENABLED = NotificationPreferenceEventType.JOURNEY_ENABLED,
  PREFERENCE_JOURNEY_DISABLED = NotificationPreferenceEventType.JOURNEY_DISABLED,
  PREFERENCE_TYPE_ENABLED = NotificationPreferenceEventType.TYPE_ENABLED,
  PREFERENCE_TYPE_DISABLED = NotificationPreferenceEventType.TYPE_DISABLED,
  PREFERENCE_SCHEDULE_UPDATED = NotificationPreferenceEventType.SCHEDULE_UPDATED,
  PREFERENCE_QUIET_HOURS_UPDATED = NotificationPreferenceEventType.QUIET_HOURS_UPDATED,
  
  // Health journey events
  HEALTH_GOAL_ACHIEVED = JourneyNotificationEventType.HEALTH_GOAL_ACHIEVED,
  HEALTH_GOAL_PROGRESS = JourneyNotificationEventType.HEALTH_GOAL_PROGRESS,
  HEALTH_METRIC_ALERT = JourneyNotificationEventType.HEALTH_METRIC_ALERT,
  HEALTH_DEVICE_CONNECTED = JourneyNotificationEventType.HEALTH_DEVICE_CONNECTED,
  HEALTH_DEVICE_DISCONNECTED = JourneyNotificationEventType.HEALTH_DEVICE_DISCONNECTED,
  HEALTH_INSIGHT_GENERATED = JourneyNotificationEventType.HEALTH_INSIGHT_GENERATED,
  
  // Care journey events
  CARE_APPOINTMENT_CREATED = JourneyNotificationEventType.CARE_APPOINTMENT_CREATED,
  CARE_APPOINTMENT_UPDATED = JourneyNotificationEventType.CARE_APPOINTMENT_UPDATED,
  CARE_APPOINTMENT_REMINDER = JourneyNotificationEventType.CARE_APPOINTMENT_REMINDER,
  CARE_APPOINTMENT_CANCELLED = JourneyNotificationEventType.CARE_APPOINTMENT_CANCELLED,
  CARE_MEDICATION_REMINDER = JourneyNotificationEventType.CARE_MEDICATION_REMINDER,
  CARE_TELEMEDICINE_READY = JourneyNotificationEventType.CARE_TELEMEDICINE_READY,
  CARE_PROVIDER_MESSAGE = JourneyNotificationEventType.CARE_PROVIDER_MESSAGE,
  
  // Plan journey events
  PLAN_CLAIM_SUBMITTED = JourneyNotificationEventType.PLAN_CLAIM_SUBMITTED,
  PLAN_CLAIM_UPDATED = JourneyNotificationEventType.PLAN_CLAIM_UPDATED,
  PLAN_CLAIM_APPROVED = JourneyNotificationEventType.PLAN_CLAIM_APPROVED,
  PLAN_CLAIM_REJECTED = JourneyNotificationEventType.PLAN_CLAIM_REJECTED,
  PLAN_BENEFIT_ACTIVATED = JourneyNotificationEventType.PLAN_BENEFIT_ACTIVATED,
  PLAN_BENEFIT_EXPIRING = JourneyNotificationEventType.PLAN_BENEFIT_EXPIRING,
  PLAN_DOCUMENT_AVAILABLE = JourneyNotificationEventType.PLAN_DOCUMENT_AVAILABLE,
  
  // Gamification events
  ACHIEVEMENT_UNLOCKED = GamificationNotificationEventType.ACHIEVEMENT_UNLOCKED,
  QUEST_COMPLETED = GamificationNotificationEventType.QUEST_COMPLETED,
  QUEST_AVAILABLE = GamificationNotificationEventType.QUEST_AVAILABLE,
  QUEST_EXPIRING = GamificationNotificationEventType.QUEST_EXPIRING,
  REWARD_EARNED = GamificationNotificationEventType.REWARD_EARNED,
  REWARD_REDEEMED = GamificationNotificationEventType.REWARD_REDEEMED,
  LEVEL_UP = GamificationNotificationEventType.LEVEL_UP,
  LEADERBOARD_POSITION = GamificationNotificationEventType.LEADERBOARD_POSITION,
}

/**
 * Type guard to check if an event type is a delivery event
 * @param eventType The notification event type to check
 * @returns True if the event type is a delivery event
 */
export function isDeliveryEvent(eventType: NotificationEventType): boolean {
  return Object.values(NotificationDeliveryEventType).includes(eventType as any);
}

/**
 * Type guard to check if an event type is a status event
 * @param eventType The notification event type to check
 * @returns True if the event type is a status event
 */
export function isStatusEvent(eventType: NotificationEventType): boolean {
  return Object.values(NotificationStatusEventType).includes(eventType as any);
}

/**
 * Type guard to check if an event type is a preference event
 * @param eventType The notification event type to check
 * @returns True if the event type is a preference event
 */
export function isPreferenceEvent(eventType: NotificationEventType): boolean {
  return Object.values(NotificationPreferenceEventType).includes(eventType as any);
}

/**
 * Type guard to check if an event type is a journey event
 * @param eventType The notification event type to check
 * @returns True if the event type is a journey event
 */
export function isJourneyEvent(eventType: NotificationEventType): boolean {
  return Object.values(JourneyNotificationEventType).includes(eventType as any);
}

/**
 * Type guard to check if an event type is a gamification event
 * @param eventType The notification event type to check
 * @returns True if the event type is a gamification event
 */
export function isGamificationEvent(eventType: NotificationEventType): boolean {
  return Object.values(GamificationNotificationEventType).includes(eventType as any);
}

/**
 * Get the journey type from a journey notification event
 * @param eventType The journey notification event type
 * @returns The journey type or undefined if not a journey event
 */
export function getJourneyTypeFromEvent(eventType: NotificationEventType): JourneyType | undefined {
  if (!isJourneyEvent(eventType)) {
    return undefined;
  }
  
  const eventString = eventType.toString();
  
  if (eventString.includes('health')) {
    return JourneyType.HEALTH;
  } else if (eventString.includes('care')) {
    return JourneyType.CARE;
  } else if (eventString.includes('plan')) {
    return JourneyType.PLAN;
  }
  
  return undefined;
}

/**
 * Get the notification channel from a delivery event
 * @param eventType The delivery event type
 * @returns The notification channel or undefined if not a delivery event
 */
export function getChannelFromDeliveryEvent(eventType: NotificationEventType): 'email' | 'sms' | 'push' | 'in-app' | undefined {
  if (!isDeliveryEvent(eventType)) {
    return undefined;
  }
  
  const eventString = eventType.toString();
  
  if (eventString.includes('email')) {
    return 'email';
  } else if (eventString.includes('sms')) {
    return 'sms';
  } else if (eventString.includes('push')) {
    return 'push';
  } else if (eventString.includes('in-app')) {
    return 'in-app';
  }
  
  return undefined;
}

/**
 * Get the delivery status from a delivery event
 * @param eventType The delivery event type
 * @returns The delivery status or undefined if not a delivery event
 */
export function getStatusFromDeliveryEvent(eventType: NotificationEventType): 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | undefined {
  if (!isDeliveryEvent(eventType)) {
    return undefined;
  }
  
  const eventString = eventType.toString();
  
  if (eventString.includes('queued')) {
    return 'queued';
  } else if (eventString.includes('sent')) {
    return 'sent';
  } else if (eventString.includes('delivered')) {
    return 'delivered';
  } else if (eventString.includes('read')) {
    return 'read';
  } else if (eventString.includes('failed')) {
    return 'failed';
  }
  
  return undefined;
}