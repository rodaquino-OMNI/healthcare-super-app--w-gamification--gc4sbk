import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { JourneyType } from '@austa/interfaces';
import { RuleActionDto } from './rule-action.dto';
import { EventType } from './rule-filter.dto';

/**
 * Data Transfer Object for creating a new gamification rule.
 * 
 * Rules define when and how users earn rewards, points, or achievements
 * based on their actions within the application.
 */
export class CreateRuleDto {
  /**
   * The name of the rule.
   * @example 'Daily Step Goal'
   */
  @IsNotEmpty({ message: 'Rule name is required' })
  @IsString({ message: 'Rule name must be a string' })
  name: string;

  /**
   * A description of what the rule does.
   * @example 'Awards XP when a user reaches their daily step goal'
   */
  @IsNotEmpty({ message: 'Rule description is required' })
  @IsString({ message: 'Rule description must be a string' })
  description: string;

  /**
   * The type of event that triggers this rule.
   * @example 'STEPS_RECORDED'
   */
  @IsNotEmpty({ message: 'Event type is required' })
  @IsEnum(EventType, { message: 'Event type must be a valid EventType' })
  eventType: EventType;

  /**
   * The specific journey this rule applies to (e.g., 'health', 'care', 'plan').
   * If not specified, the rule applies to events from any journey.
   * @example 'health'
   */
  @IsOptional()
  @IsEnum(JourneyType, { message: 'Journey must be a valid JourneyType' })
  journey?: JourneyType;

  /**
   * The condition that determines if the rule should be triggered.
   * This is a JavaScript expression that will be evaluated against the event data.
   * @example 'event.data.steps >= 10000'
   */
  @IsNotEmpty({ message: 'Condition is required' })
  @IsString({ message: 'Condition must be a string' })
  condition: string;

  /**
   * The actions that specify what happens when the rule is triggered.
   * Each action has a type and parameters specific to that type.
   */
  @IsNotEmpty({ message: 'At least one action is required' })
  @IsArray({ message: 'Actions must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions: RuleActionDto[];

  /**
   * Priority of the rule (lower number = higher priority).
   * Used to determine execution order when multiple rules match the same event.
   * @example 10
   */
  @IsOptional()
  @IsNumber({}, { message: 'Priority must be a number' })
  @Min(0, { message: 'Priority must be a non-negative number' })
  priority?: number = 100;

  /**
   * Indicates whether the rule is currently active.
   * Inactive rules are not evaluated against incoming events.
   * @example true
   */
  @IsOptional()
  @IsBoolean({ message: 'Enabled flag must be a boolean' })
  enabled?: boolean = true;

  /**
   * Optional metadata for the rule.
   * Can contain additional information specific to the rule type or journey.
   */
  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: Record<string, any>;
}