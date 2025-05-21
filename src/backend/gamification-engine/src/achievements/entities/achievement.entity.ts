import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'; // typeorm 0.3.17
import { JourneyType } from '@austa/interfaces/journey'; // @austa/interfaces ^1.0.0

/**
 * Achievement entity representing milestones that users can unlock in the gamification system.
 * Achievements are journey-specific and award XP when unlocked.
 */
@Entity('achievements')
export class Achievement {
  /**
   * Unique identifier for the achievement
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Display title of the achievement
   */
  @Column({ type: 'varchar', length: 100 })
  title: string;

  /**
   * Detailed description of the achievement and how to unlock it
   */
  @Column({ type: 'text' })
  description: string;

  /**
   * The journey this achievement belongs to (Health, Care, Plan)
   */
  @Column({ 
    type: 'varchar', 
    length: 20,
    comment: 'The journey this achievement belongs to (health, care, plan)'
  })
  journey: JourneyType;

  /**
   * Icon identifier for the achievement badge
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string;

  /**
   * Experience points awarded when this achievement is unlocked
   */
  @Column({ type: 'integer', default: 0 })
  xpReward: number;

  /**
   * Conditions required to unlock this achievement, stored as a JSON string
   */
  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any>;

  /**
   * Whether this achievement is secret (hidden until unlocked)
   */
  @Column({ type: 'boolean', default: false })
  isSecret: boolean;

  /**
   * Order for display in achievement lists
   */
  @Column({ type: 'integer', default: 0 })
  displayOrder: number;

  /**
   * Whether this achievement is currently active
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Timestamp when this achievement was created
   */
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * Timestamp when this achievement was last updated
   */
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * Version of the achievement schema, for handling schema evolution
   */
  @Column({ type: 'integer', default: 1 })
  schemaVersion: number;

  /**
   * Optional metadata for the achievement, stored as a JSON object
   */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;
}