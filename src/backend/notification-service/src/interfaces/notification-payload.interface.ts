/**
 * Notification Payload Interfaces
 * 
 * This file defines the core interfaces for notification payloads throughout the notification service.
 * It integrates with @austa/interfaces for standardized schema definitions and establishes
 * the contract for data flowing between services, frontend clients, and notification channels.
 */

import { IBaseEntity } from '@austa/interfaces/common';
import { IHealthMetric } from '@austa/interfaces/journey/health';
import { IAppointment } from '@austa/interfaces/journey/care';
import { IClaim } from '@austa/interfaces/journey/plan';
import { IAchievement } from '@austa/interfaces/gamification';

/**
 * Notification channel types supported by the system
 */
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in-app'
}

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Notification status values
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

/**
 * Base interface for all notification payloads
 * Contains the minimum required fields for any notification
 */
export interface INotificationBase {
  /**
   * The ID of the user to receive the notification
   */
  userId: string;

  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   * Used for categorizing and routing notifications
   */
  type: string;

  /**
   * Title displayed in the notification
   */
  title: string;

  /**
   * Main content of the notification
   */
  body: string;

  /**
   * Language code for the notification content
   * Defaults to user's preferred language if not specified
   */
  language?: string;
}

/**
 * Extended notification payload interface with additional metadata
 * Used for sending notifications through the notification service
 */
export interface INotificationPayload extends INotificationBase {
  /**
   * Additional structured data for the notification
   * Can include journey-specific context, actions, or metadata
   */
  data?: Record<string, any> | IJourneySpecificPayload;

  /**
   * ID of the notification template to use (if applicable)
   * References a pre-defined template in the notification service
   */
  templateId?: string;

  /**
   * Priority level of the notification
   * Affects delivery urgency and visual prominence
   * @default NotificationPriority.MEDIUM
   */
  priority?: NotificationPriority;

  /**
   * Preferred channels for notification delivery
   * If not specified, will use user preferences
   */
  channels?: NotificationChannel[];

  /**
   * Timestamp when the notification should be delivered
   * If not specified, will be delivered immediately
   */
  scheduledFor?: Date | string;

  /**
   * Whether the notification should be persisted
   * @default true
   */
  persist?: boolean;

  /**
   * Metadata for tracking and analytics
   */
  metadata?: {
    /**
     * Source service or component that triggered the notification
     */
    source?: string;

    /**
     * Correlation ID for tracing the notification across services
     */
    correlationId?: string;

    /**
     * Additional tags for categorization and filtering
     */
    tags?: string[];
  };
}

/**
 * Union type for journey-specific notification payloads
 * Uses discriminated union pattern with 'journey' field
 */
export type IJourneySpecificPayload =
  | IHealthJourneyPayload
  | ICareJourneyPayload
  | IPlanJourneyPayload
  | IGamificationPayload;

/**
 * Health journey specific notification payload
 */
export interface IHealthJourneyPayload {
  /**
   * Discriminator field for the union type
   */
  journey: 'health';

  /**
   * Type of health notification
   */
  healthNotificationType: 'goal-achieved' | 'metric-alert' | 'device-sync' | 'insight';

  /**
   * Related health metric data (if applicable)
   */
  metric?: Partial<IHealthMetric>;

  /**
   * Goal ID (if related to a goal)
   */
  goalId?: string;

  /**
   * Device ID (if related to a device)
   */
  deviceId?: string;

  /**
   * Deep link to the relevant health section
   */
  deepLink?: string;

  /**
   * Additional health-specific data
   */
  healthData?: Record<string, any>;
}

/**
 * Care journey specific notification payload
 */
export interface ICareJourneyPayload {
  /**
   * Discriminator field for the union type
   */
  journey: 'care';

  /**
   * Type of care notification
   */
  careNotificationType: 'appointment-reminder' | 'medication-reminder' | 'telemedicine' | 'provider-message';

  /**
   * Related appointment data (if applicable)
   */
  appointment?: Partial<IAppointment>;

  /**
   * Medication ID (if related to medication)
   */
  medicationId?: string;

  /**
   * Provider ID (if related to a healthcare provider)
   */
  providerId?: string;

  /**
   * Deep link to the relevant care section
   */
  deepLink?: string;

  /**
   * Additional care-specific data
   */
  careData?: Record<string, any>;
}

/**
 * Plan journey specific notification payload
 */
export interface IPlanJourneyPayload {
  /**
   * Discriminator field for the union type
   */
  journey: 'plan';

  /**
   * Type of plan notification
   */
  planNotificationType: 'claim-status' | 'benefit-usage' | 'coverage-update' | 'payment';

  /**
   * Related claim data (if applicable)
   */
  claim?: Partial<IClaim>;

  /**
   * Benefit ID (if related to a benefit)
   */
  benefitId?: string;

  /**
   * Plan ID (if related to an insurance plan)
   */
  planId?: string;

  /**
   * Deep link to the relevant plan section
   */
  deepLink?: string;

  /**
   * Additional plan-specific data
   */
  planData?: Record<string, any>;
}

/**
 * Gamification specific notification payload
 */
export interface IGamificationPayload {
  /**
   * Discriminator field for the union type
   */
  journey: 'gamification';

  /**
   * Type of gamification notification
   */
  gamificationNotificationType: 'achievement-unlocked' | 'level-up' | 'quest-completed' | 'reward-available';

  /**
   * Related achievement data (if applicable)
   */
  achievement?: Partial<IAchievement>;

  /**
   * Quest ID (if related to a quest)
   */
  questId?: string;

  /**
   * Reward ID (if related to a reward)
   */
  rewardId?: string;

  /**
   * XP earned (if applicable)
   */
  xpEarned?: number;

  /**
   * Deep link to the relevant gamification section
   */
  deepLink?: string;

  /**
   * Additional gamification-specific data
   */
  gamificationData?: Record<string, any>;
}

/**
 * Channel-specific payload variations for different notification channels
 */

/**
 * Push notification specific payload fields
 */
export interface IPushNotificationPayload extends INotificationPayload {
  /**
   * Badge count to display on the app icon
   */
  badge?: number;

  /**
   * Sound to play when notification is received
   */
  sound?: string;

  /**
   * Category for iOS notification actions
   */
  category?: string;

  /**
   * Whether the notification is mutable (iOS)
   */
  mutableContent?: boolean;

  /**
   * FCM or APNS specific options
   */
  platformSpecific?: {
    /**
     * Android specific options
     */
    android?: {
      channelId?: string;
      smallIcon?: string;
      largeIcon?: string;
      color?: string;
      priority?: 'min' | 'low' | 'default' | 'high' | 'max';
    };

    /**
     * iOS specific options
     */
    ios?: {
      threadId?: string;
      interruptionLevel?: 'passive' | 'active' | 'time-sensitive' | 'critical';
      relevanceScore?: number;
      targetContentId?: string;
    };
  };
}

/**
 * Email notification specific payload fields
 */
export interface IEmailNotificationPayload extends INotificationPayload {
  /**
   * Email subject line
   */
  subject: string;

  /**
   * HTML content of the email
   */
  htmlBody?: string;

  /**
   * Plain text content of the email
   */
  textBody?: string;

  /**
   * Email sender address
   */
  from?: string;

  /**
   * Reply-to address
   */
  replyTo?: string;

  /**
   * CC recipients
   */
  cc?: string[];

  /**
   * BCC recipients
   */
  bcc?: string[];

  /**
   * Email attachments
   */
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * SMS notification specific payload fields
 */
export interface ISmsNotificationPayload extends INotificationPayload {
  /**
   * Phone number to send SMS to
   */
  phoneNumber: string;

  /**
   * Sender ID or phone number
   */
  sender?: string;

  /**
   * Whether to use shortcode
   */
  useShortcode?: boolean;

  /**
   * Maximum number of message parts
   */
  maxParts?: number;
}

/**
 * In-app notification specific payload fields
 */
export interface IInAppNotificationPayload extends INotificationPayload {
  /**
   * Whether the notification is dismissible
   */
  dismissible?: boolean;

  /**
   * Duration to show the notification (in milliseconds)
   */
  duration?: number;

  /**
   * Position to show the notification
   */
  position?: 'top' | 'bottom' | 'center';

  /**
   * Action buttons to display
   */
  actions?: Array<{
    label: string;
    action: string;
    data?: Record<string, any>;
    primary?: boolean;
  }>;

  /**
   * Icon to display with the notification
   */
  icon?: string;

  /**
   * Image to display with the notification
   */
  image?: string;
}

/**
 * Response interface for notification operations
 */
export interface INotificationResponse extends IBaseEntity {
  /**
   * ID of the notification
   */
  id: string | number;

  /**
   * User ID the notification was sent to
   */
  userId: string;

  /**
   * Notification type
   */
  type: string;

  /**
   * Notification title
   */
  title: string;

  /**
   * Notification body
   */
  body: string;

  /**
   * Channel the notification was sent through
   */
  channel: NotificationChannel;

  /**
   * Current status of the notification
   */
  status: NotificationStatus;

  /**
   * Timestamp when the notification was created
   */
  createdAt: Date;

  /**
   * Timestamp when the notification was last updated
   */
  updatedAt: Date;

  /**
   * Timestamp when the notification was read (if applicable)
   */
  readAt?: Date;

  /**
   * Delivery attempts made
   */
  deliveryAttempts?: number;

  /**
   * Error message if delivery failed
   */
  errorMessage?: string;

  /**
   * External ID from the delivery provider (if applicable)
   */
  externalId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}