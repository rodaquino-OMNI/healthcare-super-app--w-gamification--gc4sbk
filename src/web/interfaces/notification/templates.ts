/**
 * Notification Templates Interfaces
 * 
 * This file defines the interfaces for the notification templating system in the AUSTA SuperApp.
 * These interfaces enable consistent notification formatting and localization across all three
 * journeys (Health, Care, Plan) while maintaining type safety for placeholder substitution.
 */

import { NotificationType, NotificationChannel } from './types';

/**
 * Supported languages for notification templates
 */
export type SupportedLanguage = 'en' | 'pt-BR' | 'es';

/**
 * Journey context for notification templates
 */
export type JourneyContext = 'health' | 'care' | 'plan' | 'global';

/**
 * Defines the structure for a template placeholder
 * Used to ensure type safety when substituting values in templates
 */
export interface TemplatePlaceholder {
  /** Unique identifier for the placeholder */
  key: string;
  /** Description of what the placeholder represents */
  description: string;
  /** Example value for documentation and testing */
  example: string;
  /** Optional default value if none is provided */
  defaultValue?: string;
  /** Whether this placeholder is required */
  required: boolean;
}

/**
 * Defines the content structure for a notification template
 * with support for different notification channels
 */
export interface TemplateContent {
  /** Subject line for email and push notifications */
  subject?: string;
  /** Main content body */
  body: string;
  /** Short version for push notifications */
  shortBody?: string;
  /** Call to action text */
  actionText?: string;
  /** Deep link or URL for the action */
  actionLink?: string;
}

/**
 * Defines a localized template content for a specific language
 */
export interface LocalizedTemplateContent extends TemplateContent {
  /** The language code for this content */
  language: SupportedLanguage;
}

/**
 * Defines channel-specific template configurations
 */
export interface ChannelTemplateConfig {
  /** Whether this template is enabled for this channel */
  enabled: boolean;
  /** Channel-specific template overrides */
  content?: Partial<TemplateContent>;
}

/**
 * Maps notification channels to their specific template configurations
 */
export interface ChannelTemplateMap {
  [NotificationChannel.InApp]?: ChannelTemplateConfig;
  [NotificationChannel.Push]?: ChannelTemplateConfig;
  [NotificationChannel.Email]?: ChannelTemplateConfig;
  [NotificationChannel.SMS]?: ChannelTemplateConfig;
}

/**
 * Defines a notification template with versioning, localization, and journey context
 */
export interface NotificationTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Human-readable name for the template */
  name: string;
  /** Template version for tracking changes */
  version: string;
  /** When this template was created */
  createdAt: Date;
  /** When this template was last updated */
  updatedAt: Date;
  /** The notification type this template is for */
  type: NotificationType;
  /** The journey context this template belongs to */
  journeyContext: JourneyContext;
  /** Default language for this template */
  defaultLanguage: SupportedLanguage;
  /** Localized content for different languages */
  localizedContent: LocalizedTemplateContent[];
  /** Channel-specific configurations */
  channelConfig: ChannelTemplateMap;
  /** Placeholders that can be used in this template */
  placeholders: TemplatePlaceholder[];
  /** Whether this template is active */
  active: boolean;
  /** Optional description of the template's purpose */
  description?: string;
}

/**
 * Input for creating a new notification template
 */
export type CreateNotificationTemplateInput = Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input for updating an existing notification template
 */
export type UpdateNotificationTemplateInput = Partial<Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Parameters for rendering a notification template with placeholder values
 */
export interface RenderTemplateParams {
  /** Template ID to render */
  templateId: string;
  /** Language to render the template in */
  language?: SupportedLanguage;
  /** Values to substitute for placeholders */
  placeholderValues: Record<string, string | number | boolean | null>;
  /** Notification channel to render for */
  channel?: NotificationChannel;
}

/**
 * Result of rendering a notification template
 */
export interface RenderedTemplate {
  /** The rendered template content */
  content: TemplateContent;
  /** The template that was rendered */
  template: NotificationTemplate;
  /** The language the template was rendered in */
  language: SupportedLanguage;
  /** Any placeholders that were missing values */
  missingPlaceholders?: string[];
}