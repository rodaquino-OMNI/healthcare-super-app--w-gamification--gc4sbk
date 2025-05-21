import { IsNotEmpty, IsString, IsUUID, IsObject, IsEnum, IsOptional, IsDate, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum defining the types of achievement events that can be processed
 * by the gamification engine.
 */
export enum AchievementEventType {
  /** Event triggered when an achievement is unlocked by a user */
  UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  /** Event triggered when progress is made toward an achievement */
  PROGRESS_UPDATED = 'ACHIEVEMENT_PROGRESS_UPDATED',
  /** Event triggered when an achievement is created or updated in the system */
  UPDATED = 'ACHIEVEMENT_UPDATED',
  /** Event triggered when an achievement is reset for a user */
  RESET = 'ACHIEVEMENT_RESET'
}

/**
 * Metadata for achievement progress update events.
 * Contains information about the current progress toward unlocking an achievement.
 */
export class AchievementProgressMetadata {
  /** Current progress value toward the achievement */
  @IsNotEmpty()
  currentProgress: number;
  
  /** Total progress required to unlock the achievement */
  @IsNotEmpty()
  totalRequired: number;
  
  /** Optional journey identifier associated with this progress update */
  @IsOptional()
  @IsString()
  journey?: string;
}

/**
 * Metadata for achievement unlocked events.
 * Contains information about the unlocked achievement.
 */
export class AchievementUnlockedMetadata {
  /** Title of the unlocked achievement */
  @IsNotEmpty()
  @IsString()
  achievementTitle: string;
  
  /** XP (experience points) awarded for unlocking this achievement */
  @IsNotEmpty()
  xpAwarded: number;
  
  /** Journey associated with this achievement */
  @IsNotEmpty()
  @IsString()
  journey: string;
}

/**
 * Data transfer object for achievement-related events processed by the gamification engine.
 * This DTO standardizes the schema for events related to achievements, ensuring
 * consistent event processing across the platform.
 */
export class AchievementEventDto {
  /**
   * The unique identifier of the user associated with this achievement event.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;
  
  /**
   * The unique identifier of the achievement associated with this event.
   */
  @IsNotEmpty()
  @IsUUID()
  achievementId: string;
  
  /**
   * The type of achievement event.
   */
  @IsNotEmpty()
  @IsEnum(AchievementEventType)
  eventType: AchievementEventType;
  
  /**
   * Metadata specific to the achievement event type.
   * The structure varies based on the eventType:
   * - For PROGRESS_UPDATED: Contains AchievementProgressMetadata
   * - For UNLOCKED: Contains AchievementUnlockedMetadata
   * - For other types: Contains relevant achievement data
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: 'eventType',
      subTypes: [
        { value: AchievementProgressMetadata, name: AchievementEventType.PROGRESS_UPDATED },
        { value: AchievementUnlockedMetadata, name: AchievementEventType.UNLOCKED }
      ]
    }
  })
  metadata: AchievementProgressMetadata | AchievementUnlockedMetadata | Record<string, any>;
  
  /**
   * The timestamp when this event occurred.
   * If not provided, the current timestamp will be used.
   */
  @IsOptional()
  @IsDate()
  timestamp?: Date = new Date();
  
  /**
   * Optional correlation ID for tracking related events.
   * Useful for connecting multiple events in a single user action.
   */
  @IsOptional()
  @IsString()
  correlationId?: string;
  
  /**
   * Optional source of the event (e.g., 'health-service', 'care-service', 'plan-service').
   * Helps identify which service generated the achievement event.
   */
  @IsOptional()
  @IsString()
  source?: string;
}