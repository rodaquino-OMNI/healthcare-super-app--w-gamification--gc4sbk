/**
 * @file Defines TypeScript interfaces for the gamification rules engine.
 * These interfaces standardize how rules are defined and evaluated to determine
 * when to award points, unlock achievements, and progress quests based on user events.
 * 
 * The gamification engine processes events from all journeys (Health, Care, Plan)
 * to drive user engagement through achievements, challenges, and rewards. These
 * interfaces provide type safety and consistency across the gamification system.
 * 
 * @module @austa/interfaces/gamification/rules
 * @version 1.0.0
 */

/**
 * Represents the type of action to be performed when a rule is triggered.
 */
export enum RuleActionType {
  /** Award experience points to the user */
  AWARD_XP = 'AWARD_XP',
  /** Progress an achievement by a specified amount */
  PROGRESS_ACHIEVEMENT = 'PROGRESS_ACHIEVEMENT',
  /** Progress a quest by a specified amount */
  PROGRESS_QUEST = 'PROGRESS_QUEST',
  /** Unlock a specific achievement immediately */
  UNLOCK_ACHIEVEMENT = 'UNLOCK_ACHIEVEMENT',
  /** Grant a specific reward to the user */
  GRANT_REWARD = 'GRANT_REWARD',
  /** Update the user's level */
  UPDATE_LEVEL = 'UPDATE_LEVEL',
  /** Add the user to a leaderboard or update their position */
  UPDATE_LEADERBOARD = 'UPDATE_LEADERBOARD',
}

/**
 * Base interface for all rule actions.
 */
export interface BaseRuleAction {
  /** The type of action to perform */
  type: RuleActionType;
}

/**
 * Action to award experience points to a user.
 */
export interface AwardXpAction extends BaseRuleAction {
  type: RuleActionType.AWARD_XP;
  /** The amount of XP to award */
  value: number;
}

/**
 * Action to progress an achievement.
 */
export interface ProgressAchievementAction extends BaseRuleAction {
  type: RuleActionType.PROGRESS_ACHIEVEMENT;
  /** The ID of the achievement to progress */
  achievementId: string;
  /** The amount to progress the achievement by */
  value: number;
}

/**
 * Action to progress a quest.
 */
export interface ProgressQuestAction extends BaseRuleAction {
  type: RuleActionType.PROGRESS_QUEST;
  /** The ID of the quest to progress */
  questId: string;
  /** The amount to progress the quest by */
  value: number;
}

/**
 * Action to unlock an achievement immediately.
 */
export interface UnlockAchievementAction extends BaseRuleAction {
  type: RuleActionType.UNLOCK_ACHIEVEMENT;
  /** The ID of the achievement to unlock */
  achievementId: string;
}

/**
 * Action to grant a reward to a user.
 */
export interface GrantRewardAction extends BaseRuleAction {
  type: RuleActionType.GRANT_REWARD;
  /** The ID of the reward to grant */
  rewardId: string;
}

/**
 * Action to update a user's level.
 */
export interface UpdateLevelAction extends BaseRuleAction {
  type: RuleActionType.UPDATE_LEVEL;
  /** The new level value */
  level: number;
}

/**
 * Action to update a user's position on a leaderboard.
 */
export interface UpdateLeaderboardAction extends BaseRuleAction {
  type: RuleActionType.UPDATE_LEADERBOARD;
  /** The ID of the leaderboard to update */
  leaderboardId: string;
  /** The score to set for the user on this leaderboard */
  score: number;
}

/**
 * Union type of all possible rule actions.
 */
export type RuleAction =
  | AwardXpAction
  | ProgressAchievementAction
  | ProgressQuestAction
  | UnlockAchievementAction
  | GrantRewardAction
  | UpdateLevelAction
  | UpdateLeaderboardAction;

/**
 * Represents the context in which a rule is evaluated.
 * This includes the event data and user profile information.
 */
export interface RuleContext<TEventData = any, TUserProfile = any> {
  /** The event that triggered the rule evaluation */
  event: {
    /** The type of event that occurred */
    type: string;
    /** The data associated with the event */
    data: TEventData;
    /** The timestamp when the event occurred */
    timestamp: Date;
    /** The user ID associated with the event */
    userId: string;
    /** Optional journey identifier */
    journeyType?: 'HEALTH' | 'CARE' | 'PLAN';
  };
  /** The user's profile data */
  userProfile: TUserProfile;
  /** Additional context data that may be needed for rule evaluation */
  additionalContext?: Record<string, any>;
}

/**
 * Represents a condition that must be met for a rule to be triggered.
 * This is a type-safe alternative to the string-based condition in the database.
 */
export interface RuleCondition<TEventData = any, TUserProfile = any> {
  /** A function that evaluates whether the condition is met */
  evaluate: (context: RuleContext<TEventData, TUserProfile>) => boolean;
  /** Optional description of the condition for documentation purposes */
  description?: string;
}

/**
 * Type for a rule condition function that can be used to evaluate a rule.
 */
export type RuleConditionFn<TEventData = any, TUserProfile = any> = 
  (context: RuleContext<TEventData, TUserProfile>) => boolean;

/**
 * Represents a rule that determines how points and achievements are awarded based on user actions.
 */
export interface Rule<TEventData = any, TUserProfile = any> {
  /** Unique identifier for the rule */
  id: string;
  
  /** 
   * The event type that this rule listens for
   * Examples: "STEPS_RECORDED", "APPOINTMENT_COMPLETED", "CLAIM_SUBMITTED"
   */
  event: string;
  
  /**
   * A condition that determines if the rule should be triggered
   * This can be either a string (for backward compatibility) or a RuleCondition object
   */
  condition: string | RuleCondition<TEventData, TUserProfile>;
  
  /**
   * Actions to be performed when the rule is triggered
   * This can be either a JSON string (for backward compatibility) or an array of RuleAction objects
   */
  actions: string | RuleAction[];
  
  /**
   * Optional description of what the rule does
   */
  description?: string;
  
  /**
   * Optional priority of the rule (higher numbers are evaluated first)
   */
  priority?: number;
  
  /**
   * Optional flag to indicate if the rule is currently active
   */
  isActive?: boolean;
  
  /**
   * Optional date range during which the rule is active
   */
  activeFrom?: Date;
  activeTo?: Date;
  
  /**
   * Optional journey type that this rule is associated with
   */
  journeyType?: 'HEALTH' | 'CARE' | 'PLAN' | 'CROSS_JOURNEY';
}

/**
 * Interface for health journey specific rule event data.
 * Contains data specific to health-related events that can trigger rules.
 */
export interface HealthRuleEventData {
  /** Steps recorded by the user */
  steps?: number;
  /** Heart rate recorded by the user (in BPM) */
  heartRate?: number;
  /** Sleep duration in minutes */
  sleepMinutes?: number;
  /** Calories burned */
  caloriesBurned?: number;
  /** Distance traveled in meters */
  distanceMeters?: number;
  /** Health goal progress (as a percentage from 0-100) */
  goalProgress?: number;
  /** Health goal type (e.g., 'STEPS', 'WEIGHT', 'SLEEP') */
  goalType?: string;
  /** Device type that recorded the data (e.g., 'FITBIT', 'APPLE_WATCH', 'MANUAL') */
  deviceType?: string;
  /** Metric type being recorded */
  metricType?: 'STEPS' | 'HEART_RATE' | 'SLEEP' | 'WEIGHT' | 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE';
  /** Value of the metric (used with metricType) */
  metricValue?: number;
  /** Unit of measurement for the metric */
  metricUnit?: string;
}

/**
 * Interface for care journey specific rule event data.
 * Contains data specific to care-related events that can trigger rules.
 */
export interface CareRuleEventData {
  /** Type of appointment (e.g., 'ROUTINE', 'SPECIALIST', 'EMERGENCY', 'TELEMEDICINE') */
  appointmentType?: string;
  /** Status of appointment (e.g., 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') */
  appointmentStatus?: string;
  /** Provider specialty (e.g., 'CARDIOLOGY', 'DERMATOLOGY', 'PRIMARY_CARE') */
  providerSpecialty?: string;
  /** Medication adherence percentage (0-100) */
  medicationAdherence?: number;
  /** Telemedicine session duration in minutes */
  sessionDurationMinutes?: number;
  /** Treatment plan adherence percentage (0-100) */
  treatmentPlanAdherence?: number;
  /** Medication ID that was taken or skipped */
  medicationId?: string;
  /** Medication action (e.g., 'TAKEN', 'SKIPPED', 'RESCHEDULED') */
  medicationAction?: string;
  /** Symptom checker usage details */
  symptomCheckerUsed?: boolean;
  /** Provider ID associated with the event */
  providerId?: string;
  /** Appointment ID associated with the event */
  appointmentId?: string;
}

/**
 * Interface for plan journey specific rule event data.
 * Contains data specific to insurance plan-related events that can trigger rules.
 */
export interface PlanRuleEventData {
  /** Type of claim submitted (e.g., 'MEDICAL', 'DENTAL', 'VISION', 'PHARMACY') */
  claimType?: string;
  /** Status of claim (e.g., 'SUBMITTED', 'APPROVED', 'DENIED', 'PENDING') */
  claimStatus?: string;
  /** Amount of claim in the local currency */
  claimAmount?: number;
  /** Benefit type used (e.g., 'PREVENTIVE', 'EMERGENCY', 'ROUTINE') */
  benefitType?: string;
  /** Coverage percentage (0-100) */
  coveragePercentage?: number;
  /** Document type submitted (e.g., 'RECEIPT', 'MEDICAL_REPORT', 'PRESCRIPTION') */
  documentType?: string;
  /** Claim ID associated with the event */
  claimId?: string;
  /** Plan ID associated with the event */
  planId?: string;
  /** Benefit ID associated with the event */
  benefitId?: string;
  /** Whether the claim was submitted digitally */
  digitalSubmission?: boolean;
  /** Reimbursement amount in local currency */
  reimbursementAmount?: number;
  /** Out-of-pocket amount in local currency */
  outOfPocketAmount?: number;
}

/**
 * Interface for user profile data used in rule evaluation.
 */
export interface UserProfileData {
  /** User's unique identifier */
  id: string;
  /** User's current XP level */
  level: number;
  /** User's current XP points */
  xp: number;
  /** User's achievements (IDs of unlocked achievements) */
  achievements: string[];
  /** User's active quests (IDs of active quests) */
  activeQuests: string[];
  /** User's completed quests (IDs of completed quests) */
  completedQuests: string[];
  /** User's rewards (IDs of earned rewards) */
  rewards: string[];
  /** User's journey progress for each journey type */
  journeyProgress: {
    health?: number;
    care?: number;
    plan?: number;
  };
  /** Additional user metadata that might be relevant for rules */
  metadata?: Record<string, any>;
}

/**
 * Type alias for a Health journey specific rule.
 */
export type HealthRule = Rule<HealthRuleEventData, UserProfileData>;

/**
 * Type alias for a Care journey specific rule.
 */
export type CareRule = Rule<CareRuleEventData, UserProfileData>;

/**
 * Type alias for a Plan journey specific rule.
 */
export type PlanRule = Rule<PlanRuleEventData, UserProfileData>;

/**
 * Interface for rule evaluation result.
 */
export interface RuleEvaluationResult {
  /** Whether the rule condition was satisfied */
  conditionSatisfied: boolean;
  /** The actions that were executed as a result of the rule */
  actionsExecuted: RuleAction[];
  /** The rule that was evaluated */
  rule: Rule;
  /** Timestamp when the evaluation occurred */
  evaluatedAt: Date;
  /** Any error that occurred during evaluation */
  error?: Error;
}