import { registerAs } from '@nestjs/config';
import { GamificationConfig } from '@austa/interfaces/gamification';

/**
 * Defines the gamification-specific configuration for the Gamification Engine,
 * loading values from environment variables with enhanced control over game mechanics.
 * 
 * This configuration centralizes all gamification settings to ensure consistent
 * behavior across the application and all user journeys.
 */
export const gamificationConfig = registerAs('gamification', (): GamificationConfig => ({
  /**
   * Points configuration with granular control over point awards for different actions
   * across all journeys (Health, Care, Plan).
   */
  points: {
    // Default point values for common actions across journeys
    defaultValues: {
      // Health journey points
      healthMetricRecorded: parseInt(process.env.POINTS_HEALTH_METRIC_RECORDED, 10) || 10,
      healthGoalCreated: parseInt(process.env.POINTS_HEALTH_GOAL_CREATED, 10) || 15,
      healthGoalCompleted: parseInt(process.env.POINTS_HEALTH_GOAL_COMPLETED, 10) || 100,
      deviceConnected: parseInt(process.env.POINTS_DEVICE_CONNECTED, 10) || 25,
      dailyStepsGoalMet: parseInt(process.env.POINTS_DAILY_STEPS_GOAL_MET, 10) || 20,
      weeklyActivityGoalMet: parseInt(process.env.POINTS_WEEKLY_ACTIVITY_GOAL_MET, 10) || 50,
      
      // Care journey points
      appointmentBooked: parseInt(process.env.POINTS_APPOINTMENT_BOOKED, 10) || 20,
      appointmentAttended: parseInt(process.env.POINTS_APPOINTMENT_ATTENDED, 10) || 50,
      medicationAdherenceDaily: parseInt(process.env.POINTS_MEDICATION_ADHERENCE_DAILY, 10) || 15,
      medicationAdherenceWeekly: parseInt(process.env.POINTS_MEDICATION_ADHERENCE_WEEKLY, 10) || 30,
      telemedicineSessionCompleted: parseInt(process.env.POINTS_TELEMEDICINE_SESSION_COMPLETED, 10) || 40,
      symptomCheckerCompleted: parseInt(process.env.POINTS_SYMPTOM_CHECKER_COMPLETED, 10) || 15,
      
      // Plan journey points
      claimSubmitted: parseInt(process.env.POINTS_CLAIM_SUBMITTED, 10) || 15,
      claimApproved: parseInt(process.env.POINTS_CLAIM_APPROVED, 10) || 25,
      benefitUtilized: parseInt(process.env.POINTS_BENEFIT_UTILIZED, 10) || 30,
      planReviewCompleted: parseInt(process.env.POINTS_PLAN_REVIEW_COMPLETED, 10) || 35,
      documentUploaded: parseInt(process.env.POINTS_DOCUMENT_UPLOADED, 10) || 10,
      
      // Cross-journey points
      profileCompleted: parseInt(process.env.POINTS_PROFILE_COMPLETED, 10) || 50,
      dailyLoginStreak: parseInt(process.env.POINTS_DAILY_LOGIN_STREAK, 10) || 5,
      weeklyLoginStreak: parseInt(process.env.POINTS_WEEKLY_LOGIN_STREAK, 10) || 25,
      monthlyLoginStreak: parseInt(process.env.POINTS_MONTHLY_LOGIN_STREAK, 10) || 100,
      feedbackProvided: parseInt(process.env.POINTS_FEEDBACK_PROVIDED, 10) || 20,
    },
    
    // Multipliers for special conditions (e.g., events, promotions)
    multipliers: {
      weekendBonus: parseFloat(process.env.MULTIPLIER_WEEKEND_BONUS) || 1.5,
      streakBonus: parseFloat(process.env.MULTIPLIER_STREAK_BONUS) || 1.2,
      challengeBonus: parseFloat(process.env.MULTIPLIER_CHALLENGE_BONUS) || 2.0,
      firstTimeBonus: parseFloat(process.env.MULTIPLIER_FIRST_TIME_BONUS) || 2.0,
    },
    
    // Limits to prevent abuse and ensure balanced progression
    limits: {
      maxPointsPerDay: parseInt(process.env.MAX_POINTS_PER_DAY, 10) || 1000,
      maxPointsPerAction: parseInt(process.env.MAX_POINTS_PER_ACTION, 10) || 500,
      maxPointsPerJourney: {
        health: parseInt(process.env.MAX_POINTS_PER_JOURNEY_HEALTH, 10) || 500,
        care: parseInt(process.env.MAX_POINTS_PER_JOURNEY_CARE, 10) || 500,
        plan: parseInt(process.env.MAX_POINTS_PER_JOURNEY_PLAN, 10) || 500,
      },
      maxMultiplier: parseFloat(process.env.MAX_MULTIPLIER) || 5.0,
    },
  },
  
  /**
   * Achievement configuration with detailed settings for achievement behavior,
   * notifications, and progression tracking.
   */
  achievements: {
    // General achievement settings
    enabled: process.env.ACHIEVEMENTS_ENABLED !== 'false', // Enabled by default
    notificationsEnabled: process.env.ACHIEVEMENTS_NOTIFICATIONS_ENABLED !== 'false', // Enabled by default
    progressTrackingEnabled: process.env.ACHIEVEMENTS_PROGRESS_TRACKING_ENABLED !== 'false', // Enabled by default
    
    // Achievement progression and display settings
    display: {
      showLockedAchievements: process.env.SHOW_LOCKED_ACHIEVEMENTS !== 'false', // Enabled by default
      showProgress: process.env.SHOW_ACHIEVEMENT_PROGRESS !== 'false', // Enabled by default
      showCompletionDate: process.env.SHOW_ACHIEVEMENT_COMPLETION_DATE !== 'false', // Enabled by default
    },
    
    // Achievement tiers and progression
    tiers: {
      bronze: {
        name: process.env.ACHIEVEMENT_TIER_BRONZE_NAME || 'Bronze',
        pointValue: parseInt(process.env.ACHIEVEMENT_TIER_BRONZE_POINTS, 10) || 50,
      },
      silver: {
        name: process.env.ACHIEVEMENT_TIER_SILVER_NAME || 'Silver',
        pointValue: parseInt(process.env.ACHIEVEMENT_TIER_SILVER_POINTS, 10) || 100,
      },
      gold: {
        name: process.env.ACHIEVEMENT_TIER_GOLD_NAME || 'Gold',
        pointValue: parseInt(process.env.ACHIEVEMENT_TIER_GOLD_POINTS, 10) || 200,
      },
      platinum: {
        name: process.env.ACHIEVEMENT_TIER_PLATINUM_NAME || 'Platinum',
        pointValue: parseInt(process.env.ACHIEVEMENT_TIER_PLATINUM_POINTS, 10) || 500,
      },
    },
    
    // Achievement categories for organization
    categories: {
      health: process.env.ACHIEVEMENT_CATEGORY_HEALTH || 'Health',
      care: process.env.ACHIEVEMENT_CATEGORY_CARE || 'Care',
      plan: process.env.ACHIEVEMENT_CATEGORY_PLAN || 'Plan',
      general: process.env.ACHIEVEMENT_CATEGORY_GENERAL || 'General',
      special: process.env.ACHIEVEMENT_CATEGORY_SPECIAL || 'Special',
    },
  },
  
  /**
   * Quest configuration with settings for time-limited challenges
   * that users can complete to earn rewards.
   */
  quests: {
    // General quest settings
    enabled: process.env.QUESTS_ENABLED !== 'false', // Enabled by default
    maxConcurrentQuests: parseInt(process.env.MAX_CONCURRENT_QUESTS, 10) || 5,
    refreshInterval: parseInt(process.env.QUEST_REFRESH_INTERVAL, 10) || 86400000, // 24 hours in milliseconds
    
    // Quest difficulty levels and rewards
    difficultyLevels: {
      easy: {
        name: process.env.QUEST_DIFFICULTY_EASY_NAME || 'Easy',
        pointMultiplier: parseFloat(process.env.QUEST_DIFFICULTY_EASY_MULTIPLIER) || 1.0,
        timeLimit: parseInt(process.env.QUEST_DIFFICULTY_EASY_TIME_LIMIT, 10) || 86400000, // 24 hours
      },
      medium: {
        name: process.env.QUEST_DIFFICULTY_MEDIUM_NAME || 'Medium',
        pointMultiplier: parseFloat(process.env.QUEST_DIFFICULTY_MEDIUM_MULTIPLIER) || 1.5,
        timeLimit: parseInt(process.env.QUEST_DIFFICULTY_MEDIUM_TIME_LIMIT, 10) || 259200000, // 3 days
      },
      hard: {
        name: process.env.QUEST_DIFFICULTY_HARD_NAME || 'Hard',
        pointMultiplier: parseFloat(process.env.QUEST_DIFFICULTY_HARD_MULTIPLIER) || 2.0,
        timeLimit: parseInt(process.env.QUEST_DIFFICULTY_HARD_TIME_LIMIT, 10) || 604800000, // 7 days
      },
    },
    
    // Quest types and categories
    categories: {
      daily: process.env.QUEST_CATEGORY_DAILY || 'Daily',
      weekly: process.env.QUEST_CATEGORY_WEEKLY || 'Weekly',
      journey: process.env.QUEST_CATEGORY_JOURNEY || 'Journey',
      special: process.env.QUEST_CATEGORY_SPECIAL || 'Special',
    },
  },
  
  /**
   * Rewards configuration with settings for items that users can earn
   * by completing achievements and quests.
   */
  rewards: {
    // General reward settings
    enabled: process.env.REWARDS_ENABLED !== 'false', // Enabled by default
    redemptionEnabled: process.env.REWARDS_REDEMPTION_ENABLED !== 'false', // Enabled by default
    expirationDays: parseInt(process.env.REWARDS_EXPIRATION_DAYS, 10) || 30,
    
    // Reward types and categories
    types: {
      badge: process.env.REWARD_TYPE_BADGE || 'Badge',
      item: process.env.REWARD_TYPE_ITEM || 'Item',
      discount: process.env.REWARD_TYPE_DISCOUNT || 'Discount',
      premium: process.env.REWARD_TYPE_PREMIUM || 'Premium',
    },
    
    // Reward tiers and values
    tiers: {
      common: {
        name: process.env.REWARD_TIER_COMMON_NAME || 'Common',
        requiredLevel: parseInt(process.env.REWARD_TIER_COMMON_REQUIRED_LEVEL, 10) || 1,
      },
      uncommon: {
        name: process.env.REWARD_TIER_UNCOMMON_NAME || 'Uncommon',
        requiredLevel: parseInt(process.env.REWARD_TIER_UNCOMMON_REQUIRED_LEVEL, 10) || 5,
      },
      rare: {
        name: process.env.REWARD_TIER_RARE_NAME || 'Rare',
        requiredLevel: parseInt(process.env.REWARD_TIER_RARE_REQUIRED_LEVEL, 10) || 10,
      },
      epic: {
        name: process.env.REWARD_TIER_EPIC_NAME || 'Epic',
        requiredLevel: parseInt(process.env.REWARD_TIER_EPIC_REQUIRED_LEVEL, 10) || 20,
      },
      legendary: {
        name: process.env.REWARD_TIER_LEGENDARY_NAME || 'Legendary',
        requiredLevel: parseInt(process.env.REWARD_TIER_LEGENDARY_REQUIRED_LEVEL, 10) || 30,
      },
    },
  },
  
  /**
   * Leaderboard configuration with enhanced Redis Sorted Sets integration
   * for improved performance and reliability.
   */
  leaderboard: {
    // General leaderboard settings
    enabled: process.env.LEADERBOARD_ENABLED !== 'false', // Enabled by default
    updateInterval: parseInt(process.env.LEADERBOARD_UPDATE_INTERVAL, 10) || 900000, // 15 minutes
    maxEntries: parseInt(process.env.LEADERBOARD_MAX_ENTRIES, 10) || 100,
    defaultTimeframe: process.env.LEADERBOARD_DEFAULT_TIMEFRAME || 'weekly',
    
    // Redis Sorted Sets configuration for leaderboard caching
    redis: {
      // Key prefixes for different leaderboard types
      keyPrefixes: {
        global: process.env.LEADERBOARD_KEY_PREFIX_GLOBAL || 'leaderboard:global',
        health: process.env.LEADERBOARD_KEY_PREFIX_HEALTH || 'leaderboard:health',
        care: process.env.LEADERBOARD_KEY_PREFIX_CARE || 'leaderboard:care',
        plan: process.env.LEADERBOARD_KEY_PREFIX_PLAN || 'leaderboard:plan',
      },
      
      // TTL settings for different timeframes
      ttl: {
        daily: parseInt(process.env.LEADERBOARD_TTL_DAILY, 10) || 86400, // 1 day
        weekly: parseInt(process.env.LEADERBOARD_TTL_WEEKLY, 10) || 604800, // 7 days
        monthly: parseInt(process.env.LEADERBOARD_TTL_MONTHLY, 10) || 2592000, // 30 days
        allTime: parseInt(process.env.LEADERBOARD_TTL_ALL_TIME, 10) || 31536000, // 365 days
      },
      
      // Batch processing settings for leaderboard updates
      batchSize: parseInt(process.env.LEADERBOARD_BATCH_SIZE, 10) || 100,
      
      // Size management to prevent unbounded growth
      sizeManagement: {
        enabled: process.env.LEADERBOARD_SIZE_MANAGEMENT_ENABLED !== 'false', // Enabled by default
        maxSizePerLeaderboard: parseInt(process.env.LEADERBOARD_MAX_SIZE_PER_LEADERBOARD, 10) || 10000,
        pruneThreshold: parseInt(process.env.LEADERBOARD_PRUNE_THRESHOLD, 10) || 9000,
        pruneToSize: parseInt(process.env.LEADERBOARD_PRUNE_TO_SIZE, 10) || 8000,
      },
      
      // Resilience settings for Redis connection issues
      resilience: {
        retryAttempts: parseInt(process.env.LEADERBOARD_RETRY_ATTEMPTS, 10) || 3,
        retryDelay: parseInt(process.env.LEADERBOARD_RETRY_DELAY, 10) || 1000, // 1 second
        fallbackToDatabase: process.env.LEADERBOARD_FALLBACK_TO_DATABASE !== 'false', // Enabled by default
      },
      
      // Handling ties (same score) configuration
      tieHandling: {
        // Strategy options: 'lexicographical' (default Redis behavior), 'timestamp' (first achieved), 'shared' (same rank)
        strategy: process.env.LEADERBOARD_TIE_HANDLING_STRATEGY || 'timestamp',
        // When using timestamp strategy, this determines if earlier or later timestamps get higher rank
        timestampPriority: process.env.LEADERBOARD_TIMESTAMP_PRIORITY || 'earlier', // 'earlier' or 'later'
      },
      
      // Monitoring configuration for Redis Sorted Sets
      monitoring: {
        enabled: process.env.LEADERBOARD_MONITORING_ENABLED !== 'false', // Enabled by default
        sizeCheckInterval: parseInt(process.env.LEADERBOARD_SIZE_CHECK_INTERVAL, 10) || 3600000, // 1 hour
        alertThreshold: parseInt(process.env.LEADERBOARD_ALERT_THRESHOLD, 10) || 8000, // Alert when size exceeds this value
      },
    },
    
    // Timeframes for leaderboard rankings
    timeframes: {
      daily: {
        name: process.env.LEADERBOARD_TIMEFRAME_DAILY_NAME || 'Daily',
        durationHours: 24,
      },
      weekly: {
        name: process.env.LEADERBOARD_TIMEFRAME_WEEKLY_NAME || 'Weekly',
        durationHours: 168, // 7 days
      },
      monthly: {
        name: process.env.LEADERBOARD_TIMEFRAME_MONTHLY_NAME || 'Monthly',
        durationHours: 720, // 30 days
      },
      allTime: {
        name: process.env.LEADERBOARD_TIMEFRAME_ALL_TIME_NAME || 'All Time',
        durationHours: null, // No time limit
      },
    },
  },
  
  /**
   * Level progression configuration with settings for user levels,
   * experience points, and progression curves.
   */
  levels: {
    // Base XP requirements for level progression
    baseXpRequirement: parseInt(process.env.LEVEL_BASE_XP_REQUIREMENT, 10) || 100,
    xpMultiplierPerLevel: parseFloat(process.env.LEVEL_XP_MULTIPLIER_PER_LEVEL) || 1.5,
    maxLevel: parseInt(process.env.LEVEL_MAX_LEVEL, 10) || 100,
    
    // Level milestone rewards
    milestoneRewards: {
      enabled: process.env.LEVEL_MILESTONE_REWARDS_ENABLED !== 'false', // Enabled by default
      levels: [5, 10, 25, 50, 75, 100], // Default milestone levels
    },
    
    // Level titles and badges
    titles: {
      novice: {
        name: process.env.LEVEL_TITLE_NOVICE_NAME || 'Novice',
        minLevel: parseInt(process.env.LEVEL_TITLE_NOVICE_MIN_LEVEL, 10) || 1,
        maxLevel: parseInt(process.env.LEVEL_TITLE_NOVICE_MAX_LEVEL, 10) || 10,
      },
      intermediate: {
        name: process.env.LEVEL_TITLE_INTERMEDIATE_NAME || 'Intermediate',
        minLevel: parseInt(process.env.LEVEL_TITLE_INTERMEDIATE_MIN_LEVEL, 10) || 11,
        maxLevel: parseInt(process.env.LEVEL_TITLE_INTERMEDIATE_MAX_LEVEL, 10) || 30,
      },
      advanced: {
        name: process.env.LEVEL_TITLE_ADVANCED_NAME || 'Advanced',
        minLevel: parseInt(process.env.LEVEL_TITLE_ADVANCED_MIN_LEVEL, 10) || 31,
        maxLevel: parseInt(process.env.LEVEL_TITLE_ADVANCED_MAX_LEVEL, 10) || 60,
      },
      expert: {
        name: process.env.LEVEL_TITLE_EXPERT_NAME || 'Expert',
        minLevel: parseInt(process.env.LEVEL_TITLE_EXPERT_MIN_LEVEL, 10) || 61,
        maxLevel: parseInt(process.env.LEVEL_TITLE_EXPERT_MAX_LEVEL, 10) || 90,
      },
      master: {
        name: process.env.LEVEL_TITLE_MASTER_NAME || 'Master',
        minLevel: parseInt(process.env.LEVEL_TITLE_MASTER_MIN_LEVEL, 10) || 91,
        maxLevel: parseInt(process.env.LEVEL_TITLE_MASTER_MAX_LEVEL, 10) || 100,
      },
    },
  },
}));