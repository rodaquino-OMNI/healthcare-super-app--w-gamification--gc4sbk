/**
 * @file Defines interfaces for the gamification rules engine.
 * These interfaces standardize how rules are defined and evaluated to determine
 * when to award points, unlock achievements, and progress quests based on user events.
 */

/**
 * Represents a rule that determines how points and achievements are awarded based on user actions.
 * 
 * Rules consist of:
 * - An event type to listen for (e.g., "STEPS_RECORDED", "APPOINTMENT_COMPLETED")
 * - A condition that determines if the rule should be triggered
 * - Actions to perform when the rule is triggered (award points, progress achievements, etc.)
 *
 * @interface
 */
export interface Rule {
  /**
   * Unique identifier for the rule
   */
  id: string;

  /**
   * The event type that this rule listens for
   * Examples: "STEPS_RECORDED", "APPOINTMENT_COMPLETED", "CLAIM_SUBMITTED"
   */
  event: string;

  /**
   * A condition that determines if the rule should be triggered
   * This condition will be evaluated at runtime with the event data
   */
  condition: RuleCondition;

  /**
   * Actions to be performed when the rule is triggered
   */
  actions: RuleAction[];
}

/**
 * Represents a condition that determines if a rule should be triggered.
 * Can be a string expression or a structured condition object.
 *
 * @interface
 */
export interface RuleCondition {
  /**
   * A JavaScript expression string that will be evaluated at runtime
   * Example: "event.data.steps >= 10000" or "event.data.appointmentType === 'TELEMEDICINE'"
   */
  expression?: string;

  /**
   * A structured condition object for more complex conditions
   * This allows for more type-safe condition definitions
   */
  structured?: {
    /**
     * The operator to use for the condition
     */
    operator: 'AND' | 'OR' | 'NOT' | 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS';
    
    /**
     * The field to check in the event data
     * Example: "data.steps" or "data.appointmentType"
     */
    field?: string;
    
    /**
     * The value to compare against
     */
    value?: any;
    
    /**
     * Nested conditions for logical operators (AND, OR, NOT)
     */
    conditions?: RuleCondition[];
  };
}

/**
 * Defines the types of actions that can be performed when a rule is triggered.
 *
 * @enum {string}
 */
export enum RuleActionType {
  /**
   * Award experience points to the user
   */
  AWARD_XP = 'AWARD_XP',
  
  /**
   * Progress an achievement for the user
   */
  PROGRESS_ACHIEVEMENT = 'PROGRESS_ACHIEVEMENT',
  
  /**
   * Progress a quest for the user
   */
  PROGRESS_QUEST = 'PROGRESS_QUEST',
  
  /**
   * Grant a reward to the user
   */
  GRANT_REWARD = 'GRANT_REWARD',
  
  /**
   * Send a notification to the user
   */
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  
  /**
   * Unlock a new feature or content for the user
   */
  UNLOCK_FEATURE = 'UNLOCK_FEATURE',
  
  /**
   * Custom action defined by the implementation
   */
  CUSTOM = 'CUSTOM'
}

/**
 * Represents an action to be performed when a rule is triggered.
 *
 * @interface
 */
export interface RuleAction {
  /**
   * The type of action to perform
   */
  type: RuleActionType;
  
  /**
   * The value associated with the action (e.g., number of XP points to award)
   */
  value?: number | string;
  
  /**
   * The ID of the achievement to progress (for PROGRESS_ACHIEVEMENT action)
   */
  achievementId?: string;
  
  /**
   * The ID of the quest to progress (for PROGRESS_QUEST action)
   */
  questId?: string;
  
  /**
   * The ID of the reward to grant (for GRANT_REWARD action)
   */
  rewardId?: string;
  
  /**
   * The notification message to send (for SEND_NOTIFICATION action)
   */
  message?: string;
  
  /**
   * The feature to unlock (for UNLOCK_FEATURE action)
   */
  feature?: string;
  
  /**
   * Custom data for the CUSTOM action type
   */
  customData?: Record<string, any>;
}

/**
 * Represents the context in which a rule is evaluated.
 * This includes the event data and user profile information.
 *
 * @interface
 */
export interface RuleContext {
  /**
   * The event that triggered the rule evaluation
   */
  event: {
    /**
     * The type of event
     */
    type: string;
    
    /**
     * The data associated with the event
     */
    data: Record<string, any>;
    
    /**
     * The timestamp when the event occurred
     */
    timestamp: Date | string;
    
    /**
     * The user ID associated with the event
     */
    userId: string;
    
    /**
     * The journey associated with the event (health, care, plan)
     */
    journey?: 'health' | 'care' | 'plan';
  };
  
  /**
   * The user profile information
   */
  userProfile: {
    /**
     * The user ID
     */
    id: string;
    
    /**
     * The user's current XP level
     */
    level: number;
    
    /**
     * The user's current XP points
     */
    xp: number;
    
    /**
     * The user's achievements
     */
    achievements: {
      /**
       * The achievement ID
       */
      id: string;
      
      /**
       * The current progress value
       */
      progress: number;
      
      /**
       * Whether the achievement is completed
       */
      completed: boolean;
    }[];
    
    /**
     * The user's quests
     */
    quests: {
      /**
       * The quest ID
       */
      id: string;
      
      /**
       * The current progress value
       */
      progress: number;
      
      /**
       * Whether the quest is completed
       */
      completed: boolean;
    }[];
    
    /**
     * Additional user data
     */
    data?: Record<string, any>;
  };
}

/**
 * Represents a rule specific to the Health journey.
 * Extends the base Rule interface with health-specific properties.
 *
 * @interface
 * @extends {Rule}
 */
export interface HealthRule extends Rule {
  /**
   * The specific health metric this rule applies to
   * Examples: "steps", "heartRate", "sleep", "weight"
   */
  healthMetric?: string;
  
  /**
   * The threshold value for the health metric
   * Example: 10000 (steps)
   */
  threshold?: number;
  
  /**
   * The time period over which the rule applies
   * Examples: "daily", "weekly", "monthly"
   */
  timePeriod?: 'daily' | 'weekly' | 'monthly';
}

/**
 * Represents a rule specific to the Care journey.
 * Extends the base Rule interface with care-specific properties.
 *
 * @interface
 * @extends {Rule}
 */
export interface CareRule extends Rule {
  /**
   * The type of care activity this rule applies to
   * Examples: "appointment", "medication", "telemedicine"
   */
  careActivity?: string;
  
  /**
   * The provider type associated with this rule
   * Examples: "primaryCare", "specialist", "dentist"
   */
  providerType?: string;
  
  /**
   * The frequency of the care activity
   * Examples: "once", "daily", "weekly", "monthly"
   */
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
}

/**
 * Represents a rule specific to the Plan journey.
 * Extends the base Rule interface with plan-specific properties.
 *
 * @interface
 * @extends {Rule}
 */
export interface PlanRule extends Rule {
  /**
   * The type of plan activity this rule applies to
   * Examples: "claim", "benefit", "coverage"
   */
  planActivity?: string;
  
  /**
   * The benefit type associated with this rule
   * Examples: "medical", "dental", "vision", "wellness"
   */
  benefitType?: string;
  
  /**
   * The claim status that triggers this rule
   * Examples: "submitted", "approved", "denied"
   */
  claimStatus?: 'submitted' | 'approved' | 'denied';
}

/**
 * Type guard to check if a rule is a HealthRule
 * @param rule The rule to check
 * @returns True if the rule is a HealthRule
 */
export function isHealthRule(rule: Rule): rule is HealthRule {
  return (rule as HealthRule).healthMetric !== undefined;
}

/**
 * Type guard to check if a rule is a CareRule
 * @param rule The rule to check
 * @returns True if the rule is a CareRule
 */
export function isCareRule(rule: Rule): rule is CareRule {
  return (rule as CareRule).careActivity !== undefined;
}

/**
 * Type guard to check if a rule is a PlanRule
 * @param rule The rule to check
 * @returns True if the rule is a PlanRule
 */
export function isPlanRule(rule: Rule): rule is PlanRule {
  return (rule as PlanRule).planActivity !== undefined;
}