import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { 
  IsString, 
  IsUUID, 
  IsBoolean, 
  IsNumber, 
  IsOptional, 
  IsDate, 
  Min, 
  Max 
} from 'class-validator';
import { Achievement } from './achievement.entity';
import { IUserAchievement, AchievementStatus } from '@austa/interfaces/gamification';
import { IUser } from '@austa/interfaces/auth';

/**
 * Entity representing the relationship between a user and an achievement.
 * Tracks progress, unlocking status, and metadata for each user-achievement pair.
 */
@Entity('user_achievements')
export class UserAchievement implements IUserAchievement {
  /**
   * Unique identifier for the user achievement record
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  /**
   * ID of the user who is progressing towards or has unlocked this achievement
   */
  @Column()
  @IsString()
  userId: IUser['id'];

  /**
   * Reference to the achievement entity
   */
  @ManyToOne(() => Achievement, { 
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;

  /**
   * ID of the achievement being tracked
   */
  @Column()
  @IsString()
  achievementId: string;

  /**
   * Current status of the achievement for this user
   * (LOCKED, IN_PROGRESS, UNLOCKED)
   */
  @Column({
    type: 'enum',
    enum: AchievementStatus,
    default: AchievementStatus.LOCKED
  })
  @IsString()
  status: AchievementStatus;

  /**
   * Progress percentage towards unlocking the achievement (0-100)
   */
  @Column({ type: 'float', default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Timestamp when the achievement was unlocked
   * Null if the achievement hasn't been unlocked yet
   */
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  unlockedAt: Date | null;

  /**
   * Detailed metadata for tracking partial completion and progress steps
   * Stored as JSON to allow flexible schema for different achievement types
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  progressMetadata: Record<string, any> | null;

  /**
   * Flag indicating whether the achievement has been viewed by the user after unlocking
   * Used for notification purposes
   */
  @Column({ default: false })
  @IsBoolean()
  viewed: boolean;

  /**
   * Timestamp when the user achievement record was created
   */
  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  /**
   * Timestamp when the user achievement record was last updated
   */
  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  /**
   * Updates the progress of the achievement and changes status if needed
   * @param newProgress The new progress value (0-100)
   * @param metadata Optional metadata to store with the progress update
   */
  updateProgress(newProgress: number, metadata?: Record<string, any>): void {
    // Ensure progress is within valid range
    this.progress = Math.min(Math.max(newProgress, 0), 100);
    
    // Update status based on progress
    if (this.progress >= 100 && this.status !== AchievementStatus.UNLOCKED) {
      this.status = AchievementStatus.UNLOCKED;
      this.unlockedAt = new Date();
      this.viewed = false;
    } else if (this.progress > 0 && this.progress < 100) {
      this.status = AchievementStatus.IN_PROGRESS;
    }

    // Update metadata if provided
    if (metadata) {
      this.progressMetadata = {
        ...this.progressMetadata,
        ...metadata,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Marks the achievement as viewed by the user
   */
  markAsViewed(): void {
    this.viewed = true;
  }

  /**
   * Resets the achievement progress
   */
  resetProgress(): void {
    this.progress = 0;
    this.status = AchievementStatus.LOCKED;
    this.unlockedAt = null;
    this.progressMetadata = null;
    this.viewed = false;
  }
}