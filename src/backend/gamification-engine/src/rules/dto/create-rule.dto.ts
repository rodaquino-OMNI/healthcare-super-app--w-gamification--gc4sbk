import { IsString, IsNotEmpty, IsJSON, IsBoolean, IsOptional, IsEnum, Matches, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, JourneyType } from '@austa/interfaces/gamification/events';
import { RuleActionType } from '@austa/interfaces/gamification/rules';

/**
 * Represents a single action to be performed when a rule is triggered.
 */
export class RuleActionDto {
  /**
   * The type of action to perform.
   * Examples: AWARD_XP, PROGRESS_ACHIEVEMENT, UNLOCK_REWARD
   */
  @IsNotEmpty()
  @IsEnum(RuleActionType, {
    message: 'Action type must be a valid RuleActionType',
  })
  type: RuleActionType;

  /**
   * The value associated with the action.
   * For AWARD_XP, this is the amount of XP to award.
   * For PROGRESS_ACHIEVEMENT, this is the amount of progress to add.
   */
  @IsNotEmpty()
  @IsString()
  value: string;

  /**
   * Optional ID reference for the action target.
   * For PROGRESS_ACHIEVEMENT, this would be the achievement ID.
   * For UNLOCK_REWARD, this would be the reward ID.
   */
  @IsOptional()
  @IsString()
  targetId?: string;
}

/**
 * Data transfer object for creating a new rule in the gamification engine.
 * Rules define how user actions are translated into gamification rewards.
 */
export class CreateRuleDto {
  /**
   * The name of the rule.
   * Should be descriptive and indicate the rule's purpose.
   * Example: "Daily Step Goal Achieved", "First Appointment Booked"
   */
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * A detailed description of what the rule does and when it triggers.
   */
  @IsNotEmpty()
  @IsString()
  description: string;

  /**
   * The type of event that triggers this rule.
   * Must be a valid EventType from the @austa/interfaces package.
   */
  @IsNotEmpty()
  @IsEnum(EventType, {
    message: 'Event type must be a valid EventType from @austa/interfaces',
  })
  eventType: EventType;

  /**
   * The journey associated with this rule.
   * Specifies which user journey this rule belongs to.
   */
  @IsNotEmpty()
  @IsEnum(JourneyType, {
    message: 'Journey must be a valid JourneyType (health, care, plan)',
  })
  journey: JourneyType;

  /**
   * A JavaScript expression that determines if the rule should be triggered.
   * This condition will be evaluated at runtime with the event data.
   * 
   * Examples:
   * - "event.data.steps >= 10000"
   * - "event.data.appointmentType === 'TELEMEDICINE'"
   * - "event.data.claimAmount > 100"
   * 
   * The condition must be a valid JavaScript expression and should only
   * reference the event object and its properties for security reasons.
   */
  @IsNotEmpty()
  @IsString()
  @Matches(/^[\w\s.()>=<!=+\-*/'"\[\]{}]+$/, {
    message: 'Condition must be a valid JavaScript expression',
  })
  condition: string;

  /**
   * An array of actions to be performed when the rule is triggered.
   * Each action specifies what should happen when the rule condition is met.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions: RuleActionDto[];

  /**
   * Whether the rule is enabled and should be evaluated.
   * Disabled rules are ignored by the rule engine.
   * Defaults to true if not specified.
   */
  @IsOptional()
  @IsBoolean()
  enabled: boolean = true;
}