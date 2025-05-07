import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm'; // typeorm 0.3.17
import { 
  IsString, 
  IsUUID, 
  IsBoolean, 
  IsNumber, 
  IsDate, 
  IsOptional, 
  IsObject,
  Min,
  Max
} from 'class-validator'; // class-validator 0.14.1
import { Achievement } from './achievement.entity';
import { User } from '@austa/interfaces/auth'; // @austa/interfaces 1.0.0
import { UserAchievement as IUserAchievement } from '@austa/interfaces/gamification'; // @austa/interfaces 1.0.0

/**
 * Entity representing the relationship between a user and an achievement.
 * Tracks whether the achievement has been unlocked, progress towards unlocking,
 * and associated metadata for each user-achievement pair.
 * 
 * This entity is critical for the cross-journey gamification system as it
 * maintains the state of user progression across all journeys.
 */
@Entity('user_achievements')
@Index(['userId', 'achievementId'], { unique: true })
export class UserAchievement implements IUserAchievement {
  /**
   * Unique identifier for the user-achievement relationship.
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  /**
   * Reference to the user who has or is progressing towards the achievement.
   * Uses the standardized User interface from @austa/interfaces/auth.
   */
  @Column()
  @IsString()
  @IsUUID()
  userId: string;

  /**
   * Reference to the achievement entity.
   */
  @ManyToOne(() => Achievement, { 
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  /**
   * The ID of the referenced achievement.
   */
  @Column()
  @IsString()
  @IsUUID()
  achievementId: string;

  /**
   * Indicates whether the achievement has been unlocked by the user.
   * Default is false until the achievement is completed.
   */
  @Column({ default: false })
  @IsBoolean()
  unlocked: boolean;

  /**
   * The progress percentage towards unlocking the achievement (0-100).
   * For binary achievements (unlocked/not unlocked), this will be either 0 or 100.
   * For progressive achievements, this tracks partial completion.
   */
  @Column({ type: 'float', default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Timestamp when the achievement was unlocked.
   * Null if the achievement has not been unlocked yet.
   */
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  unlockedAt: Date | null;

  /**
   * Timestamp when the user first started progress towards this achievement.
   */
  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  /**
   * Timestamp when the user's progress was last updated.
   */
  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  /**
   * Additional metadata for tracking detailed progress information.
   * This can include journey-specific data, steps completed, or any other
   * relevant information for achievement progression.
   * 
   * Example:
   * {
   *   stepsCompleted: 3,
   *   totalSteps: 5,
   *   lastCompletedStep: 'complete_profile',
   *   journeyContext: 'health',
   *   relatedEvents: ['health_metric_recorded', 'goal_achieved']
   * }
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  progressMetadata: Record<string, any> | null;

  /**
   * Updates the progress of this user achievement.
   * If progress reaches 100, the achievement is marked as unlocked.
   * 
   * @param newProgress The new progress percentage (0-100)
   * @param metadata Optional metadata to update
   */
  updateProgress(newProgress: number, metadata?: Record<string, any>): void {
    this.progress = Math.min(Math.max(newProgress, 0), 100);
    
    if (metadata) {
      this.progressMetadata = {
        ...this.progressMetadata,
        ...metadata
      };
    }
    
    // If progress reaches 100%, mark as unlocked
    if (this.progress >= 100 && !this.unlocked) {
      this.unlock();
    }
  }

  /**
   * Marks the achievement as unlocked and sets the unlock timestamp.
   */
  unlock(): void {
    this.unlocked = true;
    this.progress = 100;
    this.unlockedAt = new Date();
  }

  /**
   * Resets the achievement progress.
   * Useful for achievements that can be earned multiple times or for testing.
   */
  reset(): void {
    this.unlocked = false;
    this.progress = 0;
    this.unlockedAt = null;
  }
}