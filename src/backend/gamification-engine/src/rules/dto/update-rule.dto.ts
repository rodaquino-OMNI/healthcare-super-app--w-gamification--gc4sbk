import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, ValidateIf, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateRuleDto } from './create-rule.dto';
import { JourneyType } from './rule-filter.dto';
import { GamificationEventType } from '@austa/interfaces/gamification/events';
import { RuleCondition, RuleAction } from '@austa/interfaces/gamification/rules';

/**
 * Data Transfer Object for updating existing gamification rules.
 * Extends PartialType of CreateRuleDto to make all fields optional for PATCH operations.
 * 
 * This DTO follows NestJS best practices for partial updates, allowing clients to
 * update only specific fields of a rule without having to provide all fields.
 * It maintains the same validation rules as CreateRuleDto for the fields that are provided.
 * 
 * Key features:
 * - Supports journey-specific rule validation
 * - Enables toggling rule status without changing other properties
 * - Maintains type safety with proper interfaces from @austa/interfaces
 * - Implements standardized validation with class-validator
 * - Provides comprehensive API documentation with @nestjs/swagger
 */
export class UpdateRuleDto extends PartialType(CreateRuleDto) {
  /**
   * Optional name for the rule.
   * @example "Daily Step Goal Achievement"
   */
  @ApiProperty({
    description: 'Name of the rule',
    required: false,
    example: 'Daily Step Goal Achievement'
  })
  @IsString()
  @IsOptional()
  name?: string;

  /**
   * Optional description of what the rule does and when it triggers.
   * @example "Awards XP when a user reaches their daily step goal"
   */
  @ApiProperty({
    description: 'Description of what the rule does',
    required: false,
    example: 'Awards XP when a user reaches their daily step goal'
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Optional event type that triggers this rule.
   * Must be a valid event type from the GamificationEventType enum.
   * @example "STEPS_RECORDED"
   */
  @ApiProperty({
    description: 'Event type that triggers this rule',
    required: false,
    enum: GamificationEventType,
    example: 'STEPS_RECORDED'
  })
  @IsEnum(GamificationEventType)
  @IsOptional()
  event?: GamificationEventType;

  /**
   * Optional journey this rule belongs to.
   * Specifies which journey's events this rule applies to.
   * @example "health"
   */
  @ApiProperty({
    description: 'Journey this rule belongs to',
    required: false,
    enum: JourneyType,
    example: JourneyType.HEALTH
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journey?: JourneyType;

  /**
   * Optional condition that determines if the rule should be triggered.
   * This is a structured object with an expression property that will be evaluated
   * against the event data.
   * @example { "expression": "event.data.steps >= 10000" }
   */
  @ApiProperty({
    description: 'Condition that determines if the rule should be triggered',
    required: false,
    type: 'object',
    example: { expression: 'event.data.steps >= 10000' }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  condition?: RuleCondition;

  /**
   * Optional actions to perform when the rule is triggered.
   * This is a structured object with type and payload properties.
   * @example { "type": "AWARD_POINTS", "payload": { "points": 50 } }
   */
  @ApiProperty({
    description: 'Actions to perform when the rule is triggered',
    required: false,
    type: 'object',
    example: { type: 'AWARD_POINTS', payload: { points: 50 } }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  action?: RuleAction;

  /**
   * Optional flag indicating whether the rule is enabled.
   * Disabled rules will not be evaluated against events.
   * @example true
   */
  @ApiProperty({
    description: 'Whether the rule is enabled',
    required: false,
    example: true
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  /**
   * Optional priority of the rule.
   * Rules with higher priority are evaluated first.
   * Must be a non-negative integer.
   * @example 10
   */
  @ApiProperty({
    description: 'Priority of the rule (higher values = higher priority)',
    required: false,
    example: 10,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  /**
   * Optional validation to ensure that if journey is provided, it's a valid journey type.
   * This is a redundant check with @IsEnum but provides a more specific error message.
   */
  @ValidateIf(o => o.journey !== undefined)
  @IsEnum(JourneyType, {
    message: 'Journey must be one of: health, care, plan, or all'
  })
  validateJourney?: JourneyType;
  
  /**
   * Custom validation method that can be used to perform complex validation
   * that depends on multiple fields. This is called by the ValidationPipe.
   * 
   * For example, we could validate that certain actions are only allowed
   * for specific journey types, or that certain event types require specific
   * condition formats.
   */
  validate(): boolean | Promise<boolean> {
    // This method can be implemented to add custom validation logic
    // that depends on multiple fields. For now, we return true as
    // the basic validation is handled by class-validator decorators.
    return true;
  }
}