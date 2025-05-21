import { IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber, IsDate, IsISO8601, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from '../../events/dto/process-event.dto';

/**
 * Base DTO for all quest-related events
 * Contains common properties for all quest events
 */
export class QuestEventDto extends ProcessEventDto {
  /**
   * The ID of the quest associated with the event
   * Must be a valid UUID that identifies a quest in the system
   */
  @IsNotEmpty()
  @IsUUID()
  questId: string;

  /**
   * The timestamp when the event occurred
   * Must be a valid ISO 8601 date string
   */
  @IsNotEmpty()
  @IsISO8601()
  timestamp: string;

  /**
   * The journey associated with the quest
   * Possible values: 'health', 'care', 'plan'
   */
  @IsOptional()
  @IsString()
  journey?: string;
}

/**
 * DTO for quest.started events
 * Triggered when a user starts a new quest
 */
export class QuestStartedEventDto extends QuestEventDto {
  /**
   * The type of the event, always 'quest.started' for this DTO
   */
  @IsNotEmpty()
  @IsString()
  readonly type: string = 'quest.started';

  /**
   * Optional metadata about how the quest was started
   * For example, whether it was automatically assigned or manually selected
   */
  @IsOptional()
  @IsString()
  startMethod?: 'automatic' | 'manual';
}

/**
 * DTO for quest.completed events
 * Triggered when a user completes a quest
 */
export class QuestCompletedEventDto extends QuestEventDto {
  /**
   * The type of the event, always 'quest.completed' for this DTO
   */
  @IsNotEmpty()
  @IsString()
  readonly type: string = 'quest.completed';

  /**
   * The amount of XP awarded for completing the quest
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  xpAwarded: number;

  /**
   * The time it took to complete the quest in seconds
   * Optional field for analytics purposes
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  completionTimeSeconds?: number;
}

/**
 * DTO for quest.progress events
 * Triggered when a user makes progress on a quest
 */
export class QuestProgressEventDto extends QuestEventDto {
  /**
   * The type of the event, always 'quest.progress' for this DTO
   */
  @IsNotEmpty()
  @IsString()
  readonly type: string = 'quest.progress';

  /**
   * The current progress percentage (0-100)
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Optional description of the progress made
   * For example, "Completed 3 of 5 required actions"
   */
  @IsOptional()
  @IsString()
  progressDescription?: string;
}

/**
 * Union type for all quest-related events
 * Used for type checking and discriminated unions
 */
export type QuestEvent = QuestStartedEventDto | QuestCompletedEventDto | QuestProgressEventDto;