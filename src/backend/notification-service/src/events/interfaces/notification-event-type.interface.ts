/**
 * @file notification-event-type.interface.ts
 * @description Defines interfaces and TypeScript type utilities for notification event type categorization,
 * validation, and narrowing. This file provides a type-safe representation of notification event types
 * organized by journey and purpose, enabling proper static and runtime type checking throughout the
 * notification service.
 */

import { JourneyType } from '@austa/interfaces/common';
import { HealthEventType } from '@austa/interfaces/health';
import { CareEventType } from '@austa/interfaces/care';
import { PlanEventType } from '@austa/interfaces/plan';
import { GamificationEventType } from '@austa/interfaces/gamification';
import { NotificationType } from '@austa/interfaces/notification/types';

/**
 * Base interface for notification event types.
 * Provides a standardized structure for all notification event types
 * with journey context and category information.
 */
export interface INotificationEventType {
  /** The unique identifier for this notification event type */
  readonly type: string;
  
  /** The journey this notification event belongs to */
  readonly journey: JourneyType | 'system' | 'gamification';
  
  /** The category of this notification event for grouping and filtering */
  readonly category: string;
  
  /** Human-readable description of this notification event type */
  readonly description: string;
  
  /** Version of this event type schema for compatibility checking */
  readonly version: string;
}

/**
 * System notification event types that are not specific to any journey.
 * These events are typically related to system operations, delivery status,
 * and user preference changes.
 */
export enum SystemNotificationEventType {
  // Delivery status events
  DELIVERY_SUCCESS = 'notification.delivery.success',
  DELIVERY_FAILURE = 'notification.delivery.failure',
  DELIVERY_RETRY = 'notification.delivery.retry',
  DELIVERY_CANCELLED = 'notification.delivery.cancelled',
  
  // Preference events
  PREFERENCE_UPDATED = 'notification.preference.updated',
  PREFERENCE_RESET = 'notification.preference.reset',
  
  // Template events
  TEMPLATE_UPDATED = 'notification.template.updated',
  TEMPLATE_CREATED = 'notification.template.created',
  
  // System events
  SYSTEM_MAINTENANCE = 'notification.system.maintenance',
  SYSTEM_ALERT = 'notification.system.alert',
  SYSTEM_UPGRADE = 'notification.system.upgrade'
}

/**
 * Interface for system notification event types.
 * Extends the base notification event type with system-specific properties.
 */
export interface ISystemNotificationEventType extends INotificationEventType {
  readonly journey: 'system';
  readonly type: SystemNotificationEventType;
  readonly category: 'delivery' | 'preference' | 'template' | 'system';
}

/**
 * Interface for health journey notification event types.
 * Extends the base notification event type with health-specific properties.
 */
export interface IHealthNotificationEventType extends INotificationEventType {
  readonly journey: 'health';
  readonly type: HealthEventType;
  readonly category: 'metrics' | 'goals' | 'devices' | 'insights';
}

/**
 * Interface for care journey notification event types.
 * Extends the base notification event type with care-specific properties.
 */
export interface ICareNotificationEventType extends INotificationEventType {
  readonly journey: 'care';
  readonly type: CareEventType;
  readonly category: 'appointments' | 'medications' | 'telemedicine' | 'providers';
}

/**
 * Interface for plan journey notification event types.
 * Extends the base notification event type with plan-specific properties.
 */
export interface IPlanNotificationEventType extends INotificationEventType {
  readonly journey: 'plan';
  readonly type: PlanEventType;
  readonly category: 'claims' | 'benefits' | 'coverage' | 'documents';
}

/**
 * Interface for gamification notification event types.
 * Extends the base notification event type with gamification-specific properties.
 */
export interface IGamificationNotificationEventType extends INotificationEventType {
  readonly journey: 'gamification';
  readonly type: GamificationEventType;
  readonly category: 'achievements' | 'quests' | 'rewards' | 'levels' | 'leaderboard';
}

/**
 * Union type of all notification event types.
 * This type can be used for type narrowing and exhaustive checks.
 */
export type NotificationEventType =
  | ISystemNotificationEventType
  | IHealthNotificationEventType
  | ICareNotificationEventType
  | IPlanNotificationEventType
  | IGamificationNotificationEventType;

/**
 * Type guard to check if a notification event type is a system notification event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a system notification event type
 */
export function isSystemNotificationEventType(
  eventType: NotificationEventType
): eventType is ISystemNotificationEventType {
  return eventType.journey === 'system';
}

/**
 * Type guard to check if a notification event type is a health notification event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a health notification event type
 */
export function isHealthNotificationEventType(
  eventType: NotificationEventType
): eventType is IHealthNotificationEventType {
  return eventType.journey === 'health';
}

/**
 * Type guard to check if a notification event type is a care notification event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a care notification event type
 */
export function isCareNotificationEventType(
  eventType: NotificationEventType
): eventType is ICareNotificationEventType {
  return eventType.journey === 'care';
}

/**
 * Type guard to check if a notification event type is a plan notification event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a plan notification event type
 */
export function isPlanNotificationEventType(
  eventType: NotificationEventType
): eventType is IPlanNotificationEventType {
  return eventType.journey === 'plan';
}

/**
 * Type guard to check if a notification event type is a gamification notification event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a gamification notification event type
 */
export function isGamificationNotificationEventType(
  eventType: NotificationEventType
): eventType is IGamificationNotificationEventType {
  return eventType.journey === 'gamification';
}

/**
 * Type guard to check if a notification event type is a delivery status event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a delivery status event type
 */
export function isDeliveryStatusEventType(
  eventType: NotificationEventType
): boolean {
  return (
    isSystemNotificationEventType(eventType) &&
    eventType.category === 'delivery'
  );
}

/**
 * Interface for mapping notification types to their corresponding event types.
 * This mapping is used to determine which event type to use for a given notification type.
 */
export interface INotificationTypeToEventTypeMap {
  [key: string]: {
    eventType: string;
    journey: JourneyType | 'system' | 'gamification';
    category: string;
  };
}

/**
 * Default mapping of notification types to event types.
 * This mapping is used to determine which event type to use for a given notification type.
 */
export const DEFAULT_NOTIFICATION_TYPE_TO_EVENT_TYPE_MAP: INotificationTypeToEventTypeMap = {
  [NotificationType.ACHIEVEMENT]: {
    eventType: GamificationEventType.ACHIEVEMENT_UNLOCKED,
    journey: 'gamification',
    category: 'achievements',
  },
  [NotificationType.APPOINTMENT_REMINDER]: {
    eventType: CareEventType.APPOINTMENT_REMINDER,
    journey: 'care',
    category: 'appointments',
  },
  [NotificationType.MEDICATION_REMINDER]: {
    eventType: CareEventType.MEDICATION_REMINDER,
    journey: 'care',
    category: 'medications',
  },
  [NotificationType.HEALTH_GOAL_ACHIEVED]: {
    eventType: HealthEventType.GOAL_ACHIEVED,
    journey: 'health',
    category: 'goals',
  },
  [NotificationType.CLAIM_STATUS_UPDATE]: {
    eventType: PlanEventType.CLAIM_STATUS_UPDATED,
    journey: 'plan',
    category: 'claims',
  },
  [NotificationType.SYSTEM]: {
    eventType: SystemNotificationEventType.SYSTEM_ALERT,
    journey: 'system',
    category: 'system',
  },
};

/**
 * Interface for delivery status notification event types.
 * These events track the lifecycle of a notification from dispatch through delivery or failure.
 */
export interface IDeliveryStatusEventType extends ISystemNotificationEventType {
  readonly category: 'delivery';
  readonly type: SystemNotificationEventType.DELIVERY_SUCCESS | 
                SystemNotificationEventType.DELIVERY_FAILURE | 
                SystemNotificationEventType.DELIVERY_RETRY | 
                SystemNotificationEventType.DELIVERY_CANCELLED;
  
  /** The ID of the notification this status event is for */
  readonly notificationId: string;
  
  /** The channel this delivery status is for (email, sms, push, in-app) */
  readonly channel: string;
  
  /** Timestamp when this status was recorded */
  readonly timestamp: string;
}

/**
 * Type guard to check if a notification event type is a delivery success event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a delivery success event type
 */
export function isDeliverySuccessEventType(
  eventType: NotificationEventType
): eventType is IDeliveryStatusEventType & { type: SystemNotificationEventType.DELIVERY_SUCCESS } {
  return (
    isSystemNotificationEventType(eventType) &&
    eventType.category === 'delivery' &&
    eventType.type === SystemNotificationEventType.DELIVERY_SUCCESS
  );
}

/**
 * Type guard to check if a notification event type is a delivery failure event type.
 * @param eventType The notification event type to check
 * @returns True if the event type is a delivery failure event type
 */
export function isDeliveryFailureEventType(
  eventType: NotificationEventType
): eventType is IDeliveryStatusEventType & { type: SystemNotificationEventType.DELIVERY_FAILURE } {
  return (
    isSystemNotificationEventType(eventType) &&
    eventType.category === 'delivery' &&
    eventType.type === SystemNotificationEventType.DELIVERY_FAILURE
  );
}

/**
 * Utility function to create a notification event type from a notification type.
 * This function uses the DEFAULT_NOTIFICATION_TYPE_TO_EVENT_TYPE_MAP to determine
 * the appropriate event type for the given notification type.
 * 
 * @param notificationType The notification type to convert
 * @param version The version of the event type schema
 * @param description Optional description of the event type
 * @returns A notification event type object
 */
export function createNotificationEventTypeFromNotificationType(
  notificationType: NotificationType,
  version = '1.0.0',
  description?: string
): NotificationEventType {
  const mapping = DEFAULT_NOTIFICATION_TYPE_TO_EVENT_TYPE_MAP[notificationType];
  
  if (!mapping) {
    throw new Error(`No event type mapping found for notification type: ${notificationType}`);
  }
  
  return {
    type: mapping.eventType,
    journey: mapping.journey,
    category: mapping.category,
    version,
    description: description || `Event for notification type: ${notificationType}`,
  } as NotificationEventType;
}

/**
 * Utility function to create a delivery status event type.
 * 
 * @param statusType The type of delivery status event
 * @param notificationId The ID of the notification this status event is for
 * @param channel The channel this delivery status is for
 * @param timestamp The timestamp when this status was recorded
 * @param version The version of the event type schema
 * @param description Optional description of the event type
 * @returns A delivery status event type object
 */
export function createDeliveryStatusEventType(
  statusType: SystemNotificationEventType.DELIVERY_SUCCESS | 
             SystemNotificationEventType.DELIVERY_FAILURE | 
             SystemNotificationEventType.DELIVERY_RETRY | 
             SystemNotificationEventType.DELIVERY_CANCELLED,
  notificationId: string,
  channel: string,
  timestamp: string = new Date().toISOString(),
  version = '1.0.0',
  description?: string
): IDeliveryStatusEventType {
  return {
    type: statusType,
    journey: 'system',
    category: 'delivery',
    notificationId,
    channel,
    timestamp,
    version,
    description: description || `Delivery status event: ${statusType}`,
  };
}