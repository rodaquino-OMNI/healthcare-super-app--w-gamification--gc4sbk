/**
 * Experience Points (XP) related interfaces for the gamification system.
 * These interfaces define the structure for tracking user progression through levels,
 * managing XP sources, and handling XP transactions across all journeys.
 */

/**
 * Defines the structure for an experience level in the gamification system.
 * Maps level numbers to the XP thresholds required to reach them.
 */
export interface ExperienceLevel {
  /** The numeric level identifier */
  level: number;
  /** The minimum XP required to reach this level */
  minXp: number;
  /** The maximum XP for this level (before advancing to next level) */
  maxXp: number;
  /** Optional display name for the level (e.g., "Beginner", "Expert") */
  displayName?: string;
  /** Optional badge or icon identifier for visual representation */
  badge?: string;
}

/**
 * Enumeration of possible XP sources in the gamification system.
 * Used to categorize where XP is earned from across all journeys.
 */
export enum XPSource {
  /** XP earned from completing health-related activities */
  HEALTH_ACTIVITY = 'health_activity',
  /** XP earned from achieving health goals */
  HEALTH_GOAL = 'health_goal',
  /** XP earned from connecting health devices */
  HEALTH_DEVICE = 'health_device',
  /** XP earned from logging health metrics */
  HEALTH_METRIC = 'health_metric',
  
  /** XP earned from booking medical appointments */
  CARE_APPOINTMENT = 'care_appointment',
  /** XP earned from completing telemedicine sessions */
  CARE_TELEMEDICINE = 'care_telemedicine',
  /** XP earned from medication adherence */
  CARE_MEDICATION = 'care_medication',
  /** XP earned from completing symptom checks */
  CARE_SYMPTOM_CHECK = 'care_symptom_check',
  
  /** XP earned from submitting insurance claims */
  PLAN_CLAIM = 'plan_claim',
  /** XP earned from utilizing benefits */
  PLAN_BENEFIT = 'plan_benefit',
  /** XP earned from reviewing coverage information */
  PLAN_COVERAGE = 'plan_coverage',
  /** XP earned from uploading plan documents */
  PLAN_DOCUMENT = 'plan_document',
  
  /** XP earned from completing quests */
  QUEST_COMPLETION = 'quest_completion',
  /** XP earned from unlocking achievements */
  ACHIEVEMENT_UNLOCK = 'achievement_unlock',
  /** XP earned from daily login streaks */
  LOGIN_STREAK = 'login_streak',
  /** XP earned from profile completion */
  PROFILE_COMPLETION = 'profile_completion',
  /** XP earned from special events or promotions */
  SPECIAL_EVENT = 'special_event',
  /** XP earned from administrative actions or corrections */
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

/**
 * Defines the structure for an XP transaction in the gamification system.
 * Represents a single instance of XP being earned or deducted.
 */
export interface XPTransaction {
  /** Unique identifier for the transaction */
  id: string;
  /** User ID associated with this transaction */
  userId: string;
  /** Amount of XP earned or deducted (positive for earned, negative for deducted) */
  amount: number;
  /** Source of the XP transaction */
  source: XPSource;
  /** Timestamp when the transaction occurred */
  timestamp: Date;
  /** Optional reference ID to the specific activity that generated this XP */
  referenceId?: string;
  /** Optional description of the transaction */
  description?: string;
  /** Optional multiplier applied to this transaction */
  multiplier?: XPMultiplier;
  /** Journey associated with this transaction (health, care, plan, or cross-journey) */
  journey: 'health' | 'care' | 'plan' | 'cross-journey';
}

/**
 * Defines the structure for an XP multiplier in the gamification system.
 * Used for special events or promotions that provide boosted XP rewards.
 */
export interface XPMultiplier {
  /** Unique identifier for the multiplier */
  id: string;
  /** The multiplier value (e.g., 2.0 for double XP) */
  value: number;
  /** Name of the multiplier event */
  name: string;
  /** Description of why the multiplier is being applied */
  description: string;
  /** Start time when the multiplier becomes active */
  startTime: Date;
  /** End time when the multiplier expires */
  endTime: Date;
  /** Optional specific XP sources this multiplier applies to (if empty, applies to all sources) */
  applicableSources?: XPSource[];
  /** Optional specific journeys this multiplier applies to (if empty, applies to all journeys) */
  applicableJourneys?: Array<'health' | 'care' | 'plan' | 'cross-journey'>;
}

/**
 * Defines the structure for level-up requirements in the gamification system.
 * Specifies conditions that must be met to advance to the next level beyond XP thresholds.
 */
export interface LevelUpRequirement {
  /** The level this requirement applies to */
  level: number;
  /** Array of achievement IDs that must be unlocked to advance */
  requiredAchievements?: string[];
  /** Array of quest IDs that must be completed to advance */
  requiredQuests?: string[];
  /** Minimum number of days the user must be active to advance */
  minimumActiveDays?: number;
  /** Specific journey milestones that must be reached to advance */
  journeyMilestones?: {
    health?: string[];
    care?: string[];
    plan?: string[];
  };
  /** Optional custom validation function name to be called for special requirements */
  customValidation?: string;
}