import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm'; // typeorm@0.3.17
import { 
  IsString, 
  IsNotEmpty, 
  IsInt, 
  Min, 
  Max, 
  IsUUID,
  IsOptional,
  IsDate,
  Length,
  Matches,
  IsBoolean
} from 'class-validator'; // class-validator@0.14.1
import { Quest as IQuest } from '@austa/interfaces/gamification'; // @austa/interfaces@1.0.0
import { UserQuest } from './user-quest.entity';
import { AppException, ErrorType } from '@app/errors'; // @austa/errors@1.0.0

/**
 * Quest entity representing challenges that users can undertake
 * within the gamification system. Quests are associated with specific
 * journeys and provide XP rewards upon completion.
 * 
 * Quests can be journey-specific (health, care, plan) or cross-journey,
 * and they form a core component of the gamification engine's engagement strategy.
 * 
 * @example
 * ```typescript
 * // Creating a new health journey quest
 * const healthQuest = new Quest();
 * healthQuest.title = 'Track Blood Pressure for 7 Days';
 * healthQuest.description = 'Record your blood pressure daily for one week to earn XP.';
 * healthQuest.journey = 'health';
 * healthQuest.icon = 'heart-pulse';
 * healthQuest.xpReward = 500;
 * 
 * // Save the quest
 * await questRepository.save(healthQuest);
 * ```
 */
@Entity('quests')
@Index(['journey'])
@Index(['isActive'])
export class Quest implements IQuest {
  /**
   * Unique identifier for the quest.
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  /**
   * The title of the quest that will be displayed to users.
   * Must be between 3 and 100 characters.
   */
  @Column()
  @IsString()
  @IsNotEmpty({ message: 'Quest title is required' })
  @Length(3, 100, { message: 'Quest title must be between 3 and 100 characters' })
  title: string;

  /**
   * A detailed description of what the quest entails.
   * Provides users with information about how to complete the quest.
   */
  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty({ message: 'Quest description is required' })
  @Length(10, 1000, { message: 'Quest description must be between 10 and 1000 characters' })
  description: string;

  /**
   * The journey to which the quest belongs (e.g., 'health', 'care', 'plan').
   * This allows for journey-specific quests and filtering.
   * Can also be 'cross-journey' for quests that span multiple journeys.
   */
  @Column()
  @IsString()
  @IsNotEmpty({ message: 'Journey is required' })
  @Matches(/^(health|care|plan|cross-journey)$/, { 
    message: 'Journey must be one of: health, care, plan, cross-journey' 
  })
  journey: string;

  /**
   * The name of the icon to display for the quest.
   * References an icon in the design system.
   */
  @Column()
  @IsString()
  @IsNotEmpty({ message: 'Icon is required' })
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   * Limited to a maximum of 1000 XP per quest.
   */
  @Column()
  @IsInt({ message: 'XP reward must be an integer' })
  @Min(0, { message: 'XP reward must be at least 0' })
  @Max(1000, { message: 'XP reward cannot exceed 1000' })
  xpReward: number;

  /**
   * Optional deadline for the quest, if it's time-limited.
   * Null indicates a quest with no expiration.
   */
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  deadline: Date | null;

  /**
   * Flag indicating if the quest is currently active and available to users.
   * Inactive quests won't be shown in the quest list.
   */
  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  /**
   * Timestamp when the quest was created.
   */
  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  /**
   * Timestamp when the quest was last updated.
   */
  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  /**
   * Relationship to UserQuest entities.
   * Represents all user assignments and progress for this quest.
   */
  @OneToMany(() => UserQuest, userQuest => userQuest.quest, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE'
  })
  userQuests: UserQuest[];

  /**
   * Checks if the quest is expired based on its deadline.
   * @returns boolean indicating if the quest has expired
   */
  isExpired(): boolean {
    if (!this.deadline) {
      return false;
    }
    return new Date() > this.deadline;
  }

  /**
   * Validates the quest entity.
   * Throws an AppException if validation fails.
   * @throws AppException with INVALID_QUEST error type
   */
  validate(): void {
    if (!this.title || this.title.length < 3 || this.title.length > 100) {
      throw new AppException(
        ErrorType.INVALID_QUEST,
        'Quest title must be between 3 and 100 characters',
        { questId: this.id, title: this.title }
      );
    }

    if (!this.description || this.description.length < 10 || this.description.length > 1000) {
      throw new AppException(
        ErrorType.INVALID_QUEST,
        'Quest description must be between 10 and 1000 characters',
        { questId: this.id }
      );
    }

    if (!['health', 'care', 'plan', 'cross-journey'].includes(this.journey)) {
      throw new AppException(
        ErrorType.INVALID_QUEST,
        'Journey must be one of: health, care, plan, cross-journey',
        { questId: this.id, journey: this.journey }
      );
    }

    if (this.xpReward < 0 || this.xpReward > 1000) {
      throw new AppException(
        ErrorType.INVALID_QUEST,
        'XP reward must be between 0 and 1000',
        { questId: this.id, xpReward: this.xpReward }
      );
    }
  }

  /**
   * Checks if the quest is available to users.
   * A quest is available if it's active and not expired.
   * @returns boolean indicating if the quest is available
   */
  isAvailable(): boolean {
    return this.isActive && !this.isExpired();
  }
}