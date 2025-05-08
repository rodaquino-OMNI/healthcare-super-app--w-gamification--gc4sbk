/**
 * Data Transfer Object interfaces for notification template operations.
 * These interfaces define the data structures for creating, updating, and querying
 * notification templates, ensuring consistent payload structures between controllers,
 * services, and clients.
 */

import { IBaseDto, ICreateDto, IUpdateDto, IFindDto } from '@austa/interfaces';

/**
 * Interface for creating a new notification template.
 * Extends the base create DTO interface from @austa/interfaces.
 * 
 * @property templateId - A unique identifier for the template that can be referenced in code
 * @property language - The language code of the template (ISO 639-1 with optional region)
 * @property title - The title of the notification with optional placeholders {{variableName}}
 * @property body - The body content of the notification with optional placeholders {{variableName}}
 * @property channels - The channels through which this notification can be delivered
 */
export interface ICreateTemplateDto extends ICreateDto {
  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * Used when sending notifications to reference the appropriate template.
   * 
   * @required
   * @example 'appointment-reminder'
   */
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * Used for internationalization of notification content.
   * 
   * @default 'pt-BR'
   * @example 'pt-BR'
   */
  language?: string;

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * @required
   * @example 'Lembrete de Consulta com {{providerName}}'
   */
  title: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * @required
   * @example 'Sua consulta está agendada para {{appointmentTime}} amanhã.'
   */
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * Examples: ["push", "email", "in-app", "sms"]
   * 
   * @default ["in-app"]
   * @example ["push", "email"]
   */
  channels?: string[];
}

/**
 * Interface for updating an existing notification template.
 * Extends the base update DTO interface from @austa/interfaces.
 * All properties are optional since updates may only change some fields.
 * 
 * @property templateId - A unique identifier for the template that can be referenced in code
 * @property language - The language code of the template (ISO 639-1 with optional region)
 * @property title - The title of the notification with optional placeholders {{variableName}}
 * @property body - The body content of the notification with optional placeholders {{variableName}}
 * @property channels - The channels through which this notification can be delivered
 */
export interface IUpdateTemplateDto extends IUpdateDto {
  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * Used when sending notifications to reference the appropriate template.
   * 
   * @example 'appointment-reminder'
   */
  templateId?: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * Used for internationalization of notification content.
   * 
   * @example 'pt-BR'
   */
  language?: string;

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * @example 'Lembrete de Consulta com {{providerName}}'
   */
  title?: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * @example 'Sua consulta está agendada para {{appointmentTime}} amanhã.'
   */
  body?: string;

  /**
   * The channels through which this notification can be delivered.
   * Examples: ["push", "email", "in-app", "sms"]
   * 
   * @example ["push", "email"]
   */
  channels?: string[];
}

/**
 * Interface for finding notification templates.
 * Extends the base find DTO interface from @austa/interfaces.
 * All properties are optional to allow flexible querying.
 * 
 * @property id - The primary key of the notification template
 * @property templateId - A unique identifier for the template that can be referenced in code
 * @property language - The language code of the template (ISO 639-1 with optional region)
 * @property channels - The channels through which this notification can be delivered
 */
export interface IFindTemplateDto extends IFindDto {
  /**
   * The primary key of the notification template.
   * 
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  id?: string;

  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * Used when sending notifications to reference the appropriate template.
   * 
   * @example 'appointment-reminder'
   */
  templateId?: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * Used for internationalization of notification content.
   * 
   * @example 'pt-BR'
   */
  language?: string;

  /**
   * The channels through which this notification can be delivered.
   * Examples: ["push", "email", "in-app", "sms"]
   * 
   * @example ["push", "email"]
   */
  channels?: string[];

  /**
   * Optional journey context to filter templates by journey association.
   * Examples: 'health', 'care', 'plan'
   * 
   * @example 'health'
   */
  journey?: string;
}