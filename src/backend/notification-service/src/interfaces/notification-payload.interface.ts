import { IBaseNotification, INotificationMetadata } from '@austa/interfaces/common';
import { IHealthMetric, IHealthGoal } from '@austa/interfaces/journey/health';
import { IAppointment, IMedication } from '@austa/interfaces/journey/care';
import { IClaim, IBenefit } from '@austa/interfaces/journey/plan';
import { IAchievement, IQuest, IReward } from '@austa/interfaces/gamification';

/**
 * Base notification interface that extends the common interface from @austa/interfaces
 * Contains the core properties required for all notifications
 */
export interface INotificationBase extends IBaseNotification {
  /**
   * Unique identifier for the user receiving the notification
   */
  userId: string;

  /**
   * Title displayed in the notification
   */
  title: string;

  /**
   * Main content of the notification
   */
  body: string;

  /**
   * Timestamp when the notification was created
   */
  timestamp: string;

  /**
   * Optional metadata for the notification
   */
  metadata?: INotificationMetadata;
}

/**
 * Notification payload interface used for sending notifications
 * Extends INotificationBase with additional properties
 */
export interface INotificationPayload extends INotificationBase {
  /**
   * Type of notification (e.g., 'achievement', 'appointment', 'reminder')
   * Used for categorizing and routing notifications
   */
  type: NotificationType;

  /**
   * Additional structured data for the notification
   * Can include journey-specific context, actions, or metadata
   */
  data?: IJourneySpecificPayload;

  /**
   * ID of the notification template to use (if applicable)
   * References a pre-defined template in the notification service
   */
  templateId?: string;

  /**
   * Language code for the notification content
   * Defaults to user's preferred language if not specified
   */
  language?: string;

  /**
   * Preferred delivery channels for the notification
   * If not specified, will use user preferences
   */
  channels?: NotificationChannel[];
}

/**
 * Notification response interface for notification delivery results
 * Contains information about the delivery status and channels
 */
export interface INotificationResponse extends INotificationBase {
  /**
   * Unique identifier for the notification
   */
  id: string | number;

  /**
   * Current status of the notification
   */
  status: NotificationStatus;

  /**
   * Channels through which the notification was delivered
   */
  deliveredChannels: NotificationChannel[];

  /**
   * Timestamp when the notification was read (if applicable)
   */
  readAt?: string;

  /**
   * Error information if notification delivery failed
   */
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Union type for all possible notification types
 */
export type NotificationType =
  | HealthNotificationType
  | CareNotificationType
  | PlanNotificationType
  | GamificationNotificationType
  | SystemNotificationType;

/**
 * Health journey notification types
 */
export type HealthNotificationType =
  | 'health.metric.update'
  | 'health.goal.achieved'
  | 'health.goal.progress'
  | 'health.device.connected'
  | 'health.device.sync'
  | 'health.insight.generated';

/**
 * Care journey notification types
 */
export type CareNotificationType =
  | 'care.appointment.reminder'
  | 'care.appointment.confirmed'
  | 'care.appointment.cancelled'
  | 'care.medication.reminder'
  | 'care.medication.refill'
  | 'care.telemedicine.ready'
  | 'care.provider.message';

/**
 * Plan journey notification types
 */
export type PlanNotificationType =
  | 'plan.claim.submitted'
  | 'plan.claim.updated'
  | 'plan.claim.approved'
  | 'plan.claim.rejected'
  | 'plan.benefit.expiring'
  | 'plan.coverage.updated'
  | 'plan.document.available';

/**
 * Gamification notification types
 */
export type GamificationNotificationType =
  | 'gamification.achievement.unlocked'
  | 'gamification.quest.available'
  | 'gamification.quest.completed'
  | 'gamification.level.up'
  | 'gamification.reward.earned'
  | 'gamification.leaderboard.position';

/**
 * System notification types
 */
export type SystemNotificationType =
  | 'system.maintenance'
  | 'system.update'
  | 'system.security'
  | 'system.account';

/**
 * Notification delivery channels
 */
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in-app';

/**
 * Notification status types
 */
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Discriminated union for journey-specific notification payloads
 * Uses the 'journey' property as the discriminator
 */
export type IJourneySpecificPayload =
  | IHealthJourneyPayload
  | ICareJourneyPayload
  | IPlanJourneyPayload
  | IGamificationJourneyPayload
  | ISystemJourneyPayload;

/**
 * Base interface for all journey-specific payloads
 */
export interface IJourneyPayloadBase {
  /**
   * Journey identifier - used as discriminator for the union type
   */
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'system';

  /**
   * Action to perform when notification is tapped/clicked
   */
  action?: {
    /**
     * Type of action (e.g., 'navigate', 'open-url', 'custom')
     */
    type: 'navigate' | 'open-url' | 'custom';

    /**
     * Target for the action (e.g., route name, URL)
     */
    target: string;

    /**
     * Additional parameters for the action
     */
    params?: Record<string, any>;
  };
}

/**
 * Health journey specific notification payload
 */
export interface IHealthJourneyPayload extends IJourneyPayloadBase {
  journey: 'health';
  type: HealthNotificationType;
  metric?: IHealthMetric;
  goal?: IHealthGoal;
  deviceId?: string;
  insightId?: string;
}

/**
 * Care journey specific notification payload
 */
export interface ICareJourneyPayload extends IJourneyPayloadBase {
  journey: 'care';
  type: CareNotificationType;
  appointment?: IAppointment;
  medication?: IMedication;
  providerId?: string;
  messageId?: string;
  sessionId?: string;
}

/**
 * Plan journey specific notification payload
 */
export interface IPlanJourneyPayload extends IJourneyPayloadBase {
  journey: 'plan';
  type: PlanNotificationType;
  claim?: IClaim;
  benefit?: IBenefit;
  documentId?: string;
  coverageId?: string;
}

/**
 * Gamification journey specific notification payload
 */
export interface IGamificationJourneyPayload extends IJourneyPayloadBase {
  journey: 'gamification';
  type: GamificationNotificationType;
  achievement?: IAchievement;
  quest?: IQuest;
  reward?: IReward;
  level?: number;
  points?: number;
  position?: number;
}

/**
 * System notification payload
 */
export interface ISystemJourneyPayload extends IJourneyPayloadBase {
  journey: 'system';
  type: SystemNotificationType;
  severity?: 'info' | 'warning' | 'critical';
  expiresAt?: string;
}

/**
 * Channel-specific payload variations
 */

/**
 * Push notification specific payload
 */
export interface IPushNotificationPayload extends INotificationPayload {
  /**
   * Badge count for mobile app icon
   */
  badge?: number;

  /**
   * Sound to play for the notification
   */
  sound?: string;

  /**
   * Category for iOS notifications
   */
  category?: string;

  /**
   * Channel ID for Android notifications
   */
  channelId?: string;

  /**
   * Priority level for the notification
   */
  priority?: 'default' | 'high' | 'max';
}

/**
 * Email notification specific payload
 */
export interface IEmailNotificationPayload extends INotificationPayload {
  /**
   * Email subject line
   */
  subject: string;

  /**
   * HTML content for the email
   */
  htmlBody?: string;

  /**
   * Plain text content for the email
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
   * Email attachments
   */
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

/**
 * SMS notification specific payload
 */
export interface ISmsNotificationPayload extends INotificationPayload {
  /**
   * Phone number to send the SMS to
   */
  phoneNumber: string;

  /**
   * Sender ID or phone number
   */
  sender?: string;

  /**
   * Whether to request delivery receipt
   */
  requestDeliveryReceipt?: boolean;
}

/**
 * In-app notification specific payload
 */
export interface IInAppNotificationPayload extends INotificationPayload {
  /**
   * Whether the notification is persistent
   */
  persistent?: boolean;

  /**
   * Duration to show the notification (in milliseconds)
   */
  duration?: number;

  /**
   * Position to show the notification
   */
  position?: 'top' | 'bottom';

  /**
   * Whether to show the notification as a toast
   */
  isToast?: boolean;

  /**
   * Whether to show the notification as a modal
   */
  isModal?: boolean;
}