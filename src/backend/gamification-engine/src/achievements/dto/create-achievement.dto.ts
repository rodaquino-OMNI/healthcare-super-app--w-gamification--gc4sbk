import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { IJourneyType } from '@austa/interfaces/journey';

/**
 * Data Transfer Object for creating a new achievement in the gamification engine.
 * 
 * This DTO enforces validation rules for all required fields when creating an achievement,
 * ensuring data integrity and type safety through class-validator decorators.
 */
export class CreateAchievementDto {
  /**
   * The title of the achievement.
   * Must be a non-empty string.
   */
  @IsString()
  @IsNotEmpty({ message: 'Achievement title is required' })
  title: string;

  /**
   * A description of the achievement.
   * Must be a string explaining how to unlock the achievement.
   */
  @IsString()
  @IsNotEmpty({ message: 'Achievement description is required' })
  description: string;

  /**
   * The journey to which the achievement belongs (e.g., 'health', 'care', 'plan').
   * Must be a valid journey type from the shared interfaces.
   */
  @IsString()
  @IsNotEmpty({ message: 'Journey type is required' })
  journey: IJourneyType;

  /**
   * The name of the icon to display for the achievement.
   * Must be a string referencing a valid icon in the design system.
   */
  @IsString()
  @IsNotEmpty({ message: 'Icon name is required' })
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   * Must be an integer between 0 and 1000.
   */
  @IsInt({ message: 'XP reward must be an integer' })
  @Min(0, { message: 'XP reward must be at least 0' })
  @Max(1000, { message: 'XP reward cannot exceed 1000' })
  xpReward: number;
}