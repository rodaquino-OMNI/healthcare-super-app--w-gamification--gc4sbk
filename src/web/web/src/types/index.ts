/**
 * Type definitions index for AUSTA SuperApp web application
 * 
 * This file aggregates and re-exports all shared TypeScript types used 
 * throughout the application. By providing a single import point, it improves
 * code organization and reduces import complexity for components and services.
 * 
 * The types are organized by journey (Health, Care, Plan) and cross-cutting
 * concerns (Authentication, Gamification, Notifications).
 * 
 * IMPORTANT: This file maintains backward compatibility by re-exporting types
 * from the centralized @austa/interfaces package. This approach simplifies
 * maintenance while preserving existing import paths throughout the application.
 */

// Authentication types
export type { 
  AuthSession, 
  AuthState 
} from '@austa/interfaces/auth';

// Health Journey types
export { 
  HealthMetricType 
} from '@austa/interfaces/health';

export type { 
  HealthMetric, 
  MedicalEvent, 
  HealthGoal, 
  DeviceConnection 
} from '@austa/interfaces/health';

// Care Journey types
export type { 
  Appointment, 
  Medication, 
  TelemedicineSession, 
  TreatmentPlan 
} from '@austa/interfaces/care';

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
} from '@austa/interfaces/plan';

// Gamification types
export type { 
  Achievement, 
  Quest, 
  Reward, 
  GameProfile 
} from '@austa/interfaces/gamification';

// Notification types
export { 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus, 
  NotificationPriority 
} from '@austa/interfaces/notification';

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