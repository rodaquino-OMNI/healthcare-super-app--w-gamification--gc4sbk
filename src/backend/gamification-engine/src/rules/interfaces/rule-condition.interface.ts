/**
 * @file Rule condition interfaces for the gamification engine
 * 
 * This file defines the interfaces for rule conditions and evaluation contexts
 * in the gamification engine. It establishes the contract for condition evaluation,
 * including the structure of the evaluation context that combines event data and
 * user profile information.
 */

import { JourneyType } from '@austa/interfaces/common';
import { GameEvent } from '@austa/interfaces/gamification';
import { UserProfile } from '@austa/interfaces/gamification';

/**
 * Logical operators for combining multiple conditions
 */
export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT'
}

/**
 * Comparison operators for condition evaluation
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
  MATCHES_REGEX = 'MATCHES_REGEX'
}

/**
 * Base interface for all rule conditions
 */
export interface IRuleCondition {
  /**
   * Optional journey type to restrict this condition to a specific journey
   */
  journeyType?: JourneyType;
}

/**
 * Simple condition that compares a field value against a target value
 */
export interface ISimpleCondition extends IRuleCondition {
  /**
   * The field path to evaluate (e.g., 'event.data.steps', 'profile.level')
   */
  field: string;
  
  /**
   * The comparison operator to use
   */
  operator: ComparisonOperator;
  
  /**
   * The value to compare against
   */
  value: string | number | boolean | null;
}

/**
 * Compound condition that combines multiple conditions with a logical operator
 */
export interface ICompoundCondition extends IRuleCondition {
  /**
   * The logical operator to apply to the conditions
   */
  operator: LogicalOperator;
  
  /**
   * The conditions to combine
   */
  conditions: Array<ISimpleCondition | ICompoundCondition>;
}

/**
 * Evaluation context that provides the data needed to evaluate a rule condition
 */
export interface IEvaluationContext {
  /**
   * The event that triggered the rule evaluation
   */
  event: GameEvent;
  
  /**
   * The user profile associated with the event
   */
  profile: UserProfile;
  
  /**
   * The journey type associated with the event
   */
  journeyType: JourneyType;
}

/**
 * Type definition for a condition evaluation function
 */
export type ConditionEvaluator = (condition: IRuleCondition, context: IEvaluationContext) => boolean;

/**
 * Interface for a service that evaluates rule conditions
 */
export interface IRuleConditionEvaluator {
  /**
   * Evaluates a rule condition against the provided context
   * @param condition The condition to evaluate
   * @param context The context containing event and profile data
   * @returns True if the condition is satisfied, false otherwise
   */
  evaluate(condition: IRuleCondition | ISimpleCondition | ICompoundCondition, context: IEvaluationContext): boolean;
}