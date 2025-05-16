/**
 * Notification Data Interfaces
 * 
 * This file defines journey-specific notification data interfaces that determine
 * the payload structure for different notification types in the AUSTA SuperApp.
 * These interfaces ensure consistent data structures for notification content
 * across all journey contexts.
 */

// Import types from other journeys for cross-referencing
import { Achievement, AchievementCategory } from '../gamification/achievements';
import { ExperienceLevel } from '../gamification/xp';
import { AppointmentType } from '../care/types';
import { ClaimStatus, ClaimType } from '../plan/claims.types';

/**
 * Achievement Notification Data
 * 
 * Contains data specific to achievement unlock notifications from the gamification system.
 * This interface is used when a user unlocks a new achievement and should receive
 * a notification about it.
 */
export interface AchievementNotificationData {
  /** Unique identifier of the unlocked achievement */
  achievementId: string;
  
  /** Title of the unlocked achievement */
  achievementTitle: string;
  
  /** Description of the unlocked achievement */
  achievementDescription: string;
  
  /** Category of the achievement (health, care, plan, etc.) */
  category: AchievementCategory;
  
  /** URL to the achievement badge image */
  badgeImageUrl: string;
  
  /** Experience points earned from this achievement */
  xpEarned: number;
  
  /** Optional rewards associated with this achievement */
  rewards?: {
    /** Reward identifier */
    id: string;
    /** Reward title */
    title: string;
    /** Reward description */
    description: string;
  }[];
  
  /** Timestamp when the achievement was unlocked */
  unlockedAt: string;
  
  /** 
   * Validation hash to ensure notification data integrity
   * Used to verify the achievement was legitimately unlocked
   */
  validationHash: string;
}

/**
 * Level Up Notification Data
 * 
 * Contains data specific to user level progression notifications from the gamification system.
 * This interface is used when a user gains enough XP to reach a new level.
 */
export interface LevelUpNotificationData {
  /** The new level the user has reached */
  newLevel: number;
  
  /** Previous level the user was at */
  previousLevel: number;
  
  /** Details about the new level */
  levelDetails: {
    /** Title of the new level */
    title: string;
    /** Description of the new level */
    description: string;
    /** XP threshold for this level */
    xpThreshold: number;
    /** Benefits unlocked at this level */
    benefits: string[];
  };
  
  /** URL to the level badge image */
  levelBadgeUrl: string;
  
  /** New capabilities unlocked at this level */
  unlockedCapabilities?: string[];
  
  /** Timestamp when the level up occurred */
  leveledUpAt: string;
  
  /** 
   * Next level information to show progression path
   * Helps motivate users to continue earning XP
   */
  nextLevel?: {
    /** Next level number */
    level: number;
    /** XP needed to reach next level */
    xpNeeded: number;
    /** Title of the next level */
    title: string;
  };
  
  /** 
   * Validation hash to ensure notification data integrity
   * Used to verify the level up was legitimate
   */
  validationHash: string;
}

/**
 * Appointment Reminder Data
 * 
 * Contains data specific to healthcare appointment reminders from the Care journey.
 * This interface is used for notifications about upcoming appointments.
 */
export interface AppointmentReminderData {
  /** Unique identifier of the appointment */
  appointmentId: string;
  
  /** Type of appointment (in-person, virtual) */
  appointmentType: AppointmentType;
  
  /** Title or purpose of the appointment */
  title: string;
  
  /** Scheduled date and time of the appointment (ISO string) */
  scheduledAt: string;
  
  /** Time until the appointment in a human-readable format (e.g., "tomorrow at 2pm", "in 30 minutes") */
  timeUntil: string;
  
  /** Provider information */
  provider: {
    /** Provider ID */
    id: string;
    /** Provider name */
    name: string;
    /** Provider specialty */
    specialty?: string;
    /** Provider profile image URL */
    imageUrl?: string;
  };
  
  /** Location information for in-person appointments */
  location?: {
    /** Location name */
    name: string;
    /** Street address */
    address: string;
    /** City */
    city: string;
    /** State/province */
    state: string;
    /** Postal code */
    postalCode: string;
    /** Optional directions or notes */
    directions?: string;
  };
  
  /** Virtual session information for telemedicine appointments */
  virtualSession?: {
    /** Session URL */
    joinUrl: string;
    /** Session code */
    sessionCode?: string;
    /** Whether the app supports direct launch of the session */
    canLaunchFromApp: boolean;
  };
  
  /** 
   * Required preparation instructions for the appointment
   * E.g., "Fast for 12 hours before the appointment"
   */
  preparationInstructions?: string[];
  
  /** 
   * Actions the user can take directly from the notification
   * E.g., reschedule, cancel, confirm
   */
  availableActions: {
    /** Action type */
    type: 'reschedule' | 'cancel' | 'confirm' | 'join';
    /** Action label */
    label: string;
    /** Whether this action is recommended */
    isRecommended?: boolean;
  }[];
  
  /** 
   * Validation hash to ensure notification data integrity
   * Used to verify the appointment reminder is legitimate
   */
  validationHash: string;
}

/**
 * Claim Status Update Data
 * 
 * Contains data specific to insurance claim status updates from the Plan journey.
 * This interface is used for notifications about changes to a user's insurance claims.
 */
export interface ClaimStatusUpdateData {
  /** Unique identifier of the claim */
  claimId: string;
  
  /** Type of claim */
  claimType: ClaimType;
  
  /** Previous status of the claim */
  previousStatus: ClaimStatus;
  
  /** New status of the claim */
  newStatus: ClaimStatus;
  
  /** Human-readable description of the status change */
  statusChangeDescription: string;
  
  /** Timestamp when the status was updated */
  updatedAt: string;
  
  /** Claim details */
  claim: {
    /** Claim reference number */
    referenceNumber: string;
    /** Service date */
    serviceDate: string;
    /** Provider name */
    providerName: string;
    /** Claim amount */
    amount: number;
    /** Currency code */
    currency: string;
  };
  
  /** Financial information for processed claims */
  financialDetails?: {
    /** Amount approved */
    approvedAmount?: number;
    /** Amount paid */
    paidAmount?: number;
    /** Patient responsibility amount */
    patientResponsibility?: number;
    /** Payment date if applicable */
    paymentDate?: string;
    /** Payment method if applicable */
    paymentMethod?: string;
  };
  
  /** 
   * Required actions the user needs to take
   * E.g., "Submit additional documentation"
   */
  requiredActions?: {
    /** Action type */
    type: string;
    /** Action description */
    description: string;
    /** Deadline for the action if applicable */
    deadline?: string;
  }[];
  
  /** 
   * Documents associated with this status update
   * E.g., Explanation of Benefits (EOB)
   */
  documents?: {
    /** Document ID */
    id: string;
    /** Document type */
    type: string;
    /** Document title */
    title: string;
    /** Document URL */
    url: string;
  }[];
  
  /** 
   * Validation hash to ensure notification data integrity
   * Used to verify the claim status update is legitimate
   */
  validationHash: string;
}

/**
 * Health Goal Achievement Data
 * 
 * Contains data specific to health goal achievement notifications from the Health journey.
 * This interface is used when a user reaches a health-related goal.
 */
export interface HealthGoalAchievementData {
  /** Unique identifier of the health goal */
  goalId: string;
  
  /** Title of the health goal */
  goalTitle: string;
  
  /** Description of the health goal */
  goalDescription: string;
  
  /** Type of health metric associated with this goal */
  metricType: string;
  
  /** Target value that was achieved */
  targetValue: number;
  
  /** Unit of measurement */
  unit: string;
  
  /** Actual value achieved */
  achievedValue: number;
  
  /** Percentage of goal completion */
  completionPercentage: number;
  
  /** Timestamp when the goal was achieved */
  achievedAt: string;
  
  /** Experience points earned from this goal achievement */
  xpEarned: number;
  
  /** 
   * Related achievements that were unlocked
   * Links health goals to the gamification system
   */
  relatedAchievements?: {
    /** Achievement ID */
    id: string;
    /** Achievement title */
    title: string;
  }[];
  
  /** 
   * Suggested next goals to maintain engagement
   * Encourages continued health tracking
   */
  suggestedNextGoals?: {
    /** Goal ID */
    id: string;
    /** Goal title */
    title: string;
    /** Goal description */
    description: string;
  }[];
  
  /** 
   * Validation hash to ensure notification data integrity
   * Used to verify the goal achievement is legitimate
   */
  validationHash: string;
}