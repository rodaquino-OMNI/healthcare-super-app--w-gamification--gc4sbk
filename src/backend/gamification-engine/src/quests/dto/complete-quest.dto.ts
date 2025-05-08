import { IsString, IsUUID, IsOptional, IsNumber, IsDate, IsObject, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Evidence data for quest completion
 */
export class QuestCompletionEvidenceDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  mediaType?: string;
}

/**
 * Data Transfer Object for completing a quest.
 * 
 * This DTO defines the structure for the request to mark a quest as completed.
 * Currently, quest completion primarily relies on the quest ID (from URL params)
 * and user ID (from JWT token), but this DTO standardizes the event payload
 * and allows for future extensions like evidence submission.
 */
export class CompleteQuestDto {
  /**
   * The ID of the quest to be completed.
   * This is typically extracted from URL parameters in the controller.
   */
  @IsUUID(4)
  @IsOptional() // Optional in the DTO as it's typically extracted from URL
  questId?: string;

  /**
   * The ID of the user completing the quest.
   * This is typically extracted from the JWT token in the controller.
   */
  @IsUUID(4)
  @IsOptional() // Optional in the DTO as it's typically extracted from JWT
  userId?: string;

  /**
   * Optional evidence provided for quest completion.
   * This can include descriptions, file URLs, or other proof of completion.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestCompletionEvidenceDto)
  evidence?: QuestCompletionEvidenceDto;

  /**
   * Optional notes or comments about the quest completion.
   */
  @IsString()
  @IsOptional()
  notes?: string;

  /**
   * Optional flag to force completion even if prerequisites aren't met.
   * This should only be used by administrators or for special circumstances.
   */
  @IsBoolean()
  @IsOptional()
  forceComplete?: boolean;

  /**
   * The amount of XP awarded for completing the quest.
   * This is typically calculated by the service based on the quest definition.
   */
  @IsNumber()
  @IsOptional() // Set by the service, not the client
  xpAwarded?: number;

  /**
   * The timestamp when the quest was completed.
   * This is typically set by the service, not the client.
   */
  @IsDate()
  @IsOptional() // Set by the service, not the client
  timestamp?: Date;

  /**
   * Additional metadata or context for the quest completion.
   * This allows for extensibility without changing the DTO structure.
   */
  @IsObject()
  @IsOptional()
  completionDetails?: Record<string, any>;
}

/**
 * Data Transfer Object for the quest completion event.
 * This represents the structure of the Kafka event payload for 'quest.completed'.
 */
export class QuestCompletedEventDto {
  /**
   * The ID of the user who completed the quest.
   */
  @IsUUID(4)
  userId: string;

  /**
   * The ID of the completed quest.
   */
  @IsUUID(4)
  questId: string;

  /**
   * The amount of XP awarded for completing the quest.
   */
  @IsNumber()
  xpAwarded: number;

  /**
   * The timestamp when the quest was completed.
   */
  @IsString() // ISO string format
  timestamp: string;

  /**
   * Optional evidence provided for quest completion.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestCompletionEvidenceDto)
  evidence?: QuestCompletionEvidenceDto;

  /**
   * Optional notes or comments about the quest completion.
   */
  @IsString()
  @IsOptional()
  notes?: string;

  /**
   * Additional metadata or context for the quest completion.
   */
  @IsObject()
  @IsOptional()
  completionDetails?: Record<string, any>;
}