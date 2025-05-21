import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm'; // typeorm v0.3.20
import { INotificationPreference, IUser } from '@austa/interfaces/notification';

/**
 * Entity representing a user's notification preferences.
 * This stores the user's choices for receiving notifications across different channels.
 * Used by the notification service to determine how to deliver notifications to users.
 * 
 * Implements the INotificationPreference interface from @austa/interfaces to ensure
 * consistent type definitions across the application.
 */
@Entity()
export class NotificationPreference implements INotificationPreference {
  /**
   * Unique identifier for the notification preference record
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The user ID associated with these notification preferences
   * References the user in the authentication system
   * Maps to the IUser interface from @austa/interfaces
   */
  @Column()
  userId: string;

  /**
   * Whether push notifications are enabled for this user
   * Default is true as push notifications are a primary notification channel
   * 
   * When enabled, the notification service will attempt to deliver notifications
   * via push channels (mobile, web push) based on user's registered devices
   */
  @Column({ default: true })
  pushEnabled: boolean;

  /**
   * Whether email notifications are enabled for this user
   * Default is true for important communications
   * 
   * When enabled, the notification service will deliver notifications via email
   * If push delivery fails and this is enabled, email will be used as a fallback channel
   */
  @Column({ default: true })
  emailEnabled: boolean;

  /**
   * Whether SMS notifications are enabled for this user
   * Default is false due to potential costs associated with SMS
   * 
   * When enabled, the notification service will deliver notifications via SMS
   * Used as a final fallback channel for critical notifications when other channels fail
   * and the notification is marked as requiring guaranteed delivery
   */
  @Column({ default: false })
  smsEnabled: boolean;

  /**
   * Timestamp when the preference record was created
   * Automatically set by TypeORM
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the preference record was last updated
   * Automatically updated by TypeORM
   */
  @UpdateDateColumn()
  updatedAt: Date;
}