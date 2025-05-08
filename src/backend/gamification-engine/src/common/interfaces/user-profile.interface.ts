import { User } from '@austa/interfaces/auth';
import { Achievement } from '@austa/interfaces/gamification/achievements';

/**
 * Interface for user profile in the gamification engine
 * 
 * This interface defines the structure of user profiles used throughout the gamification engine.
 * It includes properties for user identification, experience points, level, badges, and journey-specific metrics.
 * 
 * @version 1.0.0
 */
export interface IUserProfile {
  /**
   * Unique identifier for the user profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * Reference to the user who owns this profile
   * Uses the standardized User interface from @austa/interfaces/auth
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;

  /**
   * The user's current level in the gamification system
   * Starts at level 1 and increases as the user gains XP
   * @default 1
   * @minimum 1
   */
  level: number;

  /**
   * The user's current experience points
   * Accumulates as the user completes actions, achievements, and quests
   * @default 0
   * @minimum 0
   */
  xp: number;

  /**
   * The total XP required to reach the next level
   * This is calculated based on the current level
   * @default 100
   * @minimum 100
   */
  nextLevelXp: number;

  /**
   * Date when the profile was created
   */
  createdAt: Date;

  /**
   * Date when the profile was last updated
   */
  updatedAt: Date;

  /**
   * Optional metadata for additional profile properties
   * Stored as a JSON object
   * @example { "lastJourney": "health", "preferences": { "notifications": true } }
   */
  metadata?: Record<string, any>;

  /**
   * Version number for optimistic concurrency control
   * Automatically incremented when the profile is updated
   */
  version: number;

  /**
   * List of achievements that the user has unlocked or is progressing towards
   */
  achievements?: Achievement[];

  /**
   * Journey-specific metrics for the user
   * Contains metrics for each journey (health, care, plan)
   */
  journeyMetrics?: IJourneyMetrics;
}

/**
 * Interface for journey-specific metrics
 * 
 * This interface defines the structure of journey-specific metrics used in user profiles.
 * It includes metrics for each journey (health, care, plan).
 * 
 * @version 1.0.0
 */
export interface IJourneyMetrics {
  /**
   * Health journey metrics
   */
  health?: IHealthJourneyMetrics;

  /**
   * Care journey metrics
   */
  care?: ICareJourneyMetrics;

  /**
   * Plan journey metrics
   */
  plan?: IPlanJourneyMetrics;
}

/**
 * Interface for health journey metrics
 * 
 * This interface defines the structure of health journey metrics used in user profiles.
 * It includes metrics like steps, active minutes, and health goals completed.
 * 
 * @version 1.0.0
 */
export interface IHealthJourneyMetrics {
  /**
   * Total steps recorded by the user
   * @default 0
   * @minimum 0
   */
  totalSteps?: number;

  /**
   * Total active minutes recorded by the user
   * @default 0
   * @minimum 0
   */
  totalActiveMinutes?: number;

  /**
   * Number of health goals completed by the user
   * @default 0
   * @minimum 0
   */
  goalsCompleted?: number;

  /**
   * Number of health metrics recorded by the user
   * @default 0
   * @minimum 0
   */
  metricsRecorded?: number;

  /**
   * Number of connected health devices
   * @default 0
   * @minimum 0
   */
  connectedDevices?: number;

  /**
   * Current streak of consecutive days with recorded health metrics
   * @default 0
   * @minimum 0
   */
  currentStreak?: number;

  /**
   * Longest streak of consecutive days with recorded health metrics
   * @default 0
   * @minimum 0
   */
  longestStreak?: number;

  /**
   * Additional health journey metrics
   * Stored as a JSON object
   */
  additionalMetrics?: Record<string, any>;
}

/**
 * Interface for care journey metrics
 * 
 * This interface defines the structure of care journey metrics used in user profiles.
 * It includes metrics like appointments attended, medications tracked, and telemedicine sessions.
 * 
 * @version 1.0.0
 */
export interface ICareJourneyMetrics {
  /**
   * Number of appointments attended by the user
   * @default 0
   * @minimum 0
   */
  appointmentsAttended?: number;

  /**
   * Number of medications being tracked by the user
   * @default 0
   * @minimum 0
   */
  medicationsTracked?: number;

  /**
   * Number of telemedicine sessions completed by the user
   * @default 0
   * @minimum 0
   */
  telemedicineSessions?: number;

  /**
   * Percentage of medication adherence
   * @default 0
   * @minimum 0
   * @maximum 100
   */
  medicationAdherence?: number;

  /**
   * Number of symptom checks completed by the user
   * @default 0
   * @minimum 0
   */
  symptomChecksCompleted?: number;

  /**
   * Number of care plans created for the user
   * @default 0
   * @minimum 0
   */
  carePlansCreated?: number;

  /**
   * Additional care journey metrics
   * Stored as a JSON object
   */
  additionalMetrics?: Record<string, any>;
}

/**
 * Interface for plan journey metrics
 * 
 * This interface defines the structure of plan journey metrics used in user profiles.
 * It includes metrics like claims submitted, benefits utilized, and documents uploaded.
 * 
 * @version 1.0.0
 */
export interface IPlanJourneyMetrics {
  /**
   * Number of claims submitted by the user
   * @default 0
   * @minimum 0
   */
  claimsSubmitted?: number;

  /**
   * Number of benefits utilized by the user
   * @default 0
   * @minimum 0
   */
  benefitsUtilized?: number;

  /**
   * Number of documents uploaded by the user
   * @default 0
   * @minimum 0
   */
  documentsUploaded?: number;

  /**
   * Percentage of plan coverage utilized
   * @default 0
   * @minimum 0
   * @maximum 100
   */
  coverageUtilization?: number;

  /**
   * Number of plan comparisons made by the user
   * @default 0
   * @minimum 0
   */
  planComparisons?: number;

  /**
   * Number of rewards redeemed by the user
   * @default 0
   * @minimum 0
   */
  rewardsRedeemed?: number;

  /**
   * Additional plan journey metrics
   * Stored as a JSON object
   */
  additionalMetrics?: Record<string, any>;
}

/**
 * Interface for user profile with versioning support
 * 
 * This interface extends the IUserProfile interface with a version property
 * to support backward compatibility.
 * 
 * @version 1.0.0
 */
export interface IVersionedUserProfile extends IUserProfile {
  /**
   * API version of the user profile
   * Used for backward compatibility
   * @example "1.0.0"
   */
  apiVersion: string;
}

/**
 * Interface for user profile notification
 * 
 * This interface defines the structure of user profile notifications
 * used for achievement notifications and level-up events.
 * 
 * @version 1.0.0
 */
export interface IUserProfileNotification {
  /**
   * User ID associated with the notification
   */
  userId: string;

  /**
   * Type of notification
   * @example "achievement_unlocked" | "level_up" | "quest_completed" | "reward_earned"
   */
  type: 'achievement_unlocked' | 'level_up' | 'quest_completed' | 'reward_earned';

  /**
   * Title of the notification
   * @example "Achievement Unlocked: First Steps"
   */
  title: string;

  /**
   * Message of the notification
   * @example "You've taken your first steps towards better health!"
   */
  message: string;

  /**
   * Optional data associated with the notification
   * Contains additional information about the achievement, level, quest, or reward
   */
  data?: {
    /**
     * Achievement ID if the notification is for an achievement
     */
    achievementId?: string;

    /**
     * New level if the notification is for a level up
     */
    newLevel?: number;

    /**
     * XP earned if the notification is for XP
     */
    xpEarned?: number;

    /**
     * Quest ID if the notification is for a quest
     */
    questId?: string;

    /**
     * Reward ID if the notification is for a reward
     */
    rewardId?: string;

    /**
     * Journey associated with the notification
     * @example "health" | "care" | "plan"
     */
    journey?: 'health' | 'care' | 'plan';

    /**
     * Additional data
     */
    [key: string]: any;
  };

  /**
   * Date when the notification was created
   */
  createdAt: Date;
}