import { Expose, Transform } from 'class-transformer';
import { Rule } from '../entities/rule.entity';
import { format } from 'date-fns';
import { Journey } from '@austa/interfaces/gamification/events';
import { RuleCondition, RuleAction } from '@austa/interfaces/gamification/rules';

/**
 * Data Transfer Object for standardizing rule responses across all API endpoints.
 * Extends the Rule entity with additional computed properties and controls serialization.
 * 
 * This DTO ensures consistent response formatting for rule data and enhances
 * the API contract with computed properties that are useful for frontend display.
 */
export class RuleResponseDto extends Rule {
  /**
   * The unique identifier of the rule.
   */
  @Expose()
  id: string;

  /**
   * The name of the rule.
   */
  @Expose()
  name: string;

  /**
   * A description of what the rule does.
   */
  @Expose()
  description: string;

  /**
   * The type of event that triggers this rule.
   */
  @Expose()
  eventType: string;

  /**
   * The specific journey this rule applies to (e.g., 'health', 'care', 'plan').
   * If not specified, the rule applies to events from any journey.
   */
  @Expose()
  @Transform(({ value }) => value as Journey)
  journey?: Journey;

  /**
   * The condition that determines if the rule should be triggered.
   * This is a complex object that follows the RuleCondition interface structure.
   */
  @Expose()
  @Transform(({ value }) => value as RuleCondition)
  condition: RuleCondition;

  /**
   * The action that specifies what happens when the rule is triggered.
   * This is a complex object that follows the RuleAction interface structure.
   */
  @Expose()
  @Transform(({ value }) => value as RuleAction)
  action: RuleAction;

  /**
   * Priority of the rule (lower number = higher priority).
   * Used to determine execution order when multiple rules match the same event.
   */
  @Expose()
  priority: number;

  /**
   * Indicates whether the rule is currently active.
   * Inactive rules are not evaluated against incoming events.
   * 
   * Note: This property is also exposed as 'enabled' for backward compatibility.
   */
  @Expose()
  isActive: boolean;

  /**
   * Alias for isActive property for backward compatibility.
   * Some parts of the system may still use 'enabled' instead of 'isActive'.
   */
  @Expose({ name: 'enabled' })
  @Transform(({ obj }) => obj.isActive)
  enabled: boolean;

  /**
   * Timestamp when the rule was created.
   */
  @Expose()
  createdAt: Date;

  /**
   * Timestamp when the rule was last updated.
   */
  @Expose()
  updatedAt: Date;

  /**
   * The creation date of the rule, formatted for display.
   * This is a computed property that formats the createdAt timestamp using date-fns.
   * Returns a localized date string in the format "January 1, 2023" (varies by locale).
   */
  @Expose()
  @Transform(({ obj }) => {
    if (obj.createdAt) {
      return format(new Date(obj.createdAt), 'PPP'); // Localized date format
    }
    return null;
  })
  formattedDate: string;

  /**
   * Indicates if the rule is new (created within the last 7 days).
   * This is a computed property based on the creation date.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.createdAt) return false;
    
    const createdAt = new Date(obj.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 7;
  })
  isNew: boolean;

  /**
   * A human-readable representation of the rule's complexity.
   * This is a computed property based on the condition's complexity.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.condition) return 'simple';
    
    // Determine complexity based on the structure of the condition
    // This is a simplified example - actual implementation would depend on the condition structure
    const conditionStr = JSON.stringify(obj.condition);
    if (conditionStr.length < 100) return 'simple';
    if (conditionStr.length < 500) return 'moderate';
    return 'complex';
  })
  complexity: string;

  /**
   * Creates a RuleResponseDto instance from a Rule entity.
   * This static method simplifies the transformation process in services and controllers.
   * 
   * @param rule - The rule entity to transform
   * @returns A new RuleResponseDto instance
   */
  static fromEntity(rule: Rule): RuleResponseDto {
    const responseDto = new RuleResponseDto();
    
    // Copy all properties from the rule entity
    Object.assign(responseDto, rule);
    
    return responseDto;
  }
}