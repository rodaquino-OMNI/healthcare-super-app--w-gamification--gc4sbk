import { IsString, IsInt, IsNotEmpty, Min, Max, IsEnum, Length } from 'class-validator';
import { IJourneyType } from '@austa/interfaces/common/types';

/**
 * Data Transfer Object for creating a new achievement in the gamification system.
 * 
 * This DTO validates incoming data to ensure all required fields are present and
 * properly formatted before creating a new achievement. It enforces type safety
 * and data integrity through class-validator decorators.
 */
export class CreateAchievementDto {
  /**
   * The title of the achievement.
   * Must be a non-empty string between 3 and 100 characters.
   * 
   * @example "Health Champion"
   */
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters' })
  title: string;

  /**
   * A description of the achievement explaining how to earn it.
   * Must be a string between 10 and 500 characters.
   * 
   * @example "Complete 10 health check-ins within a month"
   */
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters' })
  description: string;

  /**
   * The journey to which the achievement belongs.
   * Must be one of the predefined journey types: 'health', 'care', or 'plan'.
   * 
   * @example "health"
   */
  @IsEnum(IJourneyType, { 
    message: 'Journey must be one of: health, care, plan'
  })
  @IsNotEmpty({ message: 'Journey is required' })
  journey: IJourneyType;

  /**
   * The name of the icon to display for the achievement.
   * Must be a non-empty string corresponding to an available icon in the system.
   * 
   * @example "trophy-star"
   */
  @IsString({ message: 'Icon must be a string' })
  @IsNotEmpty({ message: 'Icon is required' })
  @Length(2, 50, { message: 'Icon name must be between 2 and 50 characters' })
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   * Must be an integer between 0 and 1000.
   * 
   * @example 100
   */
  @IsInt({ message: 'XP reward must be an integer' })
  @Min(0, { message: 'XP reward must be at least 0' })
  @Max(1000, { message: 'XP reward cannot exceed 1000' })
  @IsNotEmpty({ message: 'XP reward is required' })
  xpReward: number;
}