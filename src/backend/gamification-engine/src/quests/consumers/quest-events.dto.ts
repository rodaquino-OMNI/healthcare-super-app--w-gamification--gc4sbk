import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, IsObject, IsDateString, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from '../../events/dto/process-event.dto';

// Import interfaces from @austa/interfaces package for type-safe event schemas
import { JourneyType, QuestEventType } from '@austa/interfaces/gamification/events';

/**
 * Base DTO for all quest-related events.
 * Extends the ProcessEventDto to maintain consistent event structure.
 */
export class BaseQuestEventDto extends ProcessEventDto {
  /**
   * The ID of the quest associated with the event.
   * Must be a valid UUID that identifies an existing quest in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  questId: string;

  /**
   * The timestamp when the event occurred.
   * Must be a valid ISO 8601 date string.
   */
  @IsNotEmpty()
  @IsDateString()
  timestamp: string;

  /**
   * The journey associated with the event.
   * Possible values: 'health', 'care', 'plan'
   */
  @IsOptional()
  @IsEnum(JourneyType)
  journey?: JourneyType;

  /**
   * Additional metadata associated with the event.
   * This can contain journey-specific context or additional information.
   */
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * DTO for quest.started events.
 * Used when a user starts a new quest.
 */
export class QuestStartedEventDto extends BaseQuestEventDto {
  /**
   * The type of the event.
   * Must be 'quest.started' for this DTO.
   */
  @IsNotEmpty()
  @IsEnum(QuestEventType)
  type: QuestEventType.QUEST_STARTED;
}

/**
 * DTO for quest.completed events.
 * Used when a user completes a quest.
 */
export class QuestCompletedEventDto extends BaseQuestEventDto {
  /**
   * The type of the event.
   * Must be 'quest.completed' for this DTO.
   */
  @IsNotEmpty()
  @IsEnum(QuestEventType)
  type: QuestEventType.QUEST_COMPLETED;

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
 * Used to update the progress of a user on a quest.
 */
export class QuestProgressEventDto extends BaseQuestEventDto {
  /**
   * The type of the event.
   * Must be 'quest.progress' for this DTO.
   */
  @IsNotEmpty()
  @IsEnum(QuestEventType)
  type: QuestEventType.QUEST_PROGRESS;

  /**
   * The progress percentage of the quest.
   * Must be a number between 0 and 100.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;
}

/**
 * Union type for all quest event DTOs.
 * Used for type-safe event handling in the quest consumer.
 */
export type QuestEventDto = QuestStartedEventDto | QuestCompletedEventDto | QuestProgressEventDto;

/**
 * Factory function to create a quest.started event DTO.
 * 
 * @param userId - The ID of the user who started the quest
 * @param questId - The ID of the quest that was started
 * @param options - Additional options for the event
 * @returns A validated quest.started event DTO
 */
export function createQuestStartedEvent(
  userId: string,
  questId: string,
  options?: {
    journey?: JourneyType;
    metadata?: Record<string, any>;
    timestamp?: string;
  }
): QuestStartedEventDto {
  return {
    type: QuestEventType.QUEST_STARTED,
    userId,
    questId,
    timestamp: options?.timestamp || new Date().toISOString(),
    journey: options?.journey,
    metadata: options?.metadata,
    data: {
      questId,
      timestamp: options?.timestamp || new Date().toISOString(),
      journey: options?.journey,
      metadata: options?.metadata
    }
  };
}

/**
 * Factory function to create a quest.completed event DTO.
 * 
 * @param userId - The ID of the user who completed the quest
 * @param questId - The ID of the quest that was completed
 * @param xpAwarded - The amount of XP awarded for completing the quest
 * @param options - Additional options for the event
 * @returns A validated quest.completed event DTO
 */
export function createQuestCompletedEvent(
  userId: string,
  questId: string,
  xpAwarded: number,
  options?: {
    journey?: JourneyType;
    metadata?: Record<string, any>;
    timestamp?: string;
  }
): QuestCompletedEventDto {
  return {
    type: QuestEventType.QUEST_COMPLETED,
    userId,
    questId,
    xpAwarded,
    timestamp: options?.timestamp || new Date().toISOString(),
    journey: options?.journey,
    metadata: options?.metadata,
    data: {
      questId,
      xpAwarded,
      timestamp: options?.timestamp || new Date().toISOString(),
      journey: options?.journey,
      metadata: options?.metadata
    }
  };
}

/**
 * Factory function to create a quest.progress event DTO.
 * 
 * @param userId - The ID of the user whose quest progress is being updated
 * @param questId - The ID of the quest being updated
 * @param progress - The progress percentage (0-100)
 * @param options - Additional options for the event
 * @returns A validated quest.progress event DTO
 */
export function createQuestProgressEvent(
  userId: string,
  questId: string,
  progress: number,
  options?: {
    journey?: JourneyType;
    metadata?: Record<string, any>;
    timestamp?: string;
  }
): QuestProgressEventDto {
  return {
    type: QuestEventType.QUEST_PROGRESS,
    userId,
    questId,
    progress,
    timestamp: options?.timestamp || new Date().toISOString(),
    journey: options?.journey,
    metadata: options?.metadata,
    data: {
      questId,
      progress,
      timestamp: options?.timestamp || new Date().toISOString(),
      journey: options?.journey,
      metadata: options?.metadata
    }
  };
}