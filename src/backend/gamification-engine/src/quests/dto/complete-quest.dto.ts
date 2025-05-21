import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Data transfer object for completing a quest.
 * 
 * This DTO is used when a user completes a quest in the gamification system.
 * Currently, the quest ID is extracted from URL parameters and the user ID 
 * from the JWT token in the controller, so this DTO primarily standardizes 
 * the event payload structure for 'quest.completed' Kafka events.
 * 
 * It includes optional fields for future extensibility, such as evidence 
 * submission or completion notes.
 */
export class CompleteQuestDto {
  /**
   * The unique identifier of the quest being completed.
   * This is typically extracted from URL parameters in the controller.
   */
  @IsOptional()
  @IsString({ message: 'Quest ID must be a string' })
  questId?: string;

  /**
   * The unique identifier of the user completing the quest.
   * This is typically extracted from the JWT token in the controller.
   */
  @IsOptional()
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId?: string;

  /**
   * Optional notes or comments about the quest completion.
   * Can be used for user feedback or additional context.
   */
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  /**
   * Optional evidence of quest completion (e.g., photo URL, document reference).
   * Can be used for quests that require proof of completion.
   */
  @IsOptional()
  @IsString({ message: 'Evidence must be a string' })
  evidence?: string;
}

/**
 * Data transfer object for the 'quest.completed' Kafka event payload.
 * 
 * This DTO standardizes the event structure sent to Kafka when a quest is completed,
 * ensuring consistent event processing throughout the system.
 */
export class QuestCompletedEventDto {
  /**
   * The unique identifier of the user who completed the quest.
   */
  @IsNotEmpty({ message: 'User ID is required' })
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  userId: string;

  /**
   * The unique identifier of the completed quest.
   */
  @IsNotEmpty({ message: 'Quest ID is required' })
  @IsString({ message: 'Quest ID must be a string' })
  questId: string;

  /**
   * The amount of XP awarded to the user for completing the quest.
   */
  @IsNotEmpty({ message: 'XP awarded is required' })
  @IsNumber({}, { message: 'XP awarded must be a number' })
  @Min(0, { message: 'XP awarded must be a non-negative number' })
  @Type(() => Number)
  xpAwarded: number;

  /**
   * The timestamp when the quest was completed.
   * Defaults to the current ISO timestamp if not provided.
   */
  @IsOptional()
  @IsString({ message: 'Timestamp must be a string' })
  timestamp: string = new Date().toISOString();

  /**
   * Optional notes or comments about the quest completion.
   */
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  /**
   * Optional evidence of quest completion.
   */
  @IsOptional()
  @IsString({ message: 'Evidence must be a string' })
  evidence?: string;

  /**
   * Constructor to create a new QuestCompletedEventDto instance.
   * 
   * @param userId - The ID of the user who completed the quest
   * @param questId - The ID of the completed quest
   * @param xpAwarded - The amount of XP awarded for completion
   * @param options - Optional parameters (timestamp, notes, evidence)
   */
  constructor(
    userId: string,
    questId: string,
    xpAwarded: number,
    options?: {
      timestamp?: string;
      notes?: string;
      evidence?: string;
    }
  ) {
    this.userId = userId;
    this.questId = questId;
    this.xpAwarded = xpAwarded;
    this.timestamp = options?.timestamp || new Date().toISOString();
    this.notes = options?.notes;
    this.evidence = options?.evidence;
  }
}