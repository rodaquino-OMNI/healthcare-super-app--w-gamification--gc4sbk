/**
 * @file Notification Service Interfaces Barrel Export
 * 
 * This file serves as a centralized export point for all notification-related
 * interfaces used throughout the notification service. It organizes exports by
 * functional category and integrates with the @austa/interfaces package for
 * cross-service type consistency.
 */

// Import and re-export local interface definitions

// Core notification payload interfaces
export * from './notification-payload.interface';

// Delivery tracking and status interfaces
export * from './delivery-tracking.interface';

// Notification channel and provider interfaces
export * from './notification-channel.interface';

// User notification preferences interfaces
export * from './notification-preferences.interface';

// Common utility interfaces
export * from './common.interface';

// Import and re-export shared interfaces from @austa/interfaces package

// Core notification types and enums
export * from '@austa/interfaces/notification/types';

// Journey-specific notification data structures
export * from '@austa/interfaces/notification/data';

// Notification template interfaces
export * from '@austa/interfaces/notification/templates';

// Shared notification preference interfaces
export * from '@austa/interfaces/notification/preferences';