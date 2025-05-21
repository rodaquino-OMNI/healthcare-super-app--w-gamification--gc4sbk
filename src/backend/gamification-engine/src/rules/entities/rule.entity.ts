import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsString, IsUUID, IsBoolean, IsEnum, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Journey } from '@austa/interfaces/gamification/events';
import { Rule as IRule, RuleCondition, RuleAction } from '@austa/interfaces/gamification/rules';

/**
 * Rule entity representing gamification rules in the system.
 * 
 * Rules define the conditions under which certain actions (like awarding points or
 * unlocking achievements) should be triggered based on user events. Rules can be
 * journey-specific or apply across multiple journeys.
 */
@Entity('rules')
export class Rule implements IRule {
  /**
   * Unique identifier for the rule.
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  /**
   * Human-readable name of the rule.
   */
  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Detailed description of what the rule does.
   */
  @Column({ type: 'text' })
  @IsString()
  description: string;

  /**
   * The type of event that triggers this rule.
   * Must match one of the standardized event types from the events schema.
   * 
   * Examples: 'HEALTH_METRIC_RECORDED', 'APPOINTMENT_BOOKED', 'CLAIM_SUBMITTED'
   */
  @Column({ type: 'varchar', length: 100 })
  @IsNotEmpty()
  @IsString()
  eventType: string;

  /**
   * The specific journey this rule applies to.
   * If not specified, the rule applies to events from any journey.
   */
  @Column({ type: 'enum', enum: Journey, nullable: true })
  @IsOptional()
  @IsEnum(Journey)
  journey?: Journey;

  /**
   * JSON condition expression that determines if the rule should be triggered.
   * This is evaluated against the event data and user profile.
   * 
   * The condition is a JSON object that follows the RuleCondition interface structure.
   */
  @Column({ type: 'jsonb' })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  condition: RuleCondition;

  /**
   * JSON action definition that specifies what happens when the rule is triggered.
   * This can include awarding points, unlocking achievements, or progressing quests.
   * 
   * The action is a JSON object that follows the RuleAction interface structure.
   */
  @Column({ type: 'jsonb' })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  action: RuleAction;

  /**
   * Priority of the rule (lower number = higher priority).
   * Used to determine execution order when multiple rules match the same event.
   */
  @Column({ type: 'integer', default: 100 })
  priority: number;

  /**
   * Indicates whether the rule is currently active.
   * Inactive rules are not evaluated against incoming events.
   */
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  /**
   * Timestamp when the rule was created.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the rule was last updated.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}