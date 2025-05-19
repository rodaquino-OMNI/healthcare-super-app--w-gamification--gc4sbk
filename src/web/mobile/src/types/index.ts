/**
 * Index file that exports all shared types for use in the mobile application.
 * This provides a centralized location for importing types across the
 * Health, Care, and Plan journeys as well as authentication, gamification,
 * and notification systems.
 * 
 * All types are imported from the @austa/interfaces package, which provides
 * standardized TypeScript interfaces shared between frontend and backend.
 */

// Authentication types
export type { AuthSession, AuthState } from '@austa/interfaces/auth';

// Health journey types
export type { 
  HealthMetric, 
  MedicalEvent, 
  HealthGoal, 
  DeviceConnection 
} from '@austa/interfaces/health';
export { HealthMetricType } from '@austa/interfaces/health';

// Care journey types
export type { 
  Appointment, 
  Medication, 
  TelemedicineSession, 
  TreatmentPlan 
} from '@austa/interfaces/care';

// Plan journey types
export type {
  ClaimStatus, 
  ClaimType, 
  PlanType, 
  CoverageType,
  Claim, 
  Plan, 
  Coverage, 
  Benefit
} from '@austa/interfaces/plan';

// Gamification types
export type { 
  Achievement, 
  Quest, 
  Reward, 
  GameProfile 
} from '@austa/interfaces/gamification';

// Notification types
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
} from '@austa/interfaces/notification';

export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority
} from '@austa/interfaces/notification';