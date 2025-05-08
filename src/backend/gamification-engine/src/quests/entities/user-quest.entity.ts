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
  IsEnum, 
  IsNumber, 
  IsDate, 
  IsOptional, 
  IsObject,
  Min,
  Max
} from 'class-validator'; // class-validator 0.14.1
import { Quest } from './quest.entity';
import { User } from '@austa/interfaces/auth'; // @austa/interfaces 1.0.0
import { UserQuest as IUserQuest, QuestStatus } from '@austa/interfaces/gamification'; // @austa/interfaces 1.0.0

/**
 * Entity representing the relationship between a user and a quest.
 * Tracks the quest's completion status, progress tracking, start and completion dates,
 * and any additional metadata needed for quest tracking.
 * 
 * This entity enables features like quest status tracking, progress updates, and
 * completion notifications across all three journeys (health, care, plan).
 */
@Entity('user_quests')
@Index(['userId', 'questId'], { unique: true })
export class UserQuest implements IUserQuest {
  /**
   * Unique identifier for the user-quest relationship.
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  /**
   * Reference to the user who is undertaking the quest.
   * Uses the standardized User interface from @austa/interfaces/auth.
   */
  @Column()
  @IsString()
  @IsUUID()
  userId: string;

  /**
   * Reference to the quest entity.
   */
  @ManyToOne(() => Quest, { 
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'questId' })
  quest: Quest;

  /**
   * The ID of the referenced quest.
   */
  @Column()
  @IsString()
  @IsUUID()
  questId: string;

  /**
   * The current status of the quest for this user.
   * - NOT_STARTED: The quest has been assigned but not started
   * - IN_PROGRESS: The user has started working on the quest
   * - COMPLETED: The user has completed the quest
   */
  @Column({
    type: 'enum',
    enum: QuestStatus,
    default: QuestStatus.NOT_STARTED
  })
  @IsEnum(QuestStatus)
  status: QuestStatus;

  /**
   * The progress percentage towards completing the quest (0-100).
   * For binary quests (completed/not completed), this will be either 0 or 100.
   * For progressive quests, this tracks partial completion.
   */
  @Column({ type: 'float', default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Timestamp when the user started the quest.
   * Null if the quest has not been started yet.
   */
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  startedAt: Date | null;

  /**
   * Timestamp when the user completed the quest.
   * Null if the quest has not been completed yet.
   */
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  completedAt: Date | null;

  /**
   * Timestamp when the quest was assigned to the user.
   */
  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  /**
   * Timestamp when the user's quest progress was last updated.
   */
  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  /**
   * Additional metadata for tracking detailed quest progress information.
   * This can include journey-specific data, steps completed, or any other
   * relevant information for quest progression.
   * 
   * Example:
   * {
   *   stepsCompleted: 3,
   *   totalSteps: 5,
   *   lastCompletedStep: 'record_blood_pressure',
   *   journeyContext: 'health',
   *   relatedEvents: ['health_metric_recorded', 'goal_achieved']
   * }
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  progressMetadata: Record<string, any> | null;

  /**
   * Starts the quest for this user.
   * Sets the status to IN_PROGRESS and records the start time.
   */
  start(): void {
    if (this.status === QuestStatus.NOT_STARTED) {
      this.status = QuestStatus.IN_PROGRESS;
      this.startedAt = new Date();
      this.progress = Math.max(this.progress, 1); // Ensure progress is at least 1%
    }
  }

  /**
   * Updates the progress of this user quest.
   * If progress reaches 100, the quest is marked as completed.
   * If the quest was not started, it will be marked as started.
   * 
   * @param newProgress The new progress percentage (0-100)
   * @param metadata Optional metadata to update
   */
  updateProgress(newProgress: number, metadata?: Record<string, any>): void {
    // Start the quest if it hasn't been started yet
    if (this.status === QuestStatus.NOT_STARTED) {
      this.start();
    }

    // Update progress value, ensuring it's between 0 and 100
    this.progress = Math.min(Math.max(newProgress, 0), 100);
    
    // Update metadata if provided
    if (metadata) {
      this.progressMetadata = {
        ...this.progressMetadata,
        ...metadata
      };
    }
    
    // If progress reaches 100%, mark as completed
    if (this.progress >= 100 && this.status !== QuestStatus.COMPLETED) {
      this.complete();
    }
  }

  /**
   * Marks the quest as completed and sets the completion timestamp.
   */
  complete(): void {
    // Start the quest if it hasn't been started yet
    if (this.status === QuestStatus.NOT_STARTED) {
      this.start();
    }

    this.status = QuestStatus.COMPLETED;
    this.progress = 100;
    this.completedAt = new Date();
  }

  /**
   * Resets the quest progress.
   * Useful for quests that can be undertaken multiple times or for testing.
   * 
   * @param resetToNotStarted If true, resets to NOT_STARTED status, otherwise to IN_PROGRESS
   */
  reset(resetToNotStarted: boolean = true): void {
    if (resetToNotStarted) {
      this.status = QuestStatus.NOT_STARTED;
      this.startedAt = null;
    } else {
      this.status = QuestStatus.IN_PROGRESS;
      this.startedAt = this.startedAt || new Date();
    }
    
    this.progress = 0;
    this.completedAt = null;
  }

  /**
   * Increments the progress by the specified amount.
   * Useful for step-by-step quest progression.
   * 
   * @param increment The amount to increment progress by (default: 10)
   * @param metadata Optional metadata to update
   */
  incrementProgress(increment: number = 10, metadata?: Record<string, any>): void {
    const newProgress = this.progress + increment;
    this.updateProgress(newProgress, metadata);
  }

  /**
   * Adds a step to the quest progress metadata.
   * Useful for tracking specific steps completed in a multi-step quest.
   * 
   * @param stepId Identifier for the completed step
   * @param stepData Additional data about the step completion
   */
  addCompletedStep(stepId: string, stepData: any = {}): void {
    // Initialize steps array if it doesn't exist
    const currentMetadata = this.progressMetadata || {};
    const steps = currentMetadata.completedSteps || [];
    
    // Add the new step with timestamp
    steps.push({
      stepId,
      completedAt: new Date(),
      ...stepData
    });
    
    // Update metadata
    this.progressMetadata = {
      ...currentMetadata,
      completedSteps: steps,
      lastCompletedStep: stepId
    };
    
    // Calculate progress based on steps if totalSteps is defined
    if (currentMetadata.totalSteps) {
      const progress = (steps.length / currentMetadata.totalSteps) * 100;
      this.progress = Math.min(progress, 100);
      
      // Mark as completed if all steps are done
      if (steps.length >= currentMetadata.totalSteps) {
        this.complete();
      }
    }
  }
}