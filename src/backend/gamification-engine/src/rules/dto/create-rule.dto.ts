import { 
  IsString, 
  IsNotEmpty, 
  IsBoolean, 
  IsOptional, 
  IsEnum, 
  ValidateNested, 
  IsInt, 
  Min, 
  Max, 
  Length 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Import from @austa/interfaces using path aliases
import { GamificationEventType } from '@austa/interfaces/gamification/events';
import { RuleCondition, RuleAction } from '@austa/interfaces/gamification/rules';

// Import Journey enum from @austa/interfaces
import { JourneyId } from '@austa/interfaces/journey';

/**
 * Data Transfer Object for creating a new gamification rule.
 * 
 * This DTO defines the structure and validation rules for creating rules in the
 * gamification engine. Rules define conditions under which achievements are unlocked,
 * rewards are granted, and other gamification actions are triggered based on user events.
 * 
 * @example
 * // Example rule that awards points when a user completes a health goal
 * {
 *   name: 'Health Goal Completion',
 *   eventType: GamificationEventType.HEALTH_GOAL_COMPLETED,
 *   journey: JourneyId.HEALTH,
 *   condition: { expression: 'event.goalType === "steps" && event.achieved === true' },
 *   action: { type: RuleActionType.AWARD_POINTS, payload: { points: 50 } }
 * }
 */
export class CreateRuleDto {
  /**
   * Human-readable name for the rule.
   * 
   * Used for identification in admin interfaces and logs.
   */
  @IsString()
  @IsNotEmpty({ message: 'Rule name is required' })
  @Length(3, 100, { message: 'Rule name must be between 3 and 100 characters' })
  @ApiProperty({
    description: 'Human-readable name for the rule',
    example: 'Daily Health Check Completion',
    minLength: 3,
    maxLength: 100
  })
  name: string;

  /**
   * Detailed description of what the rule does and when it triggers.
   * 
   * Provides context for administrators and developers about the rule's purpose.
   */
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Detailed description of what the rule does and when it triggers',
    example: 'Awards points to users who complete their daily health check within the app',
    required: false
  })
  description?: string;

  /**
   * The type of event that triggers this rule.
   * Must match one of the standardized event types from @austa/interfaces.
   * 
   * The gamification engine listens for these events and evaluates applicable rules
   * when events of matching types are received.
   */
  @IsEnum(GamificationEventType, { message: 'Event type must be a valid GamificationEventType' })
  @IsNotEmpty({ message: 'Event type is required' })
  @ApiProperty({
    description: 'The type of event that triggers this rule',
    enum: GamificationEventType,
    example: GamificationEventType.HEALTH_GOAL_COMPLETED
  })
  eventType: GamificationEventType;

  /**
   * The specific journey this rule applies to.
   * If not specified, the rule applies to events from all journeys.
   * 
   * This enables journey-specific rule configuration to support cross-journey gamification.
   * Rules can be targeted to Health, Care, or Plan journeys, or apply globally.
   */
  @IsEnum(JourneyId, { message: 'Journey must be a valid JourneyId' })
  @IsOptional()
  @ApiProperty({
    description: 'The specific journey this rule applies to',
    enum: JourneyId,
    example: JourneyId.HEALTH,
    required: false
  })
  journey?: JourneyId;

  /**
   * JSON condition expression that determines if the rule should be triggered.
   * This is evaluated against the event data and user profile.
   * 
   * The condition is a JSON object that follows the RuleCondition interface from @austa/interfaces.
   * It typically contains an expression string that is evaluated at runtime against the event context.
   * 
   * @example
   * { 
   *   expression: 'event.count >= 5 && user.level >= 2',
   *   parameters: { minCount: 5, minLevel: 2 }
   * }
   */
  @IsNotEmpty({ message: 'Condition is required' })
  @ValidateNested()
  @Type(() => Object)
  @ApiProperty({
    description: 'JSON condition expression that determines if the rule should be triggered',
    example: { expression: 'event.count >= 5 && user.level >= 2' }
  })
  condition: RuleCondition;

  /**
   * JSON action definition that specifies what happens when the rule is triggered.
   * This can include granting points, unlocking achievements, or progressing quests.
   * 
   * The action is a JSON object that follows the RuleAction interface from @austa/interfaces.
   * It contains a type field specifying the action type and a payload with action-specific data.
   * 
   * @example
   * { 
   *   type: RuleActionType.AWARD_POINTS, 
   *   payload: { points: 50, multiplier: 1.5 } 
   * }
   */
  @IsNotEmpty({ message: 'Action is required' })
  @ValidateNested()
  @Type(() => Object)
  @ApiProperty({
    description: 'JSON action definition that specifies what happens when the rule is triggered',
    example: { type: 'AWARD_POINTS', payload: { points: 50 } }
  })
  action: RuleAction;

  /**
   * Priority of the rule. Rules with higher priority are evaluated first.
   * 
   * This allows more specific or important rules to take precedence when multiple rules
   * could be triggered by the same event.
   * 
   * Valid range is -100 to 100, with 0 being the default priority.
   */
  @IsInt()
  @Min(-100, { message: 'Priority must be at least -100' })
  @Max(100, { message: 'Priority cannot exceed 100' })
  @IsOptional()
  @ApiProperty({
    description: 'Priority of the rule. Rules with higher priority are evaluated first',
    example: 10,
    default: 0,
    minimum: -100,
    maximum: 100,
    required: false
  })
  priority?: number = 0;

  /**
   * Indicates whether the rule is currently active.
   * Inactive rules are not evaluated against events.
   * 
   * This allows temporarily disabling rules without deleting them, useful for
   * seasonal events, testing, or maintenance.
   */
  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description: 'Indicates whether the rule is currently active',
    example: true,
    default: true,
    required: false
  })
  isActive?: boolean = true;
}