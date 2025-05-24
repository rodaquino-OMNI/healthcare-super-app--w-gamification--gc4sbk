/**
 * @austa/interfaces/common
 * 
 * This module provides a centralized export point for all common TypeScript interfaces
 * used across the AUSTA SuperApp. These interfaces ensure type safety and consistency
 * between frontend and backend components.
 * 
 * Common interfaces include utility types, model interfaces, error types, response
 * structures, validation schemas, and status types that are shared across multiple domains.
 * 
 * @packageDocumentation
 */

// Re-export all common interfaces from their respective modules

/**
 * Authentication related interfaces
 * 
 * Includes session types, authentication state, and token structures
 */
export type { AuthSession, AuthState } from '../auth';

/**
 * Health journey interfaces
 * 
 * Includes health metrics, medical events, goals, and device connections
 */
export { HealthMetricType } from '../health';
export type { 
  HealthMetric, 
  MedicalEvent, 
  HealthGoal, 
  DeviceConnection 
} from '../health';

/**
 * Care journey interfaces
 * 
 * Includes appointments, medications, telemedicine sessions, and treatment plans
 */
export type { 
  Appointment, 
  Medication, 
  TelemedicineSession, 
  TreatmentPlan 
} from '../care';

/**
 * Plan journey interfaces
 * 
 * Includes insurance plans, claims, coverage, and benefits
 */
export type { 
  ClaimStatus, 
  ClaimType, 
  PlanType, 
  CoverageType, 
  Claim, 
  Plan, 
  Coverage, 
  Benefit 
} from '../plan';

/**
 * Gamification interfaces
 * 
 * Includes achievements, quests, rewards, and user profiles
 */
export type { 
  Achievement, 
  Quest, 
  Reward, 
  GameProfile 
} from '../gamification';

/**
 * Notification interfaces
 * 
 * Includes notification types, channels, statuses, and data structures
 */
export { 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus, 
  NotificationPriority 
} from '../notification';

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
} from '../notification';

/**
 * Common utility types
 * 
 * Shared utility types used across multiple domains
 */
export type Pagination = {
  page: number;
  limit: number;
  total: number;
};

export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  pagination?: Pagination;
};

export type ErrorResponse = {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
};

/**
 * Common status types
 * 
 * Status enums and types used across multiple domains
 */
export enum RequestStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export type SortOptions = {
  field: string;
  direction: SortDirection;
};

export type FilterOptions = Record<string, string | number | boolean | null | undefined>;