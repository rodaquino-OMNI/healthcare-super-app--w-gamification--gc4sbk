import { Rule } from '../entities/rule.entity';
import { JourneyType } from '@austa/interfaces/journey';
import { GamificationEventType } from '@austa/interfaces/gamification/events';

/**
 * Represents the activation status of a rule
 */
export enum RuleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SCHEDULED = 'scheduled',
  DEPRECATED = 'deprecated'
}

/**
 * Represents the journey context for a rule
 * Rules can be targeted to specific journeys or apply across all journeys
 */
export interface IJourneyContext {
  /**
   * The journey type this rule applies to
   * If undefined, the rule applies to all journeys
   */
  journeyType?: JourneyType;
  
  /**
   * Optional journey-specific configuration
   * Can contain additional parameters specific to each journey
   */
  config?: Record<string, any>;
}

/**
 * Represents a rule action to be performed when a rule is triggered
 */
export interface IRuleAction {
  /**
   * The type of action to perform
   */
  type: string;
  
  /**
   * The value associated with the action
   * For example, the number of XP points to award
   */
  value: number | string;
  
  /**
   * Optional target identifier for the action
   * For example, an achievement ID to progress
   */
  targetId?: string;
  
  /**
   * Optional metadata for the action
   */
  metadata?: Record<string, any>;
}

/**
 * Represents the status of a rule including activation state and version information
 */
export interface IRuleStatus {
  /**
   * The current status of the rule
   */
  status: RuleStatus;
  
  /**
   * The version of the rule
   * Follows semantic versioning
   */
  version: string;
  
  /**
   * When the rule was created
   */
  createdAt: Date;
  
  /**
   * When the rule was last updated
   */
  updatedAt: Date;
  
  /**
   * When the rule becomes active
   * Only relevant for SCHEDULED rules
   */
  activeFrom?: Date;
  
  /**
   * When the rule becomes inactive
   * Can be used for time-limited rules
   */
  activeTo?: Date;
}

/**
 * Extends the base Rule entity with additional metadata and status information
 */
export interface IRule extends Rule {
  /**
   * The parsed actions from the actions JSON string
   */
  parsedActions: IRuleAction[];
  
  /**
   * The status information for the rule
   */
  ruleStatus: IRuleStatus;
  
  /**
   * The journey context for the rule
   */
  journeyContext: IJourneyContext;
  
  /**
   * The priority of the rule
   * Higher priority rules are evaluated first
   */
  priority: number;
  
  /**
   * A human-readable name for the rule
   */
  name: string;
  
  /**
   * A description of what the rule does
   */
  description: string;
  
  /**
   * Tags for categorizing and filtering rules
   */
  tags: string[];
}

/**
 * Represents the evaluation context for a rule
 */
export interface IRuleEvaluationContext {
  /**
   * The event that triggered the rule evaluation
   */
  event: any;
  
  /**
   * The user profile associated with the event
   */
  userProfile: any;
  
  /**
   * The journey context for the evaluation
   */
  journeyContext?: IJourneyContext;
  
  /**
   * Additional data that might be needed for rule evaluation
   */
  additionalData?: Record<string, any>;
}

/**
 * Represents the result of a rule evaluation
 */
export interface IRuleEvaluationResult {
  /**
   * Whether the rule condition was satisfied
   */
  satisfied: boolean;
  
  /**
   * The actions to be performed if the rule was satisfied
   */
  actions: IRuleAction[];
  
  /**
   * The rule that was evaluated
   */
  rule: IRule;
  
  /**
   * Timestamp of when the evaluation occurred
   */
  evaluatedAt: Date;
  
  /**
   * Optional metadata about the evaluation
   */
  metadata?: Record<string, any>;
}

/**
 * Version 1 of the rule interfaces for backward compatibility
 */
export namespace V1 {
  /**
   * V1 Rule interface with minimal properties
   */
  export interface IRule extends Omit<Rule, 'actions'> {
    /**
     * The parsed actions from the actions JSON string
     */
    actions: IRuleAction[];
    
    /**
     * Whether the rule is active
     */
    isActive: boolean;
  }
  
  /**
   * V1 Rule Action interface
   */
  export interface IRuleAction {
    /**
     * The type of action to perform
     */
    type: string;
    
    /**
     * The value associated with the action
     */
    value: number | string;
    
    /**
     * Optional target identifier for the action
     */
    targetId?: string;
  }
}

/**
 * Version 2 of the rule interfaces with journey context support
 */
export namespace V2 {
  /**
   * V2 Rule interface with journey context
   */
  export interface IRule extends V1.IRule {
    /**
     * The journey context for the rule
     */
    journeyContext?: IJourneyContext;
    
    /**
     * A human-readable name for the rule
     */
    name?: string;
    
    /**
     * A description of what the rule does
     */
    description?: string;
  }
}