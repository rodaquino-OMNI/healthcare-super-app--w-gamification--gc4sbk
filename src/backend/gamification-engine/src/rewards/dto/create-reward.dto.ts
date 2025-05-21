import { IsString, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import { IReward } from '@austa/interfaces/gamification/rewards';

/**
 * Data Transfer Object for creating a new reward in the gamification system.
 * 
 * This DTO enforces validation rules to ensure data integrity when creating
 * rewards that users can earn through achievements, quests, or other actions.
 * 
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 */
export class CreateRewardDto implements Omit<IReward, 'id'> {
  /**
   * Title of the reward displayed to users
   * @example "Health Champion"
   */
  @IsNotEmpty()
  @IsString()
  title: string;

  /**
   * Detailed description of the reward
   * @example "Awarded to users who maintain a perfect health streak for 30 days"
   */
  @IsNotEmpty()
  @IsString()
  description: string;

  /**
   * Amount of XP awarded when earning this reward
   * @example 500
   */
  @IsNotEmpty()
  @IsNumber()
  xpReward: number;

  /**
   * Icon name/path used to visually represent the reward
   * @example "rewards/health-champion.svg"
   */
  @IsNotEmpty()
  @IsString()
  icon: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  @IsNotEmpty()
  @IsString()
  @IsEnum(['health', 'care', 'plan', 'global'], {
    message: 'Journey must be one of: health, care, plan, or global'
  })
  journey: string;
}