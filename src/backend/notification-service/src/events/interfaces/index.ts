/**
 * @file index.ts
 * @description Barrel file that exports all notification event interfaces from the folder,
 * providing a single entry point for importing notification event-related types. This centralized
 * export point simplifies imports throughout the codebase and ensures consistent usage patterns
 * while maintaining strong typing with the @austa/interfaces package.
 *
 * @example
 * // Import all notification event interfaces
 * import * as NotificationEvents from '@app/notification/events/interfaces';
 *
 * // Import specific interfaces
 * import { INotificationEvent, INotificationPayload } from '@app/notification/events/interfaces';
 *
 * // Import journey-specific notification interfaces
 * import { IHealthJourneyNotificationEvent } from '@app/notification/events/interfaces';
 */

// Re-export all interfaces from notification-event.interface.ts
export {
  INotificationEvent,
  INotificationPayload,
  INotificationPayloadWithChannelOptions,
  INotificationChannelOptions,
  IEmailNotificationOptions,
  IPushNotificationOptions,
  ISmsNotificationOptions,
  IInAppNotificationOptions,
  IJourneyNotificationEvent,
  IHealthJourneyNotificationEvent,
  ICareJourneyNotificationEvent,
  IPlanJourneyNotificationEvent,
  IGamificationNotificationEvent,
  INotificationDeliveryStatusEvent,
  isNotificationEvent,
  isJourneyNotificationEvent,
  isHealthJourneyNotificationEvent,
  isCareJourneyNotificationEvent,
  isPlanJourneyNotificationEvent,
  isGamificationNotificationEvent,
  isDeliveryStatusEvent
} from './notification-event.interface';

// Re-export all interfaces from notification-status.interface.ts
export {
  NotificationErrorSeverity,
  NotificationErrorCategory,
  INotificationError,
  INotificationStatus,
  IEmailNotificationStatus,
  ISmsNotificationStatus,
  IPushNotificationStatus,
  IInAppNotificationStatus,
  INotificationMetrics,
  INotificationDlqEntry,
  NotificationStatus,
  isEmailNotificationStatus,
  isSmsNotificationStatus,
  isPushNotificationStatus,
  isInAppNotificationStatus
} from './notification-status.interface';

// Re-export all interfaces from notification-event-type.interface.ts
export {
  INotificationEventType,
  IHealthNotificationEventType,
  ICareNotificationEventType,
  IPlanNotificationEventType,
  ISystemNotificationEventType,
  NotificationEventType,
  INotificationEventTypeValidator,
  HealthNotificationType,
  CareNotificationType,
  PlanNotificationType,
  SystemNotificationType,
  DeliveryStatusNotificationType,
  NotificationTypeId,
  isHealthNotificationEventType,
  isCareNotificationEventType,
  isPlanNotificationEventType,
  isSystemNotificationEventType,
  isHealthNotificationTypeId,
  isCareNotificationTypeId,
  isPlanNotificationTypeId,
  isSystemNotificationTypeId,
  isDeliveryStatusNotificationTypeId,
  isNotificationTypeId,
  getNotificationTypeEnumForJourney,
  getJourneyForNotificationTypeId,
  IHealthGoalAchievedPayload,
  IAppointmentReminderPayload,
  IClaimStatusUpdatedPayload,
  IAchievementUnlockedPayload,
  IDeliveryStatusPayload,
  INotificationEventTypeRegistry,
  INotificationEventTypeVersion,
  createNotificationEventTypeVersion,
  compareNotificationEventTypeVersions,
  isCompatibleNotificationEventTypeVersion
} from './notification-event-type.interface';

// Re-export all interfaces from notification-event-versioning.interface.ts
export {
  ValidationError,
  CompatibilityLevel,
  INotificationEventVersion,
  IVersionedNotificationEvent,
  DeprecatedField,
  INotificationEventTransformer,
  INotificationEventMigration,
  INotificationEventSchemaRegistry,
  IBackwardCompatibilityHandler,
  parseVersion,
  compareVersions,
  isBackwardCompatible,
  createVersionString,
  markFieldAsDeprecated
} from './notification-event-versioning.interface';

// Re-export all interfaces from notification-event-response.interface.ts
export {
  INotificationEventResponse,
  INotificationSuccess,
  INotificationError as INotificationErrorResponse,
  NotificationEventResponse,
  IChannelDeliveryDetails,
  IEmailDeliveryDetails,
  ISmsDeliveryDetails,
  IPushDeliveryDetails,
  IInAppDeliveryDetails,
  ChannelDeliveryDetails,
  IAsyncNotificationResponse,
  IBatchNotificationResult,
  isNotificationSuccess,
  isNotificationError,
  isAsyncNotificationResponse,
  isEmailDeliveryDetails,
  isSmsDeliveryDetails,
  isPushDeliveryDetails,
  isInAppDeliveryDetails
} from './notification-event-response.interface';

// Re-export all interfaces from notification-event-handler.interface.ts
export {
  INotificationEventHandler,
  IEmailNotificationEventHandler,
  ISmsNotificationEventHandler,
  IPushNotificationEventHandler,
  IInAppNotificationEventHandler,
  INotificationProcessor,
  IRetryableNotificationEventHandler,
  IFallbackNotificationEventHandler
} from './notification-event-handler.interface';

// Re-export all interfaces from journey-notification-events.interface.ts
export {
  JourneyType,
  IJourneyNotificationEvent as IJourneyBasedNotificationEvent,
  IHealthJourneyNotificationEvent as IHealthJourneyEvent,
  ICareJourneyNotificationEvent as ICareJourneyEvent,
  IPlanJourneyNotificationEvent as IPlanJourneyEvent,
  ICrossJourneyNotificationEvent,
  JourneyNotificationEvent,
  isHealthJourneyEvent,
  isCareJourneyEvent,
  isPlanJourneyEvent,
  isCrossJourneyEvent
} from './journey-notification-events.interface';

// Re-export relevant interfaces from @austa/interfaces for standardized schemas

// Common interfaces
export { IBaseEvent, IEventType } from '@austa/interfaces/common';

// Notification interfaces
export {
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus as NotificationStatusEnum
} from '@austa/interfaces/notification/types';

// Journey-specific interfaces
export { JourneyType as JourneyTypeEnum } from '@austa/interfaces/common/journey.types';

// Gamification interfaces
export { Achievement, Quest, Reward } from '@austa/interfaces/gamification';

/**
 * Type utility for extracting notification payload from a notification event type
 * @template T The notification event type
 */
export type ExtractNotificationPayload<T extends INotificationEvent> = T['payload'];

/**
 * Type utility for creating a strongly-typed notification event handler
 * @template T The notification event type
 */
export type TypedNotificationEventHandler<T extends INotificationEvent> = 
  Omit<INotificationEventHandler, 'handle'> & {
    handle(event: T): Promise<INotificationEventResponse>;
  };

/**
 * Type utility for creating a union of notification events by journey
 * @template J The journey type
 */
export type NotificationEventsByJourney<J extends JourneyType> = 
  Extract<JourneyNotificationEvent, { journey: J }>;

/**
 * Type utility for creating a notification event with specific payload type
 * @template P The payload type
 */
export type NotificationEventWithPayload<P extends Record<string, any>> = 
  Omit<INotificationEvent, 'payload'> & { payload: P };

/**
 * Type utility for creating a notification event with specific channel
 * @template C The notification channel
 */
export type NotificationEventByChannel<C extends NotificationChannel> = 
  INotificationEvent & { payload: { channels: C[] } };

/**
 * Type utility for creating a notification event with specific type
 * @template T The notification type
 */
export type NotificationEventByType<T extends NotificationType> = 
  INotificationEvent & { payload: { type: T } };