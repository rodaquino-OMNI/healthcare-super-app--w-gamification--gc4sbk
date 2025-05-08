/**
 * @austa/interfaces/gamification
 * 
 * This module exports all TypeScript interfaces for the cross-journey gamification engine.
 * It provides a single entry point for importing interfaces related to achievements,
 * events, leaderboards, profiles, quests, rewards, and rules used throughout the
 * gamification system.
 * 
 * @packageDocumentation
 */

/**
 * Achievement interfaces for tracking user accomplishments across journeys.
 * These interfaces define the structure of achievements, their status, and
 * user-achievement relationships.
 */
export namespace Achievements {
  /**
   * Defines the structure for an achievement in the gamification system.
   * Achievements represent milestones that users can unlock by performing
   * specific actions or reaching certain thresholds.
   */
  export interface Achievement {
    /** Unique identifier for the achievement */
    id: string;
    /** Display title of the achievement */
    title: string;
    /** Detailed description of what the achievement represents */
    description: string;
    /** Which journey this achievement belongs to (health, care, plan) */
    journey: string;
    /** Icon identifier for visual representation */
    icon: string;
    /** Current progress toward unlocking the achievement */
    progress: number;
    /** Total progress needed to unlock the achievement */
    total: number;
    /** Whether the achievement has been unlocked */
    unlocked: boolean;
  }

  /**
   * Enum representing the possible types of achievements in the system.
   */
  export enum AchievementType {
    /** Journey-specific achievements tied to a single journey */
    JOURNEY = 'JOURNEY',
    /** Achievements that span multiple journeys */
    CROSS_JOURNEY = 'CROSS_JOURNEY',
    /** Limited-time or event-based achievements */
    SPECIAL = 'SPECIAL'
  }

  /**
   * Enum representing all possible states of an achievement for a specific user.
   */
  export enum AchievementStatus {
    /** Achievement is locked and not yet available to the user */
    LOCKED = 'LOCKED',
    /** User has started progress toward the achievement */
    IN_PROGRESS = 'IN_PROGRESS',
    /** User has completed the achievement */
    UNLOCKED = 'UNLOCKED'
  }

  /**
   * Represents the relationship between a user and an achievement.
   * Tracks a user's progress toward unlocking achievements.
   */
  export interface UserAchievement {
    /** Unique identifier for the user-achievement relationship */
    id: string;
    /** Reference to the user's profile ID */
    profileId: string;
    /** Reference to the achievement ID */
    achievementId: string;
    /** Current progress toward completing the achievement */
    progress: number;
    /** Whether the achievement has been unlocked by the user */
    unlocked: boolean;
    /** Timestamp when the achievement was unlocked (if applicable) */
    unlockedAt?: Date;
  }
}

/**
 * Event interfaces for the gamification event processing system.
 * These interfaces define the structure of events that trigger
 * gamification rules, achievements, and rewards.
 */
export namespace Events {
  /**
   * Data transfer object for processing events within the gamification engine.
   * This defines the structure and validation rules for events received from 
   * various journeys in the AUSTA SuperApp. Events are used to award points,
   * track achievements, and trigger gamification elements.
   */
  export interface ProcessEventDto {
    /**
     * The type of the event.
     * Examples: 
     * - 'HEALTH_METRIC_RECORDED' - User recorded a health metric
     * - 'APPOINTMENT_BOOKED' - User booked a medical appointment
     * - 'CLAIM_SUBMITTED' - User submitted an insurance claim
     * - 'MEDICATION_TAKEN' - User logged taking medication
     * - 'GOAL_ACHIEVED' - User achieved a health goal
     */
    type: string;

    /**
     * The ID of the user associated with the event.
     * This must be a valid UUID and identify a registered user in the system.
     */
    userId: string;

    /**
     * The data associated with the event.
     * This contains journey-specific details about the event, such as:
     * - Health journey: metric type, value, unit
     * - Care journey: appointment details, provider information
     * - Plan journey: claim amount, claim type
     */
    data: object;

    /**
     * The journey associated with the event.
     * Possible values: 
     * - 'health' - My Health journey
     * - 'care' - Care Now journey
     * - 'plan' - My Plan & Benefits journey
     * This field is optional but recommended for better context.
     */
    journey?: string;
  }

  /**
   * Base interface for all events in the gamification system.
   */
  export interface BaseEvent {
    /** Unique identifier for the event */
    id: string;
    /** Type of the event */
    type: string;
    /** Timestamp when the event occurred */
    timestamp: Date;
    /** User ID associated with the event */
    userId: string;
    /** Journey context for the event (health, care, plan) */
    journey?: string;
    /** Version of the event schema for backward compatibility */
    version: string;
  }

  /**
   * Interface for event payloads with versioning support.
   */
  export interface VersionedEvent<T = any> extends BaseEvent {
    /** Typed payload data for the event */
    payload: T;
  }

  /**
   * Specialized interface for health journey events.
   */
  export interface HealthEvent extends BaseEvent {
    /** Indicates this is a health journey event */
    journey: 'health';
    /** Health-specific event data */
    payload: {
      /** Type of health metric (steps, weight, blood_pressure, etc.) */
      metricType?: string;
      /** Value of the health metric */
      value?: number;
      /** Unit of measurement for the health metric */
      unit?: string;
      /** Health goal information if applicable */
      goal?: {
        /** ID of the goal */
        id: string;
        /** Current progress toward the goal */
        progress: number;
        /** Whether the goal was achieved */
        achieved: boolean;
      };
    };
  }

  /**
   * Specialized interface for care journey events.
   */
  export interface CareEvent extends BaseEvent {
    /** Indicates this is a care journey event */
    journey: 'care';
    /** Care-specific event data */
    payload: {
      /** Appointment information if applicable */
      appointment?: {
        /** ID of the appointment */
        id: string;
        /** Type of appointment */
        type: string;
        /** Provider information */
        provider: string;
      };
      /** Medication information if applicable */
      medication?: {
        /** ID of the medication */
        id: string;
        /** Name of the medication */
        name: string;
        /** Whether the medication was taken */
        taken: boolean;
      };
    };
  }

  /**
   * Specialized interface for plan journey events.
   */
  export interface PlanEvent extends BaseEvent {
    /** Indicates this is a plan journey event */
    journey: 'plan';
    /** Plan-specific event data */
    payload: {
      /** Claim information if applicable */
      claim?: {
        /** ID of the claim */
        id: string;
        /** Type of claim */
        type: string;
        /** Amount of the claim */
        amount: number;
        /** Status of the claim */
        status: string;
      };
      /** Benefit information if applicable */
      benefit?: {
        /** ID of the benefit */
        id: string;
        /** Type of benefit */
        type: string;
        /** Whether the benefit was used */
        used: boolean;
      };
    };
  }

  /**
   * Union type for all journey-specific events.
   */
  export type JourneyEvent = HealthEvent | CareEvent | PlanEvent;

  /**
   * Interface for standardized event processing responses.
   */
  export interface EventResponse {
    /** Whether the event was processed successfully */
    success: boolean;
    /** Error message if processing failed */
    error?: string;
    /** Achievements triggered by the event */
    achievements?: Achievements.Achievement[];
    /** Experience points awarded from the event */
    xpAwarded?: number;
    /** Quests progressed by the event */
    questsProgressed?: Quests.Quest[];
  }
}

/**
 * Profile interfaces for user gamification profiles.
 * These interfaces define the structure of user profiles in the
 * gamification system, including level, XP, and achievements.
 */
export namespace Profiles {
  /**
   * Defines the structure for a user's game profile in the gamification system.
   * The game profile tracks the user's progress, level, and engagement
   * across the platform.
   */
  export interface GameProfile {
    /** Unique identifier for the profile */
    id: string;
    /** User ID associated with this profile */
    userId: string;
    /** User's current level in the gamification system */
    level: number;
    /** User's current experience points */
    xp: number;
    /** Total experience points earned over time */
    totalXp: number;
    /** Collection of the user's achievements (both locked and unlocked) */
    achievements?: Achievements.UserAchievement[];
    /** Collection of the user's quests (both active and completed) */
    quests?: Quests.UserQuest[];
    /** Timestamp when the profile was created */
    createdAt: Date;
    /** Timestamp when the profile was last updated */
    updatedAt: Date;
  }

  /**
   * Interface for profile-related events like level-ups and XP changes.
   */
  export interface ProfileEvent extends Events.BaseEvent {
    /** Type of profile event */
    type: 'PROFILE_CREATED' | 'LEVEL_UP' | 'XP_ADDED';
    /** Profile-specific event data */
    payload: {
      /** Profile ID */
      profileId: string;
      /** New level if applicable */
      newLevel?: number;
      /** Previous level if applicable */
      previousLevel?: number;
      /** XP added if applicable */
      xpAdded?: number;
      /** Current total XP */
      currentXp?: number;
    };
  }

  /**
   * Interface for standardized profile API responses.
   */
  export interface ProfileResponse {
    /** The game profile data */
    profile: GameProfile;
    /** Recent achievements */
    recentAchievements?: Achievements.Achievement[];
    /** Active quests */
    activeQuests?: Quests.Quest[];
    /** XP needed for next level */
    xpForNextLevel?: number;
  }
}

/**
 * Quest interfaces for time-limited challenges in the gamification system.
 * These interfaces define the structure of quests, their progress tracking,
 * and user-quest relationships.
 */
export namespace Quests {
  /**
   * Defines the structure for a quest in the gamification system.
   * Quests are time-limited challenges that users can complete to
   * earn rewards and progress in the system.
   */
  export interface Quest {
    /** Unique identifier for the quest */
    id: string;
    /** Display title of the quest */
    title: string;
    /** Detailed description of what the quest involves */
    description: string;
    /** Which journey this quest belongs to (health, care, plan) */
    journey: string;
    /** Icon identifier for visual representation */
    icon: string;
    /** Current progress toward completing the quest */
    progress: number;
    /** Total progress needed to complete the quest */
    total: number;
    /** Whether the quest has been completed */
    completed: boolean;
    /** Experience points rewarded for completing the quest */
    xpReward: number;
    /** Start date of the quest availability */
    startDate?: Date;
    /** End date of the quest availability */
    endDate?: Date;
  }

  /**
   * Represents the relationship between a user and a quest.
   * Tracks a user's progress toward completing quests.
   */
  export interface UserQuest {
    /** Unique identifier for the user-quest relationship */
    id: string;
    /** Reference to the user's profile ID */
    profileId: string;
    /** Reference to the quest ID */
    questId: string;
    /** Current progress toward completing the quest */
    progress: number;
    /** Whether the quest has been completed by the user */
    completed: boolean;
    /** Timestamp when the quest was completed (if applicable) */
    completedAt?: Date;
    /** Timestamp when the quest was started by the user */
    startedAt: Date;
  }

  /**
   * Interface for quest-related events like starting and completing quests.
   */
  export interface QuestEvent extends Events.BaseEvent {
    /** Type of quest event */
    type: 'QUEST_STARTED' | 'QUEST_COMPLETED' | 'QUEST_PROGRESS';
    /** Quest-specific event data */
    payload: {
      /** Quest ID */
      questId: string;
      /** Profile ID */
      profileId: string;
      /** Current progress */
      progress?: number;
      /** Whether the quest was completed */
      completed?: boolean;
    };
  }

  /**
   * Interface for filtering quests in queries.
   */
  export interface QuestFilter {
    /** Filter by journey */
    journey?: string;
    /** Filter by completion status */
    completed?: boolean;
    /** Filter by start date range */
    startDateRange?: {
      /** Start date lower bound */
      from: Date;
      /** Start date upper bound */
      to: Date;
    };
    /** Filter by end date range */
    endDateRange?: {
      /** End date lower bound */
      from: Date;
      /** End date upper bound */
      to: Date;
    };
    /** Pagination offset */
    offset?: number;
    /** Pagination limit */
    limit?: number;
    /** Sorting criteria */
    sort?: {
      /** Field to sort by */
      field: string;
      /** Sort direction */
      direction: 'ASC' | 'DESC';
    };
  }
}

/**
 * Reward interfaces for gamification rewards.
 * These interfaces define the structure of rewards that users can earn
 * by completing quests, unlocking achievements, or reaching milestones.
 */
export namespace Rewards {
  /**
   * Defines the structure for a reward in the gamification system.
   * Rewards are granted to users for completing quests, unlocking
   * achievements, or reaching certain milestones.
   */
  export interface Reward {
    /** Unique identifier for the reward */
    id: string;
    /** Display title of the reward */
    title: string;
    /** Detailed description of what the reward provides */
    description: string;
    /** Which journey this reward is associated with */
    journey: string;
    /** Icon identifier for visual representation */
    icon: string;
    /** Experience points value of the reward */
    xp: number;
    /** Whether this is a premium reward */
    isPremium?: boolean;
    /** Cost in points or currency if applicable */
    cost?: number;
    /** Availability start date */
    availableFrom?: Date;
    /** Availability end date */
    availableTo?: Date;
  }

  /**
   * Represents the relationship between a user and a reward.
   * Tracks rewards that have been granted to users.
   */
  export interface UserReward {
    /** Unique identifier for the user-reward relationship */
    id: string;
    /** Reference to the user's profile ID */
    profileId: string;
    /** Reference to the reward ID */
    rewardId: string;
    /** Timestamp when the reward was granted */
    grantedAt: Date;
    /** Whether the reward has been claimed/used */
    claimed: boolean;
    /** Timestamp when the reward was claimed (if applicable) */
    claimedAt?: Date;
  }

  /**
   * Interface for reward-related events like granting and claiming rewards.
   */
  export interface RewardEvent extends Events.BaseEvent {
    /** Type of reward event */
    type: 'REWARD_GRANTED' | 'REWARD_CLAIMED';
    /** Reward-specific event data */
    payload: {
      /** Reward ID */
      rewardId: string;
      /** Profile ID */
      profileId: string;
      /** Source of the reward (achievement, quest, etc.) */
      source?: string;
      /** Source ID if applicable */
      sourceId?: string;
    };
  }

  /**
   * Interface for standardized reward API responses.
   */
  export interface RewardResponse {
    /** The reward data */
    reward: Reward;
    /** Whether the user has earned this reward */
    earned: boolean;
    /** Whether the user has claimed this reward */
    claimed: boolean;
    /** Timestamp when the reward was earned (if applicable) */
    earnedAt?: Date;
    /** Requirements to earn this reward */
    requirements?: string[];
  }
}

/**
 * Rule interfaces for the gamification rule engine.
 * These interfaces define the structure of rules that determine when
 * achievements are unlocked, quests are completed, and rewards are granted.
 */
export namespace Rules {
  /**
   * Defines the structure for a rule in the gamification system.
   * Rules determine when achievements are unlocked, quests are completed,
   * and rewards are granted based on user actions and events.
   */
  export interface Rule {
    /** Unique identifier for the rule */
    id: string;
    /** Display name of the rule */
    name: string;
    /** Description of what the rule does */
    description: string;
    /** Whether the rule is currently active */
    isActive: boolean;
    /** Event types that can trigger this rule */
    eventTypes: string[];
    /** Journey context for the rule */
    journeyContext?: {
      /** Journeys this rule applies to */
      journeys: string[];
      /** Whether this rule applies across journeys */
      isCrossJourney: boolean;
    };
    /** Priority of the rule (higher numbers execute first) */
    priority: number;
    /** Version of the rule for backward compatibility */
    version: string;
  }

  /**
   * Interface for rule conditions that determine when a rule is triggered.
   */
  export interface RuleCondition {
    /** Type of condition */
    type: 'SIMPLE' | 'COMPOUND';
    /** Field to evaluate for simple conditions */
    field?: string;
    /** Operator for comparison */
    operator?: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'NOT_CONTAINS';
    /** Value to compare against */
    value?: any;
    /** Logical operator for compound conditions */
    logicalOperator?: 'AND' | 'OR';
    /** Nested conditions for compound conditions */
    conditions?: RuleCondition[];
  }

  /**
   * Interface for rule actions that execute when a rule is triggered.
   */
  export interface RuleAction {
    /** Type of action */
    type: 'AWARD_XP' | 'UNLOCK_ACHIEVEMENT' | 'PROGRESS_QUEST' | 'GRANT_REWARD';
    /** Parameters for the action */
    parameters: {
      /** Amount of XP to award for AWARD_XP actions */
      xpAmount?: number;
      /** Achievement ID for UNLOCK_ACHIEVEMENT actions */
      achievementId?: string;
      /** Quest ID for PROGRESS_QUEST actions */
      questId?: string;
      /** Amount of progress to add for PROGRESS_QUEST actions */
      progressAmount?: number;
      /** Reward ID for GRANT_REWARD actions */
      rewardId?: string;
    };
  }

  /**
   * Interface for rule events that trigger rule evaluation.
   */
  export interface RuleEvent extends Events.BaseEvent {
    /** Context for rule evaluation */
    evaluationContext: {
      /** User profile data */
      profile: Profiles.GameProfile;
      /** Event data that triggered the rule */
      event: Events.BaseEvent;
      /** Additional context data */
      context?: Record<string, any>;
    };
  }
}

/**
 * Leaderboard interfaces for gamification leaderboards.
 * These interfaces define the structure of leaderboards that track
 * user rankings based on XP, achievements, or other metrics.
 */
export namespace Leaderboards {
  /**
   * Defines the structure for a leaderboard entry in the gamification system.
   */
  export interface LeaderboardEntry {
    /** User ID */
    userId: string;
    /** User's display name */
    displayName: string;
    /** User's avatar URL */
    avatarUrl?: string;
    /** User's current level */
    level: number;
    /** User's score on this leaderboard */
    score: number;
    /** User's rank on this leaderboard */
    rank: number;
    /** Whether this entry represents the current user */
    isCurrentUser: boolean;
    /** User's achievement count */
    achievementCount?: number;
  }

  /**
   * Interface for leaderboard configuration.
   */
  export interface LeaderboardConfig {
    /** Unique identifier for the leaderboard */
    id: string;
    /** Display name of the leaderboard */
    name: string;
    /** Description of the leaderboard */
    description: string;
    /** Metric used for ranking (xp, achievements, etc.) */
    metric: string;
    /** Time period for the leaderboard */
    period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
    /** Journey context for the leaderboard */
    journey?: string;
    /** Maximum number of entries to display */
    limit: number;
    /** Whether the leaderboard is currently active */
    isActive: boolean;
  }

  /**
   * Interface for leaderboard API responses.
   */
  export interface LeaderboardResponse {
    /** Leaderboard configuration */
    config: LeaderboardConfig;
    /** Leaderboard entries */
    entries: LeaderboardEntry[];
    /** Current user's entry if available */
    currentUserEntry?: LeaderboardEntry;
    /** Total number of users on the leaderboard */
    totalUsers: number;
    /** Timestamp when the leaderboard was last updated */
    lastUpdated: Date;
  }
}

// Direct exports for backward compatibility
export type {
  Achievements.Achievement as Achievement,
  Quests.Quest as Quest,
  Rewards.Reward as Reward,
  Profiles.GameProfile as GameProfile,
  Events.ProcessEventDto as ProcessEventDto
};

// Export enums directly for easier usage
export {
  Achievements.AchievementType as AchievementType,
  Achievements.AchievementStatus as AchievementStatus
};