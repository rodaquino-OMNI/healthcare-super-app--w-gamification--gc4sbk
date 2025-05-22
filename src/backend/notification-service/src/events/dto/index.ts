/**
 * @file Notification Event DTOs Barrel File
 * 
 * This barrel file exports all notification event DTOs for clean imports throughout the application.
 * It provides a single entry point for all notification event-related data structures and improves code organization.
 * 
 * The notification event system is designed to work with the following components:
 * - Kafka event processing for asynchronous notification delivery
 * - Journey-specific notification templates and theming
 * - Multi-channel delivery (email, SMS, push, in-app)
 * - Robust error handling and retry mechanisms
 * - Event versioning for backward compatibility
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Import all DTOs
 * import * as NotificationEventDTOs from '@app/events/dto';
 * 
 * // Import specific DTOs
 * import { BaseNotificationEventDto, NotificationEventType } from '@app/events/dto';
 * 
 * // Use with type annotations
 * const processEvent = (event: BaseNotificationEventDto) => { ... };
 * 
 * // Use type utilities
 * const handler: NotificationEventHandler<JourneyNotificationEventDto> = async (event) => {
 *   // Type-safe access to event properties
 *   console.log(event.journeyType);
 * };
 * 
 * // Type narrowing with type guards
 * if (isJourneyNotificationEvent(event)) {
 *   // TypeScript knows this is a JourneyNotificationEventDto
 *   console.log(event.journeyType); // Health, Care, or Plan
 * }
 * 
 * // Working with versioned events
 * type EventV2 = VersionedNotificationEvent<BaseNotificationEventDto, 2>;
 * const processVersionedEvent = (event: EventV2) => {
 *   // Process version 2 specific fields
 * };
 * 
 * // Journey-specific event handling
 * const healthHandler: NotificationEventHandler<JourneySpecificEvent<'Health'>> = 
 *   async (event) => {
 *     // TypeScript knows this is a Health journey event
 *     const healthData = event.data as HealthMetricAlertData;
 *     console.log(healthData.metricType);
 *   };
 * ```
 * 
 * @module NotificationEventDTOs
 */

// Export all notification event DTOs
export * from './base-notification-event.dto';
export * from './journey-notification-event.dto';
export * from './notification-delivery-status.dto';
export * from './notification-event-response.dto';
export * from './notification-event-type.enum';
export * from './notification-event-versioning.dto';
export * from './process-notification-event.dto';

// Re-export relevant interfaces from @austa/interfaces for consistency
export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  JourneyType,
  Notification,
  NotificationTemplate,
} from '@austa/interfaces/notification/types';

export {
  AchievementNotificationData,
  LevelUpNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData,
  HealthMetricAlertData,
  MedicationReminderData,
  PlanBenefitUpdateData,
} from '@austa/interfaces/notification/data';

export {
  NotificationPreference,
  JourneyNotificationPreference,
} from '@austa/interfaces/notification/preferences';

// TypeScript type utilities for working with notification events

/**
 * Type guard to check if an event is a journey-specific notification event
 * @param event Any notification event
 * @returns Boolean indicating if the event is journey-specific
 */
export const isJourneyNotificationEvent = (event: any): event is import('./journey-notification-event.dto').JourneyNotificationEventDto => {
  return event && event.journeyType !== undefined;
};

/**
 * Type guard to check if an event is a delivery status notification event
 * @param event Any notification event
 * @returns Boolean indicating if the event is a delivery status event
 */
export const isDeliveryStatusEvent = (event: any): event is import('./notification-delivery-status.dto').NotificationDeliveryStatusDto => {
  return event && event.deliveryStatus !== undefined;
};

/**
 * Type utility to extract the data type from a notification event
 * @template T The notification event type
 */
export type NotificationEventData<T extends import('./base-notification-event.dto').BaseNotificationEventDto> = 
  T extends { data: infer D } ? D : never;

/**
 * Type utility to create a strongly-typed notification event handler
 * @template T The notification event type
 * @template R The handler return type
 */
export type NotificationEventHandler<
  T extends import('./base-notification-event.dto').BaseNotificationEventDto,
  R = void
> = (event: T) => Promise<R>;

/**
 * Type utility to create a union of all notification event types
 */
export type AnyNotificationEvent = 
  | import('./base-notification-event.dto').BaseNotificationEventDto
  | import('./journey-notification-event.dto').JourneyNotificationEventDto
  | import('./notification-delivery-status.dto').NotificationDeliveryStatusDto
  | import('./process-notification-event.dto').ProcessNotificationEventDto;

/**
 * Type utility to extract journey-specific notification events
 * @template J The journey type
 */
export type JourneySpecificEvent<J extends import('@austa/interfaces/notification/types').JourneyType> = 
  import('./journey-notification-event.dto').JourneyNotificationEventDto & { journeyType: J };

/**
 * Type utility for versioned notification events
 * @template T The notification event type
 * @template V The version number
 */
export type VersionedNotificationEvent<
  T extends import('./base-notification-event.dto').BaseNotificationEventDto,
  V extends number
> = T & { version: V };