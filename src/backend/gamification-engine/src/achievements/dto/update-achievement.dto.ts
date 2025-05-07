import { IsOptional } from 'class-validator';
import { CreateAchievementDto } from './create-achievement.dto';
import { IJourneyType } from '@austa/interfaces/journey';

/**
 * Data Transfer Object for updating an existing achievement.
 * 
 * This DTO extends CreateAchievementDto but makes all fields optional,
 * allowing clients to perform partial updates by only providing the fields
 * they want to change. This follows the Partial<Type> pattern while still
 * maintaining validation on any fields that are provided.
 * 
 * Example usage:
 * ```typescript
 * // Update only the title and xpReward
 * const updateDto = new UpdateAchievementDto();
 * updateDto.title = 'New Achievement Title';
 * updateDto.xpReward = 150;
 * await achievementsService.update(id, updateDto);
 * ```
 */
export class UpdateAchievementDto extends CreateAchievementDto {
  /**
   * Optional title of the achievement.
   * If provided, must be a non-empty string.
   */
  @IsOptional()
  title?: string;

  /**
   * Optional description of the achievement.
   * If provided, must be a string.
   */
  @IsOptional()
  description?: string;

  /**
   * Optional journey to which the achievement belongs.
   * If provided, must be a valid journey type ('health', 'care', 'plan').
   */
  @IsOptional()
  journey?: IJourneyType;

  /**
   * Optional icon name for the achievement.
   * If provided, must be a string referencing a valid icon in the design system.
   */
  @IsOptional()
  icon?: string;

  /**
   * Optional XP reward for unlocking the achievement.
   * If provided, must be an integer between 0 and 1000.
   */
  @IsOptional()
  xpReward?: number;
}