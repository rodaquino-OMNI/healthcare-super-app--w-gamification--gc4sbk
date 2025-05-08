import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JourneyType } from '@austa/interfaces/journey';

/**
 * Data Transfer Object for finding notification templates.
 * Used to filter templates by criteria such as templateId, language, and journey.
 * All fields are optional to allow for flexible querying.
 */
export class FindTemplateDto {
  /**
   * The template identifier to search for.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   */
  @ApiProperty({
    description: 'The template identifier to search for',
    example: 'appointment-reminder',
    required: false,
  })
  @IsString()
  @IsOptional()
  templateId?: string;

  /**
   * The language code to filter templates by.
   * Follows ISO 639-1 with optional region (e.g., 'pt-BR', 'en-US').
   */
  @ApiProperty({
    description: 'The language code to filter templates by (ISO 639-1 with optional region)',
    example: 'pt-BR',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;

  /**
   * The journey context to filter templates by.
   * Templates can be associated with specific journeys (health, care, plan).
   */
  @ApiProperty({
    description: 'The journey context to filter templates by',
    enum: ['health', 'care', 'plan'],
    example: 'health',
    required: false,
  })
  @IsEnum(['health', 'care', 'plan'] as const, {
    message: 'Journey must be one of: health, care, plan',
  })
  @IsOptional()
  journey?: JourneyType;

  /**
   * Optional channels to filter templates by.
   * Examples: 'push', 'email', 'in-app', 'sms'
   */
  @ApiProperty({
    description: 'The notification channels to filter templates by',
    example: ['push', 'email'],
    required: false,
    isArray: true,
  })
  @IsString({ each: true })
  @IsOptional()
  channels?: string[];
}