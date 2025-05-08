/**
 * @file index.ts
 * @description Barrel file that exports all notification event interfaces from the folder,
 * providing a single entry point for importing notification event-related types.
 * This centralized export point simplifies imports throughout the codebase and ensures
 * consistent usage patterns while maintaining strong typing with the @austa/interfaces package.
 */

// Export notification event type interfaces
export * from './notification-event-type.interface';
export * from './notification-event.interface';
export * from './notification-event-response.interface';
export * from './notification-event-handler.interface';
export * from './notification-event-versioning.interface';
export * from './notification-status.interface';
export * from './journey-notification-events.interface';

// Re-export relevant interfaces from @austa/interfaces for convenience
export { NotificationChannel, NotificationPriority, NotificationType } from '@austa/interfaces/notification/types';