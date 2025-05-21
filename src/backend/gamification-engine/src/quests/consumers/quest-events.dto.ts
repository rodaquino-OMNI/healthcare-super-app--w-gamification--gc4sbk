import { IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber, IsDateString, IsBoolean, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from '../../events/dto/process-event.dto';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

/**
 * Base DTO for quest-related events in the gamification engine.
 * Extends the ProcessEventDto with quest-specific properties.
 * This serves as the foundation for all quest event DTOs.
 */
export class BaseQuestEventDto extends ProcessEventDto {
  /**
   * The unique identifier of the quest associated with this event.
   * Must be a valid UUID.
   */
  @IsNotEmpty()
  @IsUUID()
  questId: string;

  /**
   * ISO timestamp when the event occurred.
   * Format: YYYY-MM-DDTHH:mm:ss.sssZ
   */
  @IsNotEmpty()
  @IsDateString()
  timestamp: string;

  /**
   * The journey associated with the quest.
   * Indicates which journey (health, care, plan) the quest belongs to.
   */
  @IsOptional()
  @IsString()
  journey?: JourneyType;

  /**
   * The version of the event schema.
   * Used for backward compatibility when event schemas evolve.
   * @default "1.0"
   */
  @IsOptional()
  @IsString()
  version?: string = "1.0";
}

/**
 * DTO for quest.started events.
 * These events are emitted when a user starts a new quest.
 */
export class QuestStartedEventDto extends BaseQuestEventDto {
  /**
   * The type of the event.
   * Always set to 'quest.started' for this DTO.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'quest.started';
}

/**
 * DTO for quest.completed events.
 * These events are emitted when a user completes a quest.
 */
export class QuestCompletedEventDto extends BaseQuestEventDto {
  /**
   * The type of the event.
   * Always set to 'quest.completed' for this DTO.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'quest.completed';

  /**
   * The amount of XP awarded to the user for completing the quest.
   * Must be a positive number.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  xpAwarded: number;
}

/**
 * DTO for quest.progress events.
 * These events are emitted when a user makes progress on a quest.
 */
export class QuestProgressEventDto extends BaseQuestEventDto {
  /**
   * The type of the event.
   * Always set to 'quest.progress' for this DTO.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'quest.progress';

  /**
   * The current progress percentage of the quest.
   * Must be a number between 0 and 100.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Indicates whether the quest is completed.
   * True if progress is 100%, false otherwise.
   */
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

/**
 * DTO for quest progress data.
 * Used as a nested object within other DTOs to represent quest progress details.
 */
export class QuestProgressDataDto {
  /**
   * The unique identifier of the quest.
   */
  @IsNotEmpty()
  @IsUUID()
  questId: string;

  /**
   * The current progress percentage of the quest.
   * Must be a number between 0 and 100.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Indicates whether the quest is completed.
   * True if progress is 100%, false otherwise.
   */
  @IsNotEmpty()
  @IsBoolean()
  completed: boolean;
}

/**
 * DTO for batch quest progress updates.
 * Used when updating the progress of multiple quests at once.
 */
export class BatchQuestProgressEventDto extends ProcessEventDto {
  /**
   * The type of the event.
   * Always set to 'quest.batch_progress' for this DTO.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'quest.batch_progress';

  /**
   * ISO timestamp when the event occurred.
   */
  @IsNotEmpty()
  @IsDateString()
  timestamp: string;

  /**
   * The journey associated with the quests.
   */
  @IsOptional()
  @IsString()
  journey?: JourneyType;

  /**
   * Array of quest progress data for multiple quests.
   */
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => QuestProgressDataDto)
  quests: QuestProgressDataDto[];

  /**
   * The version of the event schema.
   * @default "1.0"
   */
  @IsOptional()
  @IsString()
  version?: string = "1.0";
}