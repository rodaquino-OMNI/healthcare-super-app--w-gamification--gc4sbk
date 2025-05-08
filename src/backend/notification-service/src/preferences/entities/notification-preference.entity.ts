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
 * The delivery channel fallback logic uses these preferences to determine alternative
 * channels when the primary channel is unavailable or fails to deliver.
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
   * @type {IUser['id']}
   */
  @Column()
  userId: string;

  /**
   * Whether push notifications are enabled for this user
   * Default is true as push notifications are a primary notification channel
   * 
   * When push notifications are disabled, the fallback logic will attempt to deliver
   * through email if emailEnabled is true, or through SMS if smsEnabled is true.
   */
  @Column({ default: true })
  pushEnabled: boolean;

  /**
   * Whether email notifications are enabled for this user
   * Default is true for important communications
   * 
   * Email serves as the first fallback channel when push notifications are disabled or fail.
   * Critical notifications may still be sent via email even if pushEnabled is true,
   * based on notification priority and delivery requirements.
   */
  @Column({ default: true })
  emailEnabled: boolean;

  /**
   * Whether SMS notifications are enabled for this user
   * Default is false due to potential costs associated with SMS
   * 
   * SMS serves as the last fallback channel when both push and email channels fail.
   * For critical notifications (e.g., appointment reminders, medication alerts),
   * SMS may be used regardless of preference if other channels fail to deliver.
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