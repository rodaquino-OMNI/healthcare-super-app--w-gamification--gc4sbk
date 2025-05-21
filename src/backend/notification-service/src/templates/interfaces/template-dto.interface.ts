/**
 * Data Transfer Object interfaces for notification template operations.
 * These interfaces define the data structures for creating, updating, and querying
 * notification templates, ensuring consistent payload structures between controllers,
 * services, and clients.
 */

import { IBaseDto, ICreateDto, IUpdateDto, IQueryDto } from '@austa/interfaces';

/**
 * Interface for creating a new notification template.
 * Extends the base creation DTO interface from @austa/interfaces.
 */
export interface ICreateTemplateDto extends ICreateDto {
  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * @required
   */
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * @default 'pt-BR'
   */
  language: string;

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * @required
   */
  title: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * @required
   */
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * Examples: ["push", "email", "in-app", "sms"]
   * @default ["in-app"]
   */
  channels: string[];
}

/**
 * Interface for updating an existing notification template.
 * Extends the base update DTO interface from @austa/interfaces.
 * All fields are optional since updates may be partial.
 */
export interface IUpdateTemplateDto extends IUpdateDto {
  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * @optional
   */
  templateId?: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * @optional
   */
  language?: string;

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * @optional
   */
  title?: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * @optional
   */
  body?: string;

  /**
   * The channels through which this notification can be delivered.
   * Examples: ["push", "email", "in-app", "sms"]
   * @optional
   */
  channels?: string[];
}

/**
 * Interface for querying notification templates.
 * Extends the base query DTO interface from @austa/interfaces.
 * Provides filter criteria for finding templates.
 */
export interface IFindTemplateDto extends IQueryDto {
  /**
   * Filter templates by their unique identifier.
   * @optional
   */
  templateId?: string;

  /**
   * Filter templates by language code.
   * @optional
   */
  language?: string;

  /**
   * Filter templates by delivery channel.
   * @optional
   */
  channel?: string;

  /**
   * Filter templates by journey context (health, care, plan).
   * Assumes templates follow a naming convention that indicates journey association.
   * @optional
   */
  journey?: string;
}