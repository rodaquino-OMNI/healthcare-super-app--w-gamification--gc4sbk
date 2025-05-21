import { IsBoolean, IsDate, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserId } from '@austa/interfaces/common';

/**
 * Data Transfer Object for user achievement progress tracking.
 * Used for serializing user achievement data for API responses and
 * deserializing incoming user achievement updates.
 */
export class UserAchievementDto {
  /**
   * The unique identifier of the user.
   * Uses the standardized UserId type from @austa/interfaces.
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'User ID must be a valid UUID v4' })
  userId: UserId;

  /**
   * The unique identifier of the achievement.
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'Achievement ID must be a valid UUID v4' })
  achievementId: string;

  /**
   * The user's current progress towards unlocking the achievement.
   * Value between 0 and 100, representing percentage completion.
   */
  @IsInt({ message: 'Progress must be an integer' })
  @Min(0, { message: 'Progress cannot be negative' })
  @Max(100, { message: 'Progress cannot exceed 100%' })
  progress: number;

  /**
   * Indicates whether the achievement has been unlocked by the user.
   */
  @IsBoolean({ message: 'Unlocked status must be a boolean' })
  unlocked: boolean;

  /**
   * The date and time when the achievement was unlocked.
   * Optional as it will only be set once the achievement is unlocked.
   */
  @IsOptional()
  @IsDate({ message: 'Unlocked date must be a valid date' })
  @Type(() => Date)
  unlockedAt?: Date;

  /**
   * Additional metadata about the achievement progress.
   * This can include journey-specific details, partial completion information,
   * or any other relevant data for tracking progress.
   * 
   * Examples:
   * - For step-based achievements: { completedSteps: [1, 2], totalSteps: 5 }
   * - For collection achievements: { collectedItems: ['item1', 'item3'], totalItems: 10 }
   * - For streak achievements: { currentStreak: 5, longestStreak: 7, requiredStreak: 10 }
   */
  @IsOptional()
  @IsObject({ message: 'Metadata must be a valid JSON object' })
  metadata?: Record<string, any>;

  /**
   * The date and time when the user achievement was created.
   * This is set automatically by the system and should not be modified directly.
   */
  @IsOptional()
  @IsDate({ message: 'Created date must be a valid date' })
  @Type(() => Date)
  createdAt?: Date;

  /**
   * The date and time when the user achievement was last updated.
   * This is set automatically by the system and should not be modified directly.
   */
  @IsOptional()
  @IsDate({ message: 'Updated date must be a valid date' })
  @Type(() => Date)
  updatedAt?: Date;
}