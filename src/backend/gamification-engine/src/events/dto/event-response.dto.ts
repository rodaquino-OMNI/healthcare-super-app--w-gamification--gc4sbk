import { IsBoolean, IsNumber, IsObject, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for error details in event processing responses.
 * Provides structured information about errors that occurred during event processing.
 */
export class EventErrorDto {
  /**
   * The error code identifying the type of error.
   * Used for client-side error handling and internationalization.
   */
  @IsString()
  code: string;

  /**
   * Human-readable error message describing what went wrong.
   */
  @IsString()
  message: string;

  /**
   * Optional additional details about the error.
   * May contain technical information for debugging or logging.
   */
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}

/**
 * Data transfer object for achievement information in event responses.
 * Contains details about achievements that were unlocked during event processing.
 */
export class AchievementUnlockedDto {
  /**
   * The unique identifier of the achievement.
   */
  @IsString()
  id: string;

  /**
   * The title of the achievement.
   */
  @IsString()
  title: string;

  /**
   * The description of the achievement.
   */
  @IsString()
  description: string;

  /**
   * The journey associated with the achievement (health, care, plan).
   */
  @IsOptional()
  @IsString()
  journey?: string;

  /**
   * The URL to the achievement's icon or badge image.
   */
  @IsOptional()
  @IsString()
  iconUrl?: string;

  /**
   * The number of XP points awarded for unlocking this achievement.
   */
  @IsNumber()
  xpValue: number;
}

/**
 * Data transfer object for quest progress information in event responses.
 * Contains details about quests that progressed during event processing.
 */
export class QuestProgressDto {
  /**
   * The unique identifier of the quest.
   */
  @IsString()
  id: string;

  /**
   * The title of the quest.
   */
  @IsString()
  title: string;

  /**
   * The current progress value of the quest (e.g., 2 of 5 steps completed).
   */
  @IsNumber()
  currentProgress: number;

  /**
   * The total progress required to complete the quest.
   */
  @IsNumber()
  totalProgress: number;

  /**
   * Whether the quest was completed with this event.
   */
  @IsBoolean()
  completed: boolean;

  /**
   * The journey associated with the quest (health, care, plan).
   */
  @IsOptional()
  @IsString()
  journey?: string;
}

/**
 * Data transfer object for standardized responses from event processing operations.
 * Provides a consistent structure for success or failure results with appropriate metadata.
 * Includes fields for tracking points earned, achievements unlocked, and quests progressed.
 */
export class EventResponseDto {
  /**
   * Indicates whether the event was processed successfully.
   */
  @IsBoolean()
  success: boolean;

  /**
   * The number of XP points earned from this event.
   * Will be 0 if no points were earned or if processing failed.
   */
  @IsNumber()
  pointsEarned: number;

  /**
   * List of achievements that were unlocked by this event.
   * Will be an empty array if no achievements were unlocked or if processing failed.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AchievementUnlockedDto)
  achievementsUnlocked: AchievementUnlockedDto[];

  /**
   * List of quests that progressed due to this event.
   * Will be an empty array if no quests progressed or if processing failed.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestProgressDto)
  questsProgressed: QuestProgressDto[];

  /**
   * Error information if the event processing failed.
   * Will be null if processing was successful.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => EventErrorDto)
  error?: EventErrorDto;

  /**
   * Additional journey-specific metadata related to the event processing.
   * Can contain custom data specific to health, care, or plan journeys.
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  /**
   * Creates a successful event response.
   * @param pointsEarned The number of XP points earned from this event
   * @param achievementsUnlocked List of achievements unlocked by this event
   * @param questsProgressed List of quests that progressed due to this event
   * @param metadata Additional journey-specific metadata
   * @returns A new EventResponseDto instance with success=true
   */
  static success(
    pointsEarned: number = 0,
    achievementsUnlocked: AchievementUnlockedDto[] = [],
    questsProgressed: QuestProgressDto[] = [],
    metadata?: Record<string, any>
  ): EventResponseDto {
    const response = new EventResponseDto();
    response.success = true;
    response.pointsEarned = pointsEarned;
    response.achievementsUnlocked = achievementsUnlocked;
    response.questsProgressed = questsProgressed;
    response.metadata = metadata;
    return response;
  }

  /**
   * Creates a failed event response.
   * @param error Error information about what went wrong
   * @param metadata Additional journey-specific metadata
   * @returns A new EventResponseDto instance with success=false
   */
  static failure(
    error: EventErrorDto,
    metadata?: Record<string, any>
  ): EventResponseDto {
    const response = new EventResponseDto();
    response.success = false;
    response.pointsEarned = 0;
    response.achievementsUnlocked = [];
    response.questsProgressed = [];
    response.error = error;
    response.metadata = metadata;
    return response;
  }
}