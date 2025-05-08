/**
 * @file Notification Event DTOs Barrel Export
 * 
 * This file serves as the central export point for all notification event Data Transfer Objects (DTOs)
 * used throughout the notification service. It provides a clean, organized way to import notification
 * event structures without having to reference individual files.
 * 
 * Key features:
 * - Exports all notification event DTOs with proper TypeScript typing
 * - Re-exports relevant types from @austa/interfaces for consistency
 * - Provides type utilities for working with notification events
 * - Ensures consistent usage patterns across the notification service
 * 
 * Usage examples:
 * 
 * ```typescript
 * // Import all notification event DTOs
 * import * as NotificationEventDTOs from '@app/notification/events/dto';
 * 
 * // Import specific DTOs
 * import { 
 *   BaseNotificationEventDto, 
 *   ProcessNotificationEventDto,
 *   NotificationEventTypeEnum 
 * } from '@app/notification/events/dto';
 * 
 * // Use with type-safe validation
 * const event = new ProcessNotificationEventDto();
 * if (isValidNotificationEvent(event)) {
 *   // Process the event
 * }
 * ```
 * 
 * Journey-specific notification handling:
 * 
 * ```typescript
 * import { 
 *   BaseNotificationEventDto,
 *   isJourneyNotificationEvent,
 *   JourneyNotificationEvent
 * } from '@app/notification/events/dto';
 * 
 * function processHealthNotification(event: BaseNotificationEventDto) {
 *   if (isJourneyNotificationEvent(event, 'health')) {
 *     // This is a health journey notification
 *     const healthEvent = event as JourneyNotificationEvent<BaseNotificationEventDto, 'health'>;
 *     // Process health-specific notification
 *   }
 * }
 * ```
 * 
 * Working with versioned events:
 * 
 * ```typescript
 * import { 
 *   BaseNotificationEventDto,
 *   VersionedNotificationEvent
 * } from '@app/notification/events/dto';
 * 
 * // Type-safe handling of different event versions
 * function processEventByVersion(event: BaseNotificationEventDto) {
 *   switch (event.version) {
 *     case '1.0':
 *       return processV1Event(event as VersionedNotificationEvent<BaseNotificationEventDto, '1.0'>);
 *     case '2.0':
 *       return processV2Event(event as VersionedNotificationEvent<BaseNotificationEventDto, '2.0'>);
 *     default:
 *       throw new Error(`Unsupported event version: ${event.version}`);
 *   }
 * }
 * ```
 */

// Export all notification event DTOs
export * from './base-notification-event.dto';
export * from './journey-notification-event.dto';
export * from './notification-event-versioning.dto';
export * from './notification-event-response.dto';
export * from './notification-delivery-status.dto';
export * from './process-notification-event.dto';
export * from './notification-event-type.enum';

// Re-export relevant types from @austa/interfaces for consistency
export {
  // Core notification types
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
} from '@austa/interfaces/notification/types';

export {
  // Notification data structures
  NotificationData,
  AchievementNotificationData,
  AppointmentReminderData,
  HealthGoalNotificationData,
  MedicationReminderData,
  ClaimStatusUpdateData,
  BenefitNotificationData,
} from '@austa/interfaces/notification/data';

export {
  // Notification template interfaces
  NotificationTemplate,
  TemplateVariable,
} from '@austa/interfaces/notification/templates';

export {
  // Notification preference interfaces
  NotificationPreference,
  JourneyNotificationPreference,
} from '@austa/interfaces/notification/preferences';

// Re-export event interfaces from @austa/interfaces
export {
  // Base event interfaces
  IBaseEvent,
  IEventMetadata,
  IVersionedEvent,
  EventVersion,
  IEventHandler,
  IEventProcessor,
  IEventValidator,
  ValidationResult,
} from '@austa/interfaces/common';

// Re-export journey-specific event interfaces
export {
  // Health journey events
  IHealthJourneyEvent,
  HealthMetricRecordedEvent,
  HealthGoalAchievedEvent,
  DeviceSyncCompletedEvent,
} from '@austa/interfaces/journey/health';

export {
  // Care journey events
  ICareJourneyEvent,
  AppointmentBookedEvent,
  MedicationAdherenceEvent,
  TelemedicineSessionEvent,
  CarePlanProgressEvent,
} from '@austa/interfaces/journey/care';

export {
  // Plan journey events
  IPlanJourneyEvent,
  ClaimSubmittedEvent,
  BenefitUtilizedEvent,
  PlanSelectedEvent,
  RewardRedeemedEvent,
} from '@austa/interfaces/journey/plan';

// Re-export gamification event interfaces
export {
  // Gamification events
  IAchievementEvent,
  IQuestEvent,
  IRewardEvent,
  ILevelUpEvent,
} from '@austa/interfaces/gamification';

// Type utilities for working with notification events

/**
 * Type guard to check if an object is a valid notification event
 * @param obj The object to check
 * @returns True if the object is a valid notification event
 */
export function isValidNotificationEvent(obj: any): obj is BaseNotificationEventDto {
  return (
    obj &&
    typeof obj === 'object' &&
    'eventId' in obj &&
    'timestamp' in obj &&
    'version' in obj &&
    'type' in obj
  );
}

/**
 * Type guard to check if an event is a journey-specific notification event
 * @param event The notification event to check
 * @param journey The journey to check for ('health' | 'care' | 'plan')
 * @returns True if the event is for the specified journey
 */
export function isJourneyNotificationEvent(
  event: BaseNotificationEventDto,
  journey: 'health' | 'care' | 'plan'
): boolean {
  return (
    'journeyContext' in event &&
    event.journeyContext === journey
  );
}

/**
 * Type utility to extract the payload type from a notification event
 * @template T The notification event type
 */
export type NotificationEventPayload<T extends BaseNotificationEventDto> = T['payload'];

/**
 * Type utility to create a union of all notification event types
 */
export type AnyNotificationEvent =
  | BaseNotificationEventDto
  | ProcessNotificationEventDto
  | NotificationDeliveryStatusDto
  | NotificationEventResponseDto;

/**
 * Type utility to extract the event type from a notification event
 * @template T The notification event type
 */
export type NotificationEventType<T extends BaseNotificationEventDto> = T['type'];

/**
 * Type utility to create a mapped type of event handlers by event type
 * @template T The notification event type
 * @template H The handler type
 */
export type NotificationEventHandlerMap<
  T extends BaseNotificationEventDto,
  H extends (event: T) => any
> = {
  [K in NotificationEventType<T>]: H;
};

/**
 * Type utility to create a versioned notification event
 * @template T The notification event type
 * @template V The version type
 */
export type VersionedNotificationEvent<
  T extends BaseNotificationEventDto,
  V extends string = string
> = T & {
  version: V;
};

/**
 * Type utility to create a journey-specific notification event
 * @template T The notification event type
 * @template J The journey type
 */
export type JourneyNotificationEvent<
  T extends BaseNotificationEventDto,
  J extends 'health' | 'care' | 'plan' | 'global' = 'health' | 'care' | 'plan' | 'global'
> = T & {
  journeyContext: J;
};

/**
 * Type utility for notification event discriminated unions based on type
 * @template T The union of notification event types
 * @template K The discriminator key (default: 'type')
 */
export type NotificationEventDiscriminator<
  T extends BaseNotificationEventDto,
  K extends keyof T = 'type'
> = T[K];

/**
 * Type utility to extract notification events from a union by their type
 * @template T The union of notification event types
 * @template D The discriminator value to filter by
 * @template K The discriminator key (default: 'type')
 */
export type ExtractNotificationEventByType<
  T extends BaseNotificationEventDto,
  D extends NotificationEventDiscriminator<T>,
  K extends keyof T = 'type'
> = T extends { [key in K]: D } ? T : never;

/**
 * Type utility to create a notification event with specific payload type
 * @template T The notification event type
 * @template P The payload type
 */
export type NotificationEventWithPayload<
  T extends BaseNotificationEventDto,
  P extends Record<string, any>
> = Omit<T, 'payload'> & {
  payload: P;
};

/**
 * Type utility to create a notification event with specific metadata
 * @template T The notification event type
 * @template M The metadata type
 */
export type NotificationEventWithMetadata<
  T extends BaseNotificationEventDto,
  M extends Record<string, any>
> = Omit<T, 'metadata'> & {
  metadata: M;
};