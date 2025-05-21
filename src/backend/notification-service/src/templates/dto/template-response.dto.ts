import { Exclude, Expose, Transform } from 'class-transformer';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationChannel } from '@austa/interfaces/notification';

/**
 * Data Transfer Object for notification template responses.
 * Extends the raw database entity with additional computed properties
 * and serialization logic to ensure consistent output format in API responses.
 */
export class TemplateResponseDto {
  /**
   * The unique identifier of the template.
   */
  @Expose()
  id: string;

  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   */
  @Expose()
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   */
  @Expose()
  language: string;

  /**
   * The title of the notification with variable placeholders.
   */
  @Expose()
  title: string;

  /**
   * The body content of the notification with variable placeholders.
   */
  @Expose()
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * Transformed from JSONB string to proper array of NotificationChannel values.
   */
  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as NotificationChannel[];
      } catch (e) {
        return ['in-app'] as NotificationChannel[];
      }
    }
    return value as NotificationChannel[];
  })
  channels: NotificationChannel[];

  /**
   * The date and time when the template was created.
   * Formatted as ISO string for consistent API responses.
   */
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  createdAt: string;

  /**
   * The date and time when the template was last updated.
   * Formatted as ISO string for consistent API responses.
   */
  @Expose()
  @Transform(({ value }) => value instanceof Date ? value.toISOString() : value)
  updatedAt: string;

  /**
   * Creates a new TemplateResponseDto instance from a NotificationTemplate entity.
   * @param template The notification template entity from the database
   */
  constructor(template: Partial<NotificationTemplate>) {
    if (template) {
      this.id = template.id;
      this.templateId = template.templateId;
      this.language = template.language;
      this.title = template.title;
      this.body = template.body;
      this.channels = template.channels as unknown as NotificationChannel[];
      this.createdAt = template.createdAt?.toISOString() || new Date().toISOString();
      this.updatedAt = template.updatedAt?.toISOString() || new Date().toISOString();
    }
  }

  /**
   * Static factory method to create a TemplateResponseDto from a NotificationTemplate entity.
   * @param template The notification template entity from the database
   * @returns A new TemplateResponseDto instance
   */
  static fromEntity(template: NotificationTemplate): TemplateResponseDto {
    return new TemplateResponseDto(template);
  }

  /**
   * Static factory method to create an array of TemplateResponseDto from an array of NotificationTemplate entities.
   * @param templates Array of notification template entities from the database
   * @returns Array of TemplateResponseDto instances
   */
  static fromEntities(templates: NotificationTemplate[]): TemplateResponseDto[] {
    return templates.map(template => TemplateResponseDto.fromEntity(template));
  }
}