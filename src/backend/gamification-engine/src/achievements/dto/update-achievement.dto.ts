import { IsOptional, IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { IJourneyType } from '@austa/interfaces/journey';
import { CreateAchievementDto } from './create-achievement.dto';

/**
 * Data Transfer Object for updating an existing achievement in the gamification engine.
 * 
 * This DTO extends CreateAchievementDto but makes all fields optional using the @IsOptional
 * decorator, allowing clients to update only specific achievement properties while maintaining
 * validation rules for any provided fields. It follows the Partial<Type> pattern common in
 * TypeScript applications while preserving validation.
 */
export class UpdateAchievementDto extends CreateAchievementDto {
  /**
   * The title of the achievement.
   * Optional for updates, but must be a non-empty string if provided.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Achievement title cannot be empty if provided' })
  title: string;

  /**
   * A description of the achievement.
   * Optional for updates, but must be a string if provided.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Achievement description cannot be empty if provided' })
  description: string;

  /**
   * The journey to which the achievement belongs (e.g., 'health', 'care', 'plan').
   * Optional for updates, but must be a valid journey type if provided.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Journey type cannot be empty if provided' })
  journey: IJourneyType;

  /**
   * The name of the icon to display for the achievement.
   * Optional for updates, but must be a string if provided.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Icon name cannot be empty if provided' })
  icon: string;

  /**
   * The amount of XP (experience points) awarded for unlocking the achievement.
   * Optional for updates, but must be an integer between 0 and 1000 if provided.
   */
  @IsOptional()
  @IsInt({ message: 'XP reward must be an integer if provided' })
  @Min(0, { message: 'XP reward must be at least 0' })
  @Max(1000, { message: 'XP reward cannot exceed 1000' })
  xpReward: number;
}