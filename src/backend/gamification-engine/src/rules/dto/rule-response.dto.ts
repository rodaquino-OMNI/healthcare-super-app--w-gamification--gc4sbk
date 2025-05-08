import { Expose, Transform, Type } from 'class-transformer'; // class-transformer 0.5.1
import { Rule } from '../entities/rule.entity';
import { GamificationEventType } from '@austa/interfaces/gamification/events'; // @austa/interfaces 1.0.0
import { JourneyId } from '@austa/interfaces/journey'; // @austa/interfaces 1.0.0
import { RuleCondition, RuleAction, RuleActionType } from '@austa/interfaces/gamification/rules'; // @austa/interfaces 1.0.0
import { format } from 'date-fns'; // date-fns 3.3.1

/**
 * Data Transfer Object for standardizing rule responses across API endpoints.
 * Extends the Rule entity with additional computed properties for frontend use.
 * 
 * This DTO ensures consistent data format in responses, properly serializes rule
 * conditions and actions for client use, and follows API best practices for entity
 * representation.
 */
export class RuleResponseDto extends Rule {
  /**
   * The unique identifier for the rule.
   * Explicitly exposed to ensure it's always included in the response.
   */
  @Expose()
  id: string;

  /**
   * The human-readable name for the rule.
   */
  @Expose()
  name: string;

  /**
   * The detailed description of what the rule does and when it triggers.
   */
  @Expose()
  description?: string;

  /**
   * The type of event that triggers this rule.
   */
  @Expose()
  @Transform(({ value }) => value as GamificationEventType)
  eventType: GamificationEventType;

  /**
   * The specific journey this rule applies to.
   * If not specified, the rule applies to events from all journeys.
   */
  @Expose()
  @Transform(({ value }) => value as JourneyId)
  journey?: JourneyId;

  /**
   * JSON condition expression that determines if the rule should be triggered.
   * This is evaluated against the event data and user profile.
   */
  @Expose()
  @Type(() => Object)
  condition: RuleCondition;

  /**
   * JSON action definition that specifies what happens when the rule is triggered.
   */
  @Expose()
  @Type(() => Object)
  action: RuleAction;

  /**
   * Priority of the rule. Rules with higher priority are evaluated first.
   */
  @Expose()
  priority: number;

  /**
   * Indicates whether the rule is currently active.
   */
  @Expose()
  isActive: boolean;

  /**
   * Timestamp when the rule was created.
   * Transformed to ISO string format for consistent API responses.
   */
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  createdAt: Date;

  /**
   * Timestamp when the rule was last updated.
   * Transformed to ISO string format for consistent API responses.
   */
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  updatedAt: Date;

  /**
   * Computed property that returns the formatted creation date.
   * Uses date-fns for consistent date formatting across the application.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (obj.createdAt instanceof Date) {
      return format(obj.createdAt, 'PPP'); // Locale-aware date format
    }
    if (typeof obj.createdAt === 'string') {
      return format(new Date(obj.createdAt), 'PPP');
    }
    return null;
  })
  get formattedDate(): string | null {
    return null; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that returns the journey-specific color for UI display.
   * Maps the journey type to its corresponding theme color.
   */
  @Expose()
  @Transform(({ obj }) => {
    const journeyColorMap = {
      [JourneyId.HEALTH]: '#4CAF50', // Green
      [JourneyId.CARE]: '#FF9800',   // Orange
      [JourneyId.PLAN]: '#2196F3'    // Blue
    };
    
    return obj.journey ? journeyColorMap[obj.journey] : '#9C27B0'; // Default to purple if no journey specified
  })
  get journeyColor(): string {
    return '#9C27B0'; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that returns a human-readable representation of the action.
   * Useful for displaying in admin interfaces and logs.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.action || !obj.action.type) {
      return 'Unknown action';
    }

    const actionTypeMap = {
      [RuleActionType.AWARD_POINTS]: 'Award Points',
      [RuleActionType.UNLOCK_ACHIEVEMENT]: 'Unlock Achievement',
      [RuleActionType.PROGRESS_QUEST]: 'Progress Quest',
      [RuleActionType.GRANT_REWARD]: 'Grant Reward'
    };

    const actionType = actionTypeMap[obj.action.type] || obj.action.type;
    
    switch (obj.action.type) {
      case RuleActionType.AWARD_POINTS:
        return `${actionType}: ${obj.action.payload?.points || 0} points`;
      case RuleActionType.UNLOCK_ACHIEVEMENT:
        return `${actionType}: ${obj.action.payload?.achievementId || 'Unknown achievement'}`;
      case RuleActionType.PROGRESS_QUEST:
        return `${actionType}: ${obj.action.payload?.questId || 'Unknown quest'} (${obj.action.payload?.progress || 0} progress)`;
      case RuleActionType.GRANT_REWARD:
        return `${actionType}: ${obj.action.payload?.rewardId || 'Unknown reward'}`;
      default:
        return `${actionType}`;
    }
  })
  get actionDescription(): string {
    return ''; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that determines if this rule is configurable by users.
   * System rules with negative priorities are typically not configurable.
   */
  @Expose()
  @Transform(({ obj }) => {
    // System rules typically have negative priorities and are not configurable by users
    return obj.priority >= 0;
  })
  get isConfigurable(): boolean {
    return true; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that returns the event type in a human-readable format.
   * Converts the enum value to a formatted string for display purposes.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.eventType) {
      return 'Unknown Event';
    }

    // Convert from SCREAMING_SNAKE_CASE to Title Case With Spaces
    return obj.eventType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  })
  get eventTypeFormatted(): string {
    return ''; // This is a placeholder, the actual value is set by the @Transform decorator
  }

  /**
   * Computed property that returns a simplified condition for display purposes.
   * Extracts key information from the condition expression for UI rendering.
   */
  @Expose()
  @Transform(({ obj }) => {
    if (!obj.condition || !obj.condition.expression) {
      return 'No condition specified';
    }

    // For complex conditions, we might want to provide a simplified summary
    // This is a basic implementation that returns the raw expression
    // In a real application, you might want to parse the expression and generate a more user-friendly summary
    return obj.condition.expression.length > 50
      ? `${obj.condition.expression.substring(0, 47)}...`
      : obj.condition.expression;
  })
  get conditionSummary(): string {
    return ''; // This is a placeholder, the actual value is set by the @Transform decorator
  }
}