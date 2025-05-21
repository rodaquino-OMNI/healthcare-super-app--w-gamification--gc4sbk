import { IBaseEvent } from '@austa/interfaces/events';
import { IVersionedEvent } from '@austa/interfaces/events';
import { EventVersion } from '@austa/interfaces/events';
import { 
  INotificationPayload, 
  IEmailNotificationPayload,
  IPushNotificationPayload,
  ISmsNotificationPayload,
  IInAppNotificationPayload,
  IJourneySpecificPayload,
  NotificationType,
  NotificationChannel
} from '../../interfaces/notification-payload.interface';

/**
 * Core notification event interface that extends the base event interface
 * Represents events flowing through the notification system
 */
export interface INotificationEvent extends IBaseEvent {
  /**
   * Type of notification event
   */
  type: NotificationType;

  /**
   * Notification payload containing the data to be delivered
   */
  payload: INotificationPayload;

  /**
   * Channels through which the notification should be delivered
   * If not specified, will use user preferences
   */
  channels?: NotificationChannel[];

  /**
   * Priority level for processing the notification
   * Higher priority events are processed before lower priority ones
   */
  priority?: 'low' | 'normal' | 'high' | 'critical';

  /**
   * Timestamp when the notification should be delivered
   * If not specified, the notification will be delivered immediately
   */
  scheduledFor?: string;

  /**
   * Timestamp after which the notification should not be delivered
   * Used for time-sensitive notifications
   */
  expiresAt?: string;

  /**
   * Correlation ID for tracking related events across services
   * Used for distributed tracing and debugging
   */
  correlationId?: string;

  /**
   * Metadata for monitoring, logging, and tracing
   */
  metadata?: INotificationEventMetadata;
}

/**
 * Metadata for notification events
 * Used for monitoring, logging, and tracing
 */
export interface INotificationEventMetadata {
  /**
   * Source service or component that generated the event
   */
  source: string;

  /**
   * User ID for whom the notification is intended
   */
  userId: string;

  /**
   * Journey context for the notification
   */
  journey?: 'health' | 'care' | 'plan' | 'gamification' | 'system';

  /**
   * Trace ID for distributed tracing
   */
  traceId?: string;

  /**
   * Span ID for distributed tracing
   */
  spanId?: string;

  /**
   * Additional context for the notification
   */
  context?: Record<string, any>;

  /**
   * Tags for categorizing and filtering notifications
   */
  tags?: string[];
}

/**
 * Versioned notification event interface
 * Supports backward compatibility and schema evolution
 */
export interface IVersionedNotificationEvent extends INotificationEvent, IVersionedEvent {
  /**
   * Semantic version of the event schema
   */
  version: EventVersion;

  /**
   * Minimum version of the consumer required to process this event
   */
  minConsumerVersion?: EventVersion;

  /**
   * Whether this event schema is deprecated
   */
  deprecated?: boolean;

  /**
   * Version-specific metadata
   */
  versionMetadata?: {
    /**
     * Previous versions that are compatible with this event
     */
    compatibleWith?: EventVersion[];

    /**
     * Migration path for upgrading from previous versions
     */
    migrationPath?: string;

    /**
     * Deprecation notice for deprecated event schemas
     */
    deprecationNotice?: string;
  };
}

/**
 * Channel-specific notification event interfaces
 */

/**
 * Email notification event interface
 */
export interface IEmailNotificationEvent extends INotificationEvent {
  type: 'care.appointment.reminder' | 'plan.claim.approved' | 'health.goal.achieved' | 'system.account';
  payload: IEmailNotificationPayload;
  channels: ['email'];
}

/**
 * Push notification event interface
 */
export interface IPushNotificationEvent extends INotificationEvent {
  type: NotificationType;
  payload: IPushNotificationPayload;
  channels: ['push'];
}

/**
 * SMS notification event interface
 */
export interface ISmsNotificationEvent extends INotificationEvent {
  type: 'care.appointment.reminder' | 'care.medication.reminder' | 'system.security';
  payload: ISmsNotificationPayload;
  channels: ['sms'];
}

/**
 * In-app notification event interface
 */
export interface IInAppNotificationEvent extends INotificationEvent {
  type: NotificationType;
  payload: IInAppNotificationPayload;
  channels: ['in-app'];
}

/**
 * Multi-channel notification event interface
 */
export interface IMultiChannelNotificationEvent extends INotificationEvent {
  type: NotificationType;
  payload: INotificationPayload;
  channels: NotificationChannel[];
}

/**
 * Journey-specific notification event interfaces
 */

/**
 * Base interface for journey-specific notification events
 */
export interface IJourneyNotificationEvent extends INotificationEvent {
  payload: INotificationPayload & {
    data: IJourneySpecificPayload;
  };
  metadata: INotificationEventMetadata & {
    journey: 'health' | 'care' | 'plan' | 'gamification' | 'system';
  };
}

/**
 * Health journey notification event interface
 */
export interface IHealthJourneyNotificationEvent extends IJourneyNotificationEvent {
  type: 'health.metric.update' | 'health.goal.achieved' | 'health.goal.progress' | 
        'health.device.connected' | 'health.device.sync' | 'health.insight.generated';
  payload: INotificationPayload & {
    data: IJourneySpecificPayload & {
      journey: 'health';
    };
  };
  metadata: INotificationEventMetadata & {
    journey: 'health';
  };
}

/**
 * Care journey notification event interface
 */
export interface ICareJourneyNotificationEvent extends IJourneyNotificationEvent {
  type: 'care.appointment.reminder' | 'care.appointment.confirmed' | 'care.appointment.cancelled' |
        'care.medication.reminder' | 'care.medication.refill' | 'care.telemedicine.ready' | 
        'care.provider.message';
  payload: INotificationPayload & {
    data: IJourneySpecificPayload & {
      journey: 'care';
    };
  };
  metadata: INotificationEventMetadata & {
    journey: 'care';
  };
}

/**
 * Plan journey notification event interface
 */
export interface IPlanJourneyNotificationEvent extends IJourneyNotificationEvent {
  type: 'plan.claim.submitted' | 'plan.claim.updated' | 'plan.claim.approved' | 
        'plan.claim.rejected' | 'plan.benefit.expiring' | 'plan.coverage.updated' | 
        'plan.document.available';
  payload: INotificationPayload & {
    data: IJourneySpecificPayload & {
      journey: 'plan';
    };
  };
  metadata: INotificationEventMetadata & {
    journey: 'plan';
  };
}

/**
 * Gamification journey notification event interface
 */
export interface IGamificationJourneyNotificationEvent extends IJourneyNotificationEvent {
  type: 'gamification.achievement.unlocked' | 'gamification.quest.available' | 
        'gamification.quest.completed' | 'gamification.level.up' | 
        'gamification.reward.earned' | 'gamification.leaderboard.position';
  payload: INotificationPayload & {
    data: IJourneySpecificPayload & {
      journey: 'gamification';
    };
  };
  metadata: INotificationEventMetadata & {
    journey: 'gamification';
  };
}

/**
 * System notification event interface
 */
export interface ISystemJourneyNotificationEvent extends IJourneyNotificationEvent {
  type: 'system.maintenance' | 'system.update' | 'system.security' | 'system.account';
  payload: INotificationPayload & {
    data: IJourneySpecificPayload & {
      journey: 'system';
    };
  };
  metadata: INotificationEventMetadata & {
    journey: 'system';
  };
}

/**
 * Type guard to check if an event is a notification event
 * @param event The event to check
 * @returns True if the event is a notification event
 */
export function isNotificationEvent(event: any): event is INotificationEvent {
  return (
    event &&
    typeof event === 'object' &&
    'type' in event &&
    'payload' in event &&
    typeof event.payload === 'object' &&
    'userId' in event.payload
  );
}

/**
 * Type guard to check if an event is a journey-specific notification event
 * @param event The event to check
 * @returns True if the event is a journey-specific notification event
 */
export function isJourneyNotificationEvent(event: any): event is IJourneyNotificationEvent {
  return (
    isNotificationEvent(event) &&
    event.payload &&
    event.payload.data &&
    'journey' in event.payload.data &&
    event.metadata &&
    'journey' in event.metadata
  );
}

/**
 * Type guard to check if an event is a versioned notification event
 * @param event The event to check
 * @returns True if the event is a versioned notification event
 */
export function isVersionedNotificationEvent(event: any): event is IVersionedNotificationEvent {
  return (
    isNotificationEvent(event) &&
    'version' in event &&
    typeof event.version === 'object' &&
    'major' in event.version &&
    'minor' in event.version &&
    'patch' in event.version
  );
}

/**
 * Type guard to check if an event is a specific journey notification event
 * @param event The event to check
 * @param journey The journey to check for
 * @returns True if the event is a notification event for the specified journey
 */
export function isJourneySpecificNotificationEvent(
  event: any,
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'system'
): boolean {
  return (
    isJourneyNotificationEvent(event) &&
    event.payload.data.journey === journey &&
    event.metadata.journey === journey
  );
}