/**
 * Interfaces for template formatting operations in the notification service.
 * These interfaces define the contract for replacing placeholder variables in templates
 * with actual data, supporting the formatTemplateWithData method in TemplatesService.
 */

import { NotificationTemplate } from '../entities/notification-template.entity';

/**
 * Represents the journey types in the AUSTA SuperApp.
 * Used for journey-specific template customization.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface for template formatting options.
 * Defines the structure for placeholder data objects used in template formatting.
 */
export interface ITemplateFormattingOptions {
  /**
   * The data object containing values to replace placeholders in the template.
   * Keys should match the placeholder names in the template (without {{ }}).
   */
  data: Record<string, string | number | boolean>;
  
  /**
   * Optional journey context for journey-specific template customization.
   * When provided, enables journey-specific formatting rules.
   */
  journeyContext?: JourneyType;
  
  /**
   * Optional flag to throw errors when placeholders are not found in the data object.
   * When true, missing placeholders will cause an error instead of being left unchanged.
   * Default is false (missing placeholders are left as-is).
   */
  strictMode?: boolean;
  
  /**
   * Optional custom placeholder pattern.
   * Defaults to {{variableName}} if not specified.
   */
  placeholderPattern?: RegExp;
}

/**
 * Interface for the formatted template result.
 * Specifies the return type for formatted template outputs.
 */
export interface IFormattedTemplate {
  /**
   * The original template ID.
   */
  id: string;
  
  /**
   * The template identifier.
   */
  templateId: string;
  
  /**
   * The formatted template title with placeholders replaced.
   */
  title: string;
  
  /**
   * The formatted template body with placeholders replaced.
   */
  body: string;
  
  /**
   * The language of the template.
   */
  language: string;
  
  /**
   * The channel for which this template is intended (email, sms, push, in-app).
   */
  channel: string;
  
  /**
   * Optional metadata for the template.
   */
  metadata?: Record<string, any>;
  
  /**
   * List of placeholders that were successfully replaced.
   */
  replacedPlaceholders: string[];
  
  /**
   * List of placeholders that were not found in the data object.
   * Empty if all placeholders were successfully replaced or if none were found.
   */
  missingPlaceholders: string[];
  
  /**
   * The journey context used for formatting, if any.
   */
  journeyContext?: JourneyType;
  
  /**
   * Flag indicating if the template was successfully formatted.
   */
  isFormatted: boolean;
}

/**
 * Interface for template formatting errors.
 * Provides structured error information for template formatting failures.
 */
export interface ITemplateFormattingError extends Error {
  /**
   * The template ID that caused the error.
   */
  templateId: string;
  
  /**
   * The specific placeholders that caused the error.
   */
  placeholders: string[];
  
  /**
   * The journey context in which the error occurred, if any.
   */
  journeyContext?: JourneyType;
  
  /**
   * Additional error details.
   */
  details: Record<string, any>;
}

/**
 * Type for a function that formats a template with data.
 * Defines the signature for template formatting functions.
 */
export type TemplateFormatter = (
  template: NotificationTemplate,
  options: ITemplateFormattingOptions
) => IFormattedTemplate | Promise<IFormattedTemplate>;