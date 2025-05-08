import { IsString, IsUUID, IsOptional, IsNumber, IsDate, IsObject, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Optional initial state for a quest when starting
 */
export class QuestInitialStateDto {
  /**
   * Optional initial progress value (0-100)
   */
  @IsNumber()
  @IsOptional()
  progress?: number;

  /**
   * Optional context data for the quest
   */
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  /**
   * Optional flag to indicate if this quest should be prioritized
   */
  @IsBoolean()
  @IsOptional()
  isPriority?: boolean;
}

/**
 * Data Transfer Object for starting a quest.
 * 
 * This DTO defines the structure for the request to start a new quest.
 * Currently, quest starting primarily relies on the quest ID (from URL params)
 * and user ID (from JWT token), but this DTO standardizes the event payload
 * and allows for future extensions like initial progress state or optional parameters.
 */
export class StartQuestDto {
  /**
   * The ID of the quest to be started.
   * This is typically extracted from URL parameters in the controller.
   */
  @IsUUID(4)
  @IsOptional() // Optional in the DTO as it's typically extracted from URL
  questId?: string;

  /**
   * The ID of the user starting the quest.
   * This is typically extracted from the JWT token in the controller.
   */
  @IsUUID(4)
  @IsOptional() // Optional in the DTO as it's typically extracted from JWT
  userId?: string;

  /**
   * Optional initial state for the quest.
   * This can include initial progress or context data.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestInitialStateDto)
  initialState?: QuestInitialStateDto;

  /**
   * Optional source of the quest start request.
   * This can be used to track where the quest was started from.
   */
  @IsString()
  @IsOptional()
  source?: string;

  /**
   * Optional journey context for cross-journey quests.
   * This can be used to associate a quest with a specific journey context.
   */
  @IsEnum(['health', 'care', 'plan', 'cross-journey'])
  @IsOptional()
  journeyContext?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * The timestamp when the quest was started.
   * This is typically set by the service, not the client.
   */
  @IsDate()
  @IsOptional() // Set by the service, not the client
  timestamp?: Date;

  /**
   * Additional metadata or context for the quest start.
   * This allows for extensibility without changing the DTO structure.
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * Data Transfer Object for the quest started event.
 * This represents the structure of the Kafka event payload for 'quest.started'.
 */
export class QuestStartedEventDto {
  /**
   * The ID of the user who started the quest.
   */
  @IsUUID(4)
  userId: string;

  /**
   * The ID of the started quest.
   */
  @IsUUID(4)
  questId: string;

  /**
   * The timestamp when the quest was started.
   */
  @IsString() // ISO string format
  timestamp: string;

  /**
   * Optional initial state for the quest.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestInitialStateDto)
  initialState?: QuestInitialStateDto;

  /**
   * Optional source of the quest start request.
   */
  @IsString()
  @IsOptional()
  source?: string;

  /**
   * Optional journey context for cross-journey quests.
   */
  @IsEnum(['health', 'care', 'plan', 'cross-journey'])
  @IsOptional()
  journeyContext?: 'health' | 'care' | 'plan' | 'cross-journey';

  /**
   * Additional metadata or context for the quest start.
   */
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}