/**
 * @file Experience Points (XP) related interfaces for the gamification system
 * @description Defines interfaces for the XP system that tracks user progression
 * through levels, sources of XP, and XP transactions. These interfaces are used
 * by both web and mobile applications to ensure consistent implementation.
 */

/**
 * Defines the structure for an experience level in the gamification system.
 * Maps level numbers to the XP thresholds required to reach them.
 */
export interface ExperienceLevel {
  /** The numeric level value */
  level: number;
  /** XP threshold required to reach this level */
  threshold: number;
  /** Optional title for this level (e.g., "Beginner", "Expert") */
  title?: string;
  /** Optional benefits unlocked at this level */
  benefits?: string[];
  /** Optional badge image URL for this level */
  badgeUrl?: string;
}

/**
 * Enum defining the possible sources of XP in the gamification system.
 * Used to categorize where XP comes from for analytics and display purposes.
 */
export enum XPSource {
  /** XP earned from completing health-related activities */
  HEALTH_ACTIVITY = 'health_activity',
  /** XP earned from tracking health metrics consistently */
  HEALTH_TRACKING = 'health_tracking',
  /** XP earned from achieving health goals */
  HEALTH_GOAL = 'health_goal',
  /** XP earned from connecting health devices */
  HEALTH_DEVICE = 'health_device',
  
  /** XP earned from booking medical appointments */
  CARE_APPOINTMENT = 'care_appointment',
  /** XP earned from attending telemedicine sessions */
  CARE_TELEMEDICINE = 'care_telemedicine',
  /** XP earned from medication adherence */
  CARE_MEDICATION = 'care_medication',
  /** XP earned from completing symptom checks */
  CARE_SYMPTOM_CHECK = 'care_symptom_check',
  
  /** XP earned from submitting insurance claims */
  PLAN_CLAIM = 'plan_claim',
  /** XP earned from utilizing benefits */
  PLAN_BENEFIT = 'plan_benefit',
  /** XP earned from reviewing coverage details */
  PLAN_COVERAGE = 'plan_coverage',
  /** XP earned from using cost simulators */
  PLAN_COST_SIMULATOR = 'plan_cost_simulator',
  
  /** XP earned from completing quests */
  QUEST_COMPLETION = 'quest_completion',
  /** XP earned from unlocking achievements */
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  /** XP earned from daily logins */
  DAILY_LOGIN = 'daily_login',
  /** XP earned from completing profile information */
  PROFILE_COMPLETION = 'profile_completion',
  /** XP earned from special events or promotions */
  SPECIAL_EVENT = 'special_event',
  /** XP earned from referrals */
  REFERRAL = 'referral',
}

/**
 * Defines the structure for an XP transaction in the gamification system.
 * Represents a single instance of XP being awarded to or deducted from a user.
 */
export interface XPTransaction {
  /** Unique identifier for the transaction */
  id: string;
  /** User ID associated with this transaction */
  userId: string;
  /** Amount of XP awarded (positive) or deducted (negative) */
  amount: number;
  /** Source of the XP transaction */
  source: XPSource;
  /** Timestamp when the transaction occurred */
  timestamp: Date;
  /** Optional description of the transaction */
  description?: string;
  /** Optional reference to related entity (achievement ID, quest ID, etc.) */
  referenceId?: string;
  /** Optional multiplier applied to this transaction */
  multiplier?: XPMultiplier;
}

/**
 * Defines the structure for an XP multiplier in the gamification system.
 * Used for special events or promotions that boost XP rewards.
 */
export interface XPMultiplier {
  /** Unique identifier for the multiplier */
  id: string;
  /** Name of the multiplier event */
  name: string;
  /** Multiplier value (e.g., 2.0 for double XP) */
  value: number;
  /** Start time when the multiplier becomes active */
  startTime: Date;
  /** End time when the multiplier expires */
  endTime: Date;
  /** Optional description of the multiplier event */
  description?: string;
  /** Optional array of XP sources this multiplier applies to (if empty, applies to all) */
  applicableSources?: XPSource[];
  /** Optional journey this multiplier applies to (if undefined, applies to all) */
  journey?: 'health' | 'care' | 'plan';
}

/**
 * Defines the structure for level-up requirements in the gamification system.
 * Specifies additional conditions beyond XP thresholds needed to advance levels.
 */
export interface LevelUpRequirement {
  /** The level this requirement applies to */
  targetLevel: number;
  /** Array of achievement IDs that must be unlocked to reach this level */
  requiredAchievements?: string[];
  /** Array of quest IDs that must be completed to reach this level */
  requiredQuests?: string[];
  /** Minimum number of days the user must be active */
  minimumDaysActive?: number;
  /** Whether the user needs to complete their profile */
  requireCompleteProfile?: boolean;
  /** Journey-specific requirements */
  journeyRequirements?: {
    /** Health journey requirements */
    health?: {
      /** Minimum number of health metrics that must be tracked */
      minTrackedMetrics?: number;
      /** Whether a device connection is required */
      requireDeviceConnection?: boolean;
    };
    /** Care journey requirements */
    care?: {
      /** Minimum number of appointments that must be booked */
      minAppointmentsBooked?: number;
      /** Whether a telemedicine session is required */
      requireTelemedicineSession?: boolean;
    };
    /** Plan journey requirements */
    plan?: {
      /** Minimum number of claims that must be submitted */
      minClaimsSubmitted?: number;
      /** Whether benefit utilization is required */
      requireBenefitUtilization?: boolean;
    };
  };
}

/**
 * Defines the structure for XP summary statistics in the gamification system.
 * Provides an overview of a user's XP earnings and level progression.
 */
export interface XPSummary {
  /** Total XP accumulated by the user */
  totalXp: number;
  /** User's current level */
  currentLevel: number;
  /** XP required for the next level */
  nextLevelThreshold: number;
  /** XP earned since the last level up */
  xpSinceLastLevel: number;
  /** XP needed to reach the next level */
  xpToNextLevel: number;
  /** Percentage progress to the next level (0-100) */
  levelProgress: number;
  /** XP earned in the current day */
  todayXp: number;
  /** XP earned in the current week */
  weeklyXp: number;
  /** XP earned in the current month */
  monthlyXp: number;
  /** Array of recent XP transactions */
  recentTransactions: XPTransaction[];
  /** Currently active XP multipliers */
  activeMultipliers: XPMultiplier[];
}