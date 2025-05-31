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

// Re-export journey-specific interfaces
export * as Health from './health';
export * as Care from './care';
export * as Plan from './plan';

// Re-export cross-cutting concerns
export * as Auth from './auth';
export * as Gamification from './gamification';
export * as Notification from './notification';

// Re-export shared interfaces
export * as Common from './common';
export * as Themes from './themes';
export * as Components from './components';
export * as API from './api';

// Re-export Next.js specific interfaces
export * as Next from './next';

// Direct exports of commonly used types for backward compatibility

// Auth types
export type { AuthSession, AuthState } from './auth';

// Health Journey types
export { HealthMetricType } from './health';
export type { HealthMetric, MedicalEvent, HealthGoal, DeviceConnection } from './health';

// Care Journey types
export type { 
  Appointment, 
  Medication, 
  TelemedicineSession, 
  TreatmentPlan 
} from './care';

// Plan Journey types
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

// Gamification types
export type { 
  Achievement, 
  Quest, 
  Reward, 
  GameProfile 
} from './gamification';

// Notification types
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

/**
 * Type declaration to support module augmentation
 * This allows consumers to extend interfaces in a type-safe way
 */
declare global {
  namespace AustaInterfaces {
    // Journey namespaces
    export import Health = Interfaces.Health;
    export import Care = Interfaces.Care;
    export import Plan = Interfaces.Plan;
    
    // Cross-cutting namespaces
    export import Auth = Interfaces.Auth;
    export import Gamification = Interfaces.Gamification;
    export import Notification = Interfaces.Notification;
    
    // Shared namespaces
    export import Common = Interfaces.Common;
    export import Themes = Interfaces.Themes;
    export import Components = Interfaces.Components;
    export import API = Interfaces.API;
    export import Next = Interfaces.Next;
  }
}

// Self-reference for namespace support
import * as Interfaces from '.';

// Default export for ESM compatibility
export default {
  Health,
  Care,
  Plan,
  Auth,
  Gamification,
  Notification,
  Common,
  Themes,
  Components,
  API,
  Next
};