import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationTemplateInterface } from '@austa/interfaces/notification';

/**
 * Data Transfer Object for notification template responses.
 * Standardizes the format of template data returned by API endpoints,
 * ensuring consistent field naming and proper serialization of complex fields.
 * 
 * Extends the raw database entity with additional computed properties and
 * transforms database column names to camelCase for API consistency.
 */
export class TemplateResponseDto implements NotificationTemplateInterface {
  /**
   * Unique identifier for the template.
   */
  id: string;

  /**
   * Template identifier used for referencing in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked'
   */
  templateId: string;

  /**
   * Language code of the template (e.g., 'pt-BR', 'en-US').
   */
  language: string;

  /**
   * The title of the notification with placeholders.
   */
  title: string;

  /**
   * The body content of the notification with placeholders.
   */
  body: string;

  /**
   * Available delivery channels for this template.
   * Examples: ['push', 'email', 'in-app', 'sms']
   */
  channels: string[];

  /**
   * Creation timestamp.
   */
  createdAt: Date;

  /**
   * Last update timestamp.
   */
  updatedAt: Date;

  /**
   * Transforms a NotificationTemplate entity into a TemplateResponseDto.
   * Handles proper serialization of JSONB fields and ensures consistent
   * field naming for API responses.
   * 
   * @param template The notification template entity from the database
   * @returns A properly formatted TemplateResponseDto for API responses
   */
  static fromEntity(template: NotificationTemplate): TemplateResponseDto {
    if (!template) {
      return null;
    }

    const response = new TemplateResponseDto();
    response.id = template.id;
    response.templateId = template.templateId;
    response.language = template.language;
    response.title = template.title;
    response.body = template.body;
    
    // Parse the channels JSON string to an array
    // The entity stores channels as a JSONB string in PostgreSQL
    try {
      response.channels = typeof template.channels === 'string' 
        ? JSON.parse(template.channels) 
        : template.channels;
    } catch (error) {
      // Fallback to default channel if parsing fails
      response.channels = ['in-app'];
    }
    
    response.createdAt = template.createdAt;
    response.updatedAt = template.updatedAt;

    return response;
  }

  /**
   * Transforms an array of NotificationTemplate entities into TemplateResponseDto objects.
   * 
   * @param templates Array of notification template entities
   * @returns Array of properly formatted TemplateResponseDto objects
   */
  static fromEntities(templates: NotificationTemplate[]): TemplateResponseDto[] {
    if (!templates || !Array.isArray(templates)) {
      return [];
    }

    return templates.map(template => this.fromEntity(template));
  }

  /**
   * Creates a simplified version of the template response with only essential fields.
   * Useful for list views or summary displays.
   * 
   * @returns A simplified template object with core fields
   */
  toSummary(): Partial<TemplateResponseDto> {
    return {
      id: this.id,
      templateId: this.templateId,
      language: this.language,
      title: this.title,
      channels: this.channels
    };
  }
}