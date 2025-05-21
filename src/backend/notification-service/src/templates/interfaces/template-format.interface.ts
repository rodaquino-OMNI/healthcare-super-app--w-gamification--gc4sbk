/**
 * Interfaces for template formatting operations in the notification service.
 * These interfaces define the contract for replacing placeholder variables in templates
 * with actual data, supporting journey-specific customization and enhanced error handling.
 */

import { NotificationTemplate } from '../entities/notification-template.entity';

/**
 * Defines the options for template formatting operations.
 * Provides type-safe structure for placeholder data and formatting preferences.
 */
export interface ITemplateFormattingOptions {
  /**
   * Data object containing values to replace placeholders in the template.
   * Keys should match the placeholder names in the template (without {{ }} delimiters).
   * Example: { userName: 'João', appointmentTime: '14:00' }
   */
  data: Record<string, any>;

  /**
   * Optional journey context for journey-specific template customization.
   * Valid values are 'health', 'care', 'plan' or undefined.
   */
  journeyContext?: 'health' | 'care' | 'plan';

  /**
   * Optional language preference for the template.
   * If provided, will be used to select the appropriate language version of the template.
   * Format should follow ISO 639-1 with optional region (e.g., 'pt-BR', 'en-US').
   */
  language?: string;

  /**
   * Optional flag to throw an error if a placeholder is not found in the data object.
   * If true, the formatting operation will throw an error when a placeholder cannot be replaced.
   * If false (default), missing placeholders will be left unchanged in the output.
   */
  strictMode?: boolean;

  /**
   * Optional custom placeholder pattern to use instead of the default {{variableName}} pattern.
   * Should be a regular expression with a capturing group for the variable name.
   * Example: /\{\{(\w+)\}\}/g for the default {{variableName}} pattern.
   */
  placeholderPattern?: RegExp;
}

/**
 * Represents the result of a template formatting operation.
 * Provides a type-safe structure for the formatted template output.
 */
export interface IFormattedTemplate {
  /**
   * The original template ID that was formatted.
   */
  templateId: string;

  /**
   * The formatted title with placeholders replaced by actual data.
   */
  title: string;

  /**
   * The formatted body with placeholders replaced by actual data.
   */
  body: string;

  /**
   * The language of the formatted template.
   */
  language: string;

  /**
   * The channels through which this notification can be delivered.
   */
  channels: string[];

  /**
   * The journey context used for formatting, if any.
   */
  journeyContext?: 'health' | 'care' | 'plan';

  /**
   * Metadata about the formatting operation.
   */
  metadata: {
    /**
     * Timestamp when the template was formatted.
     */
    formattedAt: Date;

    /**
     * List of placeholder variables that were successfully replaced.
     */
    replacedVariables: string[];

    /**
     * List of placeholder variables that were not found in the data object.
     * Only populated if strictMode is false and placeholders were left unchanged.
     */
    missingVariables?: string[];
  };
}

/**
 * Interface for the template formatting service.
 * Defines the contract for services that perform template formatting operations.
 */
export interface ITemplateFormatter {
  /**
   * Formats a template by replacing placeholders with actual data.
   * 
   * @param template The notification template to format
   * @param options The formatting options including data for placeholder replacement
   * @returns A formatted template with placeholders replaced by actual data
   * @throws Error if strictMode is true and a placeholder cannot be replaced
   */
  formatTemplate(template: NotificationTemplate, options: ITemplateFormattingOptions): IFormattedTemplate;
}