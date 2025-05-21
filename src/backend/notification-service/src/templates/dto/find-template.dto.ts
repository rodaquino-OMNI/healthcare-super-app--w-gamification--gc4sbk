import { IsEnum, IsOptional, IsString } from 'class-validator'; // class-validator@0.14.0+
import { JOURNEY_IDS } from '@austa/interfaces/journey';

/**
 * Data Transfer Object for filtering notification templates.
 * Used to search templates by criteria such as templateId, language, and journey.
 * All fields are optional to allow flexible querying.
 */
export class FindTemplateDto {
  /**
   * The template identifier to filter by.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   */
  @IsOptional()
  @IsString()
  templateId?: string;

  /**
   * The language code to filter by, following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   */
  @IsOptional()
  @IsString()
  language?: string;

  /**
   * The journey context to filter by.
   * Must be one of the valid journey types: 'health', 'care', or 'plan'.
   */
  @IsOptional()
  @IsEnum(JOURNEY_IDS, {
    message: `Journey must be one of the following values: ${Object.values(JOURNEY_IDS).join(', ')}`,
  })
  journey?: string;
}