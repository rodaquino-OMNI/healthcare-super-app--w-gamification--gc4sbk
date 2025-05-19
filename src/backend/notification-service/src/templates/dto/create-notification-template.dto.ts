import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum, Matches, MaxLength, MinLength, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationChannel } from '@austa/interfaces/notification/types';
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';

/**
 * Data Transfer Object for creating a new notification template.
 * Used to validate and transfer data when creating notification templates.
 */
export class CreateNotificationTemplateDto {
  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'templateId must contain only lowercase letters, numbers, and hyphens',
  })
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z]{2}-[A-Z]{2}$/, {
    message: 'language must be in format "xx-XX" (e.g., "pt-BR", "en-US")',
  })
  language: string = 'pt-BR';

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * Examples: ["push", "email", "in-app", "sms"]
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  /**
   * Optional journey identifier to associate the template with a specific journey.
   * Used for journey-specific template identification and retrieval.
   * Examples: 'health', 'care', 'plan'
   */
  @IsOptional()
  @IsString()
  @IsEnum(JOURNEY_IDS)
  journeyId?: string;

  /**
   * Optional metadata for additional template configuration.
   * Can include information about required variables, template category, etc.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  metadata?: Record<string, any>;
}