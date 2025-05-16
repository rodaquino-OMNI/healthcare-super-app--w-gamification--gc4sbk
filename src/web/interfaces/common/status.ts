/**
 * @file Common Status Types
 * @description Defines standardized status enums and types used across all domains in the AUSTA SuperApp.
 * These types ensure consistent terminology and state management throughout the application
 * and help maintain a unified user experience across all journeys.
 */

/**
 * Represents the activation status of an entity.
 * Used for enabling/disabling features, accounts, or other activatable items.
 */
export enum ActiveStatus {
  /** Entity is active and fully functional */
  ACTIVE = 'active',
  /** Entity is inactive and not currently functional */
  INACTIVE = 'inactive',
  /** Entity is awaiting activation */
  PENDING = 'pending'
}

/**
 * Represents the progress status of a task, goal, or process.
 * Used for tracking completion status across the application.
 */
export enum ProgressStatus {
  /** Task or process has not been started */
  NOT_STARTED = 'not_started',
  /** Task or process is currently in progress */
  IN_PROGRESS = 'in_progress',
  /** Task or process has been completed */
  COMPLETED = 'completed',
  /** Task or process has been paused */
  PAUSED = 'paused',
  /** Task or process has been cancelled */
  CANCELLED = 'cancelled'
}

/**
 * Represents the approval status of an entity that requires review.
 * Used for workflows that involve approval processes.
 */
export enum ApprovalStatus {
  /** Entity is awaiting approval */
  PENDING = 'pending',
  /** Entity has been approved */
  APPROVED = 'approved',
  /** Entity has been rejected */
  REJECTED = 'rejected',
  /** Additional information is required before approval can proceed */
  ADDITIONAL_INFO_REQUIRED = 'additional_info_required',
  /** Entity is under review */
  IN_REVIEW = 'in_review'
}

/**
 * Represents the visibility status of an entity.
 * Used for controlling whether items are visible to users.
 */
export enum VisibilityStatus {
  /** Entity is visible to all applicable users */
  VISIBLE = 'visible',
  /** Entity is hidden from all users */
  HIDDEN = 'hidden',
  /** Entity is visible only to specific users or roles */
  RESTRICTED = 'restricted'
}

/**
 * Represents the stage of a multi-step process.
 * Used for tracking progress through defined workflows.
 */
export enum ProcessStageStatus {
  /** Process is in the initial stage */
  INITIAL = 'initial',
  /** Process is in an intermediate stage */
  INTERMEDIATE = 'intermediate',
  /** Process is in the final stage */
  FINAL = 'final',
  /** Process has been completed */
  COMPLETED = 'completed',
  /** Process has failed */
  FAILED = 'failed'
}

/**
 * Represents the status of a health-related goal.
 * Used specifically in the Health journey for goal tracking.
 */
export enum HealthGoalStatus {
  /** Goal has been created but progress has not started */
  NOT_STARTED = 'not_started',
  /** Progress is being made toward the goal */
  IN_PROGRESS = 'in_progress',
  /** Goal has been achieved */
  ACHIEVED = 'achieved',
  /** Goal has been abandoned */
  ABANDONED = 'abandoned',
  /** Goal deadline has passed without achievement */
  EXPIRED = 'expired'
}

/**
 * Represents the status of a device connection.
 * Used in the Health journey for tracking connected health devices.
 */
export enum DeviceConnectionStatus {
  /** Device is connected and actively syncing data */
  CONNECTED = 'connected',
  /** Device was previously connected but is currently disconnected */
  DISCONNECTED = 'disconnected',
  /** Connection to the device is pending authorization */
  PENDING_AUTHORIZATION = 'pending_authorization',
  /** Device connection has been authorized but not yet established */
  AUTHORIZED = 'authorized',
  /** Device connection has failed */
  CONNECTION_FAILED = 'connection_failed'
}

/**
 * Represents the status of an insurance claim.
 * Used in the Plan journey for tracking claim processing.
 */
export type ClaimStatus = 
  | 'pending'               // Claim has been submitted but not yet processed
  | 'approved'              // Claim has been approved
  | 'denied'                // Claim has been denied
  | 'additional_info_required'; // Additional information is needed to process the claim

/**
 * Represents the status of an appointment.
 * Used in the Care journey for tracking appointment scheduling.
 */
export enum AppointmentStatus {
  /** Appointment has been scheduled */
  SCHEDULED = 'scheduled',
  /** Appointment has been confirmed */
  CONFIRMED = 'confirmed',
  /** Appointment has been completed */
  COMPLETED = 'completed',
  /** Appointment has been cancelled */
  CANCELLED = 'cancelled',
  /** Patient did not attend the appointment */
  NO_SHOW = 'no_show',
  /** Appointment has been rescheduled */
  RESCHEDULED = 'rescheduled'
}

/**
 * Represents the status of a medication regimen.
 * Used in the Care journey for tracking medication adherence.
 */
export enum MedicationStatus {
  /** Medication is currently active */
  ACTIVE = 'active',
  /** Medication has been discontinued */
  DISCONTINUED = 'discontinued',
  /** Medication is on hold */
  ON_HOLD = 'on_hold',
  /** Medication has been completed */
  COMPLETED = 'completed'
}

/**
 * Represents the status of a notification.
 * Used in the notification system across all journeys.
 */
export enum NotificationStatus {
  /** Notification has been delivered but not yet read */
  DELIVERED = 'delivered',
  /** Notification has been read by the user */
  READ = 'read',
  /** Notification has been dismissed by the user */
  DISMISSED = 'dismissed',
  /** Notification delivery has failed */
  FAILED = 'failed',
  /** Notification is scheduled for future delivery */
  SCHEDULED = 'scheduled'
}

/**
 * Represents the status of a gamification achievement.
 * Used in the gamification system across all journeys.
 */
export enum AchievementStatus {
  /** Achievement is locked and not yet available to the user */
  LOCKED = 'locked',
  /** Achievement is available but not yet completed */
  AVAILABLE = 'available',
  /** Achievement has been completed */
  COMPLETED = 'completed',
  /** Achievement has been claimed with rewards collected */
  CLAIMED = 'claimed'
}

/**
 * Represents the status of a quest or challenge.
 * Used in the gamification system across all journeys.
 */
export enum QuestStatus {
  /** Quest is available to start */
  AVAILABLE = 'available',
  /** Quest is in progress */
  IN_PROGRESS = 'in_progress',
  /** Quest has been completed */
  COMPLETED = 'completed',
  /** Quest has expired without completion */
  EXPIRED = 'expired',
  /** Quest has been failed */
  FAILED = 'failed'
}