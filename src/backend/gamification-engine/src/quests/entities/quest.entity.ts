import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm'; // typeorm@0.3.17
import { IsString, IsNotEmpty, IsInt, Min, Max, Length, IsOptional, Matches } from 'class-validator'; // class-validator@0.14.1

// Import from @austa/interfaces package for standardized interfaces
import { QuestInterface } from '@austa/interfaces/gamification';

// Import related entities using path aliases
import { UserQuest } from '@app/quests/entities/user-quest.entity';

/**
 * Quest entity representing challenges that users can undertake
 * within the gamification system. Quests are associated with specific
 * journeys and provide XP rewards upon completion.
 *
 * This entity implements the QuestInterface from @austa/interfaces
 * to ensure consistency between backend and frontend models.
 */
@Entity()
export class Quest implements QuestInterface {
  /**
   * Unique identifier for the quest.
   * Generated automatically as a UUID by TypeORM.
   */
  @PrimaryGeneratedColumn('uuid', {
    comment: 'Unique identifier for the quest'
  })
  id: string;

  /**
   * The title of the quest that will be displayed to users.
   * Must not be empty and should be between 3 and 100 characters.
   */
  @Column({
    length: 100,
    comment: 'The title of the quest displayed to users'
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title: string;

  /**
   * A detailed description of what the quest entails.
   * Should provide clear instructions for users to complete the quest.
   */
  @Column({
    type: 'text',
    comment: 'Detailed description of the quest requirements'
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  /**
   * The journey to which the quest belongs (e.g., 'health', 'care', 'plan').
   * This allows for journey-specific quests and filtering.
   * Indexed for faster queries when filtering by journey.
   */
  @Column({
    comment: 'The journey this quest belongs to (health, care, plan)'
  })
  @Index()
  @IsString({ message: 'Journey must be a string' })
  @IsNotEmpty({ message: 'Journey is required' })
  @Matches(/^(health|care|plan)$/, {
    message: 'Journey must be one of: health, care, plan'
  })
  journey: string;

  /**
   * The name of the icon to display for the quest.
   * References an icon in the design system.
   */
  @Column({
    comment: 'Icon name from the design system'
  })
  @IsString({ message: 'Icon must be a string' })
  @IsNotEmpty({ message: 'Icon is required' })
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   * Limited to a maximum of 1000 XP per quest.
   */
  @Column({
    type: 'int',
    comment: 'XP reward for completing the quest (0-1000)'
  })
  @IsInt({ message: 'XP reward must be an integer' })
  @Min(0, { message: 'XP reward must be at least 0' })
  @Max(1000, { message: 'XP reward cannot exceed 1000' })
  xpReward: number;

  /**
   * Optional difficulty level of the quest (1-5).
   * Higher values indicate more challenging quests.
   */
  @Column({
    type: 'int',
    nullable: true,
    comment: 'Optional difficulty level (1-5)'
  })
  @IsOptional()
  @IsInt({ message: 'Difficulty must be an integer' })
  @Min(1, { message: 'Difficulty must be at least 1' })
  @Max(5, { message: 'Difficulty cannot exceed 5' })
  difficulty?: number;

  /**
   * One-to-many relationship with UserQuest entity.
   * This creates a bi-directional relationship allowing easy access
   * to all user progress records for this quest.
   */
  @OneToMany(() => UserQuest, userQuest => userQuest.quest, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE'
  })
  userQuests: UserQuest[];
}