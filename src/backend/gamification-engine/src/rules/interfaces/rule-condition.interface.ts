/**
 * @file Rule condition interfaces for the gamification engine
 * @description Defines TypeScript interfaces for rule conditions and evaluation contexts.
 * These interfaces provide the foundation for all rule condition structures, ensuring type safety
 * and consistent condition evaluation across the gamification engine.
 */

import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import { IBaseEvent } from '../../events/interfaces/event.interface';

/**
 * Logical operator types for combining multiple conditions
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT'
}

/**
 * Comparison operator types for condition evaluation
 */
export enum ComparisonOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  EXISTS = 'EXISTS',
  NOT_EXISTS = 'NOT_EXISTS'
}

/**
 * Base interface for all rule conditions
 */
export interface IRuleCondition {
  /**
   * Optional journey type to restrict the condition to a specific journey
   * If not provided, the condition applies to all journeys
   */
  journey?: JourneyType;
}

/**
 * Interface for simple comparison conditions
 */
export interface IComparisonCondition extends IRuleCondition {
  /**
   * The field path to evaluate in the event data or user profile
   * @example "event.data.metricValue", "profile.level", "event.journey"
   */
  field: string;

  /**
   * The comparison operator to use
   */
  operator: ComparisonOperator;

  /**
   * The value to compare against
   * Can be a primitive value (string, number, boolean) or an array for certain operators
   */
  value: string | number | boolean | Array<string | number | boolean>;
}

/**
 * Interface for logical conditions that combine multiple conditions
 */
export interface ILogicalCondition extends IRuleCondition {
  /**
   * The logical operator to apply to the conditions
   */
  operator: LogicalOperator;

  /**
   * The conditions to combine with the logical operator
   * Can be a mix of comparison and nested logical conditions
   */
  conditions: Array<IComparisonCondition | ILogicalCondition>;
}

/**
 * Union type for all possible condition types
 */
export type RuleCondition = IComparisonCondition | ILogicalCondition;

/**
 * Interface for user profile data available during rule evaluation
 */
export interface IUserProfile {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * User's current experience points
   */
  xp: number;

  /**
   * User's current level
   */
  level: number;

  /**
   * User's completed achievements
   */
  achievements?: string[];

  /**
   * User's active quests
   */
  quests?: string[];

  /**
   * User's earned rewards
   */
  rewards?: string[];

  /**
   * Additional user metadata
   */
  metadata?: Record<string, any>;

  /**
   * Journey-specific user data
   */
  journeyData?: {
    health?: Record<string, any>;
    care?: Record<string, any>;
    plan?: Record<string, any>;
  };
}

/**
 * Interface for the evaluation context used during rule condition evaluation
 * Combines event data and user profile information
 */
export interface IEvaluationContext {
  /**
   * The event being evaluated
   */
  event: IBaseEvent;

  /**
   * The user profile associated with the event
   */
  profile: IUserProfile;

  /**
   * The timestamp when the evaluation is occurring
   * Defaults to the current time if not provided
   */
  evaluationTime?: Date;

  /**
   * Additional context data that may be needed for evaluation
   */
  metadata?: Record<string, any>;
}

/**
 * Type definition for a condition evaluation function
 * Returns true if the condition is satisfied, false otherwise
 */
export type ConditionEvaluator = (condition: RuleCondition, context: IEvaluationContext) => boolean;