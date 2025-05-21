import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'; // typeorm@0.3.17

import { NotificationChannel } from '@austa/interfaces/notification/types';
import { NotificationTemplate as INotificationTemplate } from '@austa/interfaces/notification/templates';

/**
 * Represents a notification template entity in the database.
 * Templates define the structure and content of notifications sent to users
 * across different journeys and channels.
 *
 * This entity implements the INotificationTemplate interface from @austa/interfaces
 * to ensure consistency with the journey-centered architecture patterns.
 */
@Entity('notification_templates')
export class NotificationTemplate implements Partial<INotificationTemplate> {
  /**
   * The primary key of the notification template.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * A unique identifier for the template that can be referenced in code.
   * Examples: 'appointment-reminder', 'achievement-unlocked', 'medication-reminder'
   * Used when sending notifications to reference the appropriate template.
   */
  @Column({ name: 'template_id', unique: true })
  templateId: string;

  /**
   * The language code of the template following ISO 639-1 with optional region.
   * Examples: 'pt-BR' (Brazilian Portuguese), 'en-US' (English)
   * Used for internationalization of notification content.
   */
  @Column({ length: 10, default: 'pt-BR' })
  language: string;

  /**
   * The title of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * Example: "Lembrete de Consulta com {{providerName}}"
   */
  @Column({ type: 'text' })
  title: string;

  /**
   * The body content of the notification. Can include variable placeholders
   * in the format {{variableName}} that will be replaced with actual values
   * when the notification is sent.
   * 
   * Example: "Sua consulta está agendada para {{appointmentTime}} amanhã."
   */
  @Column({ type: 'text' })
  body: string;

  /**
   * The channels through which this notification can be delivered.
   * Stored as a JSON array of NotificationChannel enum values in the database.
   * 
   * Examples: ["push", "email", "in-app", "sms"]
   * 
   * Note: While typed as NotificationChannel[] in TypeScript, this is stored as JSONB in PostgreSQL.
   * Application code handles serialization/deserialization appropriately.
   */
  @Column({ type: 'jsonb', default: () => `'["${NotificationChannel.IN_APP}"]'` })
  channels: NotificationChannel[];

  /**
   * The date and time when the template was created.
   * Automatically set by TypeORM.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * The date and time when the template was last updated.
   * Automatically updated by TypeORM.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Transforms the channels field from database format (string) to TypeScript format (NotificationChannel[])
   * This is called automatically by TypeORM when loading entities from the database.
   */
  constructor(partial?: Partial<NotificationTemplate>) {
    if (partial) {
      Object.assign(this, partial);
      
      // Handle channels conversion if it's a string (from database)
      if (typeof this.channels === 'string') {
        try {
          const channelsArray = JSON.parse(this.channels);
          this.channels = channelsArray as NotificationChannel[];
        } catch (error) {
          // Default to in-app notifications if parsing fails
          this.channels = [NotificationChannel.IN_APP];
        }
      }
    }
  }
}