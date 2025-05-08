import { IsString, IsNotEmpty, IsArray, IsOptional, MaxLength, ArrayMinSize, Matches, IsEnum } from 'class-validator'; // class-validator@0.14.0+
import { Transform, Type } from 'class-transformer'; // class-transformer@0.5.1+

// Import from @austa packages for standardized interfaces
import { INotificationTemplate } from '@austa/interfaces/notification/templates';
import { NotificationChannel } from '@austa/interfaces/notification/types';

// Import using path aliases for consistent imports
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';

/**
 * Data Transfer Object for creating a new notification template.
 * Implements validation rules for all required fields and ensures
 * data integrity before database insertion.
 * 
 * @example
 * {
 *   "templateId": "appointment-reminder-care",
 *   "language": "pt-BR",
 *   "title": "Lembrete de Consulta com {{providerName}}",
 *   "body": "Sua consulta está agendada para {{appointmentTime}} amanhã.",
 *   "channels": ["push", "in-app", "email"]
 * }
 */
export class CreateNotificationTemplateDto implements Omit<INotificationTemplate, 'id' | 'createdAt' | 'updatedAt'> {
  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * Used when sending notifications to reference the appropriate template.
   * 
   * Should follow the format: [purpose]-[context]-[journey] (optional)
   * e.g., appointment-reminder-care, achievement-unlocked, medication-reminder-health
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'templateId must contain only lowercase letters, numbers, and hyphens',
  })
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * Used for internationalization of notification content.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: 'language must be in format "xx" or "xx-XX" (e.g., "pt" or "pt-BR")',
  })
  @IsOptional()
  language?: string = 'pt-BR';

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * Example: "Lembrete de Consulta com {{providerName}}"
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * Example: "Sua consulta está agendada para {{appointmentTime}} amanhã."
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * 
   * Examples: ["push", "email", "in-app", "sms"]
   * 
   * Note: While stored as a JSON string in the database, this is handled as an array
   * in the DTO for better developer experience and validation.
   */
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  @Transform(({ value }) => {
    // Handle both string and array inputs for channels
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return [value];
      }
    }
    return value;
  })
  channels: NotificationChannel[];

  /**
   * Optional journey context for the template.
   * If provided, associates the template with a specific journey (health, care, plan).
   */
  @IsString()
  @IsEnum(JOURNEY_IDS)
  @IsOptional()
  journey?: string;

  /**
   * Transforms the DTO to a format suitable for database storage.
   * Handles conversion of arrays to JSON strings as needed.
   * 
   * @returns Object ready for database insertion
   */
  toEntity(): Omit<INotificationTemplate, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      templateId: this.templateId,
      language: this.language,
      title: this.title,
      body: this.body,
      // Convert channels array to JSON string for database storage
      channels: JSON.stringify(this.channels),
    };
  }
}