/**
 * Point Values Constants
 * 
 * This file defines standard point values awarded for different user actions across all journeys.
 * These constants ensure consistent point calculation throughout the gamification engine
 * when processing events and awarding achievements.
 * 
 * @module gamification-engine/common/constants/point-values
 */

/**
 * Base point values for Health journey events
 */
export const HEALTH_POINTS = {
  /** Points awarded for recording a health metric (weight, blood pressure, etc.) */
  METRIC_RECORDED: 5,
  /** Points awarded for connecting a health device (smartwatch, scale, etc.) */
  DEVICE_CONNECTED: 25,
  /** Points awarded for completing a health assessment */
  ASSESSMENT_COMPLETED: 50,
  /** Points awarded for setting a new health goal */
  GOAL_CREATED: 10,
  /** Points awarded for achieving a daily health goal */
  DAILY_GOAL_ACHIEVED: 15,
  /** Points awarded for achieving a weekly health goal */
  WEEKLY_GOAL_ACHIEVED: 50,
  /** Points awarded for achieving a monthly health goal */
  MONTHLY_GOAL_ACHIEVED: 150,
  /** Points awarded for sharing health insights with a provider */
  INSIGHT_SHARED: 20,
  /** Points awarded for completing a health challenge */
  CHALLENGE_COMPLETED: 75,
  /** Points awarded for maintaining a healthy metric streak */
  HEALTHY_METRIC_STREAK: 10,
  /** Points awarded for viewing health education content */
  EDUCATION_VIEWED: 5,
};

/**
 * Base point values for Care journey events
 */
export const CARE_POINTS = {
  /** Points awarded for booking a medical appointment */
  APPOINTMENT_BOOKED: 15,
  /** Points awarded for attending a medical appointment */
  APPOINTMENT_ATTENDED: 30,
  /** Points awarded for completing a telemedicine session */
  TELEMEDICINE_COMPLETED: 35,
  /** Points awarded for recording medication adherence */
  MEDICATION_TAKEN: 5,
  /** Points awarded for completing a symptom check */
  SYMPTOM_CHECK_COMPLETED: 10,
  /** Points awarded for adding a new medication to tracking */
  MEDICATION_ADDED: 5,
  /** Points awarded for maintaining a medication adherence streak */
  MEDICATION_STREAK: 10,
  /** Points awarded for completing a care plan step */
  CARE_PLAN_STEP_COMPLETED: 20,
  /** Points awarded for completing a full care plan */
  CARE_PLAN_COMPLETED: 100,
  /** Points awarded for providing feedback after an appointment */
  APPOINTMENT_FEEDBACK: 10,
  /** Points awarded for updating health preferences */
  PREFERENCES_UPDATED: 5,
};

/**
 * Base point values for Plan journey events
 */
export const PLAN_POINTS = {
  /** Points awarded for submitting an insurance claim */
  CLAIM_SUBMITTED: 20,
  /** Points awarded for uploading supporting documents for a claim */
  DOCUMENT_UPLOADED: 10,
  /** Points awarded for reviewing plan benefits */
  BENEFITS_REVIEWED: 15,
  /** Points awarded for comparing insurance plans */
  PLANS_COMPARED: 25,
  /** Points awarded for selecting a new insurance plan */
  PLAN_SELECTED: 50,
  /** Points awarded for setting up automatic payments */
  AUTO_PAYMENT_SETUP: 30,
  /** Points awarded for referring a friend to the platform */
  FRIEND_REFERRED: 100,
  /** Points awarded for completing the annual plan review */
  ANNUAL_REVIEW_COMPLETED: 75,
  /** Points awarded for using a covered benefit */
  BENEFIT_USED: 40,
  /** Points awarded for completing a financial wellness assessment */
  FINANCIAL_ASSESSMENT: 35,
  /** Points awarded for updating coverage information */
  COVERAGE_UPDATED: 15,
};

/**
 * Multipliers applied to base point values for special conditions
 */
export const POINT_MULTIPLIERS = {
  /** Multiplier for first-time actions (first appointment, first goal, etc.) */
  FIRST_TIME: 2.0,
  /** Multiplier for actions completed during special promotions */
  PROMOTION: 1.5,
  /** Multiplier for consecutive day streaks (3-6 days) */
  STREAK_SHORT: 1.25,
  /** Multiplier for consecutive day streaks (7-13 days) */
  STREAK_MEDIUM: 1.5,
  /** Multiplier for consecutive day streaks (14+ days) */
  STREAK_LONG: 2.0,
  /** Multiplier for completing all daily tasks */
  ALL_DAILY_TASKS: 1.25,
  /** Multiplier for completing actions across multiple journeys in same day */
  CROSS_JOURNEY: 1.5,
  /** Multiplier for weekend activity to encourage consistent engagement */
  WEEKEND: 1.2,
  /** Multiplier for completing actions during off-peak hours */
  OFF_PEAK: 1.1,
  /** Multiplier for completing preventive health actions */
  PREVENTIVE: 1.3,
  /** Multiplier for completing high-priority health actions */
  HIGH_PRIORITY: 1.75,
};

/**
 * Level thresholds defining XP required to reach each user level
 */
export const LEVEL_THRESHOLDS = {
  /** XP required for level 1 (starting level) */
  LEVEL_1: 0,
  /** XP required for level 2 */
  LEVEL_2: 100,
  /** XP required for level 3 */
  LEVEL_3: 250,
  /** XP required for level 4 */
  LEVEL_4: 500,
  /** XP required for level 5 */
  LEVEL_5: 1000,
  /** XP required for level 6 */
  LEVEL_6: 2000,
  /** XP required for level 7 */
  LEVEL_7: 3500,
  /** XP required for level 8 */
  LEVEL_8: 5500,
  /** XP required for level 9 */
  LEVEL_9: 8000,
  /** XP required for level 10 */
  LEVEL_10: 11000,
  /** XP required for level 11 */
  LEVEL_11: 14500,
  /** XP required for level 12 */
  LEVEL_12: 18500,
  /** XP required for level 13 */
  LEVEL_13: 23000,
  /** XP required for level 14 */
  LEVEL_14: 28000,
  /** XP required for level 15 */
  LEVEL_15: 33500,
  /** XP required for level 16 */
  LEVEL_16: 39500,
  /** XP required for level 17 */
  LEVEL_17: 46000,
  /** XP required for level 18 */
  LEVEL_18: 53000,
  /** XP required for level 19 */
  LEVEL_19: 60500,
  /** XP required for level 20 (maximum level) */
  LEVEL_20: 68500,
};

/**
 * Level progression constants for calculating level-ups and rewards
 */
export const LEVEL_PROGRESSION = {
  /** Starting level for new users */
  STARTING_LEVEL: 1,
  /** Maximum achievable level */
  MAX_LEVEL: 20,
  /** Percentage of level progress to show level-up animation */
  LEVEL_UP_ANIMATION_THRESHOLD: 95,
  /** Number of reward points awarded per level-up */
  REWARD_POINTS_PER_LEVEL: 50,
  /** Bonus reward points for reaching milestone levels (5, 10, 15, 20) */
  MILESTONE_LEVEL_BONUS: 100,
};

/**
 * Point decay and expiration parameters
 */
export const POINT_DECAY = {
  /** Whether point decay is enabled */
  ENABLED: true,
  /** Number of days of inactivity before points start to decay */
  INACTIVITY_THRESHOLD_DAYS: 30,
  /** Percentage of points that decay per week after inactivity threshold */
  WEEKLY_DECAY_PERCENTAGE: 5,
  /** Maximum percentage of points that can decay (preserves some progress) */
  MAX_DECAY_PERCENTAGE: 50,
  /** Number of days until unclaimed rewards expire */
  REWARD_EXPIRATION_DAYS: 90,
  /** Whether to send notification before points start decaying */
  DECAY_NOTIFICATION: true,
  /** Days before decay starts to send notification */
  DECAY_NOTIFICATION_DAYS: 7,
};

/**
 * Achievement completion rewards (bonus points for completing achievements)
 */
export const ACHIEVEMENT_REWARDS = {
  /** Points awarded for completing a bronze tier achievement */
  BRONZE: 50,
  /** Points awarded for completing a silver tier achievement */
  SILVER: 100,
  /** Points awarded for completing a gold tier achievement */
  GOLD: 200,
  /** Points awarded for completing a platinum tier achievement */
  PLATINUM: 500,
  /** Points awarded for completing all achievements in a category */
  CATEGORY_COMPLETION: 300,
  /** Points awarded for completing a limited-time achievement */
  LIMITED_TIME: 150,
  /** Points awarded for completing a hidden achievement */
  HIDDEN: 250,
  /** Points awarded for completing a cross-journey achievement */
  CROSS_JOURNEY: 350,
};

/**
 * Quest completion rewards (bonus points for completing quests/challenges)
 */
export const QUEST_REWARDS = {
  /** Points awarded for completing a daily quest */
  DAILY: 25,
  /** Points awarded for completing a weekly quest */
  WEEKLY: 100,
  /** Points awarded for completing a monthly quest */
  MONTHLY: 300,
  /** Points awarded for completing a seasonal quest */
  SEASONAL: 500,
  /** Points awarded for completing all daily quests in a week */
  DAILY_STREAK_WEEK: 150,
  /** Points awarded for completing all weekly quests in a month */
  WEEKLY_STREAK_MONTH: 400,
};

/**
 * Leaderboard position rewards (bonus points awarded weekly based on leaderboard position)
 */
export const LEADERBOARD_REWARDS = {
  /** Points awarded for 1st place on the weekly leaderboard */
  FIRST_PLACE: 500,
  /** Points awarded for 2nd place on the weekly leaderboard */
  SECOND_PLACE: 400,
  /** Points awarded for 3rd place on the weekly leaderboard */
  THIRD_PLACE: 300,
  /** Points awarded for positions 4-10 on the weekly leaderboard */
  TOP_10: 200,
  /** Points awarded for positions 11-25 on the weekly leaderboard */
  TOP_25: 150,
  /** Points awarded for positions 26-50 on the weekly leaderboard */
  TOP_50: 100,
  /** Points awarded for positions 51-100 on the weekly leaderboard */
  TOP_100: 50,
  /** Points awarded for participation (any position) on the weekly leaderboard */
  PARTICIPATION: 25,
};

/**
 * Special event point values for seasonal or promotional events
 */
export const SPECIAL_EVENT_POINTS = {
  /** Points awarded for participating in a seasonal challenge */
  SEASONAL_PARTICIPATION: 50,
  /** Points awarded for completing a seasonal challenge */
  SEASONAL_COMPLETION: 250,
  /** Points awarded for participating in a community challenge */
  COMMUNITY_PARTICIPATION: 75,
  /** Points awarded for contributing to a community goal */
  COMMUNITY_CONTRIBUTION: 30,
  /** Points awarded for completing a promotional activity */
  PROMOTIONAL_ACTIVITY: 100,
  /** Points awarded for participating in a health awareness campaign */
  HEALTH_AWARENESS: 125,
};