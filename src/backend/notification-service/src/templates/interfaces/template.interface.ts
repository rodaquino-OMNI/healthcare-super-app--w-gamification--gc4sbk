import { IBaseNotification } from '@austa/interfaces/common';

/**
 * Notification delivery channels
 * Defines the possible channels through which notifications can be delivered
 */
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in-app';

/**
 * Interface for notification templates
 * Represents the core template entity structure used throughout the notification service
 * Extends the base notification interface from @austa/interfaces for standardization
 */
export interface INotificationTemplate extends IBaseNotification {
  /**
   * The primary key of the notification template
   */
  id: string;

  /**
   * A unique identifier for the template that can be referenced in code
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * Used when sending notifications to reference the appropriate template
   */
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * Used for internationalization of notification content
   */
  language: string;

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * Example: "Lembrete de Consulta com {{providerName}}"
   */
  title: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * Example: "Sua consulta está agendada para {{appointmentTime}} amanhã."
   */
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * 
   * Examples: ["push", "email", "in-app", "sms"]
   */
  channels: NotificationChannel[];

  /**
   * The date and time when the template was created
   */
  createdAt: Date;

  /**
   * The date and time when the template was last updated
   */
  updatedAt: Date;
}