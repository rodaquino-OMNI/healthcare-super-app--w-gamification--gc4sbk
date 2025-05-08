import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsUUID, IsBoolean, IsOptional, IsEnum, ValidateNested, IsInt, Min, Max, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Import from @austa/interfaces using path aliases
import { GamificationEventType } from '@austa/interfaces/gamification/events';
import { Rule as RuleInterface, RuleCondition, RuleAction, RuleActionType } from '@austa/interfaces/gamification/rules';

// Import Journey enum from @austa/interfaces
import { JourneyId } from '@austa/interfaces/journey';

// Import shared utilities
import { AppException, ErrorType } from '@app/shared/exceptions';

/**
 * Rule entity for the gamification engine.
 * 
 * Rules define the conditions under which achievements are unlocked, rewards are granted,
 * and other gamification actions are triggered based on user events across all journeys.
 * 
 * Rules are evaluated against events from all three journeys (Health, Care, Plan) and can
 * be configured to respond to specific event types or journey-specific events.
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
@Entity('rules')
@Index(['eventType', 'journey'], { where: 'is_active = true' })
export class Rule implements RuleInterface {
  /**
   * Unique identifier for the rule.
   * 
   * Automatically generated UUID v4 when a new rule is created.
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID(4)
  @ApiProperty({
    description: 'Unique identifier for the rule',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  /**
   * Human-readable name for the rule.
   * 
   * Used for identification in admin interfaces and logs.
   */
  @Column({ type: 'varchar', length: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Rule name is required' })
  @Length(3, 100, { message: 'Rule name must be between 3 and 100 characters' })
  @ApiProperty({
    description: 'Human-readable name for the rule',
    example: 'Daily Health Check Completion'
  })
  name: string;

  /**
   * Detailed description of what the rule does and when it triggers.
   * 
   * Provides context for administrators and developers about the rule's purpose.
   */
  @Column({ type: 'text', nullable: true })
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
  @Column({ type: 'varchar', length: 100 })
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
  @Column({ type: 'varchar', length: 20, nullable: true })
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
  @Column({ type: 'jsonb' })
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
  @Column({ type: 'jsonb' })
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
  @Column({ type: 'integer', default: 0 })
  @IsInt()
  @Min(-100, { message: 'Priority must be at least -100' })
  @Max(100, { message: 'Priority cannot exceed 100' })
  @ApiProperty({
    description: 'Priority of the rule. Rules with higher priority are evaluated first',
    example: 10,
    default: 0,
    minimum: -100,
    maximum: 100
  })
  priority: number;

  /**
   * Indicates whether the rule is currently active.
   * Inactive rules are not evaluated against events.
   * 
   * This allows temporarily disabling rules without deleting them, useful for
   * seasonal events, testing, or maintenance.
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  @IsBoolean()
  @ApiProperty({
    description: 'Indicates whether the rule is currently active',
    example: true,
    default: true
  })
  isActive: boolean;

  /**
   * Timestamp when the rule was created.
   * Automatically set by TypeORM.
   */
  @CreateDateColumn({ type: 'timestamptz' })
  @ApiProperty({
    description: 'Timestamp when the rule was created',
    example: '2023-01-01T00:00:00Z'
  })
  createdAt: Date;

  /**
   * Timestamp when the rule was last updated.
   * Automatically updated by TypeORM on each save.
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  @ApiProperty({
    description: 'Timestamp when the rule was last updated',
    example: '2023-01-02T00:00:00Z'
  })
  updatedAt: Date;
  
  /**
   * Validates a rule condition expression to ensure it's safe to evaluate.
   * 
   * @param expression The condition expression to validate
   * @returns True if the expression is valid, false otherwise
   * @throws AppException if the expression contains unsafe code
   */
  static validateConditionExpression(expression: string): boolean {
    if (!expression || typeof expression !== 'string') {
      throw new AppException(
        'Invalid condition expression',
        ErrorType.VALIDATION,
        'GAME_RULE_001',
        { expression }
      );
    }
    
    // Check for potentially unsafe code patterns
    const unsafePatterns = [
      /eval\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /new\s+Function/i,
      /require\s*\(/i,
      /import\s*\(/i,
      /process/i,
      /global/i,
      /__dirname/i,
      /__filename/i
    ];
    
    for (const pattern of unsafePatterns) {
      if (pattern.test(expression)) {
        throw new AppException(
          'Condition expression contains unsafe code',
          ErrorType.SECURITY,
          'GAME_RULE_002',
          { expression, pattern: pattern.toString() }
        );
      }
    }
    
    return true;
  }
}