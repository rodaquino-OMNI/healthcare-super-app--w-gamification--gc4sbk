import { registerAs } from '@nestjs/config';
import {
  AchievementCategory,
  LeaderboardTimeFrame,
  QuestCategory,
  QuestStatus,
  RewardCategory,
  RewardStatus,
  XPSource,
} from '@austa/interfaces/gamification';

/**
 * Interface for the points configuration section
 */
interface PointsConfig {
  defaultValues: Record<string, number>;
  multipliers: Record<string, number>;
  limits: {
    maxPointsPerDay: number;
    maxPointsPerAction: number;
    maxMultiplier: number;
    maxConsecutiveSameActions: number;
    cooldownPeriodMinutes: number;
  };
  levels: {
    levelUpThresholds: Array<{ level: number; xpRequired: number }>;
    levelBenefits: Record<string, number>;
  };
}

/**
 * Interface for the achievements configuration section
 */
interface AchievementsConfig {
  categories: Record<string, {
    enabled: boolean;
    displayName: string;
    description: string;
    iconUrl?: string;
  }>;
  notifications: {
    enabled: boolean;
    displayDurationMs: number;
    soundEnabled: boolean;
    animationEnabled: boolean;
  };
  progressTracking: {
    enabled: boolean;
    updateFrequencyMs: number;
    showPercentage: boolean;
    persistProgressOnLogout: boolean;
  };
  unlocking: {
    notifyOnUnlock: boolean;
    saveUnlockTimestamp: boolean;
    requireVerification: boolean;
    allowMultipleUnlocks: boolean;
  };
}

/**
 * Interface for the quests configuration section
 */
interface QuestsConfig {
  types: {
    daily: {
      enabled: boolean;
      maxActive: number;
      refreshTime: string;
      timeZone: string;
    };
    weekly: {
      enabled: boolean;
      maxActive: number;
      refreshDay: number;
      refreshTime: string;
      timeZone: string;
    };
    monthly: {
      enabled: boolean;
      maxActive: number;
      refreshDay: number;
      refreshTime: string;
      timeZone: string;
    };
    special: {
      enabled: boolean;
      maxActive: number;
    };
  };
  selection: {
    algorithm: string;
    personalizedFactors: Record<string, number>;
    refreshStrategy: string;
  };
  progress: {
    trackPartialProgress: boolean;
    autoCompleteWhenEligible: boolean;
    notifyOnProgress: boolean;
    notifyOnCompletion: boolean;
  };
  expiration: {
    expireIncompleteQuests: boolean;
    notifyBeforeExpiration: boolean;
    expirationWarningHours: number;
    allowQuestExtension: boolean;
    maxExtensionDays: number;
  };
}

/**
 * Interface for the rewards configuration section
 */
interface RewardsConfig {
  categories: Record<string, {
    enabled: boolean;
    displayName: string;
    description: string;
  }>;
  redemption: {
    enabled: boolean;
    requireConfirmation: boolean;
    generateRedemptionCode: boolean;
    allowPartialRedemption: boolean;
    notifyOnRedemption: boolean;
  };
  expiration: {
    expirationEnabled: boolean;
    defaultExpirationDays: number;
    notifyBeforeExpiration: boolean;
    expirationWarningDays: number;
    allowExtension: boolean;
    maxExtensionDays: number;
  };
  inventory: {
    trackInventory: boolean;
    showRemainingQuantity: boolean;
    notifyLowInventory: boolean;
    lowInventoryThreshold: number;
    allowWaitlist: boolean;
  };
}

/**
 * Interface for the leaderboard configuration section
 */
interface LeaderboardConfig {
  general: {
    enabled: boolean;
    updateIntervalMs: number;
    maxEntries: number;
    defaultTimeFrame: string;
  };
  sortedSets: {
    enabled: boolean;
    keyPrefix: string;
    scoreUpdateStrategy: string;
    separateJourneyLeaderboards: boolean;
    useZAddBatchSize: number;
    usePipeline: boolean;
  };
  timeFrames: {
    daily: {
      enabled: boolean;
      resetTime: string;
      timeZone: string;
      ttlHours: number;
    };
    weekly: {
      enabled: boolean;
      resetDay: number;
      resetTime: string;
      timeZone: string;
      ttlDays: number;
    };
    monthly: {
      enabled: boolean;
      resetDay: number;
      resetTime: string;
      timeZone: string;
      ttlDays: number;
    };
    allTime: {
      enabled: boolean;
      snapshotFrequencyDays: number;
    };
  };
  journeys: Record<string, {
    enabled: boolean;
    displayName: string;
    description: string;
  }>;
}

/**
 * Interface for the complete gamification configuration
 */
interface GamificationConfig {
  points: PointsConfig;
  achievements: AchievementsConfig;
  quests: QuestsConfig;
  rewards: RewardsConfig;
  leaderboard: LeaderboardConfig;
}

/**
 * Gamification-specific configuration module that centralizes all game mechanics settings.
 * This module provides configuration for points, achievements, quests, rewards, and leaderboards.
 */
export const gamificationConfig = registerAs<GamificationConfig>('gamification', () => ({
  // Points configuration with granular control over awards
  // This section defines how points are awarded for different actions across all journeys,
  // including base values, multipliers, limits, and level progression thresholds
  points: {
    // Default point values for different actions across journeys
    // These values serve as the base point awards for various user activities
    // and can be further modified by multipliers and other factors at runtime
    defaultValues: {
      // Health journey points
      healthMetricRecorded: parseInt(process.env.POINTS_HEALTH_METRIC_RECORDED, 10) || 10,
      healthGoalCreated: parseInt(process.env.POINTS_HEALTH_GOAL_CREATED, 10) || 15,
      healthGoalCompleted: parseInt(process.env.POINTS_HEALTH_GOAL_COMPLETED, 10) || 100,
      deviceConnected: parseInt(process.env.POINTS_DEVICE_CONNECTED, 10) || 25,
      dailyStepsGoalMet: parseInt(process.env.POINTS_DAILY_STEPS_GOAL_MET, 10) || 30,
      weeklyExerciseGoalMet: parseInt(process.env.POINTS_WEEKLY_EXERCISE_GOAL_MET, 10) || 75,
      
      // Care journey points
      appointmentBooked: parseInt(process.env.POINTS_APPOINTMENT_BOOKED, 10) || 20,
      appointmentAttended: parseInt(process.env.POINTS_APPOINTMENT_ATTENDED, 10) || 50,
      medicationAdherenceDaily: parseInt(process.env.POINTS_MEDICATION_ADHERENCE_DAILY, 10) || 15,
      medicationAdherenceWeekly: parseInt(process.env.POINTS_MEDICATION_ADHERENCE_WEEKLY, 10) || 50,
      telemedicineSessionCompleted: parseInt(process.env.POINTS_TELEMEDICINE_SESSION_COMPLETED, 10) || 40,
      symptomCheckerUsed: parseInt(process.env.POINTS_SYMPTOM_CHECKER_USED, 10) || 10,
      
      // Plan journey points
      claimSubmitted: parseInt(process.env.POINTS_CLAIM_SUBMITTED, 10) || 15,
      benefitUtilized: parseInt(process.env.POINTS_BENEFIT_UTILIZED, 10) || 25,
      planComparisonCompleted: parseInt(process.env.POINTS_PLAN_COMPARISON_COMPLETED, 10) || 20,
      documentUploaded: parseInt(process.env.POINTS_DOCUMENT_UPLOADED, 10) || 10,
      
      // Cross-journey points
      profileCompleted: parseInt(process.env.POINTS_PROFILE_COMPLETED, 10) || 50,
      dailyLoginStreak: parseInt(process.env.POINTS_DAILY_LOGIN_STREAK, 10) || 5,
      weeklyLoginStreak: parseInt(process.env.POINTS_WEEKLY_LOGIN_STREAK, 10) || 25,
      monthlyLoginStreak: parseInt(process.env.POINTS_MONTHLY_LOGIN_STREAK, 10) || 100,
      feedbackProvided: parseInt(process.env.POINTS_FEEDBACK_PROVIDED, 10) || 15,
    },
    
    // Multipliers for special events or conditions
    multipliers: {
      weekendBonus: parseFloat(process.env.MULTIPLIER_WEEKEND_BONUS) || 1.5,
      holidayBonus: parseFloat(process.env.MULTIPLIER_HOLIDAY_BONUS) || 2.0,
      consecutiveDaysBonus: parseFloat(process.env.MULTIPLIER_CONSECUTIVE_DAYS_BONUS) || 1.1,
      referralBonus: parseFloat(process.env.MULTIPLIER_REFERRAL_BONUS) || 1.25,
    },
    
    // Limits to prevent gaming the system
    limits: {
      maxPointsPerDay: parseInt(process.env.MAX_POINTS_PER_DAY, 10) || 1000,
      maxPointsPerAction: parseInt(process.env.MAX_POINTS_PER_ACTION, 10) || 500,
      maxMultiplier: parseFloat(process.env.MAX_MULTIPLIER) || 3.0,
      maxConsecutiveSameActions: parseInt(process.env.MAX_CONSECUTIVE_SAME_ACTIONS, 10) || 5,
      cooldownPeriodMinutes: parseInt(process.env.COOLDOWN_PERIOD_MINUTES, 10) || 5,
    },
    
    // Level thresholds for user progression
    levels: {
      levelUpThresholds: [
        { level: 1, xpRequired: 0 },
        { level: 2, xpRequired: 100 },
        { level: 3, xpRequired: 250 },
        { level: 4, xpRequired: 500 },
        { level: 5, xpRequired: 1000 },
        { level: 6, xpRequired: 2000 },
        { level: 7, xpRequired: 3500 },
        { level: 8, xpRequired: 5000 },
        { level: 9, xpRequired: 7500 },
        { level: 10, xpRequired: 10000 },
        { level: 11, xpRequired: 15000 },
        { level: 12, xpRequired: 20000 },
        { level: 13, xpRequired: 30000 },
        { level: 14, xpRequired: 40000 },
        { level: 15, xpRequired: 50000 },
        { level: 16, xpRequired: 75000 },
        { level: 17, xpRequired: 100000 },
        { level: 18, xpRequired: 150000 },
        { level: 19, xpRequired: 200000 },
        { level: 20, xpRequired: 250000 },
      ],
      levelBenefits: {
        unlockRewardsAtLevel: 2,
        unlockQuestsAtLevel: 3,
        unlockLeaderboardAtLevel: 5,
        unlockCustomizationAtLevel: 7,
        unlockSpecialEventsAtLevel: 10,
      },
    },
  },
  
  // Achievement configuration with detailed options
  achievements: {
    // Categories for organizing achievements
    categories: {
      health: {
        enabled: process.env.ACHIEVEMENT_CATEGORY_HEALTH_ENABLED !== 'false',
        displayName: process.env.ACHIEVEMENT_CATEGORY_HEALTH_DISPLAY_NAME || 'Health Journey',
        description: process.env.ACHIEVEMENT_CATEGORY_HEALTH_DESCRIPTION || 'Achievements related to health tracking and goals',
        iconUrl: process.env.ACHIEVEMENT_CATEGORY_HEALTH_ICON_URL || '/icons/health-achievement.svg',
      },
      care: {
        enabled: process.env.ACHIEVEMENT_CATEGORY_CARE_ENABLED !== 'false',
        displayName: process.env.ACHIEVEMENT_CATEGORY_CARE_DISPLAY_NAME || 'Care Journey',
        description: process.env.ACHIEVEMENT_CATEGORY_CARE_DESCRIPTION || 'Achievements related to medical care and appointments',
        iconUrl: process.env.ACHIEVEMENT_CATEGORY_CARE_ICON_URL || '/icons/care-achievement.svg',
      },
      plan: {
        enabled: process.env.ACHIEVEMENT_CATEGORY_PLAN_ENABLED !== 'false',
        displayName: process.env.ACHIEVEMENT_CATEGORY_PLAN_DISPLAY_NAME || 'Plan Journey',
        description: process.env.ACHIEVEMENT_CATEGORY_PLAN_DESCRIPTION || 'Achievements related to insurance plans and benefits',
        iconUrl: process.env.ACHIEVEMENT_CATEGORY_PLAN_ICON_URL || '/icons/plan-achievement.svg',
      },
      crossJourney: {
        enabled: process.env.ACHIEVEMENT_CATEGORY_CROSS_JOURNEY_ENABLED !== 'false',
        displayName: process.env.ACHIEVEMENT_CATEGORY_CROSS_JOURNEY_DISPLAY_NAME || 'SuperApp Master',
        description: process.env.ACHIEVEMENT_CATEGORY_CROSS_JOURNEY_DESCRIPTION || 'Achievements spanning multiple journeys',
        iconUrl: process.env.ACHIEVEMENT_CATEGORY_CROSS_JOURNEY_ICON_URL || '/icons/cross-journey-achievement.svg',
      },
    },
    
    // Achievement notification settings
    notifications: {
      enabled: process.env.ACHIEVEMENT_NOTIFICATIONS_ENABLED !== 'false',
      displayDurationMs: parseInt(process.env.ACHIEVEMENT_NOTIFICATION_DURATION_MS, 10) || 5000,
      soundEnabled: process.env.ACHIEVEMENT_NOTIFICATION_SOUND_ENABLED !== 'false',
      animationEnabled: process.env.ACHIEVEMENT_NOTIFICATION_ANIMATION_ENABLED !== 'false',
    },
    
    // Achievement progress tracking settings
    progressTracking: {
      enabled: process.env.ACHIEVEMENT_PROGRESS_TRACKING_ENABLED !== 'false',
      updateFrequencyMs: parseInt(process.env.ACHIEVEMENT_PROGRESS_UPDATE_FREQUENCY_MS, 10) || 60000,
      showPercentage: process.env.ACHIEVEMENT_PROGRESS_SHOW_PERCENTAGE !== 'false',
      persistProgressOnLogout: process.env.ACHIEVEMENT_PERSIST_PROGRESS_ON_LOGOUT !== 'false',
    },
    
    // Achievement unlocking rules
    unlocking: {
      notifyOnUnlock: process.env.ACHIEVEMENT_NOTIFY_ON_UNLOCK !== 'false',
      saveUnlockTimestamp: process.env.ACHIEVEMENT_SAVE_UNLOCK_TIMESTAMP !== 'false',
      requireVerification: process.env.ACHIEVEMENT_REQUIRE_VERIFICATION === 'true',
      allowMultipleUnlocks: process.env.ACHIEVEMENT_ALLOW_MULTIPLE_UNLOCKS === 'true',
    },
  },
  
  // Quest configuration with detailed options
  quests: {
    // Types of quests available
    types: {
      daily: {
        enabled: process.env.QUEST_TYPE_DAILY_ENABLED !== 'false',
        maxActive: parseInt(process.env.QUEST_TYPE_DAILY_MAX_ACTIVE, 10) || 3,
        refreshTime: process.env.QUEST_TYPE_DAILY_REFRESH_TIME || '00:00',
        timeZone: process.env.QUEST_TYPE_DAILY_TIMEZONE || 'America/Sao_Paulo',
      },
      weekly: {
        enabled: process.env.QUEST_TYPE_WEEKLY_ENABLED !== 'false',
        maxActive: parseInt(process.env.QUEST_TYPE_WEEKLY_MAX_ACTIVE, 10) || 5,
        refreshDay: parseInt(process.env.QUEST_TYPE_WEEKLY_REFRESH_DAY, 10) || 1, // Monday
        refreshTime: process.env.QUEST_TYPE_WEEKLY_REFRESH_TIME || '00:00',
        timeZone: process.env.QUEST_TYPE_WEEKLY_TIMEZONE || 'America/Sao_Paulo',
      },
      monthly: {
        enabled: process.env.QUEST_TYPE_MONTHLY_ENABLED !== 'false',
        maxActive: parseInt(process.env.QUEST_TYPE_MONTHLY_MAX_ACTIVE, 10) || 7,
        refreshDay: parseInt(process.env.QUEST_TYPE_MONTHLY_REFRESH_DAY, 10) || 1,
        refreshTime: process.env.QUEST_TYPE_MONTHLY_REFRESH_TIME || '00:00',
        timeZone: process.env.QUEST_TYPE_MONTHLY_TIMEZONE || 'America/Sao_Paulo',
      },
      special: {
        enabled: process.env.QUEST_TYPE_SPECIAL_ENABLED !== 'false',
        maxActive: parseInt(process.env.QUEST_TYPE_SPECIAL_MAX_ACTIVE, 10) || 2,
      },
    },
    
    // Quest selection and assignment settings
    selection: {
      algorithm: process.env.QUEST_SELECTION_ALGORITHM || 'personalized', // 'random', 'personalized', 'sequential'
      personalizedFactors: {
        userPreferences: parseFloat(process.env.QUEST_PERSONALIZED_FACTOR_USER_PREFERENCES) || 0.4,
        userHistory: parseFloat(process.env.QUEST_PERSONALIZED_FACTOR_USER_HISTORY) || 0.3,
        journeyProgress: parseFloat(process.env.QUEST_PERSONALIZED_FACTOR_JOURNEY_PROGRESS) || 0.3,
      },
      refreshStrategy: process.env.QUEST_REFRESH_STRATEGY || 'replace-expired', // 'replace-all', 'replace-expired', 'add-only'
    },
    
    // Quest progress and completion settings
    progress: {
      trackPartialProgress: process.env.QUEST_TRACK_PARTIAL_PROGRESS !== 'false',
      autoCompleteWhenEligible: process.env.QUEST_AUTO_COMPLETE_WHEN_ELIGIBLE !== 'false',
      notifyOnProgress: process.env.QUEST_NOTIFY_ON_PROGRESS !== 'false',
      notifyOnCompletion: process.env.QUEST_NOTIFY_ON_COMPLETION !== 'false',
    },
    
    // Quest expiration settings
    expiration: {
      expireIncompleteQuests: process.env.QUEST_EXPIRE_INCOMPLETE_QUESTS !== 'false',
      notifyBeforeExpiration: process.env.QUEST_NOTIFY_BEFORE_EXPIRATION !== 'false',
      expirationWarningHours: parseInt(process.env.QUEST_EXPIRATION_WARNING_HOURS, 10) || 24,
      allowQuestExtension: process.env.QUEST_ALLOW_EXTENSION === 'true',
      maxExtensionDays: parseInt(process.env.QUEST_MAX_EXTENSION_DAYS, 10) || 1,
    },
  },
  
  // Reward configuration with detailed options
  rewards: {
    // Categories of rewards
    categories: {
      virtual: {
        enabled: process.env.REWARD_CATEGORY_VIRTUAL_ENABLED !== 'false',
        displayName: process.env.REWARD_CATEGORY_VIRTUAL_DISPLAY_NAME || 'Virtual Rewards',
        description: process.env.REWARD_CATEGORY_VIRTUAL_DESCRIPTION || 'Digital items and benefits',
      },
      physical: {
        enabled: process.env.REWARD_CATEGORY_PHYSICAL_ENABLED !== 'false',
        displayName: process.env.REWARD_CATEGORY_PHYSICAL_DISPLAY_NAME || 'Physical Rewards',
        description: process.env.REWARD_CATEGORY_PHYSICAL_DESCRIPTION || 'Tangible rewards and merchandise',
      },
      discount: {
        enabled: process.env.REWARD_CATEGORY_DISCOUNT_ENABLED !== 'false',
        displayName: process.env.REWARD_CATEGORY_DISCOUNT_DISPLAY_NAME || 'Discounts',
        description: process.env.REWARD_CATEGORY_DISCOUNT_DESCRIPTION || 'Special offers and discounts',
      },
      experience: {
        enabled: process.env.REWARD_CATEGORY_EXPERIENCE_ENABLED !== 'false',
        displayName: process.env.REWARD_CATEGORY_EXPERIENCE_DISPLAY_NAME || 'Experiences',
        description: process.env.REWARD_CATEGORY_EXPERIENCE_DESCRIPTION || 'Special experiences and events',
      },
    },
    
    // Reward redemption settings
    redemption: {
      enabled: process.env.REWARD_REDEMPTION_ENABLED !== 'false',
      requireConfirmation: process.env.REWARD_REDEMPTION_REQUIRE_CONFIRMATION !== 'false',
      generateRedemptionCode: process.env.REWARD_REDEMPTION_GENERATE_CODE !== 'false',
      allowPartialRedemption: process.env.REWARD_REDEMPTION_ALLOW_PARTIAL === 'true',
      notifyOnRedemption: process.env.REWARD_REDEMPTION_NOTIFY !== 'false',
    },
    
    // Reward expiration settings
    expiration: {
      expirationEnabled: process.env.REWARD_EXPIRATION_ENABLED !== 'false',
      defaultExpirationDays: parseInt(process.env.REWARD_DEFAULT_EXPIRATION_DAYS, 10) || 30,
      notifyBeforeExpiration: process.env.REWARD_NOTIFY_BEFORE_EXPIRATION !== 'false',
      expirationWarningDays: parseInt(process.env.REWARD_EXPIRATION_WARNING_DAYS, 10) || 7,
      allowExtension: process.env.REWARD_ALLOW_EXTENSION === 'true',
      maxExtensionDays: parseInt(process.env.REWARD_MAX_EXTENSION_DAYS, 10) || 15,
    },
    
    // Reward inventory and availability settings
    inventory: {
      trackInventory: process.env.REWARD_TRACK_INVENTORY !== 'false',
      showRemainingQuantity: process.env.REWARD_SHOW_REMAINING_QUANTITY !== 'false',
      notifyLowInventory: process.env.REWARD_NOTIFY_LOW_INVENTORY !== 'false',
      lowInventoryThreshold: parseInt(process.env.REWARD_LOW_INVENTORY_THRESHOLD, 10) || 10,
      allowWaitlist: process.env.REWARD_ALLOW_WAITLIST === 'true',
    },
  },
  
  // Leaderboard configuration with Redis Sorted Sets integration
  // Redis Sorted Sets provide O(log(N)) time complexity for score updates and range queries,
  // making them ideal for high-performance leaderboard implementations
  leaderboard: {
    // General leaderboard settings
    general: {
      enabled: process.env.LEADERBOARD_ENABLED !== 'false',
      updateIntervalMs: parseInt(process.env.LEADERBOARD_UPDATE_INTERVAL_MS, 10) || 900000, // 15 minutes
      maxEntries: parseInt(process.env.LEADERBOARD_MAX_ENTRIES, 10) || 100,
      defaultTimeFrame: process.env.LEADERBOARD_DEFAULT_TIMEFRAME || 'weekly',
    },
    
    // Redis Sorted Sets configuration for efficient leaderboard operations
    // These settings optimize the use of Redis ZADD, ZRANGE, ZREVRANGE, and ZRANK commands
    // for high-performance leaderboard operations with minimal latency
    sortedSets: {
      enabled: process.env.LEADERBOARD_SORTED_SETS_ENABLED !== 'false',
      keyPrefix: process.env.LEADERBOARD_SORTED_SETS_KEY_PREFIX || 'leaderboard:',
      // Strategy for updating scores: 'increment' adds to existing score, 'replace' overwrites it
      scoreUpdateStrategy: process.env.LEADERBOARD_SCORE_UPDATE_STRATEGY || 'increment', // 'increment', 'replace'
      // Whether to maintain separate leaderboards for each journey
      separateJourneyLeaderboards: process.env.LEADERBOARD_SEPARATE_JOURNEYS !== 'false',
      // Batch size for ZADD operations to optimize performance
      useZAddBatchSize: parseInt(process.env.LEADERBOARD_ZADD_BATCH_SIZE, 10) || 100,
      // Whether to use Redis pipelining for bulk operations
      usePipeline: process.env.LEADERBOARD_USE_PIPELINE !== 'false',
    },
    
    // Additional Redis Sorted Sets optimizations can be configured in redis.config.ts
    // This separation of concerns keeps infrastructure details in redis.config.ts
    // while keeping game mechanics configuration here
    
    // Time-based leaderboard settings
    timeFrames: {
      daily: {
        enabled: process.env.LEADERBOARD_TIMEFRAME_DAILY_ENABLED !== 'false',
        resetTime: process.env.LEADERBOARD_TIMEFRAME_DAILY_RESET_TIME || '00:00',
        timeZone: process.env.LEADERBOARD_TIMEFRAME_DAILY_TIMEZONE || 'America/Sao_Paulo',
        ttlHours: parseInt(process.env.LEADERBOARD_TIMEFRAME_DAILY_TTL_HOURS, 10) || 48,
      },
      weekly: {
        enabled: process.env.LEADERBOARD_TIMEFRAME_WEEKLY_ENABLED !== 'false',
        resetDay: parseInt(process.env.LEADERBOARD_TIMEFRAME_WEEKLY_RESET_DAY, 10) || 1, // Monday
        resetTime: process.env.LEADERBOARD_TIMEFRAME_WEEKLY_RESET_TIME || '00:00',
        timeZone: process.env.LEADERBOARD_TIMEFRAME_WEEKLY_TIMEZONE || 'America/Sao_Paulo',
        ttlDays: parseInt(process.env.LEADERBOARD_TIMEFRAME_WEEKLY_TTL_DAYS, 10) || 14,
      },
      monthly: {
        enabled: process.env.LEADERBOARD_TIMEFRAME_MONTHLY_ENABLED !== 'false',
        resetDay: parseInt(process.env.LEADERBOARD_TIMEFRAME_MONTHLY_RESET_DAY, 10) || 1,
        resetTime: process.env.LEADERBOARD_TIMEFRAME_MONTHLY_RESET_TIME || '00:00',
        timeZone: process.env.LEADERBOARD_TIMEFRAME_MONTHLY_TIMEZONE || 'America/Sao_Paulo',
        ttlDays: parseInt(process.env.LEADERBOARD_TIMEFRAME_MONTHLY_TTL_DAYS, 10) || 60,
      },
      allTime: {
        enabled: process.env.LEADERBOARD_TIMEFRAME_ALL_TIME_ENABLED !== 'false',
        snapshotFrequencyDays: parseInt(process.env.LEADERBOARD_TIMEFRAME_ALL_TIME_SNAPSHOT_FREQUENCY_DAYS, 10) || 7,
      },
    },
    
    // Journey-specific leaderboard settings
    journeys: {
      health: {
        enabled: process.env.LEADERBOARD_JOURNEY_HEALTH_ENABLED !== 'false',
        displayName: process.env.LEADERBOARD_JOURNEY_HEALTH_DISPLAY_NAME || 'Health Champions',
        description: process.env.LEADERBOARD_JOURNEY_HEALTH_DESCRIPTION || 'Top users in the Health journey',
      },
      care: {
        enabled: process.env.LEADERBOARD_JOURNEY_CARE_ENABLED !== 'false',
        displayName: process.env.LEADERBOARD_JOURNEY_CARE_DISPLAY_NAME || 'Care Leaders',
        description: process.env.LEADERBOARD_JOURNEY_CARE_DESCRIPTION || 'Top users in the Care journey',
      },
      plan: {
        enabled: process.env.LEADERBOARD_JOURNEY_PLAN_ENABLED !== 'false',
        displayName: process.env.LEADERBOARD_JOURNEY_PLAN_DISPLAY_NAME || 'Plan Experts',
        description: process.env.LEADERBOARD_JOURNEY_PLAN_DESCRIPTION || 'Top users in the Plan journey',
      },
      overall: {
        enabled: process.env.LEADERBOARD_JOURNEY_OVERALL_ENABLED !== 'false',
        displayName: process.env.LEADERBOARD_JOURNEY_OVERALL_DISPLAY_NAME || 'SuperApp Elite',
        description: process.env.LEADERBOARD_JOURNEY_OVERALL_DESCRIPTION || 'Top users across all journeys',
      },
    },
  },
  
  // Integration with other services and modules
  // This section defines how the gamification engine integrates with other parts of the system
  integration: {
    // Event processing integration
    events: {
      // Whether to process events from different journeys
      processHealthEvents: process.env.GAMIFICATION_PROCESS_HEALTH_EVENTS !== 'false',
      processCareEvents: process.env.GAMIFICATION_PROCESS_CARE_EVENTS !== 'false',
      processPlanEvents: process.env.GAMIFICATION_PROCESS_PLAN_EVENTS !== 'false',
      // Batch processing settings
      batchSize: parseInt(process.env.GAMIFICATION_EVENT_BATCH_SIZE, 10) || 100,
      processingIntervalMs: parseInt(process.env.GAMIFICATION_EVENT_PROCESSING_INTERVAL_MS, 10) || 5000,
    },
    
    // Notification service integration for achievement and quest notifications
    notifications: {
      enabled: process.env.GAMIFICATION_NOTIFICATIONS_ENABLED !== 'false',
      achievementChannel: process.env.GAMIFICATION_ACHIEVEMENT_NOTIFICATION_CHANNEL || 'in-app',
      questChannel: process.env.GAMIFICATION_QUEST_NOTIFICATION_CHANNEL || 'in-app',
      leaderboardChannel: process.env.GAMIFICATION_LEADERBOARD_NOTIFICATION_CHANNEL || 'in-app',
      rewardChannel: process.env.GAMIFICATION_REWARD_NOTIFICATION_CHANNEL || 'in-app',
    },
    
    // User profile integration
    userProfiles: {
      syncWithAuthService: process.env.GAMIFICATION_SYNC_WITH_AUTH_SERVICE !== 'false',
      cacheUserProfiles: process.env.GAMIFICATION_CACHE_USER_PROFILES !== 'false',
      userProfileCacheTtlSeconds: parseInt(process.env.GAMIFICATION_USER_PROFILE_CACHE_TTL_SECONDS, 10) || 300,
    },
  },
}));

/**
 * This configuration module is part of the refactored gamification engine architecture.
 * It centralizes all game mechanics settings in one place, making it easier to maintain
 * and extend the gamification features.
 * 
 * Key improvements in this refactoring:
 * 
 * 1. Enhanced points configuration with more granular control over awards
 *    - Added journey-specific point values
 *    - Implemented multipliers for special events
 *    - Added limits to prevent gaming the system
 * 
 * 2. Improved leaderboard configuration with Redis Sorted Sets integration
 *    - Optimized for high-performance leaderboard operations
 *    - Added support for different time frames (daily, weekly, monthly)
 *    - Implemented journey-specific leaderboards
 * 
 * 3. Added more detailed achievement and quest configuration options
 *    - Enhanced categorization for better organization
 *    - Improved notification and progress tracking settings
 *    - Added support for different quest types and selection algorithms
 * 
 * 4. Integration with @austa/interfaces for type-safe gamification models
 *    - Ensures consistency between configuration and implementation
 *    - Provides better developer experience with type checking
 *    - Facilitates standardized module resolution across the monorepo
 */