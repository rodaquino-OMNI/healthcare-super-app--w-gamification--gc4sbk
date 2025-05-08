import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NotificationChannel, NotificationStatus } from '@austa/interfaces/notification/types';

/**
 * Entity representing a notification in the AUSTA SuperApp.
 * Maps to the 'notifications' table in the database.
 */
@Entity('notifications')
export class Notification {
  /**
   * Unique identifier for the notification.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the user who should receive the notification.
   */
  @Column({ name: 'user_id' })
  userId: string;

  /**
   * Type of notification (e.g., 'appointment_reminder', 'achievement_unlocked').
   */
  @Column()
  type: string;

  /**
   * Title of the notification.
   */
  @Column()
  title: string;

  /**
   * Body content of the notification.
   */
  @Column()
  body: string;

  /**
   * Channel through which the notification was delivered.
   */
  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  /**
   * Current status of the notification.
   */
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.SENT,
  })
  status: NotificationStatus;

  /**
   * Optional data associated with the notification, stored as JSON.
   */
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  /**
   * Timestamp when the notification was read by the user.
   */
  @Column({ name: 'read_at', nullable: true })
  readAt?: Date;

  /**
   * Timestamp when the notification was created.
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /**
   * Timestamp when the notification was last updated.
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}