import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { IReward } from '@austa/interfaces/gamification/rewards';

/**
 * Data Transfer Object for updating an existing reward.
 * 
 * This DTO makes all fields optional to support partial updates via PATCH requests,
 * while maintaining the same validation rules as CreateRewardDto.
 * 
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 */
export class UpdateRewardDto implements Partial<IReward> {
  /**
   * Title of the reward displayed to users
   * @example "Health Champion"
   */
  @IsOptional()
  @IsString()
  title?: string;

  /**
   * Detailed description of the reward
   * @example "Awarded to users who maintain a perfect health streak for 30 days"
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Amount of XP awarded when earning this reward
   * @example 500
   */
  @IsOptional()
  @IsNumber()
  xpReward?: number;

  /**
   * Icon name/path used to visually represent the reward
   * @example "rewards/health-champion.svg"
   */
  @IsOptional()
  @IsString()
  icon?: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  @IsOptional()
  @IsString()
  @IsEnum(['health', 'care', 'plan', 'global'], {
    message: 'Journey must be one of: health, care, plan, or global'
  })
  journey?: string;
}