import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for starting a quest for a user.
 * This DTO is used by the QuestsController.startQuest method.
 * 
 * Currently minimal as quest starting only requires the quest ID (from URL) 
 * and user ID (from JWT token), but provides extensibility for future additions.
 */
export class StartQuestDto {
  /**
   * The unique identifier of the quest to start
   * This is typically extracted from the URL parameter in the controller
   */
  @IsNotEmpty({ message: 'Quest ID is required' })
  @IsString({ message: 'Quest ID must be a string' })
  questId: string;

  /**
   * The unique identifier of the user starting the quest
   * This is typically extracted from the JWT token in the controller
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  /**
   * Optional initial progress state for the quest
   * Defaults to 0 if not provided
   */
  @IsOptional()
  @IsString({ message: 'Initial progress must be a number' })
  initialProgress?: number;

  /**
   * Optional additional parameters for future extensibility
   */
  @IsOptional()
  @Type(() => Object)
  additionalParams?: Record<string, any>;
}

/**
 * Data transfer object for the Kafka event payload when a quest is started.
 * This standardizes the event schema for 'quest.started' events within the gamification engine.
 */
export class QuestStartedEventDto {
  /**
   * The unique identifier of the user who started the quest
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  /**
   * The unique identifier of the quest that was started
   */
  @IsNotEmpty({ message: 'Quest ID is required' })
  @IsString({ message: 'Quest ID must be a string' })
  questId: string;

  /**
   * The timestamp when the quest was started
   * @default current ISO timestamp
   */
  @IsOptional()
  @IsString({ message: 'Timestamp must be a string' })
  timestamp: string = new Date().toISOString();

  /**
   * Optional initial progress state for the quest
   * Defaults to 0 if not provided
   */
  @IsOptional()
  @IsString({ message: 'Initial progress must be a number' })
  initialProgress?: number;

  /**
   * Optional journey identifier associated with the quest
   * Useful for cross-journey analytics and achievements
   */
  @IsOptional()
  @IsString({ message: 'Journey must be a string' })
  journey?: string;

  /**
   * Optional additional data for future extensibility
   */
  @IsOptional()
  @Type(() => Object)
  additionalData?: Record<string, any>;
}