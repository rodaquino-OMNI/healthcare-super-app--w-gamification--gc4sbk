import { IsString, IsNumber, IsNotEmpty, Min, MaxLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Reward } from '@austa/interfaces/gamification';

/**
 * Data Transfer Object for creating a new reward in the gamification system.
 * 
 * This DTO validates incoming request data when creating rewards through the API.
 * It ensures all required fields are present and properly formatted before processing.
 * Part of the reward management feature (F-303) that handles distribution of 
 * digital and physical rewards based on user achievements and progress.
 * 
 * Implements the standardized Reward interface from @austa/interfaces for type consistency
 * across services and the frontend applications.
 */
export class CreateRewardDto implements Omit<Reward, 'id'> {
  /**
   * Title of the reward displayed to users
   * @example "Health Champion"
   */
  @ApiProperty({
    description: 'Title of the reward displayed to users',
    example: 'Health Champion',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  /**
   * Detailed description of the reward
   * @example "Awarded to users who maintain perfect health metrics for 30 consecutive days"
   */
  @ApiProperty({
    description: 'Detailed description of the reward',
    example: 'Awarded to users who maintain perfect health metrics for 30 consecutive days',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  description: string;

  /**
   * Amount of XP awarded when earning this reward
   * @example 500
   */
  @ApiProperty({
    description: 'Amount of XP awarded when earning this reward',
    example: 500,
    minimum: 1,
  })
  @IsNumber({}, { message: 'XP reward must be a number' })
  @IsNotEmpty({ message: 'XP reward is required' })
  @Min(1, { message: 'XP reward must be at least 1' })
  xpReward: number;

  /**
   * Icon name/path used to visually represent the reward
   * @example "trophy-gold"
   */
  @ApiProperty({
    description: 'Icon name/path used to visually represent the reward',
    example: 'trophy-gold',
  })
  @IsString({ message: 'Icon must be a string' })
  @IsNotEmpty({ message: 'Icon is required' })
  @MaxLength(100, { message: 'Icon path cannot exceed 100 characters' })
  icon: string;

  /**
   * The journey this reward is associated with
   * Can be 'health', 'care', 'plan', or 'global' for cross-journey rewards
   * @example "health"
   */
  @ApiProperty({
    description: 'The journey this reward is associated with',
    example: 'health',
    enum: ['health', 'care', 'plan', 'global'],
  })
  @IsString({ message: 'Journey must be a string' })
  @IsNotEmpty({ message: 'Journey is required' })
  @IsIn(['health', 'care', 'plan', 'global'], { 
    message: 'Journey must be one of: health, care, plan, global' 
  })
  journey: 'health' | 'care' | 'plan' | 'global';
}