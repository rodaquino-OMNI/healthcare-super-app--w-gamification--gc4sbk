import { 
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  NotificationPriority
} from '@austa/interfaces/notification/types';
import { 
  AchievementNotificationData,
  LevelUpNotificationData
} from '@austa/interfaces/notification/data';

/**
 * Enum representing the different journey contexts in the AUSTA SuperApp.
 * Used for categorizing notifications and calculating appropriate TTLs.
 */
export enum JourneyContext {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAME = 'game'
}

/**
 * Interface for in-app notification payloads.
 * Extends the base Notification interface from @austa/interfaces
 * with additional properties specific to the in-app channel.
 */
export interface IInAppNotification extends Notification {
  /**
   * The channel through which the notification is delivered.
   * For this interface, it's always IN_APP.
   */
  channel: NotificationChannel.IN_APP;
  
  /**
   * Timestamp when the notification was created or sent.
   */
  timestamp: string;
  
  /**
   * Optional metadata specific to in-app notifications.
   */
  metadata?: {
    /**
     * Whether this notification was delivered through a fallback mechanism.
     */
    fallback?: boolean;
    
    /**
     * The original journey context if delivered through fallback.
     */
    originalJourney?: string;
    
    /**
     * Whether this notification should trigger a visual indicator.
     */
    highlight?: boolean;
    
    /**
     * How long the notification should be displayed (in milliseconds).
     */
    displayDuration?: number;
  };
}

/**
 * Interface for journey-specific in-app notifications.
 * Provides type safety for notifications with journey context.
 */
export interface IJourneyInAppNotification extends IInAppNotification {
  /**
   * The journey context of the notification.
   */
  journey: JourneyContext;
}

/**
 * Interface for health journey in-app notifications.
 * Includes health-specific data and context.
 */
export interface IHealthInAppNotification extends IJourneyInAppNotification {
  /**
   * The journey context is always HEALTH for this interface.
   */
  journey: JourneyContext.HEALTH;
  
  /**
   * Health-specific notification data.
   */
  data?: {
    /**
     * Health metric type (e.g., 'steps', 'heart_rate', 'weight').
     */
    metricType?: string;
    
    /**
     * Current value of the health metric.
     */
    currentValue?: number;
    
    /**
     * Target value for the health metric.
     */
    targetValue?: number;
    
    /**
     * Progress percentage towards the target.
     */
    progress?: number;
    
    /**
     * Whether a health goal was achieved.
     */
    goalAchieved?: boolean;
    
    /**
     * Additional health-related information.
     */
    [key: string]: any;
  };
}

/**
 * Interface for care journey in-app notifications.
 * Includes care-specific data and context.
 */
export interface ICareInAppNotification extends IJourneyInAppNotification {
  /**
   * The journey context is always CARE for this interface.
   */
  journey: JourneyContext.CARE;
  
  /**
   * Care-specific notification data.
   */
  data?: {
    /**
     * Appointment ID if notification is related to an appointment.
     */
    appointmentId?: string;
    
    /**
     * Appointment date and time.
     */
    appointmentDateTime?: string;
    
    /**
     * Provider information for appointments.
     */
    provider?: {
      id: string;
      name: string;
      specialty?: string;
    };
    
    /**
     * Medication information for medication reminders.
     */
    medication?: {
      id: string;
      name: string;
      dosage?: string;
      instructions?: string;
    };
    
    /**
     * Additional care-related information.
     */
    [key: string]: any;
  };
}

/**
 * Interface for plan journey in-app notifications.
 * Includes plan-specific data and context.
 */
export interface IPlanInAppNotification extends IJourneyInAppNotification {
  /**
   * The journey context is always PLAN for this interface.
   */
  journey: JourneyContext.PLAN;
  
  /**
   * Plan-specific notification data.
   */
  data?: {
    /**
     * Claim ID if notification is related to a claim.
     */
    claimId?: string;
    
    /**
     * Claim status (e.g., 'submitted', 'approved', 'denied').
     */
    claimStatus?: string;
    
    /**
     * Claim amount information.
     */
    claimAmount?: {
      requested: number;
      approved?: number;
      currency: string;
    };
    
    /**
     * Benefit information.
     */
    benefit?: {
      id: string;
      name: string;
      coverage?: string;
    };
    
    /**
     * Additional plan-related information.
     */
    [key: string]: any;
  };
}

/**
 * Interface for gamification in-app notifications.
 * Includes achievement and reward data.
 */
export interface IGamificationInAppNotification extends IJourneyInAppNotification {
  /**
   * The journey context is always GAME for this interface.
   */
  journey: JourneyContext.GAME;
  
  /**
   * Type of notification is typically achievement or level-related.
   */
  type: NotificationType.ACHIEVEMENT | NotificationType.LEVEL_UP;
  
  /**
   * Gamification-specific notification data.
   */
  data: AchievementNotificationData | LevelUpNotificationData;
}

/**
 * Interface for WebSocket message format used for in-app notifications.
 * Defines the structure of messages sent through the WebSocket connection.
 */
export interface IWebSocketNotificationMessage {
  /**
   * The notification payload.
   */
  notification: IInAppNotification;
  
  /**
   * Unique identifier for the WebSocket message.
   */
  messageId: string;
  
  /**
   * Timestamp when the message was sent.
   */
  sentAt: string;
  
  /**
   * Optional trace ID for distributed tracing.
   */
  traceId?: string;
}

/**
 * Interface for WebSocket event types used in the notification system.
 * Defines the events that can be emitted or listened for.
 */
export enum WebSocketEventType {
  /**
   * Event emitted when a new notification is available.
   */
  NOTIFICATION = 'notification',
  
  /**
   * Event emitted when a client connects to the WebSocket server.
   */
  CONNECTED = 'connected',
  
  /**
   * Event emitted when a client subscribes to a journey.
   */
  SUBSCRIBED = 'subscribed',
  
  /**
   * Event emitted when a client unsubscribes from a journey.
   */
  UNSUBSCRIBED = 'unsubscribed',
  
  /**
   * Event emitted when a notification is marked as read.
   */
  MARKED = 'marked',
  
  /**
   * Event emitted when an error occurs.
   */
  ERROR = 'error'
}

/**
 * Interface for WebSocket subscription request.
 * Used when a client subscribes to a journey.
 */
export interface IWebSocketSubscriptionRequest {
  /**
   * The journey to subscribe to.
   */
  journey: JourneyContext;
}

/**
 * Interface for WebSocket subscription response.
 * Sent to confirm a successful subscription.
 */
export interface IWebSocketSubscriptionResponse {
  /**
   * The journey that was subscribed to.
   */
  journey: JourneyContext;
  
  /**
   * Optional trace ID for distributed tracing.
   */
  traceId?: string;
}

/**
 * Interface for WebSocket mark-as-read request.
 * Used when a client marks a notification as read.
 */
export interface IWebSocketMarkAsReadRequest {
  /**
   * ID of the notification to mark as read.
   */
  notificationId: string;
}

/**
 * Interface for WebSocket mark-as-read response.
 * Sent to confirm a notification was marked as read.
 */
export interface IWebSocketMarkAsReadResponse {
  /**
   * ID of the notification that was marked as read.
   */
  notificationId: string;
  
  /**
   * Optional trace ID for distributed tracing.
   */
  traceId?: string;
}

/**
 * Interface for WebSocket error response.
 * Sent when an error occurs during WebSocket communication.
 */
export interface IWebSocketErrorResponse {
  /**
   * Error message describing what went wrong.
   */
  message: string;
  
  /**
   * Optional error code for categorizing errors.
   */
  code?: string;
  
  /**
   * Optional trace ID for distributed tracing.
   */
  traceId?: string;
}

/**
 * Interface for WebSocket connection status.
 * Used to track user connection state in Redis.
 */
export interface IWebSocketConnectionStatus {
  /**
   * ID of the connected user.
   */
  userId: string;
  
  /**
   * ID of the Socket.io client.
   */
  clientId: string;
  
  /**
   * Timestamp when the connection was established.
   */
  connectedAt: string;
  
  /**
   * List of journeys the user is subscribed to.
   */
  subscribedJourneys: JourneyContext[];
  
  /**
   * IP address of the client.
   */
  ipAddress?: string;
  
  /**
   * User agent of the client.
   */
  userAgent?: string;
}

/**
 * Interface for Redis storage structure of pending notifications.
 * Defines how notifications are stored in Redis for offline users.
 */
export interface IPendingNotification {
  /**
   * ID of the notification.
   */
  id: string;
  
  /**
   * Type of the notification.
   */
  type: string;
  
  /**
   * Title of the notification.
   */
  title: string;
  
  /**
   * Body content of the notification.
   */
  body: string;
  
  /**
   * Timestamp when the notification was created or stored.
   */
  timestamp: string;
  
  /**
   * Channel through which the notification should be delivered.
   */
  channel: NotificationChannel;
  
  /**
   * Current status of the notification.
   */
  status: NotificationStatus;
  
  /**
   * Optional data associated with the notification.
   */
  data?: Record<string, any>;
}

/**
 * Interface for Redis hash storage of pending notifications.
 * Maps notification IDs to serialized notification payloads.
 */
export interface IPendingNotificationsHash {
  /**
   * Key is a timestamp-based notification ID.
   * Value is a serialized JSON string of IPendingNotification.
   */
  [notificationId: string]: string;
}

/**
 * Interface for in-app notification channel configuration.
 * Defines configuration options specific to the in-app channel.
 */
export interface IInAppChannelConfig {
  /**
   * Whether the in-app notification channel is enabled.
   */
  enabled: boolean;
  
  /**
   * Maximum number of pending notifications to store per user.
   */
  maxPendingNotifications: number;
  
  /**
   * Default TTL for pending notifications in seconds.
   */
  defaultTTL: number;
  
  /**
   * Journey-specific TTLs for pending notifications in seconds.
   */
  journeyTTLs: {
    [key in JourneyContext]: number;
  };
  
  /**
   * Configuration for WebSocket connections.
   */
  websocket: {
    /**
     * Whether to enable ping/pong for connection health checks.
     */
    enablePing: boolean;
    
    /**
     * Ping interval in milliseconds.
     */
    pingInterval: number;
    
    /**
     * Timeout for ping responses in milliseconds.
     */
    pingTimeout: number;
  };
}

/**
 * Interface for retry configuration specific to in-app notifications.
 * Defines how failed notification deliveries should be retried.
 */
export interface IInAppRetryConfig {
  /**
   * Whether to enable retries for failed deliveries.
   */
  enabled: boolean;
  
  /**
   * Maximum number of retry attempts.
   */
  maxAttempts: number;
  
  /**
   * Base delay between retry attempts in milliseconds.
   */
  baseDelayMs: number;
  
  /**
   * Factor by which to increase delay between retry attempts.
   */
  backoffFactor: number;
  
  /**
   * Maximum delay between retry attempts in milliseconds.
   */
  maxDelayMs: number;
  
  /**
   * Whether to use jitter to randomize retry delays.
   */
  useJitter: boolean;
}

/**
 * Interface for delivery status tracking specific to in-app notifications.
 * Used to track the delivery status of notifications.
 */
export interface IInAppDeliveryStatus {
  /**
   * ID of the notification.
   */
  notificationId: string;
  
  /**
   * ID of the user the notification was sent to.
   */
  userId: string;
  
  /**
   * Whether the notification was delivered successfully.
   */
  delivered: boolean;
  
  /**
   * Timestamp when the notification was delivered.
   */
  deliveredAt?: string;
  
  /**
   * Whether the notification was read by the user.
   */
  read: boolean;
  
  /**
   * Timestamp when the notification was read.
   */
  readAt?: string;
  
  /**
   * Number of delivery attempts made.
   */
  attempts: number;
  
  /**
   * Error message if delivery failed.
   */
  error?: string;
  
  /**
   * Journey context of the notification.
   */
  journey?: JourneyContext;
}

/**
 * Type for journey-specific notification handlers.
 * Defines a function type for handling notifications in different journey contexts.
 */
export type JourneyNotificationHandler = (
  userId: string,
  notification: IInAppNotification,
  journey: JourneyContext
) => Promise<boolean>;

/**
 * Interface for journey-specific notification processors.
 * Maps journey contexts to their respective notification handlers.
 */
export interface IJourneyNotificationProcessors {
  /**
   * Map of journey contexts to notification handlers.
   */
  [key in JourneyContext]?: JourneyNotificationHandler;
}

/**
 * Interface for Redis key patterns used in the in-app notification channel.
 * Provides standardized key formats for Redis operations.
 */
export interface IRedisKeyPatterns {
  /**
   * Pattern for user connection keys.
   * Format: user:{userId}:connection
   */
  userConnection: string;
  
  /**
   * Pattern for pending notifications keys.
   * Format: user:{userId}:pending_notifications
   */
  pendingNotifications: string;
  
  /**
   * Pattern for journey subscription keys.
   * Format: user:{userId}:journey:{journey}
   */
  journeySubscription: string;
  
  /**
   * Pattern for notification delivery status keys.
   * Format: notification:{notificationId}:delivery
   */
  deliveryStatus: string;
}

/**
 * Interface for batch notification operations.
 * Used for sending multiple notifications efficiently.
 */
export interface IBatchNotificationOperation {
  /**
   * List of user IDs to send notifications to.
   */
  userIds: string[];
  
  /**
   * The notification to send to all users.
   */
  notification: IInAppNotification;
  
  /**
   * Optional journey context for the notifications.
   */
  journey?: JourneyContext;
  
  /**
   * Optional callback to execute after each notification is sent.
   */
  onNotificationSent?: (userId: string, success: boolean) => void;
  
  /**
   * Optional callback to execute after all notifications are sent.
   */
  onBatchComplete?: (results: { userId: string; success: boolean }[]) => void;
}

/**
 * Interface for in-app notification service metrics.
 * Used for monitoring and observability.
 */
export interface IInAppNotificationMetrics {
  /**
   * Total number of notifications sent.
   */
  totalSent: number;
  
  /**
   * Number of notifications sent successfully.
   */
  successCount: number;
  
  /**
   * Number of notifications that failed to send.
   */
  failureCount: number;
  
  /**
   * Number of notifications stored for later delivery.
   */
  storedCount: number;
  
  /**
   * Average delivery time in milliseconds.
   */
  avgDeliveryTimeMs: number;
  
  /**
   * Counts by journey context.
   */
  journeyCounts: {
    [key in JourneyContext]: number;
  };
  
  /**
   * Counts by notification type.
   */
  typeCounts: Record<string, number>;
}