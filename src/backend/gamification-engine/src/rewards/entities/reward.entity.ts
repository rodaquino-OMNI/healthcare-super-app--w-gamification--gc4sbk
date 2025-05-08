import { IsUUID, IsString, IsNumber, IsOptional, IsNotEmpty, IsEnum, Min, Max, Length, Matches, ValidateIf } from 'class-validator';
import { Reward as RewardInterface, RewardCategory, JourneyType } from '@austa/interfaces/gamification/rewards';
import { PrismaModel } from '@app/shared/database/prisma.model';
import { Transform } from 'class-transformer';

/**
 * Represents a reward that a user can earn in the gamification system.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 * 
 * This entity is used with Prisma ORM for database operations and implements
 * the RewardInterface from @austa/interfaces for type safety across services.
 * 
 * @implements {RewardInterface} - Ensures type compatibility with shared interfaces
 * @extends {PrismaModel} - Provides base functionality for Prisma models
 */
export class Reward extends PrismaModel implements RewardInterface {
  /**
   * Unique identifier for the reward
   * Must be a valid UUID v4
   */
  @IsUUID(4, { message: 'Reward ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Reward ID is required' })
  id: string;

  /**
   * Title of the reward displayed to users
   * Must be between 3 and 100 characters
   */
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title: string;

  /**
   * Detailed description of the reward
   * Must be between 10 and 500 characters
   */
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description: string;

  /**
   * Amount of XP awarded when earning this reward
   * Must be a positive number between 1 and 10000
   */
  @IsNumber({}, { message: 'XP reward must be a number' })
  @IsNotEmpty({ message: 'XP reward is required' })
  @Min(1, { message: 'XP reward must be at least 1' })
  @Max(10000, { message: 'XP reward cannot exceed 10000' })
  xpReward: number;

  /**
   * Icon name/path used to visually represent the reward
   * Must be a valid path format
   */
  @IsString({ message: 'Icon must be a string' })
  @IsNotEmpty({ message: 'Icon is required' })
  @Matches(/^[\w\-\/\.]+$/, { 
    message: 'Icon must be a valid path format containing only letters, numbers, underscores, hyphens, slashes, and dots' 
  })
  icon: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   */
  @IsEnum(JourneyType, { 
    message: 'Journey must be one of: health, care, plan, global' 
  })
  @IsNotEmpty({ message: 'Journey is required' })
  @Transform(({ value }) => value?.toLowerCase())
  journey: string;
  
  /**
   * Category of the reward
   * Determines how the reward can be redeemed
   */
  @IsEnum(RewardCategory, {
    message: 'Category must be a valid reward category'
  })
  @IsNotEmpty({ message: 'Category is required' })
  category: RewardCategory;
  
  /**
   * Availability period start date
   * When the reward becomes available for earning
   */
  @IsOptional()
  availableFrom?: Date;
  
  /**
   * Availability period end date
   * When the reward is no longer available for earning
   */
  @IsOptional()
  availableTo?: Date;
  
  /**
   * Flag indicating if the reward is currently active
   * Inactive rewards cannot be earned but remain visible to users who already earned them
   */
  @IsOptional()
  isActive: boolean = true;

  /**
   * Optional creation date of the reward
   * Automatically managed by Prisma
   */
  @IsOptional()
  createdAt?: Date;

  /**
   * Optional last update date of the reward
   * Automatically managed by Prisma
   */
  @IsOptional()
  updatedAt?: Date;
  
  /**
   * Validates that availableTo is after availableFrom if both are provided
   */
  @ValidateIf(o => o.availableFrom && o.availableTo)
  @IsNotEmpty({
    message: 'Available to date must be after available from date',
    context: {
      validator: function(value, args) {
        const { object } = args;
        return object.availableTo > object.availableFrom;
      }
    }
  })
  get validDateRange(): boolean {
    if (this.availableFrom && this.availableTo) {
      return this.availableTo > this.availableFrom;
    }
    return true;
  }
}