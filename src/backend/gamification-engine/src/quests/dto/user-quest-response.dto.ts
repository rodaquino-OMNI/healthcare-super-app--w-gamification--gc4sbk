import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // @nestjs/swagger ^9.0.0
import { IsBoolean, IsInt, IsString, IsUUID, Max, Min } from 'class-validator'; // class-validator@0.14.1
import { Type } from 'class-transformer'; // class-transformer@0.5.1

/**
 * DTO representing quest details within a user quest response.
 * Contains essential information about the quest itself.
 */
export class QuestDetailsDto {
  /**
   * Unique identifier for the quest.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Unique identifier for the quest',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID(4)
  @IsString()
  id: string;

  /**
   * The title of the quest displayed to users.
   * @example "Daily Health Check"
   */
  @ApiProperty({
    description: 'The title of the quest displayed to users',
    example: 'Daily Health Check'
  })
  @IsString()
  title: string;

  /**
   * Detailed description of what the quest entails.
   * @example "Record your blood pressure and heart rate for 5 consecutive days."
   */
  @ApiProperty({
    description: 'Detailed description of the quest requirements',
    example: 'Record your blood pressure and heart rate for 5 consecutive days.'
  })
  @IsString()
  description: string;

  /**
   * The journey this quest belongs to (health, care, plan).
   * Used for journey-specific filtering and visualization.
   * @example "health"
   */
  @ApiProperty({
    description: 'The journey this quest belongs to',
    enum: ['health', 'care', 'plan'],
    example: 'health'
  })
  @IsString()
  journey: string;

  /**
   * Icon name from the design system to display for this quest.
   * @example "heart-rate"
   */
  @ApiProperty({
    description: 'Icon name from the design system',
    example: 'heart-rate'
  })
  @IsString()
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   * @example 100
   */
  @ApiProperty({
    description: 'XP reward for completing the quest',
    minimum: 0,
    maximum: 1000,
    example: 100
  })
  @IsInt()
  @Min(0)
  @Max(1000)
  xpReward: number;

  /**
   * Optional difficulty level of the quest (1-5).
   * Higher values indicate more challenging quests.
   * @example 3
   */
  @ApiPropertyOptional({
    description: 'Optional difficulty level (1-5)',
    minimum: 1,
    maximum: 5,
    example: 3
  })
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;
}

/**
 * Data Transfer Object (DTO) representing a user's participation in a specific quest.
 * Combines data from the UserQuest entity with related Quest information to provide
 * a comprehensive view of quest progress, completion status, and associated reward details.
 * 
 * This DTO is used by the controller's startQuest and completeQuest endpoints to return
 * consistent response structures with all necessary information for the frontend.
 */
export class UserQuestResponseDto {
  /**
   * Unique identifier for the user quest record.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Unique identifier for the user quest record',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID(4)
  @IsString()
  id: string;

  /**
   * Unique identifier for the user's game profile.
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Unique identifier for the user\'s game profile',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID(4)
  @IsString()
  profileId: string;

  /**
   * The user's current progress toward completing the quest (0-100).
   * This allows tracking partial completion of quests that require
   * multiple steps or actions.
   * @example 75
   */
  @ApiProperty({
    description: 'Current progress toward completing the quest (0-100)',
    minimum: 0,
    maximum: 100,
    example: 75
  })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Indicates whether the user has completed the quest.
   * When true, the quest is considered fully completed and rewards are granted.
   * @example false
   */
  @ApiProperty({
    description: 'Indicates whether the user has completed the quest',
    example: false
  })
  @IsBoolean()
  completed: boolean;

  /**
   * Detailed information about the quest itself.
   */
  @ApiProperty({
    description: 'Detailed information about the quest itself',
    type: QuestDetailsDto
  })
  @Type(() => QuestDetailsDto)
  quest: QuestDetailsDto;

  /**
   * Timestamp when the user started the quest.
   * @example "2023-04-15T14:30:00Z"
   */
  @ApiProperty({
    description: 'Timestamp when the user started the quest',
    format: 'date-time',
    example: '2023-04-15T14:30:00Z'
  })
  startedAt: Date;

  /**
   * Timestamp when the user completed the quest, if applicable.
   * @example "2023-04-18T09:45:00Z"
   */
  @ApiPropertyOptional({
    description: 'Timestamp when the user completed the quest, if applicable',
    format: 'date-time',
    example: '2023-04-18T09:45:00Z'
  })
  completedAt?: Date;
}