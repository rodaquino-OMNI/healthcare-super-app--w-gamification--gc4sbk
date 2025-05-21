import { Rule } from '../entities/rule.entity';
import { JourneyType } from '@austa/interfaces/common/journey.enum';
import { EventType } from '@austa/interfaces/gamification/event.enum';

/**
 * Interface representing the context of a journey for rule targeting
 * Allows rules to be applied specifically to certain journeys
 */
export interface IJourneyContext {
  /**
   * The type of journey this rule applies to
   * Can be Health, Care, or Plan journey
   */
  journeyType: JourneyType;

  /**
   * Optional journey-specific metadata for additional targeting
   * Can contain journey-specific properties for more granular rule application
   */
  metadata?: Record<string, any>;
}

/**
 * Interface representing the status of a rule
 * Tracks whether a rule is active and its configuration state
 */
export interface IRuleStatus {
  /**
   * Whether the rule is currently active and should be evaluated
   */
  isActive: boolean;

  /**
   * The date when this rule was activated
   */
  activatedAt?: Date;

  /**
   * The date when this rule was last modified
   */
  lastModifiedAt?: Date;

  /**
   * The version of this rule's configuration
   */
  version: number;
}

/**
 * Interface extending the Rule entity with additional metadata
 * Provides the complete contract for rule objects beyond database entity
 */
export interface IRule extends Rule {
  /**
   * The status of this rule
   */
  status: IRuleStatus;

  /**
   * The journey context this rule applies to
   * If not provided, the rule applies to all journeys
   */
  journeyContext?: IJourneyContext;

  /**
   * The type of event this rule listens for
   * Uses standardized event types from @austa/interfaces
   */
  eventType: EventType;

  /**
   * Metadata for rule categorization and filtering
   */
  metadata?: {
    /**
     * Tags for categorizing and filtering rules
     */
    tags?: string[];

    /**
     * Description of what this rule does
     */
    description?: string;

    /**
     * Priority of this rule (higher numbers = higher priority)
     */
    priority?: number;
  };
}

/**
 * Interface for rule evaluation results
 * Returned when a rule is evaluated against an event
 */
export interface IRuleEvaluationResult {
  /**
   * Whether the rule condition was satisfied
   */
  satisfied: boolean;

  /**
   * The rule that was evaluated
   */
  rule: IRule;

  /**
   * The actions that should be performed if the rule was satisfied
   * Empty array if the rule was not satisfied
   */
  actions: Array<Record<string, any>>;

  /**
   * Metadata about the evaluation process
   */
  metadata?: {
    /**
     * Time taken to evaluate the rule in milliseconds
     */
    evaluationTimeMs?: number;

    /**
     * Any additional context from the evaluation
     */
    context?: Record<string, any>;
  };
}

/**
 * Interface for rule creation payload
 * Used when creating a new rule
 */
export interface IRuleCreatePayload {
  /**
   * The event type this rule listens for
   */
  eventType: EventType;

  /**
   * The condition to evaluate
   */
  condition: string;

  /**
   * The actions to perform when the condition is met
   */
  actions: string;

  /**
   * Optional journey context for journey-specific rules
   */
  journeyContext?: IJourneyContext;

  /**
   * Optional metadata for the rule
   */
  metadata?: {
    tags?: string[];
    description?: string;
    priority?: number;
  };
}

/**
 * Interface for rule update payload
 * Used when updating an existing rule
 */
export interface IRuleUpdatePayload {
  /**
   * The event type this rule listens for
   */
  eventType?: EventType;

  /**
   * The condition to evaluate
   */
  condition?: string;

  /**
   * The actions to perform when the condition is met
   */
  actions?: string;

  /**
   * Optional journey context for journey-specific rules
   */
  journeyContext?: IJourneyContext;

  /**
   * Status updates for the rule
   */
  status?: {
    isActive?: boolean;
  };

  /**
   * Optional metadata for the rule
   */
  metadata?: {
    tags?: string[];
    description?: string;
    priority?: number;
  };
}

/**
 * Version 1 of the rule interface for backward compatibility
 * @deprecated Use IRule instead
 */
export interface IRuleV1 extends Omit<Rule, 'event'> {
  /**
   * The event type this rule listens for
   */
  event: string;

  /**
   * Whether the rule is active
   */
  isActive: boolean;
}