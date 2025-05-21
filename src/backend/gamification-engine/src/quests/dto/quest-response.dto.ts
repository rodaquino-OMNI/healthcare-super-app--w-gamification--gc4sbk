import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'; // @nestjs/swagger ^9.0.0
import { IsInt, IsString, IsUUID, Max, Min, IsOptional } from 'class-validator'; // class-validator@0.14.1

/**
 * Data Transfer Object (DTO) for standardizing quest data in API responses.
 * 
 * This DTO maps the Quest entity fields to a consistent format for client consumption.
 * It is used by controller methods to ensure uniform response structure when returning
 * quest data through the findAll and findOne endpoints.
 */
export class QuestResponseDto {
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
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  /**
   * Optional estimated time to complete the quest in minutes.
   * Helps users gauge the time commitment required.
   * @example 15
   */
  @ApiPropertyOptional({
    description: 'Estimated time to complete in minutes',
    minimum: 1,
    example: 15
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedTimeMinutes?: number;

  /**
   * Optional tags for categorizing and filtering quests.
   * @example ["daily", "health-metrics"]
   */
  @ApiPropertyOptional({
    description: 'Tags for categorizing quests',
    type: [String],
    example: ['daily', 'health-metrics']
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}