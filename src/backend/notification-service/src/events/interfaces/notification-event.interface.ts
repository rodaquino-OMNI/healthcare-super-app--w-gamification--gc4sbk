import { IBaseEvent } from '@austa/interfaces/events/base-event.interface';
import { NotificationChannel, NotificationPriority, NotificationStatus, NotificationType } from '@austa/interfaces/notification/types';
import { JourneyType } from '@austa/interfaces/common/journey.types';

/**
 * Interface for notification event payload
 * Contains all data required to create and deliver a notification
 */
export interface INotificationPayload {
  /**
   * Unique identifier for the notification
   */
  id?: string;

  /**
   * User ID of the recipient
   */
  userId: string;

  /**
   * Title of the notification
   */
  title: string;

  /**
   * Body content of the notification
   */
  body: string;

  /**
   * Type of notification
   */
  type: NotificationType;

  /**
   * Priority level of the notification
   */
  priority: NotificationPriority;

  /**
   * Channels to deliver the notification through
   */
  channels: NotificationChannel[];

  /**
   * Current status of the notification
   */
  status?: NotificationStatus;

  /**
   * Optional data specific to the notification type
   */
  data?: Record<string, any>;

  /**
   * Optional template ID to use for formatting
   */
  templateId?: string;

  /**
   * Optional template variables for substitution
   */
  templateVariables?: Record<string, any>;

  /**
   * Optional deep link URL for the notification
   */
  deepLink?: string;

  /**
   * Optional expiration date for the notification
   */
  expiresAt?: Date;

  /**
   * Optional metadata for tracking and analytics
   */
  metadata?: Record<string, any>;
}

/**
 * Channel-specific options for email notifications
 */
export interface IEmailNotificationOptions {
  /**
   * Email subject line
   */
  subject: string;

  /**
   * Email sender address
   */
  from?: string;

  /**
   * Email HTML content
   */
  html?: string;

  /**
   * Email plain text content
   */
  text?: string;

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
 * Channel-specific options for push notifications
 */
export interface IPushNotificationOptions {
  /**
   * Badge count to display
   */
  badge?: number;

  /**
   * Sound to play
   */
  sound?: string;

  /**
   * Image URL to display
   */
  imageUrl?: string;

  /**
   * Action buttons to display
   */
  actions?: Array<{
    id: string;
    title: string;
    action: string;
  }>;

  /**
   * Device tokens to target
   */
  deviceTokens?: string[];
}

/**
 * Channel-specific options for SMS notifications
 */
export interface ISmsNotificationOptions {
  /**
   * Phone number to send to
   */
  phoneNumber: string;

  /**
   * Sender ID or phone number
   */
  sender?: string;
}

/**
 * Channel-specific options for in-app notifications
 */
export interface IInAppNotificationOptions {
  /**
   * Icon to display
   */
  icon?: string;

  /**
   * Action to perform when clicked
   */
  action?: string;

  /**
   * Duration to display (in ms)
   */
  duration?: number;

  /**
   * Whether the notification is dismissible
   */
  dismissible?: boolean;
}

/**
 * Combined channel options for a notification
 */
export interface INotificationChannelOptions {
  /**
   * Email-specific options
   */
  email?: IEmailNotificationOptions;

  /**
   * Push notification-specific options
   */
  push?: IPushNotificationOptions;

  /**
   * SMS-specific options
   */
  sms?: ISmsNotificationOptions;

  /**
   * In-app notification-specific options
   */
  inApp?: IInAppNotificationOptions;
}

/**
 * Extended notification payload with channel-specific options
 */
export interface INotificationPayloadWithChannelOptions extends INotificationPayload {
  /**
   * Channel-specific configuration options
   */
  channelOptions?: INotificationChannelOptions;
}

/**
 * Base notification event interface
 * Extends the base event interface with notification-specific properties
 */
export interface INotificationEvent extends IBaseEvent {
  /**
   * Notification payload
   */
  payload: INotificationPayloadWithChannelOptions;

  /**
   * Schema version for backward compatibility
   */
  schemaVersion: string;

  /**
   * Trace ID for distributed tracing
   */
  traceId?: string;

  /**
   * Correlation ID for event correlation
   */
  correlationId?: string;

  /**
   * Retry count for failed notifications
   */
  retryCount?: number;

  /**
   * Maximum number of retries allowed
   */
  maxRetries?: number;
}

/**
 * Journey-specific notification event interface
 */
export interface IJourneyNotificationEvent extends INotificationEvent {
  /**
   * Journey type that generated the notification
   */
  journeyType: JourneyType;

  /**
   * Journey-specific context data
   */
  journeyContext?: Record<string, any>;
}

/**
 * Health journey notification event
 */
export interface IHealthJourneyNotificationEvent extends IJourneyNotificationEvent {
  journeyType: JourneyType.HEALTH;
  journeyContext?: {
    metricId?: string;
    goalId?: string;
    deviceId?: string;
    insightId?: string;
  };
}

/**
 * Care journey notification event
 */
export interface ICareJourneyNotificationEvent extends IJourneyNotificationEvent {
  journeyType: JourneyType.CARE;
  journeyContext?: {
    appointmentId?: string;
    providerId?: string;
    medicationId?: string;
    telemedicineSessionId?: string;
  };
}

/**
 * Plan journey notification event
 */
export interface IPlanJourneyNotificationEvent extends IJourneyNotificationEvent {
  journeyType: JourneyType.PLAN;
  journeyContext?: {
    planId?: string;
    claimId?: string;
    benefitId?: string;
    documentId?: string;
  };
}

/**
 * Gamification notification event
 */
export interface IGamificationNotificationEvent extends INotificationEvent {
  /**
   * Gamification-specific context
   */
  gamificationContext: {
    /**
     * Achievement ID if related to an achievement
     */
    achievementId?: string;
    
    /**
     * Quest ID if related to a quest
     */
    questId?: string;
    
    /**
     * Reward ID if related to a reward
     */
    rewardId?: string;
    
    /**
     * Level information if related to level progression
     */
    level?: {
      current: number;
      previous: number;
    };
    
    /**
     * XP information if related to XP gain
     */
    xp?: {
      gained: number;
      total: number;
    };
  };
}

/**
 * Notification delivery status event
 */
export interface INotificationDeliveryStatusEvent extends INotificationEvent {
  /**
   * Status of the notification delivery
   */
  deliveryStatus: {
    /**
     * Overall status of the notification
     */
    status: NotificationStatus;
    
    /**
     * Channel-specific delivery statuses
     */
    channelStatuses?: {
      [channel in NotificationChannel]?: {
        status: NotificationStatus;
        timestamp: Date;
        error?: {
          code: string;
          message: string;
          details?: any;
        };
      };
    };
    
    /**
     * Timestamp of the status update
     */
    timestamp: Date;
  };
}

/**
 * Type guard to check if an event is a notification event
 */
export function isNotificationEvent(event: IBaseEvent): event is INotificationEvent {
  return (
    event.type.startsWith('notification.') &&
    'payload' in event &&
    'schemaVersion' in event
  );
}

/**
 * Type guard to check if an event is a journey notification event
 */
export function isJourneyNotificationEvent(event: IBaseEvent): event is IJourneyNotificationEvent {
  return (
    isNotificationEvent(event) &&
    'journeyType' in event
  );
}

/**
 * Type guard to check if an event is a health journey notification event
 */
export function isHealthJourneyNotificationEvent(event: IBaseEvent): event is IHealthJourneyNotificationEvent {
  return (
    isJourneyNotificationEvent(event) &&
    event.journeyType === JourneyType.HEALTH
  );
}

/**
 * Type guard to check if an event is a care journey notification event
 */
export function isCareJourneyNotificationEvent(event: IBaseEvent): event is ICareJourneyNotificationEvent {
  return (
    isJourneyNotificationEvent(event) &&
    event.journeyType === JourneyType.CARE
  );
}

/**
 * Type guard to check if an event is a plan journey notification event
 */
export function isPlanJourneyNotificationEvent(event: IBaseEvent): event is IPlanJourneyNotificationEvent {
  return (
    isJourneyNotificationEvent(event) &&
    event.journeyType === JourneyType.PLAN
  );
}

/**
 * Type guard to check if an event is a gamification notification event
 */
export function isGamificationNotificationEvent(event: IBaseEvent): event is IGamificationNotificationEvent {
  return (
    isNotificationEvent(event) &&
    'gamificationContext' in event
  );
}

/**
 * Type guard to check if an event is a delivery status event
 */
export function isDeliveryStatusEvent(event: IBaseEvent): event is INotificationDeliveryStatusEvent {
  return (
    isNotificationEvent(event) &&
    'deliveryStatus' in event
  );
}