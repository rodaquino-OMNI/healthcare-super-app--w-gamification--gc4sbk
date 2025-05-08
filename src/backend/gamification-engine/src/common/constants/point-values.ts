/**
 * @file Point Values Constants
 * @description Defines standard point values awarded for different user actions across all journeys.
 * These constants ensure consistent point calculation throughout the gamification engine when
 * processing events and awarding achievements.
 */

/**
 * Base point values for Health Journey actions
 * @description Points awarded for actions in the "Minha Saúde" journey
 */
export const HEALTH_POINTS = {
  /**
   * Points for tracking health metrics
   */
  TRACK_METRIC: 10,
  TRACK_METRIC_STREAK_WEEK: 50,
  TRACK_METRIC_STREAK_MONTH: 200,
  
  /**
   * Points for health goals
   */
  CREATE_GOAL: 20,
  PROGRESS_GOAL: 15,
  COMPLETE_GOAL: 100,
  
  /**
   * Points for device connections
   */
  CONNECT_DEVICE: 50,
  SYNC_DEVICE: 5,
  SYNC_DEVICE_STREAK_WEEK: 25,
  
  /**
   * Points for health insights
   */
  VIEW_INSIGHT: 5,
  SHARE_INSIGHT: 15,
  IMPLEMENT_RECOMMENDATION: 30,
  
  /**
   * Points for medical events
   */
  ADD_MEDICAL_EVENT: 20,
  UPDATE_MEDICAL_HISTORY: 25,
  SHARE_MEDICAL_RECORD: 15,
};

/**
 * Base point values for Care Journey actions
 * @description Points awarded for actions in the "Cuidar-me Agora" journey
 */
export const CARE_POINTS = {
  /**
   * Points for appointment management
   */
  BOOK_APPOINTMENT: 30,
  ATTEND_APPOINTMENT: 50,
  RATE_PROVIDER: 20,
  RESCHEDULE_APPOINTMENT: 5,
  
  /**
   * Points for telemedicine
   */
  START_TELEMEDICINE: 40,
  COMPLETE_TELEMEDICINE: 60,
  
  /**
   * Points for medication management
   */
  ADD_MEDICATION: 15,
  MEDICATION_ADHERENCE_DAY: 10,
  MEDICATION_ADHERENCE_WEEK: 50,
  MEDICATION_ADHERENCE_MONTH: 150,
  
  /**
   * Points for symptom tracking
   */
  TRACK_SYMPTOM: 10,
  COMPLETE_SYMPTOM_CHECKER: 25,
  
  /**
   * Points for treatment plans
   */
  START_TREATMENT: 30,
  FOLLOW_TREATMENT_DAY: 15,
  COMPLETE_TREATMENT: 100,
};

/**
 * Base point values for Plan Journey actions
 * @description Points awarded for actions in the "Meu Plano & Benefícios" journey
 */
export const PLAN_POINTS = {
  /**
   * Points for plan management
   */
  REVIEW_PLAN: 20,
  UPDATE_PLAN: 30,
  COMPARE_PLANS: 15,
  
  /**
   * Points for benefits usage
   */
  VIEW_BENEFITS: 5,
  USE_BENEFIT: 25,
  RECOMMEND_BENEFIT: 20,
  
  /**
   * Points for claims management
   */
  SUBMIT_CLAIM: 40,
  UPLOAD_DOCUMENT: 15,
  CLAIM_APPROVED: 50,
  
  /**
   * Points for financial actions
   */
  VIEW_COVERAGE: 5,
  PAY_PREMIUM: 30,
  SETUP_AUTO_PAY: 50,
  
  /**
   * Points for document management
   */
  DOWNLOAD_DOCUMENT: 5,
  UPLOAD_REQUIRED_DOCUMENT: 20,
  COMPLETE_DOCUMENTATION: 40,
};

/**
 * Point multipliers for special conditions
 * @description Multipliers applied to base point values in special circumstances
 */
export const POINT_MULTIPLIERS = {
  /**
   * First-time action multiplier
   * Applied the first time a user performs a specific action
   */
  FIRST_TIME: 2.0,
  
  /**
   * Streak multipliers
   * Applied when users maintain consistent activity
   */
  STREAK: {
    /**
     * Multiplier for 3-day streaks
     */
    THREE_DAY: 1.2,
    
    /**
     * Multiplier for 7-day streaks
     */
    WEEK: 1.5,
    
    /**
     * Multiplier for 30-day streaks
     */
    MONTH: 2.0,
    
    /**
     * Multiplier for 90-day streaks
     */
    QUARTER: 3.0,
  },
  
  /**
   * Time-based multipliers
   * Applied during specific promotional periods
   */
  TIME_BASED: {
    /**
     * Weekend multiplier
     * Applied to actions performed on weekends
     */
    WEEKEND: 1.2,
    
    /**
     * Off-peak multiplier
     * Applied during system off-peak hours
     */
    OFF_PEAK: 1.3,
    
    /**
     * Special event multiplier
     * Applied during promotional events
     */
    SPECIAL_EVENT: 1.5,
  },
  
  /**
   * Challenge multipliers
   * Applied during active challenges
   */
  CHALLENGE: {
    /**
     * Active quest multiplier
     * Applied to actions that contribute to an active quest
     */
    ACTIVE_QUEST: 1.25,
    
    /**
     * Final quest step multiplier
     * Applied to the final action needed to complete a quest
     */
    FINAL_QUEST_STEP: 1.5,
  },
};

/**
 * Level progression thresholds
 * @description XP required to reach each level in the gamification system
 */
export const LEVEL_THRESHOLDS = {
  /**
   * XP required for level 1 (starting level)
   */
  LEVEL_1: 0,
  
  /**
   * XP required for level 2
   */
  LEVEL_2: 100,
  
  /**
   * XP required for level 3
   */
  LEVEL_3: 250,
  
  /**
   * XP required for level 4
   */
  LEVEL_4: 500,
  
  /**
   * XP required for level 5
   */
  LEVEL_5: 1000,
  
  /**
   * XP required for level 6
   */
  LEVEL_6: 2000,
  
  /**
   * XP required for level 7
   */
  LEVEL_7: 3500,
  
  /**
   * XP required for level 8
   */
  LEVEL_8: 5500,
  
  /**
   * XP required for level 9
   */
  LEVEL_9: 8000,
  
  /**
   * XP required for level 10
   */
  LEVEL_10: 12000,
  
  /**
   * XP required for level 11
   */
  LEVEL_11: 17000,
  
  /**
   * XP required for level 12
   */
  LEVEL_12: 23000,
  
  /**
   * XP required for level 13
   */
  LEVEL_13: 30000,
  
  /**
   * XP required for level 14
   */
  LEVEL_14: 40000,
  
  /**
   * XP required for level 15
   */
  LEVEL_15: 55000,
  
  /**
   * XP required for level 16
   */
  LEVEL_16: 75000,
  
  /**
   * XP required for level 17
   */
  LEVEL_17: 100000,
  
  /**
   * XP required for level 18
   */
  LEVEL_18: 130000,
  
  /**
   * XP required for level 19
   */
  LEVEL_19: 170000,
  
  /**
   * XP required for level 20 (max level)
   */
  LEVEL_20: 220000,
};

/**
 * Level progression formula parameters
 * @description Parameters for calculating XP requirements for levels beyond the predefined thresholds
 */
export const LEVEL_PROGRESSION = {
  /**
   * Base XP required for level 1
   */
  BASE_XP: 0,
  
  /**
   * Base increment between early levels
   */
  BASE_INCREMENT: 100,
  
  /**
   * Growth factor for XP requirements between levels
   * Higher values create steeper progression curves
   */
  GROWTH_FACTOR: 1.4,
  
  /**
   * Maximum level cap
   * The highest level a user can achieve
   */
  MAX_LEVEL: 50,
  
  /**
   * XP soft cap
   * Point at which XP requirements grow more significantly
   */
  SOFT_CAP_LEVEL: 20,
  
  /**
   * Soft cap multiplier
   * Increases XP requirements after reaching the soft cap
   */
  SOFT_CAP_MULTIPLIER: 1.2,
};

/**
 * Point decay and expiration parameters
 * @description Constants for point decay over time and expiration of temporary points
 */
export const POINT_DECAY = {
  /**
   * Inactivity decay
   * Percentage of points lost after periods of inactivity
   */
  INACTIVITY: {
    /**
     * Percentage lost after 30 days of inactivity
     */
    MONTH: 0.05, // 5%
    
    /**
     * Percentage lost after 90 days of inactivity
     */
    QUARTER: 0.15, // 15%
    
    /**
     * Percentage lost after 180 days of inactivity
     */
    HALF_YEAR: 0.30, // 30%
    
    /**
     * Maximum percentage that can be lost due to inactivity
     */
    MAX_DECAY: 0.50, // 50%
  },
  
  /**
   * Temporary point expiration (in days)
   * Time periods after which temporary points expire
   */
  EXPIRATION: {
    /**
     * Expiration for promotional points (in days)
     */
    PROMOTIONAL: 30,
    
    /**
     * Expiration for seasonal event points (in days)
     */
    SEASONAL: 90,
    
    /**
     * Expiration for challenge points (in days)
     */
    CHALLENGE: 60,
    
    /**
     * Expiration for bonus points (in days)
     */
    BONUS: 45,
  },
  
  /**
   * Point recovery parameters
   * Constants for recovering lost points after decay
   */
  RECOVERY: {
    /**
     * Percentage of decayed points recovered per active day
     */
    DAILY_RECOVERY_RATE: 0.02, // 2%
    
    /**
     * Maximum percentage of decayed points that can be recovered
     */
    MAX_RECOVERY: 0.80, // 80%
    
    /**
     * Bonus multiplier for consecutive active days during recovery
     */
    CONSECUTIVE_DAY_MULTIPLIER: 1.1,
  },
};

/**
 * Combined point values for all journeys
 * @description Aggregates all journey-specific point values for easier access
 */
export const POINT_VALUES = {
  /**
   * Health journey point values
   */
  HEALTH: HEALTH_POINTS,
  
  /**
   * Care journey point values
   */
  CARE: CARE_POINTS,
  
  /**
   * Plan journey point values
   */
  PLAN: PLAN_POINTS,
  
  /**
   * Point multipliers for special conditions
   */
  MULTIPLIERS: POINT_MULTIPLIERS,
  
  /**
   * Level progression thresholds and parameters
   */
  LEVELS: {
    THRESHOLDS: LEVEL_THRESHOLDS,
    PROGRESSION: LEVEL_PROGRESSION,
  },
  
  /**
   * Point decay and expiration parameters
   */
  DECAY: POINT_DECAY,
};