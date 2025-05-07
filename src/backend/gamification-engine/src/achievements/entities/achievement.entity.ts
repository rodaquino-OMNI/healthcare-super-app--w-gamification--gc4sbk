import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, Check, VersionColumn } from 'typeorm';
import { Achievement as IAchievement } from '@austa/interfaces/gamification/achievements';
import { JourneyType } from '@austa/interfaces/journey';
import { EventSchema } from '@austa/interfaces/gamification/events';
import { ErrorType, AppException } from '@app/shared/exceptions/exceptions.types';

/**
 * Achievement Entity
 * 
 * Represents achievable milestones in the gamification system across all three journeys
 * (Health, Care, Plan). Achievements are unlocked by users when specific conditions are met,
 * granting XP rewards and potentially unlocking special features or rewards.
 *
 * This entity implements the standardized Achievement interface from @austa/interfaces
 * to ensure consistency between backend storage and frontend display. It uses TypeORM
 * decorators for database mapping and includes comprehensive validation.
 *
 * @implements {IAchievement} Achievement interface from @austa/interfaces
 */
@Entity('achievements')
export class Achievement implements IAchievement {
  /**
   * Unique identifier for the achievement
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Short, descriptive title of the achievement
   * @example "First Steps"
   */
  @Column({ type: 'varchar', length: 100 })
  @Index()
  title: string;

  /**
   * Detailed description explaining how to unlock the achievement
   * @example "Complete your first health assessment to begin your wellness journey."
   */
  @Column({ type: 'text' })
  description: string;

  /**
   * The journey this achievement belongs to (health, care, plan)
   * Cross-journey achievements can be unlocked from any journey
   * @example "health"
   */
  @Column({ 
    type: 'varchar', 
    length: 20,
    comment: 'The journey this achievement belongs to (health, care, plan, or cross-journey)'
  })
  @Index()
  journey: JourneyType;

  /**
   * Experience points awarded when this achievement is unlocked
   * @example 100
   */
  @Column({ type: 'integer' })
  @Check('"xpReward" >= 0')
  xpReward: number;

  /**
   * Path to the achievement's icon image
   * @example "/assets/achievements/first-steps.png"
   */
  @Column({ type: 'varchar', length: 255 })
  iconPath: string;

  /**
   * Path to the locked (grayed out) version of the achievement's icon
   * @example "/assets/achievements/first-steps-locked.png"
   */
  @Column({ type: 'varchar', length: 255 })
  lockedIconPath: string;

  /**
   * JSON schema defining the conditions required to unlock this achievement
   * This uses the standardized event schema from @austa/interfaces
   * @example { "type": "health.assessment.completed", "count": 1 }
   */
  @Column({ 
    type: 'jsonb', 
    comment: 'JSON schema defining the conditions required to unlock this achievement'
  })
  conditions: EventSchema;

  /**
   * Whether this achievement is secret (hidden until unlocked)
   * @default false
   */
  @Column({ type: 'boolean', default: false })
  isSecret: boolean;

  /**
   * Whether this achievement is featured (highlighted in the UI)
   * @default false
   */
  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  /**
   * Order in which this achievement appears in lists
   * Lower numbers appear first
   * @default 100
   */
  @Column({ type: 'integer', default: 100 })
  displayOrder: number;

  /**
   * Optional badge ID associated with this achievement
   * @example "health-enthusiast"
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  badgeId?: string;

  /**
   * Optional metadata for additional achievement properties
   * Stored as a JSON object
   * @example { "difficulty": "easy", "category": "onboarding" }
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  /**
   * Date when the achievement was created
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * Date when the achievement was last updated
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  /**
   * Version number, automatically incremented when the entity is updated
   * Used for optimistic concurrency control
   */
  @VersionColumn()
  version: number;

  /**
   * Validates if the achievement can be created or updated
   * Throws an error if validation fails
   * 
   * @throws {AppException} If validation fails
   */
  validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new AppException(
        'Achievement title is required',
        ErrorType.BUSINESS,
        'GAME_101',
        { achievement: this }
      );
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new AppException(
        'Achievement description is required',
        ErrorType.BUSINESS,
        'GAME_102',
        { achievement: this }
      );
    }

    if (this.xpReward < 0) {
      throw new AppException(
        'XP reward must be a positive number',
        ErrorType.BUSINESS,
        'GAME_103',
        { achievement: this, xpReward: this.xpReward }
      );
    }

    // Additional validation logic can be added here
  }
}