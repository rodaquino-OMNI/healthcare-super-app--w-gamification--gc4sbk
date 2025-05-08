/**
 * Achievement Types Constants
 * 
 * This file defines constants for different achievement categories and types used throughout the gamification engine.
 * These constants are used to categorize achievements, define their behavior, and establish consistent achievement types
 * across the application.
 * 
 * The achievement system is a core component of the gamification engine, which processes events from all journeys
 * (Health, Care, Plan) and assigns achievements based on configurable rules. These achievements drive user engagement
 * through recognition and rewards for completing health-positive actions.
 */

/**
 * Enum representing the journey categories for achievements.
 * Each achievement is associated with a specific journey in the application.
 */
export enum AchievementJourney {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  CROSS_JOURNEY = 'cross_journey', // For achievements that span multiple journeys
}

/**
 * Enum representing the difficulty levels for achievements.
 * Used to categorize achievements by their complexity and effort required.
 */
export enum AchievementDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

/**
 * Enum representing the trigger types for achievements.
 * Defines how achievements are activated and tracked.
 */
export enum AchievementTriggerType {
  ONE_TIME = 'one_time',       // Triggered once when a specific action is completed
  CUMULATIVE = 'cumulative',   // Triggered when a specific action is performed a certain number of times
  STREAK = 'streak',           // Triggered when a specific action is performed consistently over time
  MILESTONE = 'milestone',     // Triggered when a specific value reaches a threshold
  COLLECTION = 'collection',   // Triggered when a set of related items is collected
}

/**
 * Enum representing the visibility status of achievements.
 * Controls whether achievements are visible to users before being unlocked.
 */
export enum AchievementVisibility {
  VISIBLE = 'visible',         // Achievement is visible before unlocking
  HIDDEN = 'hidden',           // Achievement is hidden until unlocked
  PARTIALLY_HIDDEN = 'partially_hidden', // Achievement is visible but details are hidden
}

/**
 * Enum representing the categories of health-related achievements.
 */
export enum HealthAchievementCategory {
  STEPS = 'steps',
  SLEEP = 'sleep',
  HEART_RATE = 'heart_rate',
  WEIGHT = 'weight',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose',
  ACTIVITY = 'activity',
  GOALS = 'goals',
  DEVICE_CONNECTION = 'device_connection',
  HEALTH_RECORDS = 'health_records',
}

/**
 * Enum representing the categories of care-related achievements.
 */
export enum CareAchievementCategory {
  APPOINTMENTS = 'appointments',
  TELEMEDICINE = 'telemedicine',
  MEDICATION = 'medication',
  TREATMENT_PLAN = 'treatment_plan',
  SYMPTOM_CHECKER = 'symptom_checker',
  PROVIDER_INTERACTION = 'provider_interaction',
}

/**
 * Enum representing the categories of plan-related achievements.
 */
export enum PlanAchievementCategory {
  CLAIMS = 'claims',
  BENEFITS = 'benefits',
  COVERAGE = 'coverage',
  INSURANCE_CARD = 'insurance_card',
  COST_SIMULATOR = 'cost_simulator',
}

/**
 * Enum representing the categories of cross-journey achievements.
 */
export enum CrossJourneyAchievementCategory {
  PLATFORM_USAGE = 'platform_usage',
  PROFILE_COMPLETION = 'profile_completion',
  REFERRALS = 'referrals',
  FEEDBACK = 'feedback',
  ENGAGEMENT = 'engagement',
}

/**
 * Interface for achievement display metadata.
 * Contains information used for rendering achievements in the UI.
 */
export interface AchievementDisplayMetadata {
  iconUrl: string;             // URL to the achievement icon
  lockedIconUrl: string;       // URL to the locked version of the achievement icon
  backgroundColor: string;     // Background color for the achievement display
  borderColor: string;         // Border color for the achievement display
  journeyColor: string;        // Journey-specific color for the achievement
  animationUrl?: string;       // Optional URL to animation displayed when achievement is unlocked
  badgeShape?: AchievementBadgeShape; // Shape of the achievement badge
  tier?: AchievementTier;      // Visual tier of the achievement
}

/**
 * Enum representing the shapes of achievement badges.
 */
export enum AchievementBadgeShape {
  CIRCLE = 'circle',
  SHIELD = 'shield',
  STAR = 'star',
  HEXAGON = 'hexagon',
  RIBBON = 'ribbon',
}

/**
 * Enum representing the visual tiers of achievements.
 */
export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

/**
 * Interface for achievement point values.
 * Defines the XP and other point values awarded for completing an achievement.
 */
export interface AchievementPointValues {
  xp: number;                  // Experience points awarded
  journeyPoints: number;       // Journey-specific points awarded
  rewardPoints?: number;       // Optional reward points that can be redeemed
}

/**
 * Constants for achievement point multipliers based on difficulty.
 */
export const ACHIEVEMENT_POINT_MULTIPLIERS = {
  [AchievementDifficulty.BEGINNER]: 1,
  [AchievementDifficulty.INTERMEDIATE]: 2,
  [AchievementDifficulty.ADVANCED]: 3,
  [AchievementDifficulty.EXPERT]: 5,
};

/**
 * Constants for base XP values for different achievement trigger types.
 */
export const BASE_XP_VALUES = {
  [AchievementTriggerType.ONE_TIME]: 50,
  [AchievementTriggerType.CUMULATIVE]: 75,
  [AchievementTriggerType.STREAK]: 100,
  [AchievementTriggerType.MILESTONE]: 125,
  [AchievementTriggerType.COLLECTION]: 150,
};

/**
 * Constants for journey-specific colors used in achievement displays.
 */
export const JOURNEY_COLORS = {
  [AchievementJourney.HEALTH]: '#4CAF50',      // Green
  [AchievementJourney.CARE]: '#FF9800',        // Orange
  [AchievementJourney.PLAN]: '#2196F3',        // Blue
  [AchievementJourney.CROSS_JOURNEY]: '#9C27B0', // Purple
};

/**
 * Constants for achievement notification priorities.
 */
export enum AchievementNotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Mapping of achievement difficulties to notification priorities.
 */
export const ACHIEVEMENT_NOTIFICATION_PRIORITIES = {
  [AchievementDifficulty.BEGINNER]: AchievementNotificationPriority.LOW,
  [AchievementDifficulty.INTERMEDIATE]: AchievementNotificationPriority.LOW,
  [AchievementDifficulty.ADVANCED]: AchievementNotificationPriority.MEDIUM,
  [AchievementDifficulty.EXPERT]: AchievementNotificationPriority.HIGH,
};

/**
 * Mapping of achievement difficulties to badge tiers.
 */
export const ACHIEVEMENT_BADGE_TIERS = {
  [AchievementDifficulty.BEGINNER]: AchievementTier.BRONZE,
  [AchievementDifficulty.INTERMEDIATE]: AchievementTier.SILVER,
  [AchievementDifficulty.ADVANCED]: AchievementTier.GOLD,
  [AchievementDifficulty.EXPERT]: AchievementTier.DIAMOND,
};

/**
 * Mapping of achievement journeys to badge shapes.
 */
export const ACHIEVEMENT_BADGE_SHAPES = {
  [AchievementJourney.HEALTH]: AchievementBadgeShape.CIRCLE,
  [AchievementJourney.CARE]: AchievementBadgeShape.SHIELD,
  [AchievementJourney.PLAN]: AchievementBadgeShape.HEXAGON,
  [AchievementJourney.CROSS_JOURNEY]: AchievementBadgeShape.STAR,
};

/**
 * Constants for achievement streak requirements.
 */
export const STREAK_REQUIREMENTS = {
  SHORT: 3,   // 3 consecutive days/actions
  MEDIUM: 7,  // 7 consecutive days/actions
  LONG: 14,   // 14 consecutive days/actions
  EPIC: 30,   // 30 consecutive days/actions
};

/**
 * Constants for achievement cumulative requirements.
 */
export const CUMULATIVE_REQUIREMENTS = {
  TIER_1: 5,    // 5 total actions
  TIER_2: 10,   // 10 total actions
  TIER_3: 25,   // 25 total actions
  TIER_4: 50,   // 50 total actions
  TIER_5: 100,  // 100 total actions
};

/**
 * Constants for milestone-based achievements in the Health journey.
 */
export const HEALTH_MILESTONES = {
  STEPS: {
    DAILY: 10000,     // 10,000 steps in a day
    WEEKLY: 70000,    // 70,000 steps in a week
    MONTHLY: 300000,  // 300,000 steps in a month
  },
  SLEEP: {
    OPTIMAL: 8,       // 8 hours of sleep
    WEEKLY_AVG: 7,    // 7 hours average sleep per night in a week
  },
  WEIGHT: {
    GOAL_REACHED: 'goal_reached',  // Reached weight goal
    CONSISTENT: 30,   // Maintained weight for 30 days
  },
  ACTIVITY: {
    ACTIVE_MINUTES: 30,  // 30 active minutes per day
    WEEKLY_WORKOUTS: 5,   // 5 workouts per week
  },
};

/**
 * Constants for milestone-based achievements in the Care journey.
 */
export const CARE_MILESTONES = {
  MEDICATION: {
    ADHERENCE_RATE: 0.95,  // 95% medication adherence
    DAYS_PERFECT: 30,      // 30 days of perfect medication adherence
  },
  APPOINTMENTS: {
    ATTENDED: 5,            // Attended 5 appointments
    NO_CANCELLATIONS: 10,   // 10 appointments without cancellations
  },
  TELEMEDICINE: {
    SESSIONS_COMPLETED: 3,  // Completed 3 telemedicine sessions
  },
};

/**
 * Constants for milestone-based achievements in the Plan journey.
 */
export const PLAN_MILESTONES = {
  CLAIMS: {
    SUBMITTED: 5,           // Submitted 5 claims
    DIGITAL_SUBMISSION: 3,  // Submitted 3 claims digitally
  },
  BENEFITS: {
    UTILIZATION_RATE: 0.5,  // Used 50% of available benefits
    EXPLORED_ALL: true,      // Explored all benefits
  },
};

/**
 * Interface for achievement rule configuration.
 * Defines the parameters for achievement rules processing.
 */
export interface AchievementRuleConfig {
  triggerType: AchievementTriggerType;
  journey: AchievementJourney;
  category: string;  // From journey-specific category enums
  difficulty: AchievementDifficulty;
  threshold?: number;  // For cumulative, streak, or milestone achievements
  timeframe?: number;  // Time period in days for completing the achievement
  resetOnFailure?: boolean;  // Whether progress resets on breaking a streak
  requiresConsecutiveDays?: boolean;  // Whether days must be consecutive
  visibility?: AchievementVisibility;  // Whether the achievement is visible before unlocking
  prerequisiteAchievements?: string[];  // IDs of achievements that must be completed first
  exclusiveWith?: string[];  // IDs of achievements that cannot be active simultaneously
}

/**
 * Interface for achievement event payload.
 * Represents the data structure for events that can trigger achievements.
 */
export interface AchievementEventPayload {
  userId: string;  // ID of the user who performed the action
  journeyType: AchievementJourney;  // Journey where the action was performed
  category: string;  // Category of the action
  action: string;  // Specific action performed
  value?: number;  // Optional numeric value associated with the action
  metadata?: Record<string, any>;  // Additional context about the action
  timestamp: Date;  // When the action occurred
}

/**
 * Constants for achievement event types that can trigger achievements.
 */
export enum AchievementEventType {
  // Health journey events
  STEPS_RECORDED = 'steps_recorded',
  SLEEP_RECORDED = 'sleep_recorded',
  WEIGHT_RECORDED = 'weight_recorded',
  BLOOD_PRESSURE_RECORDED = 'blood_pressure_recorded',
  BLOOD_GLUCOSE_RECORDED = 'blood_glucose_recorded',
  ACTIVITY_COMPLETED = 'activity_completed',
  GOAL_CREATED = 'goal_created',
  GOAL_ACHIEVED = 'goal_achieved',
  DEVICE_CONNECTED = 'device_connected',
  HEALTH_RECORD_ADDED = 'health_record_added',
  
  // Care journey events
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_ATTENDED = 'appointment_attended',
  TELEMEDICINE_SESSION_COMPLETED = 'telemedicine_session_completed',
  MEDICATION_TRACKED = 'medication_tracked',
  MEDICATION_ADHERENCE_STREAK = 'medication_adherence_streak',
  TREATMENT_PLAN_PROGRESS = 'treatment_plan_progress',
  TREATMENT_PLAN_COMPLETED = 'treatment_plan_completed',
  SYMPTOM_CHECK_COMPLETED = 'symptom_check_completed',
  PROVIDER_RATED = 'provider_rated',
  
  // Plan journey events
  CLAIM_SUBMITTED = 'claim_submitted',
  CLAIM_APPROVED = 'claim_approved',
  BENEFIT_USED = 'benefit_used',
  BENEFIT_EXPLORED = 'benefit_explored',
  COVERAGE_REVIEWED = 'coverage_reviewed',
  DIGITAL_CARD_USED = 'digital_card_used',
  COST_ESTIMATE_GENERATED = 'cost_estimate_generated',
  
  // Cross-journey events
  PROFILE_UPDATED = 'profile_updated',
  FEEDBACK_PROVIDED = 'feedback_provided',
  APP_OPENED = 'app_opened',
  FEATURE_USED = 'feature_used',
  REFERRAL_SENT = 'referral_sent',
  REFERRAL_ACCEPTED = 'referral_accepted',
}