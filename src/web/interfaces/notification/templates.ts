/**
 * Notification Templates Interfaces
 * 
 * This file defines the interfaces for the notification templating system in the AUSTA SuperApp.
 * These interfaces enable consistent notification formatting and localization across all three
 * journeys (Health, Care, Plan) while maintaining type safety for placeholder substitution.
 */

/**
 * Enum representing the three main journeys in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',    // "Minha Saúde" journey
  CARE = 'care',        // "Cuidar-me Agora" journey
  PLAN = 'plan',        // "Meu Plano & Benefícios" journey
  ALL = 'all'           // Cross-journey context
}

/**
 * Supported languages for notification templates
 */
export enum NotificationLanguage {
  EN_US = 'en-US',
  PT_BR = 'pt-BR',
  ES_ES = 'es-ES',
}

/**
 * Template placeholder types to ensure type safety when substituting values
 */
export enum TemplatePlaceholderType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage',
  URL = 'url',
  HTML = 'html',
}

/**
 * Definition of a template placeholder with type information
 */
export interface TemplatePlaceholder {
  /** Unique identifier for the placeholder (e.g., "{{userName}}") */
  key: string;
  
  /** Data type of the placeholder for validation */
  type: TemplatePlaceholderType;
  
  /** Whether this placeholder is required */
  required: boolean;
  
  /** Optional default value if not provided */
  defaultValue?: string | number | Date;
  
  /** Optional description of the placeholder for documentation */
  description?: string;
}

/**
 * Template content for a specific language
 */
export interface TemplateContent {
  /** The language code for this content */
  language: NotificationLanguage;
  
  /** The subject line for email or title for push notifications */
  subject: string;
  
  /** The main content of the notification with placeholders */
  body: string;
  
  /** Optional short version for SMS or preview text */
  shortBody?: string;
  
  /** Optional HTML version for email notifications */
  htmlBody?: string;
}

/**
 * Journey-specific context for templates
 */
export interface JourneyTemplateContext {
  /** The journey this template belongs to */
  journeyType: JourneyType;
  
  /** Journey-specific styling information */
  styling?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    bannerUrl?: string;
  };
  
  /** Journey-specific deep links */
  deepLinks?: {
    /** Base URL for deep links */
    baseUrl: string;
    /** Additional path parameters */
    pathParams?: Record<string, string>;
  };
}

/**
 * Notification template interface for defining reusable notification structures
 */
export interface NotificationTemplate {
  /** Unique identifier for the template */
  id: string;
  
  /** Template name for administrative purposes */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Template version for tracking changes */
  version: string;
  
  /** Template content in different languages */
  content: TemplateContent[];
  
  /** Placeholders used in this template */
  placeholders: TemplatePlaceholder[];
  
  /** Journey context for this template */
  journeyContext?: JourneyTemplateContext;
  
  /** When this template was created */
  createdAt: Date;
  
  /** When this template was last updated */
  updatedAt: Date;
  
  /** Whether this template is active */
  isActive: boolean;
}

/**
 * Type for template placeholder values when sending a notification
 */
export type TemplatePlaceholderValues = Record<string, string | number | Date>;

/**
 * Interface for rendering a template with specific values
 */
export interface TemplateRenderRequest {
  /** Template ID to render */
  templateId: string;
  
  /** Preferred language for the notification */
  preferredLanguage: NotificationLanguage;
  
  /** Fallback language if preferred is not available */
  fallbackLanguage?: NotificationLanguage;
  
  /** Values to substitute in the template placeholders */
  placeholderValues: TemplatePlaceholderValues;
  
  /** Optional journey-specific context overrides */
  journeyContextOverrides?: Partial<JourneyTemplateContext>;
}

/**
 * Result of rendering a template
 */
export interface RenderedTemplate {
  /** The rendered subject/title */
  subject: string;
  
  /** The rendered body text */
  body: string;
  
  /** The rendered short body (if available) */
  shortBody?: string;
  
  /** The rendered HTML body (if available) */
  htmlBody?: string;
  
  /** The language that was used for rendering */
  language: NotificationLanguage;
  
  /** Journey context used in rendering */
  journeyContext?: JourneyTemplateContext;
}

/**
 * Interface for creating a new notification template
 */
export interface CreateNotificationTemplateRequest {
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Initial version */
  version: string;
  
  /** Template content in different languages */
  content: TemplateContent[];
  
  /** Placeholders used in this template */
  placeholders: TemplatePlaceholder[];
  
  /** Optional journey context */
  journeyContext?: JourneyTemplateContext;
}

/**
 * Interface for updating an existing notification template
 */
export interface UpdateNotificationTemplateRequest {
  /** Template ID to update */
  id: string;
  
  /** New template name (optional) */
  name?: string;
  
  /** New template description (optional) */
  description?: string;
  
  /** New version (required when updating content or placeholders) */
  version?: string;
  
  /** Updated template content (optional) */
  content?: TemplateContent[];
  
  /** Updated placeholders (optional) */
  placeholders?: TemplatePlaceholder[];
  
  /** Updated journey context (optional) */
  journeyContext?: JourneyTemplateContext;
  
  /** Whether to activate or deactivate the template */
  isActive?: boolean;
}