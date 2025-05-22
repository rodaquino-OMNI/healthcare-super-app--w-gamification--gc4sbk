/**
 * @file Notification Event Interfaces Barrel File
 * @description Exports all notification event interfaces from the notification service's event system.
 * This file serves as the central entry point for importing notification event-related interfaces,
 * providing a clean and consistent import pattern throughout the codebase.
 */

// Re-export interfaces from @austa/interfaces packages
import * as AustaEvents from '@austa/interfaces/events';
import * as AustaNotifications from '@austa/interfaces/notification';
import * as AustaHealth from '@austa/interfaces/health';
import * as AustaCare from '@austa/interfaces/care';
import * as AustaPlan from '@austa/interfaces/plan';
import * as AustaGamification from '@austa/interfaces/gamification';

// Export local event interfaces
export * from './notification-event.interface';
export * from './notification-event-type.interface';
export * from './notification-status.interface';
export * from './journey-notification-events.interface';
export * from './notification-event-versioning.interface';
export * from './notification-event-response.interface';
export * from './notification-event-handler.interface';

// Re-export interfaces from @austa/interfaces
export { 
  AustaEvents,
  AustaNotifications,
  AustaHealth,
  AustaCare,
  AustaPlan,
  AustaGamification
};

/**
 * Namespace for all notification event-related interfaces and types.
 * Provides a structured way to import specific notification event interfaces.
 */
export namespace NotificationEvents {
  // Core notification event interfaces
  export * from './notification-event.interface';
  export * from './notification-event-type.interface';
  
  // Notification status tracking
  export * from './notification-status.interface';
  
  // Journey-specific notification events
  export * from './journey-notification-events.interface';
  
  // Event versioning and compatibility
  export * from './notification-event-versioning.interface';
  
  // Event handling and processing
  export * from './notification-event-response.interface';
  export * from './notification-event-handler.interface';
  
  // Re-export from @austa/interfaces with aliases to avoid naming conflicts
  export import Events = AustaEvents;
  export import Notifications = AustaNotifications;
  export import Health = AustaHealth;
  export import Care = AustaCare;
  export import Plan = AustaPlan;
  export import Gamification = AustaGamification;
}

/**
 * Type utilities for working with notification event interfaces
 */

/**
 * Extracts the payload type from a notification event interface
 * @template T The notification event interface type
 */
export type NotificationPayload<T> = T extends { payload: infer P } ? P : never;

/**
 * Creates a type-safe notification event creator function type
 * @template T The notification event interface type
 */
export type NotificationEventCreator<T> = (payload: NotificationPayload<T>) => T;

/**
 * Utility type to extract notification event types from a union of notification event interfaces
 * @template T The union of notification event interfaces
 */
export type NotificationEventTypeFromUnion<T> = T extends { type: infer Type } ? Type : never;

/**
 * Utility type to filter notification events by type
 * @template AllEvents Union of all notification event types
 * @template EventType The specific notification event type to filter by
 */
export type FilterNotificationEventsByType<AllEvents, EventType> = 
  AllEvents extends { type: EventType } ? AllEvents : never;

/**
 * Utility type to filter notification events by journey
 * @template AllEvents Union of all notification event types
 * @template Journey The specific journey to filter by
 */
export type FilterNotificationEventsByJourney<AllEvents, Journey> = 
  AllEvents extends { metadata: { journey: Journey } } ? AllEvents : never;

/**
 * Utility type to filter notification events by channel
 * @template AllEvents Union of all notification event types
 * @template Channel The specific channel to filter by
 */
export type FilterNotificationEventsByChannel<AllEvents, Channel> = 
  AllEvents extends { channels: Channel[] } ? 
    Channel extends AllEvents['channels'][number] ? AllEvents : never : never;

/**
 * @example Usage examples
 * 
 * // Import all notification event interfaces
 * import * as NotificationEventInterfaces from './events/interfaces';
 * 
 * // Import specific interfaces
 * import { INotificationEvent, INotificationEventHandler } from './events/interfaces';
 * 
 * // Import using namespace
 * import { NotificationEvents } from './events/interfaces';
 * const handler: NotificationEvents.INotificationEventHandler = { ... };
 * 
 * // Import shared interfaces from @austa/interfaces
 * import { AustaNotifications } from './events/interfaces';
 * const notificationType: AustaNotifications.NotificationType = 'system.account';
 * 
 * // Use type utilities
 * import { NotificationPayload, FilterNotificationEventsByJourney } from './events/interfaces';
 * type HealthEventPayload = NotificationPayload<NotificationEvents.IHealthJourneyNotificationEvent>;
 * type HealthEvents = FilterNotificationEventsByJourney<INotificationEvent, 'health'>;
 */