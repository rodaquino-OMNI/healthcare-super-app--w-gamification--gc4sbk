/**
 * @austa/interfaces
 * 
 * Central barrel file that re-exports all TypeScript interfaces from the journey-specific
 * and shared folders, providing a unified import surface for the entire AUSTA SuperApp.
 * 
 * This file enables developers to import interfaces from a single entry point,
 * facilitating consistent type usage across both web and mobile applications
 * while maintaining the journey-centered architecture.
 * 
 * @example
 * // Import all interfaces
 * import * as Interfaces from '@austa/interfaces';
 * 
 * // Import specific journey interfaces
 * import { Health, Care, Plan } from '@austa/interfaces';
 * 
 * // Import specific interface
 * import { AuthSession } from '@austa/interfaces/auth';
 */

// Re-export all journey-specific interfaces

/**
 * Health Journey interfaces
 * 
 * Includes interfaces for health metrics, medical events, health goals,
 * and device connections used in the Health Journey.
 */
export * as Health from './health';

/**
 * Care Journey interfaces
 * 
 * Includes interfaces for appointments, medications, telemedicine sessions,
 * providers, and treatment plans used in the Care Journey.
 */
export * as Care from './care';

/**
 * Plan Journey interfaces
 * 
 * Includes interfaces for insurance plans, claims, coverage, benefits,
 * and documents used in the Plan Journey.
 */
export * as Plan from './plan';

/**
 * Gamification interfaces
 * 
 * Includes interfaces for achievements, quests, rewards, profiles, events,
 * leaderboards, XP, and rules used in the gamification system.
 */
export * as Gamification from './gamification';

/**
 * Authentication interfaces
 * 
 * Includes interfaces for authentication sessions, state, tokens, users,
 * and API responses used in the authentication system.
 */
export * as Auth from './auth';

/**
 * Notification interfaces
 * 
 * Includes interfaces for notifications, preferences, templates, and
 * notification data used in the notification system.
 */
export * as Notification from './notification';

/**
 * Common utility interfaces
 * 
 * Includes common interfaces for models, errors, validation, responses,
 * and utility types used across all domains.
 */
export * as Common from './common';

/**
 * Component interfaces
 * 
 * Includes interfaces for UI components, including primitives, core components,
 * and journey-specific components used in the design system.
 */
export * as Components from './components';

/**
 * Theme interfaces
 * 
 * Includes interfaces for themes, tokens, style props, and journey-specific
 * theme variations used in the design system.
 */
export * as Themes from './themes';

/**
 * API interfaces
 * 
 * Includes interfaces for API requests, responses, GraphQL operations,
 * REST endpoints, and WebSocket events used in API communication.
 */
export * as API from './api';

/**
 * Next.js interfaces
 * 
 * Includes interfaces for Next.js pages, API routes, middleware, and
 * server-side rendering used in the web application.
 */
export * as Next from './next';

// Direct re-exports for backward compatibility and convenience

// Auth interfaces
export { AuthSession, AuthState } from './auth';

// Health interfaces
export { HealthMetricType } from './health';
export type { HealthMetric, MedicalEvent, HealthGoal, DeviceConnection } from './health';

// Care interfaces
export type { 
  Appointment, 
  Medication, 
  TelemedicineSession, 
  TreatmentPlan 
} from './care';

// Plan interfaces
export type { 
  ClaimStatus, 
  ClaimType, 
  PlanType, 
  CoverageType, 
  Claim, 
  Plan, 
  Coverage, 
  Benefit 
} from './plan';

// Gamification interfaces
export type { 
  Achievement, 
  Quest, 
  Reward, 
  GameProfile 
} from './gamification';

// Notification interfaces
export { 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus, 
  NotificationPriority 
} from './notification';

export type { 
  Notification, 
  NotificationPreference, 
  JourneyNotificationPreference, 
  SendNotificationRequest, 
  NotificationTemplate, 
  NotificationFilter, 
  NotificationCount, 
  AchievementNotificationData, 
  LevelUpNotificationData, 
  AppointmentReminderData, 
  ClaimStatusUpdateData 
} from './notification';

// Add TypeScript module augmentation for global types
declare global {
  /**
   * AUSTA SuperApp namespace for global type augmentation
   */
  namespace AUSTA {
    /**
     * Journey types for the AUSTA SuperApp
     */
    type JourneyType = 'health' | 'care' | 'plan';

    /**
     * Platform types for the AUSTA SuperApp
     */
    type PlatformType = 'web' | 'mobile';
  }
}