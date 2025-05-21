import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'; // typeorm@0.3.17
import { IsString, IsNotEmpty, IsUUID, IsEnum, IsNumber, Min, Max, IsOptional, IsDate } from 'class-validator'; // class-validator@0.14.1
import { Quest } from './quest.entity';

/**
 * Enum representing the possible states of a user's quest progress.
 */
export enum QuestStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

/**
 * UserQuest entity that tracks a user's progress on a specific quest.
 * This entity creates a relation between users and quests, storing the
 * quest's completion status, progress tracking, start and completion dates,
 * and any additional metadata needed for quest tracking.
 */
@Entity()
export class UserQuest {
  /**
   * Unique identifier for the user quest record.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The ID of the user profile associated with this quest progress.
   * Links to the user's profile in the gamification system.
   */
  @Column()
  @IsUUID()
  @IsNotEmpty()
  profileId: string;

  /**
   * The quest that the user is working on.
   * Many-to-one relationship with the Quest entity.
   */
  @ManyToOne(() => Quest)
  @JoinColumn({ name: 'questId' })
  quest: Quest;

  /**
   * The ID of the quest associated with this user quest record.
   */
  @Column()
  @IsUUID()
  @IsNotEmpty()
  questId: string;

  /**
   * The current status of the quest for this user.
   * Can be NOT_STARTED, IN_PROGRESS, or COMPLETED.
   */
  @Column({
    type: 'enum',
    enum: QuestStatus,
    default: QuestStatus.NOT_STARTED
  })
  @IsEnum(QuestStatus)
  status: QuestStatus;

  /**
   * The current progress value for incremental quests.
   * Represents a percentage (0-100) of completion.
   */
  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * The date when the user started the quest.
   * Set automatically when the status changes from NOT_STARTED to IN_PROGRESS.
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsDate()
  startedAt: Date | null;

  /**
   * The date when the user completed the quest.
   * Set automatically when the status changes to COMPLETED.
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsDate()
  completedAt: Date | null;

  /**
   * Additional metadata for the quest, stored as a JSON object.
   * Can include journey-specific data, event tracking, or other custom information.
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata: Record<string, any> | null;

  /**
   * The journey to which this quest progress belongs (e.g., 'health', 'care', 'plan').
   * This allows for journey-specific quest tracking and filtering.
   */
  @Column()
  @IsString()
  @IsNotEmpty()
  journey: string;

  /**
   * Timestamp for when the record was created.
   * Automatically set by TypeORM.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp for when the record was last updated.
   * Automatically updated by TypeORM.
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Indicates whether the quest has been rewarded.
   * Used to track if XP and other rewards have been granted to the user.
   */
  @Column({ default: false })
  rewarded: boolean;

  /**
   * Updates the progress of the quest and automatically updates the status
   * based on the progress value.
   * 
   * @param progressValue The new progress value (0-100)
   * @returns The updated UserQuest instance
   */
  updateProgress(progressValue: number): UserQuest {
    // Ensure progress is within valid range
    this.progress = Math.max(0, Math.min(100, progressValue));
    
    // Update status based on progress
    if (this.progress === 0) {
      this.status = QuestStatus.NOT_STARTED;
      this.startedAt = null;
    } else if (this.progress < 100) {
      // Only set startedAt if transitioning from NOT_STARTED
      if (this.status === QuestStatus.NOT_STARTED) {
        this.startedAt = new Date();
      }
      this.status = QuestStatus.IN_PROGRESS;
    } else {
      // Only set completedAt if transitioning to COMPLETED
      if (this.status !== QuestStatus.COMPLETED) {
        this.completedAt = new Date();
      }
      this.status = QuestStatus.COMPLETED;
    }
    
    return this;
  }

  /**
   * Completes the quest, setting progress to 100% and status to COMPLETED.
   * 
   * @returns The updated UserQuest instance
   */
  complete(): UserQuest {
    // Set progress to 100%
    this.progress = 100;
    
    // Update status to COMPLETED
    this.status = QuestStatus.COMPLETED;
    
    // Set completion date if not already set
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
    
    // Set start date if not already set (for quests completed in one step)
    if (!this.startedAt) {
      this.startedAt = new Date();
    }
    
    return this;
  }

  /**
   * Marks the quest as rewarded after XP and other rewards have been granted.
   * 
   * @returns The updated UserQuest instance
   */
  markRewarded(): UserQuest {
    this.rewarded = true;
    return this;
  }
}