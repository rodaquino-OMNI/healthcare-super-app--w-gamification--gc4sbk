import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { NotificationStatus, NotificationPriority, NotificationType, NotificationChannel } from '@austa/interfaces';

/**
 * @fileoverview
 * This file defines interfaces specific to the in-app notification channel.
 * It includes interfaces for notification payloads, WebSocket messages,
 * Redis storage structures, and channel-specific configuration options.
 * 
 * These interfaces ensure type safety and consistent data structures throughout
 * the in-app notification delivery process. They complement the standardized
 * notification schemas from @austa/interfaces with channel-specific extensions.
 * 
 * The interfaces in this file are used by the InAppService, WebsocketsGateway,
 * and other components involved in in-app notification delivery.
 * 
 * @note
 * This file imports and extends types from @austa/interfaces to ensure
 * consistency with the standardized notification schemas used across the
 * AUSTA SuperApp. The imported types include NotificationStatus, NotificationPriority,
 * NotificationType, and NotificationChannel, which provide standardized enums
 * for notification properties.
 */

/**
 * Enum representing the different journey contexts in the AUSTA SuperApp.
 * Used for categorizing notifications and determining appropriate TTLs.
 * 
 * @remarks
 * This enum is used to provide journey-specific context for notifications,
 * which affects how they are processed, stored, and displayed to users.
 */
export enum JourneyContext {
  /** Health journey context for health metrics, goals, and insights */
  HEALTH = 'health',
  /** Care journey context for appointments, medications, and treatments */
  CARE = 'care',
  /** Plan journey context for insurance plans, claims, and benefits */
  PLAN = 'plan',
  /** Gamification context for achievements, quests, and rewards */
  GAME = 'game',
}

/**
 * Interface for in-app notification payload sent via WebSockets.
 * This is the format that will be delivered to clients through the WebSocket connection.
 * 
 * @remarks
 * This interface extends the base notification structure with in-app specific fields.
 * It is used for both immediate delivery via WebSockets and for storing notifications
 * that will be delivered when a user connects.
 */
export interface InAppNotificationPayload {
  /** Unique identifier for the notification */
  id: string;
  /** Type of notification (e.g., 'achievement', 'appointment_reminder', etc.) */
  type: NotificationType | string;
  /** Notification title */
  title: string;
  /** Notification body/content */
  body: string;
  /** ISO timestamp when the notification was created */
  timestamp: string;
  /** Delivery channel, always 'in-app' for this interface */
  channel: NotificationChannel.IN_APP | 'in-app';
  /** Current status of the notification */
  status: NotificationStatus | string;
  /** Journey context for the notification */
  journey?: JourneyContext;
  /** Additional data specific to the notification type */
  data?: Record<string, any>;
  /** Optional URL or deep link to navigate to when the notification is clicked */
  actionUrl?: string;
  /** Optional action type (e.g., 'open', 'dismiss', 'snooze') */
  actionType?: string;
  /** Optional expiration time for the notification */
  expiresAt?: string;
  /** Optional priority level for the notification */
  priority?: NotificationPriority | 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Enum for WebSocket message types.
 * Defines the different types of messages that can be sent through WebSockets.
 */
export enum WebSocketMessageType {
  /** Notification message type */
  NOTIFICATION = 'notification',
  /** System message type for service announcements */
  SYSTEM = 'system',
  /** Acknowledgment message type for confirming receipt */
  ACK = 'acknowledgment',
  /** Error message type for communicating issues */
  ERROR = 'error',
}

/**
 * Interface for WebSocket message format.
 * Extends the notification payload with metadata needed for WebSocket delivery.
 * 
 * @remarks
 * This interface defines the structure of messages sent through the WebSocket connection.
 * It includes the notification payload along with additional metadata for message handling.
 */
export interface WebSocketMessage extends InAppNotificationPayload {
  /** Message type for WebSocket clients to handle appropriately */
  messageType: WebSocketMessageType;
  /** Optional correlation ID for tracking the notification through the system */
  correlationId?: string;
  /** Optional timestamp when the message was sent */
  sentAt?: string;
  /** Optional metadata for the message */
  meta?: {
    /** Service that sent the message */
    source?: string;
    /** Version of the message format */
    version?: string;
    /** Whether the message requires acknowledgment */
    requiresAck?: boolean;
    /** Journey context for the message */
    journeyContext?: JourneyContext;
  };
}

/**
 * Interface for Redis key patterns used in the in-app notification channel.
 * Defines the structure of Redis keys for storing connection status and pending notifications.
 */
export interface InAppRedisKeys {
  /** Key pattern for storing user connection status */
  connectionKey: (userId: string) => string;
  /** Key pattern for storing pending notifications */
  pendingNotificationsKey: (userId: string) => string;
  /** Key pattern for storing notification metadata */
  notificationMetaKey: (notificationId: string) => string;
  /** Key pattern for storing notification delivery attempts */
  deliveryAttemptsKey: (notificationId: string) => string;
}

/**
 * Interface for Redis storage structure for pending notifications.
 * Defines how notifications are stored in Redis for users who are offline.
 * 
 * @remarks
 * This interface defines the structure of notification data stored in Redis
 * for users who are not currently connected. These notifications will be
 * delivered when the user connects to the WebSocket server.
 */
export interface InAppRedisStorage {
  /** Key pattern for storing user connection status */
  connectionKey: string;
  /** Key pattern for storing pending notifications */
  pendingNotificationsKey: string;
  /** Serialized notification payload */
  serializedNotification: string;
  /** Unique identifier for the notification in Redis */
  notificationId: string;
  /** Optional expiration time for the notification in Redis */
  expiresAt?: number;
  /** Optional metadata for the notification */
  metadata?: {
    /** Journey context for the notification */
    journeyContext: JourneyContext;
    /** Priority level for the notification */
    priority: NotificationPriority | 'low' | 'medium' | 'high' | 'critical';
    /** Number of delivery attempts made */
    deliveryAttempts: number;
    /** Timestamp of the last delivery attempt */
    lastAttemptAt?: number;
  };
}

/**
 * Interface for TTL configuration based on journey context.
 * Different journeys may have different retention policies for notifications.
 * 
 * @remarks
 * This interface defines the Time-To-Live (TTL) values for notifications in different
 * journey contexts. TTL values determine how long notifications are stored in Redis
 * before they expire. Journey-specific TTLs allow for different retention policies
 * based on the importance and relevance of notifications in each journey.
 */
export interface JourneyTTLConfig {
  /** TTL in seconds for health journey notifications */
  [JourneyContext.HEALTH]: number;
  /** TTL in seconds for care journey notifications */
  [JourneyContext.CARE]: number;
  /** TTL in seconds for plan journey notifications */
  [JourneyContext.PLAN]: number;
  /** TTL in seconds for gamification notifications */
  [JourneyContext.GAME]: number;
  /** Default TTL in seconds for notifications with unknown journey context */
  default: number;
}

/**
 * Default TTL values for different journey contexts in seconds.
 * These values can be overridden in the application configuration.
 */
export const DEFAULT_JOURNEY_TTL: JourneyTTLConfig = {
  [JourneyContext.HEALTH]: 7 * 24 * 60 * 60, // 7 days
  [JourneyContext.CARE]: 14 * 24 * 60 * 60, // 14 days
  [JourneyContext.PLAN]: 30 * 24 * 60 * 60, // 30 days
  [JourneyContext.GAME]: 3 * 24 * 60 * 60, // 3 days
  default: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Interface for in-app notification channel configuration options.
 * Allows customization of the in-app notification channel behavior.
 * 
 * @remarks
 * This interface defines the configuration options for the in-app notification channel.
 * It allows for customization of various aspects of notification delivery, storage,
 * and retry behavior. These options can be set in the application configuration and
 * will affect how the in-app notification channel operates.
 */
export interface InAppNotificationConfig {
  /** Whether the in-app notification channel is enabled */
  enabled: boolean;
  /** Maximum number of pending notifications to store per user */
  maxPendingNotifications: number;
  /** TTL configuration for different journey contexts */
  ttl: JourneyTTLConfig;
  /** Whether to attempt delivery via WebSockets first */
  prioritizeWebSockets: boolean;
  /** Retry configuration for failed deliveries */
  retry: InAppRetryOptions;
  /** Batch size for processing pending notifications */
  batchSize?: number;
  /** Whether to compress notification payloads for storage */
  compressPayloads?: boolean;
  /** Whether to track notification delivery metrics */
  trackMetrics?: boolean;
  /** Whether to enable debug logging for the in-app channel */
  debugLogging?: boolean;
  /** Journey-specific configuration overrides */
  journeyOverrides?: {
    /** Health journey specific configuration */
    [JourneyContext.HEALTH]?: Partial<InAppNotificationConfig>;
    /** Care journey specific configuration */
    [JourneyContext.CARE]?: Partial<InAppNotificationConfig>;
    /** Plan journey specific configuration */
    [JourneyContext.PLAN]?: Partial<InAppNotificationConfig>;
    /** Gamification journey specific configuration */
    [JourneyContext.GAME]?: Partial<InAppNotificationConfig>;
  };
}

/**
 * Default configuration for the in-app notification channel.
 * These values can be overridden in the application configuration.
 */
export const DEFAULT_IN_APP_CONFIG: InAppNotificationConfig = {
  enabled: true,
  maxPendingNotifications: 100,
  ttl: DEFAULT_JOURNEY_TTL,
  prioritizeWebSockets: true,
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    useExponentialBackoff: true,
    maxBackoffDelay: 60000, // 1 minute
    sendToDLQ: true,
  },
  batchSize: 10,
  compressPayloads: false,
  trackMetrics: true,
  debugLogging: false,
};

/**
 * Interface for retry options specific to in-app notifications.
 * Configures how failed notification deliveries are retried.
 * 
 * @remarks
 * This interface defines the retry behavior for failed notification deliveries.
 * It allows for configuration of retry attempts, delays, backoff strategies,
 * and dead letter queue integration. These options can be customized for
 * different notification types and journey contexts.
 */
export interface InAppRetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
  /** Whether to use exponential backoff for retries */
  useExponentialBackoff: boolean;
  /** Maximum backoff delay in milliseconds */
  maxBackoffDelay?: number;
  /** Whether to send to dead letter queue after all retries fail */
  sendToDLQ: boolean;
  /** Optional custom backoff factor for exponential backoff */
  backoffFactor?: number;
  /** Optional jitter to add to retry delays (0-1, representing percentage of delay) */
  jitter?: number;
  /** Optional callback to execute before each retry attempt */
  beforeRetry?: (attempt: number, delay: number) => Promise<void>;
  /** Optional callback to execute after all retries have failed */
  onRetryExhausted?: (notificationId: string) => Promise<void>;
}

/**
 * Interface for notification delivery result.
 * Provides information about the result of a notification delivery attempt.
 */
export interface InAppDeliveryResult {
  /** Whether the delivery was successful */
  success: boolean;
  /** The notification ID that was delivered */
  notificationId: string;
  /** The user ID that the notification was delivered to */
  userId: string;
  /** The timestamp when the delivery was attempted */
  timestamp: string;
  /** The delivery method used (websocket, redis) */
  method: 'websocket' | 'redis';
  /** Optional error message if the delivery failed */
  error?: string;
  /** Optional error code if the delivery failed */
  errorCode?: string;
  /** Optional retry information if the delivery failed */
  retry?: {
    /** Whether a retry will be attempted */
    willRetry: boolean;
    /** The attempt number (1-based) */
    attemptNumber: number;
    /** The next retry time, if applicable */
    nextRetryAt?: string;
  };
}

/**
 * Utility type for extracting journey context from a notification.
 * Used to determine the appropriate TTL and categorization for notifications.
 * 
 * @remarks
 * This type defines a function that extracts the journey context from a notification entity.
 * It is used to determine how notifications should be categorized, stored, and processed
 * based on their journey context. The extracted context affects TTL values, retry behavior,
 * and other aspects of notification handling.
 */
export type JourneyExtractor = (notification: NotificationEntity) => JourneyContext;

/**
 * Interface for in-app notification service methods.
 * Defines the public API of the in-app notification channel service.
 */
export interface InAppNotificationService {
  /** Sends an in-app notification to a user */
  send(userId: string, notification: NotificationEntity): Promise<InAppDeliveryResult>;
  /** Checks if a user is connected to the WebSocket server */
  checkUserConnection(userId: string): Promise<boolean>;
  /** Stores a notification for later delivery */
  storeNotificationForLaterDelivery(userId: string, notification: NotificationEntity): Promise<boolean>;
  /** Retrieves pending notifications for a user */
  getPendingNotifications(userId: string): Promise<InAppNotificationPayload[]>;
  /** Marks a notification as delivered */
  markAsDelivered(userId: string, notificationId: string): Promise<boolean>;
  /** Extracts the journey context from a notification */
  getJourneyFromNotification(notification: NotificationEntity): JourneyContext;
}