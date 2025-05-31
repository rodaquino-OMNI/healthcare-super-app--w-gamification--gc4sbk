/**
 * Notification Data Interfaces
 * 
 * This file defines journey-specific notification data interfaces that determine
 * the payload structure for different notification types in the AUSTA SuperApp.
 * 
 * These interfaces ensure consistent data structures for notification content
 * across all journey contexts (Health, Care, Plan) and the gamification system.
 */

// Import types from journey-specific interfaces
import { Achievement } from '../gamification/achievements';
import { Appointment } from '../care/appointment';
import { Claim, ClaimStatus } from '../plan/claims.types';
import { HealthMetric } from '../health/metric';

/**
 * Base interface for all notification data payloads
 * Provides common properties that all notification data should include
 */
export interface BaseNotificationData {
  /** Unique identifier for the notification data */
  id: string;
  
  /** Timestamp when the notification data was created */
  timestamp: string;
  
  /** Optional metadata for additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Achievement Notification Data
 * 
 * Contains data specific to achievement unlocked notifications from the
 * gamification system. Used to display achievement badges, descriptions,
 * and XP rewards in notification components.
 */
export interface AchievementNotificationData extends BaseNotificationData {
  /** The achievement that was unlocked */
  achievement: Achievement;
  
  /** XP points earned for this achievement */
  xpEarned: number;
  
  /** Optional journey context where the achievement was earned */
  journeyContext?: 'health' | 'care' | 'plan';
  
  /** URL to the achievement badge image */
  badgeImageUrl: string;
  
  /** Whether this is a special or rare achievement */
  isSpecialAchievement?: boolean;
  
  /** Optional related achievements that could be unlocked next */
  relatedAchievements?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  
  /** Validation flag to ensure the achievement is actually unlocked */
  isUnlocked: boolean;
}

/**
 * Level Up Notification Data
 * 
 * Contains data specific to user level progression notifications from the
 * gamification system. Used to display new level, rewards, and unlocked
 * features in notification components.
 */
export interface LevelUpNotificationData extends BaseNotificationData {
  /** Previous user level */
  previousLevel: number;
  
  /** New user level after leveling up */
  newLevel: number;
  
  /** Total XP points the user now has */
  totalXp: number;
  
  /** XP required to reach the next level */
  nextLevelXp: number;
  
  /** New features or benefits unlocked at this level */
  unlockedFeatures?: Array<{
    name: string;
    description: string;
    iconUrl?: string;
  }>;
  
  /** Optional rewards granted for reaching this level */
  levelRewards?: Array<{
    id: string;
    name: string;
    description: string;
    value?: number;
  }>;
  
  /** Validation flag to ensure the level up is legitimate */
  isVerified: boolean;
}

/**
 * Appointment Reminder Data
 * 
 * Contains data specific to appointment reminder notifications from the
 * Care journey. Used to display appointment details, provider information,
 * and action buttons in notification components.
 */
export interface AppointmentReminderData extends BaseNotificationData {
  /** The appointment being reminded about */
  appointment: Appointment;
  
  /** Time remaining until the appointment (in minutes) */
  timeRemaining: number;
  
  /** Whether this is the final reminder before the appointment */
  isFinalReminder: boolean;
  
  /** Location details for in-person appointments */
  locationDetails?: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    directions?: string;
  };
  
  /** Connection details for virtual appointments */
  connectionDetails?: {
    url: string;
    meetingId?: string;
    passcode?: string;
    provider: string;
  };
  
  /** Actions that can be taken from the notification */
  actions: Array<{
    type: 'reschedule' | 'cancel' | 'confirm' | 'join';
    label: string;
    url?: string;
  }>;
  
  /** Validation flag to ensure the appointment is still active */
  isActive: boolean;
}

/**
 * Health Metric Alert Data
 * 
 * Contains data specific to health metric alerts from the Health journey.
 * Used to display metric values, thresholds, and recommended actions
 * in notification components.
 */
export interface HealthMetricAlertData extends BaseNotificationData {
  /** The health metric that triggered the alert */
  metric: HealthMetric;
  
  /** The threshold that was exceeded or not met */
  threshold: {
    min?: number;
    max?: number;
    unit: string;
    description: string;
  };
  
  /** Severity level of the alert */
  severity: 'info' | 'warning' | 'critical';
  
  /** Recommended actions based on the metric value */
  recommendedActions?: Array<{
    description: string;
    priority: number;
    url?: string;
  }>;
  
  /** Historical context for this metric */
  historicalContext?: {
    trend: 'improving' | 'stable' | 'worsening';
    previousReadings: Array<{
      value: number;
      timestamp: string;
    }>;
  };
  
  /** Validation flag to ensure the alert is legitimate */
  isValidated: boolean;
}

/**
 * Claim Status Update Data
 * 
 * Contains data specific to insurance claim status updates from the
 * Plan journey. Used to display claim details, status changes, and
 * next steps in notification components.
 */
export interface ClaimStatusUpdateData extends BaseNotificationData {
  /** The claim that was updated */
  claim: Claim;
  
  /** Previous status of the claim */
  previousStatus: ClaimStatus;
  
  /** New status of the claim */
  newStatus: ClaimStatus;
  
  /** Reason for the status change, if applicable */
  statusChangeReason?: string;
  
  /** Estimated processing time for pending claims (in days) */
  estimatedProcessingTime?: number;
  
  /** Additional documents required, if applicable */
  requiredDocuments?: Array<{
    name: string;
    description: string;
    isRequired: boolean;
    uploadUrl?: string;
  }>;
  
  /** Payment details for approved claims */
  paymentDetails?: {
    amount: number;
    currency: string;
    estimatedPaymentDate?: string;
    paymentMethod?: string;
  };
  
  /** Actions that can be taken from the notification */
  actions: Array<{
    type: 'view' | 'upload' | 'appeal' | 'contact';
    label: string;
    url?: string;
  }>;
  
  /** Validation flag to ensure the status update is legitimate */
  isVerified: boolean;
}

/**
 * Medication Reminder Data
 * 
 * Contains data specific to medication reminders from the Care journey.
 * Used to display medication details, dosage instructions, and action
 * buttons in notification components.
 */
export interface MedicationReminderData extends BaseNotificationData {
  /** Name of the medication */
  medicationName: string;
  
  /** Dosage information */
  dosage: {
    amount: number;
    unit: string;
    instructions?: string;
  };
  
  /** Time the medication should be taken */
  scheduledTime: string;
  
  /** Whether this is a recurring reminder */
  isRecurring: boolean;
  
  /** Importance of this medication */
  importance: 'low' | 'medium' | 'high';
  
  /** Actions that can be taken from the notification */
  actions: Array<{
    type: 'taken' | 'snooze' | 'skip';
    label: string;
    url?: string;
  }>;
  
  /** Streak of consecutive days taking this medication */
  currentStreak?: number;
  
  /** Validation flag to ensure the reminder is still active */
  isActive: boolean;
}

/**
 * Type union of all notification data types
 * Used for type narrowing when handling notifications
 */
export type NotificationData =
  | AchievementNotificationData
  | LevelUpNotificationData
  | AppointmentReminderData
  | HealthMetricAlertData
  | ClaimStatusUpdateData
  | MedicationReminderData;