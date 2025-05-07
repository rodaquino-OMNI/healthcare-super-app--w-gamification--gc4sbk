import { IsNotEmpty, IsString, IsUUID, IsObject, IsEnum, IsOptional, IsDate, ValidateNested } from 'class-validator'; // class-validator 0.14.1
import { Type } from 'class-transformer'; // class-transformer 0.5.1
import { IJourneyType } from '@austa/interfaces'; // @austa/interfaces 1.0.0

/**
 * Enum defining the types of achievement events that can be processed
 * by the gamification engine.
 */
export enum AchievementEventType {
  /** Event triggered when an achievement is unlocked */
  UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  /** Event triggered when progress is made towards an achievement */
  PROGRESS_UPDATED = 'ACHIEVEMENT_PROGRESS_UPDATED',
  /** Event triggered when an achievement is created or modified */
  ACHIEVEMENT_MODIFIED = 'ACHIEVEMENT_MODIFIED',
  /** Event triggered when an achievement is reset for a user */
  RESET = 'ACHIEVEMENT_RESET'
}

/**
 * Class representing the metadata for an achievement event.
 * Contains additional information specific to the event type.
 */
export class AchievementEventMetadata {
  /**
   * The current progress value for the achievement (0-100).
   * Required for PROGRESS_UPDATED events.
   */
  @IsOptional()
  @IsNotEmpty()
  progress?: number;

  /**
   * The journey associated with the achievement.
   * Helps with journey-specific achievement processing.
   */
  @IsOptional()
  @IsString()
  journey?: IJourneyType;

  /**
   * Additional context data for the achievement event.
   * Can contain journey-specific information.
   */
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

/**
 * Data Transfer Object (DTO) for achievement events processed by the gamification engine.
 * This standardizes the schema for all achievement-related events across the platform.
 */
export class AchievementEventDto {
  /**
   * The unique identifier of the user associated with this achievement event.
   * Must be a valid UUID.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * The unique identifier of the achievement associated with this event.
   * Must be a valid UUID.
   */
  @IsNotEmpty()
  @IsUUID()
  achievementId: string;

  /**
   * The type of achievement event.
   * Must be one of the values defined in AchievementEventType enum.
   */
  @IsNotEmpty()
  @IsEnum(AchievementEventType)
  eventType: AchievementEventType;

  /**
   * Additional metadata specific to the achievement event.
   * Contains information like progress, journey context, etc.
   */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AchievementEventMetadata)
  metadata?: AchievementEventMetadata;

  /**
   * The timestamp when the event occurred.
   * If not provided, the current time will be used.
   */
  @IsOptional()
  @IsDate()
  timestamp?: Date = new Date();

  /**
   * Creates a new achievement event DTO.
   * 
   * @param partial - Partial data to initialize the DTO with
   */
  constructor(partial?: Partial<AchievementEventDto>) {
    if (partial) {
      Object.assign(this, partial);
      
      // Set default timestamp if not provided
      if (!this.timestamp) {
        this.timestamp = new Date();
      }
    }
  }
}