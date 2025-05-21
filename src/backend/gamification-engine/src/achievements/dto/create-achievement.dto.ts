import { 
  IsString, 
  IsInt, 
  IsNotEmpty, 
  Min, 
  Max, 
  IsEnum,
  Length,
  Matches
} from 'class-validator';
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
   * Must be between 3 and 100 characters long.
   */
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @Length(3, 100, { message: 'Title must be between 3 and 100 characters long' })
  title: string;

  /**
   * A detailed description of what the achievement represents.
   * Must be between 10 and 500 characters long.
   */
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @Length(10, 500, { message: 'Description must be between 10 and 500 characters long' })
  description: string;

  /**
   * The journey to which the achievement belongs.
   * Must be one of the predefined journey types: 'health', 'care', or 'plan'.
   */
  @IsNotEmpty({ message: 'Journey is required' })
  @IsEnum(IJourneyType, { message: 'Journey must be one of: health, care, plan' })
  journey: IJourneyType;

  /**
   * The name of the icon to display for the achievement.
   * Must follow the pattern of lowercase letters, numbers, and hyphens.
   */
  @IsString({ message: 'Icon must be a string' })
  @IsNotEmpty({ message: 'Icon is required' })
  @Matches(/^[a-z0-9-]+$/, { message: 'Icon must contain only lowercase letters, numbers, and hyphens' })
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   * Must be an integer between 5 and 1000.
   */
  @IsInt({ message: 'XP reward must be an integer' })
  @Min(5, { message: 'XP reward must be at least 5' })
  @Max(1000, { message: 'XP reward cannot exceed 1000' })
  @IsNotEmpty({ message: 'XP reward is required' })
  xpReward: number;
}