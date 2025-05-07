import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserIdentifier } from '@austa/interfaces/auth';

/**
 * Data Transfer Object for user achievement progress tracking.
 * Used for serializing user achievement data for API responses and
 * deserializing incoming user achievement updates.
 */
export class UserAchievementDto {
  /**
   * The unique identifier of the user.
   * Integrated with @austa/interfaces for type-safe user identification.
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'userId must be a valid UUID v4' })
  userId: string;

  /**
   * The unique identifier of the achievement.
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'achievementId must be a valid UUID v4' })
  achievementId: string;

  /**
   * The user's current progress towards unlocking the achievement.
   * Value between 0 and 1000, where 1000 represents 100% completion.
   */
  @IsInt({ message: 'progress must be an integer' })
  @Min(0, { message: 'progress must be at least 0' })
  @Max(1000, { message: 'progress cannot exceed 1000' })
  progress: number;

  /**
   * Indicates whether the achievement has been unlocked by the user.
   */
  @IsBoolean({ message: 'unlocked must be a boolean value' })
  unlocked: boolean;

  /**
   * The date and time when the achievement was unlocked.
   * Optional as it will be null for achievements that haven't been unlocked yet.
   */
  @IsOptional()
  @IsDate({ message: 'unlockedAt must be a valid date' })
  @Type(() => Date)
  unlockedAt?: Date;

  /**
   * Additional metadata for detailed progress tracking.
   * Flexible JSON structure that can store journey-specific progress details.
   * Examples:
   * - Health journey: { stepsCompleted: 8000, goalSteps: 10000 }
   * - Care journey: { appointmentsScheduled: 3, medicationsTracked: 5 }
   * - Plan journey: { claimsSubmitted: 2, benefitsReviewed: true }
   */
  @IsOptional()
  @IsObject({ message: 'metadata must be a valid JSON object' })
  metadata?: Record<string, any>;

  /**
   * Creates a new UserAchievementDto instance.
   * 
   * @param partial - Partial data to initialize the DTO with
   */
  constructor(partial?: Partial<UserAchievementDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

/**
 * Data Transfer Object for updating user achievement progress.
 * Contains only the fields that can be updated by API requests.
 */
export class UpdateUserAchievementDto {
  /**
   * The user's updated progress towards unlocking the achievement.
   */
  @IsOptional()
  @IsInt({ message: 'progress must be an integer' })
  @Min(0, { message: 'progress must be at least 0' })
  @Max(1000, { message: 'progress cannot exceed 1000' })
  progress?: number;

  /**
   * Updated unlocked status for the achievement.
   */
  @IsOptional()
  @IsBoolean({ message: 'unlocked must be a boolean value' })
  unlocked?: boolean;

  /**
   * Updated metadata for detailed progress tracking.
   */
  @IsOptional()
  @IsObject({ message: 'metadata must be a valid JSON object' })
  metadata?: Record<string, any>;

  /**
   * Creates a new UpdateUserAchievementDto instance.
   * 
   * @param partial - Partial data to initialize the DTO with
   */
  constructor(partial?: Partial<UpdateUserAchievementDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

/**
 * Data Transfer Object for bulk user achievement updates.
 * Used for updating multiple achievements at once.
 */
export class BulkUserAchievementUpdateDto {
  /**
   * The unique identifier of the user.
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'userId must be a valid UUID v4' })
  userId: string;

  /**
   * Array of achievement updates to apply.
   */
  @IsNotEmpty({ message: 'achievements array cannot be empty' })
  @ValidateNested({ each: true })
  @Type(() => AchievementUpdate)
  achievements: AchievementUpdate[];

  /**
   * Creates a new BulkUserAchievementUpdateDto instance.
   * 
   * @param partial - Partial data to initialize the DTO with
   */
  constructor(partial?: Partial<BulkUserAchievementUpdateDto>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}

/**
 * Helper class for bulk achievement updates.
 */
export class AchievementUpdate {
  /**
   * The unique identifier of the achievement.
   */
  @IsNotEmpty()
  @IsUUID(4, { message: 'achievementId must be a valid UUID v4' })
  achievementId: string;

  /**
   * The user's updated progress towards unlocking the achievement.
   */
  @IsOptional()
  @IsInt({ message: 'progress must be an integer' })
  @Min(0, { message: 'progress must be at least 0' })
  @Max(1000, { message: 'progress cannot exceed 1000' })
  progress?: number;

  /**
   * Updated unlocked status for the achievement.
   */
  @IsOptional()
  @IsBoolean({ message: 'unlocked must be a boolean value' })
  unlocked?: boolean;

  /**
   * Updated metadata for detailed progress tracking.
   */
  @IsOptional()
  @IsObject({ message: 'metadata must be a valid JSON object' })
  metadata?: Record<string, any>;

  /**
   * Creates a new AchievementUpdate instance.
   * 
   * @param partial - Partial data to initialize with
   */
  constructor(partial?: Partial<AchievementUpdate>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}