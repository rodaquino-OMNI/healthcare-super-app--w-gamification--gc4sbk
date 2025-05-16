/**
 * @file rules.ts
 * @description Defines TypeScript interfaces for gamification rules that determine when
 * achievements are unlocked and rewards are granted. These interfaces standardize the
 * definition of gamification logic across all journeys.
 */

import { Achievement } from '../achievements';
import { Reward } from '../rewards';
import { Quest } from '../quests';

/**
 * Defines the possible journey types in the application.
 * Used to categorize rules by the journey they belong to.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GLOBAL = 'global' // For rules that apply across all journeys
}

/**
 * Defines the context in which a rule is evaluated.
 * Contains all necessary data for rule condition evaluation.
 */
export interface RuleContext {
  /** The user ID for whom the rule is being evaluated */
  userId: string;
  /** The journey in which the rule is being evaluated */
  journey: JourneyType;
  /** Timestamp when the rule evaluation started */
  timestamp: Date;
  /** Additional data specific to the event that triggered the rule evaluation */
  eventData: Record<string, any>;
  /** Optional metadata that can be used for rule evaluation */
  metadata?: Record<string, any>;
}

/**
 * Defines the result of a rule condition evaluation.
 * Includes whether the condition was met and optional metadata.
 */
export interface RuleConditionResult {
  /** Whether the condition was met */
  isMet: boolean;
  /** Optional metadata about the condition evaluation */
  metadata?: Record<string, any>;
}

/**
 * Defines a condition function that determines if a rule should be triggered.
 * @param context The context in which the rule is evaluated
 * @returns A RuleConditionResult indicating if the condition was met
 */
export type RuleCondition = (context: RuleContext) => RuleConditionResult | Promise<RuleConditionResult>;

/**
 * Defines the possible actions that can be taken when a rule is triggered.
 */
export enum RuleActionType {
  UNLOCK_ACHIEVEMENT = 'unlock_achievement',
  GRANT_REWARD = 'grant_reward',
  PROGRESS_QUEST = 'progress_quest',
  GRANT_XP = 'grant_xp',
  CUSTOM = 'custom'
}

/**
 * Defines the base interface for all rule action payloads.
 */
export interface BaseRuleActionPayload {
  /** The type of action to perform */
  type: RuleActionType;
}

/**
 * Payload for unlocking an achievement.
 */
export interface UnlockAchievementPayload extends BaseRuleActionPayload {
  type: RuleActionType.UNLOCK_ACHIEVEMENT;
  /** The ID of the achievement to unlock */
  achievementId: string;
  /** Optional metadata to include with the achievement */
  metadata?: Record<string, any>;
}

/**
 * Payload for granting a reward.
 */
export interface GrantRewardPayload extends BaseRuleActionPayload {
  type: RuleActionType.GRANT_REWARD;
  /** The ID of the reward to grant */
  rewardId: string;
  /** Optional metadata to include with the reward */
  metadata?: Record<string, any>;
}

/**
 * Payload for progressing a quest.
 */
export interface ProgressQuestPayload extends BaseRuleActionPayload {
  type: RuleActionType.PROGRESS_QUEST;
  /** The ID of the quest to progress */
  questId: string;
  /** The amount of progress to add */
  progressAmount: number;
  /** Optional metadata to include with the quest progress */
  metadata?: Record<string, any>;
}

/**
 * Payload for granting XP.
 */
export interface GrantXPPayload extends BaseRuleActionPayload {
  type: RuleActionType.GRANT_XP;
  /** The amount of XP to grant */
  xpAmount: number;
  /** Optional source of the XP */
  source?: string;
  /** Optional metadata to include with the XP grant */
  metadata?: Record<string, any>;
}

/**
 * Payload for custom actions.
 */
export interface CustomActionPayload extends BaseRuleActionPayload {
  type: RuleActionType.CUSTOM;
  /** The name of the custom action */
  actionName: string;
  /** Custom data for the action */
  data: Record<string, any>;
}

/**
 * Union type of all possible rule action payloads.
 */
export type RuleActionPayload =
  | UnlockAchievementPayload
  | GrantRewardPayload
  | ProgressQuestPayload
  | GrantXPPayload
  | CustomActionPayload;

/**
 * Defines an action function that executes when a rule condition is met.
 * @param context The context in which the rule is evaluated
 * @param conditionResult The result of the condition evaluation
 * @returns A promise that resolves when the action is complete
 */
export type RuleAction = (context: RuleContext, conditionResult: RuleConditionResult) => Promise<RuleActionPayload[]>;

/**
 * Defines a rule in the gamification system.
 * Rules determine when achievements are unlocked and rewards are granted.
 */
export interface Rule {
  /** Unique identifier for the rule */
  id: string;
  /** Display name of the rule */
  name: string;
  /** Detailed description of what the rule represents */
  description: string;
  /** Which journey this rule belongs to */
  journey: JourneyType;
  /** Priority of the rule (higher values are evaluated first) */
  priority: number;
  /** Whether the rule is currently active */
  isActive: boolean;
  /** The condition that determines if the rule should be triggered */
  condition: RuleCondition;
  /** The action to take when the condition is met */
  action: RuleAction;
  /** Optional tags for categorizing and filtering rules */
  tags?: string[];
  /** Optional metadata for additional rule properties */
  metadata?: Record<string, any>;
}

/**
 * Interface for health journey specific rules.
 * Extends the base Rule interface with health-specific properties.
 */
export interface HealthRule extends Rule {
  journey: JourneyType.HEALTH;
  /** Health-specific metadata */
  healthMetadata?: {
    /** The type of health metric this rule is related to */
    metricType?: string;
    /** The threshold value for the health metric */
    threshold?: number;
    /** The comparison operator for the threshold */
    operator?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  };
}

/**
 * Interface for care journey specific rules.
 * Extends the base Rule interface with care-specific properties.
 */
export interface CareRule extends Rule {
  journey: JourneyType.CARE;
  /** Care-specific metadata */
  careMetadata?: {
    /** The type of care activity this rule is related to */
    activityType?: 'appointment' | 'medication' | 'telemedicine' | 'checkup';
    /** The frequency requirement for the activity */
    frequency?: 'daily' | 'weekly' | 'monthly' | 'once';
  };
}

/**
 * Interface for plan journey specific rules.
 * Extends the base Rule interface with plan-specific properties.
 */
export interface PlanRule extends Rule {
  journey: JourneyType.PLAN;
  /** Plan-specific metadata */
  planMetadata?: {
    /** The type of plan activity this rule is related to */
    activityType?: 'claim' | 'benefit' | 'coverage' | 'payment';
    /** The benefit category this rule is related to */
    benefitCategory?: string;
  };
}

/**
 * Interface for global rules that apply across all journeys.
 * Extends the base Rule interface with cross-journey properties.
 */
export interface GlobalRule extends Rule {
  journey: JourneyType.GLOBAL;
  /** Global rule metadata */
  globalMetadata?: {
    /** The journeys this global rule applies to */
    applicableJourneys?: JourneyType[];
    /** Whether this rule requires completion of all applicable journeys */
    requireAllJourneys?: boolean;
  };
}

/**
 * Union type of all journey-specific rule types.
 */
export type JourneyRule = HealthRule | CareRule | PlanRule | GlobalRule;