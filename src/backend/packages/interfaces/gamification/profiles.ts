import { Achievement } from './achievements';
import { Quest } from './quests';
import { Reward } from './rewards';

/**
 * Defines the structure for a user's game profile in the gamification system.
 * The game profile tracks the user's progress, level, and engagement
 * across all journeys in the platform.
 */
export interface GameProfile {
  /**
   * Unique identifier for the game profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id?: string;

  /**
   * Reference to the user who owns this game profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId?: string;

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
  nextLevelXp?: number;

  /**
   * Collection of the user's achievements (both locked and unlocked)
   * Includes all achievements that the user has unlocked or is progressing towards
   */
  achievements?: Achievement[];

  /**
   * Collection of the user's quests (both active and completed)
   * Includes all quests that the user has completed or is currently working on
   */
  quests?: Quest[];

  /**
   * Collection of rewards that the user has earned
   * Includes all rewards that have been granted to the user
   */
  rewards?: Reward[];

  /**
   * Date when the profile was created
   */
  createdAt?: Date;

  /**
   * Date when the profile was last updated
   */
  updatedAt?: Date;

  /**
   * Optional metadata for additional profile properties
   * Stored as a JSON object
   * @example { "lastJourney": "health", "preferences": { "notifications": true } }
   */
  metadata?: Record<string, any>;

  /**
   * Version number, used for optimistic concurrency control
   */
  version?: number;
}

/**
 * Defines the structure for a user's streak information in the gamification system.
 * Streaks track consecutive days of activity and provide bonuses for consistent engagement.
 */
export interface UserStreak {
  /**
   * Unique identifier for the streak
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id?: string;

  /**
   * Reference to the user who owns this streak
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;

  /**
   * The current streak count (consecutive days)
   * @default 0
   * @minimum 0
   */
  currentStreak: number;

  /**
   * The user's longest streak (historical high)
   * @default 0
   * @minimum 0
   */
  longestStreak: number;

  /**
   * The date of the last activity that counted toward the streak
   */
  lastActivityDate: Date;

  /**
   * The journey associated with this streak (health, care, plan)
   * If undefined, represents a cross-journey streak
   */
  journey?: string;

  /**
   * The type of activity being tracked for this streak
   * @example "login", "exercise", "medication"
   */
  activityType: string;

  /**
   * Optional metadata for additional streak properties
   * @example { "bonusMultiplier": 1.5, "milestones": [7, 30, 90] }
   */
  metadata?: Record<string, any>;
}

/**
 * Defines the structure for a user's badge in the gamification system.
 * Badges are visual indicators of achievements or status that users can display on their profile.
 */
export interface UserBadge {
  /**
   * Unique identifier for the badge
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id?: string;

  /**
   * Reference to the user who owns this badge
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;

  /**
   * The name of the badge
   * @example "Health Champion", "Care Expert", "Plan Master"
   */
  name: string;

  /**
   * Description of what the badge represents
   * @example "Completed all health assessments"
   */
  description: string;

  /**
   * The journey associated with this badge (health, care, plan)
   * If undefined, represents a cross-journey badge
   */
  journey?: string;

  /**
   * Icon identifier for visual representation
   * @example "trophy", "medal", "star"
   */
  icon: string;

  /**
   * The date when the badge was earned
   */
  earnedAt: Date;

  /**
   * Whether the badge is currently displayed on the user's profile
   * @default true
   */
  isDisplayed?: boolean;

  /**
   * The rarity level of the badge
   * @example "common", "rare", "epic", "legendary"
   */
  rarity?: string;

  /**
   * Optional metadata for additional badge properties
   * @example { "color": "gold", "animation": "sparkle" }
   */
  metadata?: Record<string, any>;
}

/**
 * Defines the structure for a user's activity summary in the gamification system.
 * Activity summaries provide an overview of user engagement across different journeys.
 */
export interface UserActivitySummary {
  /**
   * Reference to the user this activity summary belongs to
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  userId: string;

  /**
   * Total number of achievements unlocked
   * @default 0
   */
  totalAchievements: number;

  /**
   * Total number of quests completed
   * @default 0
   */
  totalQuests: number;

  /**
   * Total experience points earned
   * @default 0
   */
  totalXp: number;

  /**
   * Journey-specific activity counts
   */
  journeyActivity?: {
    /**
     * Health journey activity metrics
     */
    health?: {
      achievements: number;
      quests: number;
      xp: number;
    };

    /**
     * Care journey activity metrics
     */
    care?: {
      achievements: number;
      quests: number;
      xp: number;
    };

    /**
     * Plan journey activity metrics
     */
    plan?: {
      achievements: number;
      quests: number;
      xp: number;
    };
  };

  /**
   * Date range for this activity summary
   */
  period?: {
    /**
     * Start date of the activity period
     */
    startDate: Date;

    /**
     * End date of the activity period
     */
    endDate: Date;
  };

  /**
   * Optional metadata for additional activity metrics
   * @example { "mostActiveJourney": "health", "activeDays": 5 }
   */
  metadata?: Record<string, any>;
}

/**
 * Defines the structure for a user's level progression in the gamification system.
 * Level progression tracks the user's advancement through the gamification levels.
 */
export interface LevelProgression {
  /**
   * The user's current level
   * @minimum 1
   */
  currentLevel: number;

  /**
   * The user's current XP
   * @minimum 0
   */
  currentXp: number;

  /**
   * XP required to reach the next level
   * @minimum 1
   */
  nextLevelXp: number;

  /**
   * Percentage progress toward the next level (0-100)
   * @minimum 0
   * @maximum 100
   */
  progressPercentage: number;

  /**
   * XP remaining to reach the next level
   * @minimum 0
   */
  xpRemaining: number;

  /**
   * Array of level thresholds for reference
   * Each entry represents the total XP required to reach that level
   * @example [0, 100, 283, 520, 800, 1118]
   */
  levelThresholds?: number[];
}