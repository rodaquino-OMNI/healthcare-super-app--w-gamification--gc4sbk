/**
 * @file rules.ts
 * @description Defines TypeScript interfaces for gamification rules that determine when
 * achievements are unlocked and rewards are granted. These interfaces standardize the
 * definition of gamification logic across all journeys (Health, Care, Plan).
 */

/**
 * Enum defining the types of rules in the gamification system.
 */
export enum RuleType {
  /** Rules that trigger based on a single event */
  SIMPLE = 'SIMPLE',
  /** Rules that require multiple conditions to be met */
  COMPOUND = 'COMPOUND',
  /** Rules that trigger based on a sequence of events */
  SEQUENTIAL = 'SEQUENTIAL',
  /** Rules that trigger based on a streak of consecutive actions */
  STREAK = 'STREAK',
  /** Rules that trigger based on a time period */
  TIMED = 'TIMED',
}

/**
 * Enum defining the operators used in rule conditions.
 */
export enum ConditionOperator {
  /** Equal to comparison */
  EQUALS = 'EQUALS',
  /** Not equal to comparison */
  NOT_EQUALS = 'NOT_EQUALS',
  /** Greater than comparison */
  GREATER_THAN = 'GREATER_THAN',
  /** Less than comparison */
  LESS_THAN = 'LESS_THAN',
  /** Greater than or equal to comparison */
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  /** Less than or equal to comparison */
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  /** Contains value in array or string */
  CONTAINS = 'CONTAINS',
  /** Does not contain value in array or string */
  NOT_CONTAINS = 'NOT_CONTAINS',
  /** Matches a regular expression pattern */
  MATCHES = 'MATCHES',
  /** Logical AND between conditions */
  AND = 'AND',
  /** Logical OR between conditions */
  OR = 'OR',
}

/**
 * Enum defining the types of actions that can be triggered by rules.
 */
export enum ActionType {
  /** Grant an achievement to the user */
  GRANT_ACHIEVEMENT = 'GRANT_ACHIEVEMENT',
  /** Update progress toward an achievement */
  UPDATE_ACHIEVEMENT_PROGRESS = 'UPDATE_ACHIEVEMENT_PROGRESS',
  /** Grant a reward to the user */
  GRANT_REWARD = 'GRANT_REWARD',
  /** Grant experience points to the user */
  GRANT_XP = 'GRANT_XP',
  /** Unlock a quest for the user */
  UNLOCK_QUEST = 'UNLOCK_QUEST',
  /** Update progress toward a quest */
  UPDATE_QUEST_PROGRESS = 'UPDATE_QUEST_PROGRESS',
  /** Send a notification to the user */
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  /** Apply a multiplier to XP earned */
  APPLY_XP_MULTIPLIER = 'APPLY_XP_MULTIPLIER',
}

/**
 * Enum defining the journeys in the AUSTA SuperApp.
 */
export enum Journey {
  /** Health journey ("Minha Saúde") */
  HEALTH = 'HEALTH',
  /** Care journey ("Cuidar-me Agora") */
  CARE = 'CARE',
  /** Plan journey ("Meu Plano & Benefícios") */
  PLAN = 'PLAN',
  /** Cross-journey (applies to multiple journeys) */
  CROSS_JOURNEY = 'CROSS_JOURNEY',
}

/**
 * Interface for a condition that must be met for a rule to trigger.
 * Conditions evaluate properties of events or user state against expected values.
 */
export interface RuleCondition {
  /** Unique identifier for the condition */
  id: string;
  /** The property path to evaluate (e.g., 'event.type', 'user.level') */
  property: string;
  /** The operator to use for comparison */
  operator: ConditionOperator;
  /** The value to compare against */
  value: any;
  /** Optional description of the condition for readability */
  description?: string;
  /** For compound conditions (AND/OR), the nested conditions to evaluate */
  conditions?: RuleCondition[];
}

/**
 * Interface for an action that is triggered when a rule's conditions are met.
 * Actions define the consequences of rule activation.
 */
export interface RuleAction {
  /** Unique identifier for the action */
  id: string;
  /** The type of action to perform */
  type: ActionType;
  /** Parameters specific to the action type */
  parameters: Record<string, any>;
  /** Optional delay before executing the action (in milliseconds) */
  delay?: number;
  /** Optional conditions that must be met for this specific action to execute */
  conditions?: RuleCondition[];
  /** Optional description of the action for readability */
  description?: string;
}

/**
 * Interface for the context in which a rule is evaluated.
 * Provides access to the current event, user state, and other relevant data.
 */
export interface RuleContext {
  /** The event that triggered the rule evaluation */
  event: Record<string, any>;
  /** The user's current state in the gamification system */
  user: {
    /** User's unique identifier */
    id: string;
    /** User's current level */
    level: number;
    /** User's current XP */
    xp: number;
    /** User's achievements */
    achievements: Record<string, any>[];
    /** User's quests */
    quests: Record<string, any>[];
    /** User's journey-specific data */
    journeyData: Record<string, any>;
  };
  /** Timestamp when the rule is being evaluated */
  timestamp: number;
  /** The journey context in which the rule is being evaluated */
  journey: Journey;
  /** Additional metadata relevant to rule evaluation */
  metadata?: Record<string, any>;
}

/**
 * Interface for a rule in the gamification system.
 * Rules define when achievements are unlocked and rewards are granted.
 */
export interface Rule {
  /** Unique identifier for the rule */
  id: string;
  /** Display name of the rule */
  name: string;
  /** Detailed description of what the rule represents */
  description: string;
  /** The type of rule */
  type: RuleType;
  /** The journey this rule belongs to */
  journey: Journey;
  /** The conditions that must be met for the rule to trigger */
  conditions: RuleCondition[];
  /** The actions to perform when the rule is triggered */
  actions: RuleAction[];
  /** Whether the rule is currently active */
  isActive: boolean;
  /** Priority of the rule (higher numbers are evaluated first) */
  priority: number;
  /** Optional start date for when the rule becomes active */
  startDate?: string;
  /** Optional end date for when the rule becomes inactive */
  endDate?: string;
  /** Optional cooldown period between rule triggers (in milliseconds) */
  cooldown?: number;
  /** Optional maximum number of times the rule can be triggered */
  maxTriggers?: number;
  /** Optional tags for categorizing and filtering rules */
  tags?: string[];
  /** Version of the rule for tracking changes */
  version: string;
}

/**
 * Interface for health journey-specific rules.
 * Extends the base Rule interface with health-specific properties.
 */
export interface HealthRule extends Rule {
  /** The journey must be HEALTH for this rule type */
  journey: Journey.HEALTH;
  /** Health-specific metadata for the rule */
  healthMetadata?: {
    /** Related health metrics (e.g., 'steps', 'heart_rate') */
    relatedMetrics?: string[];
    /** Health goals this rule contributes to */
    contributesToGoals?: string[];
    /** Devices this rule is applicable to */
    applicableDevices?: string[];
  };
}

/**
 * Interface for care journey-specific rules.
 * Extends the base Rule interface with care-specific properties.
 */
export interface CareRule extends Rule {
  /** The journey must be CARE for this rule type */
  journey: Journey.CARE;
  /** Care-specific metadata for the rule */
  careMetadata?: {
    /** Related appointment types */
    appointmentTypes?: string[];
    /** Related medication adherence */
    medicationAdherence?: boolean;
    /** Related telemedicine sessions */
    telemedicineSessions?: boolean;
  };
}

/**
 * Interface for plan journey-specific rules.
 * Extends the base Rule interface with plan-specific properties.
 */
export interface PlanRule extends Rule {
  /** The journey must be PLAN for this rule type */
  journey: Journey.PLAN;
  /** Plan-specific metadata for the rule */
  planMetadata?: {
    /** Related benefit types */
    benefitTypes?: string[];
    /** Related claim types */
    claimTypes?: string[];
    /** Related plan selection activities */
    planSelection?: boolean;
  };
}

/**
 * Interface for cross-journey rules that span multiple journeys.
 * Extends the base Rule interface with cross-journey properties.
 */
export interface CrossJourneyRule extends Rule {
  /** The journey must be CROSS_JOURNEY for this rule type */
  journey: Journey.CROSS_JOURNEY;
  /** The journeys this rule applies to */
  applicableJourneys: Journey[];
  /** Cross-journey-specific metadata */
  crossJourneyMetadata?: {
    /** Whether this rule requires activities across multiple journeys */
    requiresMultipleJourneys: boolean;
    /** Journey-specific requirements */
    journeyRequirements?: Record<Journey, RuleCondition[]>;
  };
}

/**
 * Interface for a rule evaluation result.
 * Contains information about whether the rule was triggered and any resulting actions.
 */
export interface RuleEvaluationResult {
  /** The ID of the rule that was evaluated */
  ruleId: string;
  /** Whether the rule was triggered */
  triggered: boolean;
  /** The actions that were executed as a result of the rule being triggered */
  actions: RuleAction[];
  /** Any error that occurred during rule evaluation */
  error?: string;
  /** Timestamp when the rule was evaluated */
  timestamp: number;
  /** Additional context about the rule evaluation */
  context?: Record<string, any>;
}

/**
 * Type for a function that evaluates a rule against a context.
 * Returns a promise that resolves to a RuleEvaluationResult.
 */
export type RuleEvaluator = (
  rule: Rule,
  context: RuleContext
) => Promise<RuleEvaluationResult>;