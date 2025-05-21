import { IsUUID, IsString, IsNumber, IsOptional, IsEnum, Min, Max, Length, IsNotEmpty } from 'class-validator';
import { Reward as RewardInterface, JourneyType } from '@austa/interfaces/gamification';

/**
 * Represents a reward that a user can earn in the gamification system.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 *
 * This entity uses Prisma ORM for database operations and integrates with
 * the @austa/interfaces package for type-safe data contracts.
 */
export class Reward implements RewardInterface {
  /**
   * Unique identifier for the reward
   */
  @IsUUID(4, { message: 'Reward ID must be a valid UUID v4' })
  id: string;

  /**
   * Title of the reward displayed to users
   */
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title: string;

  /**
   * Detailed description of the reward
   */
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description cannot be empty' })
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description: string;

  /**
   * Amount of XP awarded when earning this reward
   */
  @IsNumber({}, { message: 'XP reward must be a number' })
  @Min(0, { message: 'XP reward cannot be negative' })
  @Max(10000, { message: 'XP reward cannot exceed 10000' })
  xpReward: number;

  /**
   * Icon name/path used to visually represent the reward
   */
  @IsString({ message: 'Icon must be a string' })
  @IsNotEmpty({ message: 'Icon cannot be empty' })
  icon: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   */
  @IsEnum(JourneyType, { 
    message: 'Journey must be one of: health, care, plan, or global'
  })
  journey: JourneyType;

  /**
   * Optional creation date of the reward
   */
  @IsOptional()
  createdAt?: Date;

  /**
   * Optional last update date of the reward
   */
  @IsOptional()
  updatedAt?: Date;
}