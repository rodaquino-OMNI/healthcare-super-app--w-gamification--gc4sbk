import { IsString, IsNumber, IsOptional, IsUUID, IsIn } from 'class-validator';
import { Reward } from '@austa/interfaces/gamification';

/**
 * Data Transfer Object for updating an existing reward in the gamification system.
 * 
 * This DTO makes all fields optional to support partial updates, while maintaining
 * the same validation rules as CreateRewardDto. It's used in PATCH or PUT endpoints
 * to validate incoming update requests for rewards.
 *
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 */
export class UpdateRewardDto implements Partial<Reward> {
  /**
   * Optional title of the reward displayed to users
   * @example "Health Champion Badge"
   */
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  title?: string;

  /**
   * Optional detailed description of the reward
   * @example "Awarded to users who have maintained a perfect health streak for 30 days"
   */
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  /**
   * Optional amount of XP awarded when earning this reward
   * @example 500
   */
  @IsOptional()
  @IsNumber({}, { message: 'XP reward must be a number' })
  xpReward?: number;

  /**
   * Optional icon name/path used to visually represent the reward
   * @example "health-champion-badge.svg"
   */
  @IsOptional()
  @IsString({ message: 'Icon must be a string' })
  icon?: string;

  /**
   * Optional journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  @IsOptional()
  @IsString({ message: 'Journey must be a string' })
  @IsIn(['health', 'care', 'plan', 'global'], { 
    message: 'Journey must be one of: health, care, plan, or global' 
  })
  journey?: string;
}