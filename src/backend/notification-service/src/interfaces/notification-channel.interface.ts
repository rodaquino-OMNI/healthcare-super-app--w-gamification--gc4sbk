import { NotificationEntity } from '../notifications/entities/notification.entity';
import { RetryStatus } from '../retry/interfaces/retry-status.enum';
import { IRetryOptions } from '../retry/interfaces/retry-options.interface';
import { IRetryableOperation } from '../retry/interfaces/retryable-operation.interface';

// Import from @austa/interfaces package for standardized schemas
import { NotificationChannel, NotificationType, NotificationPriority } from '@austa/interfaces/notification/types';
import { Notification } from '@austa/interfaces/notification/types';

/**
 * Represents the result of a notification channel delivery attempt
 */
export interface IChannelDeliveryResult {
  /** Whether the delivery was successful */
  success: boolean;
  
  /** Unique identifier for the delivery attempt */
  attemptId: string;
  
  /** Timestamp when the delivery was attempted */
  timestamp: Date;
  
  /** Provider-specific message ID or reference (if available) */
  providerMessageId?: string;
  
  /** Error information if delivery failed */
  error?: IChannelError;
  
  /** Additional metadata about the delivery */
  metadata?: Record<string, any>;
}

/**
 * Standardized error information for notification channel failures
 */
export interface IChannelError {
  /** Error code (can be provider-specific or standardized) */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Classification of the error for retry decisions */
  classification: FailureClassification;
  
  /** Original error object or details (if available) */
  originalError?: any;
  
  /** Additional context about the error */
  context?: Record<string, any>;
}

/**
 * Classification of channel delivery failures for retry decisions
 */
export enum FailureClassification {
  /** Temporary failure that can be retried (e.g., network timeout) */
  TRANSIENT = 'transient',
  
  /** Permanent failure that should not be retried (e.g., invalid recipient) */
  PERMANENT = 'permanent',
  
  /** Failure due to rate limiting that should be retried after a delay */
  RATE_LIMITED = 'rate_limited',
  
  /** Failure due to authentication or authorization issues */
  AUTH_ERROR = 'auth_error',
  
  /** Failure due to provider service being unavailable */
  SERVICE_UNAVAILABLE = 'service_unavailable',
  
  /** Failure due to invalid request format or content */
  INVALID_REQUEST = 'invalid_request',
  
  /** Unknown or unclassified failure */
  UNKNOWN = 'unknown'
}

/**
 * Base interface for notification channel capabilities
 */
export interface IChannelCapabilities {
  /** Whether the channel supports rich content (HTML, formatting, etc.) */
  supportsRichContent: boolean;
  
  /** Whether the channel supports attachments (files, images, etc.) */
  supportsAttachments: boolean;
  
  /** Whether the channel supports delivery confirmation */
  supportsDeliveryConfirmation: boolean;
  
  /** Whether the channel supports read receipts */
  supportsReadReceipts: boolean;
  
  /** Maximum size of message content in bytes (if applicable) */
  maxContentSize?: number;
  
  /** Maximum number of recipients per message (if applicable) */
  maxRecipients?: number;
  
  /** Supported notification priorities */
  supportedPriorities: NotificationPriority[];
  
  /** Supported notification types */
  supportedTypes: NotificationType[];
}

/**
 * Base interface for notification channel configuration
 */
export interface IChannelConfig {
  /** Whether the channel is enabled */
  enabled: boolean;
  
  /** Maximum number of delivery attempts before giving up */
  maxRetryAttempts: number;
  
  /** Retry options for failed deliveries */
  retryOptions: IRetryOptions;
  
  /** Default sender identity (email address, phone number, etc.) */
  defaultSender?: string;
  
  /** Rate limiting configuration (requests per minute, etc.) */
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  };
  
  /** Channel-specific configuration parameters */
  providerConfig: Record<string, any>;
  
  /** Fallback channel to use if this channel fails */
  fallbackChannel?: NotificationChannel;
}

/**
 * Base interface for all notification channels
 */
export interface INotificationChannel {
  /** Unique identifier for the channel type */
  readonly channelType: NotificationChannel;
  
  /** Channel capabilities */
  readonly capabilities: IChannelCapabilities;
  
  /** Channel configuration */
  readonly config: IChannelConfig;
  
  /**
   * Sends a notification through this channel
   * @param recipient The recipient identifier (email, phone, device token, user ID)
   * @param notification The notification entity to send
   * @returns A promise that resolves to the delivery result
   */
  send(recipient: string, notification: NotificationEntity): Promise<IChannelDeliveryResult>;
  
  /**
   * Checks if this channel can handle the given notification type
   * @param notificationType The notification type to check
   * @returns True if this channel can handle the notification type
   */
  canHandle(notificationType: NotificationType): boolean;
  
  /**
   * Validates a recipient identifier for this channel
   * @param recipient The recipient identifier to validate
   * @returns True if the recipient identifier is valid for this channel
   */
  validateRecipient(recipient: string): boolean;
  
  /**
   * Gets the current status of the channel (online, degraded, offline)
   * @returns A promise that resolves to the channel status
   */
  getStatus(): Promise<ChannelStatus>;
}

/**
 * Status of a notification channel
 */
export enum ChannelStatus {
  /** Channel is fully operational */
  ONLINE = 'online',
  
  /** Channel is operational but with degraded performance */
  DEGRADED = 'degraded',
  
  /** Channel is not operational */
  OFFLINE = 'offline'
}

/**
 * Interface for notification channels that support retry operations
 */
export interface IRetryableChannel extends INotificationChannel, IRetryableOperation {
  /**
   * Gets the current retry status for a specific notification
   * @param notificationId The ID of the notification
   * @returns A promise that resolves to the retry status
   */
  getRetryStatus(notificationId: string): Promise<RetryStatus>;
  
  /**
   * Schedules a retry for a failed notification
   * @param recipient The recipient identifier
   * @param notification The notification entity
   * @param error The error that caused the failure
   * @returns A promise that resolves when the retry is scheduled
   */
  scheduleRetry(recipient: string, notification: NotificationEntity, error: IChannelError): Promise<void>;
  
  /**
   * Classifies an error to determine retry strategy
   * @param error The error to classify
   * @returns The failure classification
   */
  classifyError(error: any): FailureClassification;
}

/**
 * Interface for email channel capabilities
 */
export interface IEmailChannelCapabilities extends IChannelCapabilities {
  /** Whether HTML content is supported */
  supportsHtml: boolean;
  
  /** Whether inline CSS is supported */
  supportsInlineCSS: boolean;
  
  /** Maximum size of attachments in bytes */
  maxAttachmentSize: number;
  
  /** Supported attachment file types */
  supportedAttachmentTypes: string[];
}

/**
 * Interface for email channel configuration
 */
export interface IEmailChannelConfig extends IChannelConfig {
  /** SMTP server configuration */
  providerConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
}

/**
 * Interface for email notification channel
 */
export interface IEmailChannel extends IRetryableChannel {
  readonly channelType: NotificationChannel.EMAIL;
  readonly capabilities: IEmailChannelCapabilities;
  readonly config: IEmailChannelConfig;
  
  /**
   * Sends an email with attachments
   * @param to Recipient email address
   * @param subject Email subject
   * @param html Email HTML content
   * @param attachments Optional email attachments
   * @returns A promise that resolves to the delivery result
   */
  sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<IChannelDeliveryResult>;
}

/**
 * Interface for SMS channel capabilities
 */
export interface ISmsChannelCapabilities extends IChannelCapabilities {
  /** Maximum length of SMS messages in characters */
  maxMessageLength: number;
  
  /** Whether Unicode characters are supported */
  supportsUnicode: boolean;
  
  /** Whether message concatenation is supported for long messages */
  supportsConcatenation: boolean;
}

/**
 * Interface for SMS channel configuration
 */
export interface ISmsChannelConfig extends IChannelConfig {
  /** SMS provider configuration */
  providerConfig: {
    accountSid: string;
    authToken: string;
    defaultFrom: string;
  };
}

/**
 * Interface for SMS notification channel
 */
export interface ISmsChannel extends IRetryableChannel {
  readonly channelType: NotificationChannel.SMS;
  readonly capabilities: ISmsChannelCapabilities;
  readonly config: ISmsChannelConfig;
  
  /**
   * Sends an SMS message
   * @param phoneNumber Recipient phone number
   * @param message SMS message content
   * @returns A promise that resolves to the delivery result
   */
  sendSms(phoneNumber: string, message: string): Promise<IChannelDeliveryResult>;
}

/**
 * Interface for push notification channel capabilities
 */
export interface IPushChannelCapabilities extends IChannelCapabilities {
  /** Whether the channel supports action buttons */
  supportsActionButtons: boolean;
  
  /** Whether the channel supports notification badges */
  supportsBadges: boolean;
  
  /** Whether the channel supports notification sounds */
  supportsSounds: boolean;
  
  /** Whether the channel supports notification images */
  supportsImages: boolean;
  
  /** Maximum number of action buttons supported */
  maxActionButtons?: number;
}

/**
 * Interface for push channel configuration
 */
export interface IPushChannelConfig extends IChannelConfig {
  /** Push notification provider configuration */
  providerConfig: {
    apiKey: string;
    projectId?: string;
    appId?: string;
  };
}

/**
 * Interface for push notification channel
 */
export interface IPushChannel extends IRetryableChannel {
  readonly channelType: NotificationChannel.PUSH;
  readonly capabilities: IPushChannelCapabilities;
  readonly config: IPushChannelConfig;
  
  /**
   * Sends a push notification
   * @param token Device token
   * @param payload Push notification payload
   * @returns A promise that resolves to the delivery result
   */
  sendPush(token: string, payload: any): Promise<IChannelDeliveryResult>;
}

/**
 * Interface for in-app notification channel capabilities
 */
export interface IInAppChannelCapabilities extends IChannelCapabilities {
  /** Whether the channel supports notification persistence */
  supportsPersistence: boolean;
  
  /** Whether the channel supports notification actions */
  supportsActions: boolean;
  
  /** Whether the channel supports notification grouping */
  supportsGrouping: boolean;
  
  /** Whether the channel supports notification dismissal */
  supportsDismissal: boolean;
}

/**
 * Interface for in-app channel configuration
 */
export interface IInAppChannelConfig extends IChannelConfig {
  /** In-app notification provider configuration */
  providerConfig: {
    /** Time-to-live for notifications in seconds */
    ttl: number;
    
    /** Maximum number of notifications to store per user */
    maxNotificationsPerUser: number;
    
    /** Whether to persist notifications for offline users */
    persistForOfflineUsers: boolean;
  };
}

/**
 * Interface for in-app notification channel
 */
export interface IInAppChannel extends IRetryableChannel {
  readonly channelType: NotificationChannel.IN_APP;
  readonly capabilities: IInAppChannelCapabilities;
  readonly config: IInAppChannelConfig;
  
  /**
   * Sends an in-app notification
   * @param userId User ID
   * @param notification Notification entity
   * @returns A promise that resolves to the delivery result
   */
  sendInApp(userId: string, notification: NotificationEntity): Promise<IChannelDeliveryResult>;
  
  /**
   * Checks if a user is currently connected
   * @param userId User ID
   * @returns A promise that resolves to true if the user is connected
   */
  checkUserConnection(userId: string): Promise<boolean>;
  
  /**
   * Stores a notification for later delivery
   * @param userId User ID
   * @param notification Notification entity
   * @returns A promise that resolves to true if the notification was stored successfully
   */
  storeNotificationForLaterDelivery(userId: string, notification: NotificationEntity): Promise<boolean>;
}

/**
 * Interface for channel provider factory
 */
export interface IChannelProviderFactory {
  /**
   * Creates a notification channel instance
   * @param channelType The type of channel to create
   * @param config The channel configuration
   * @returns A promise that resolves to the channel instance
   */
  createChannel<T extends INotificationChannel>(channelType: NotificationChannel, config: IChannelConfig): Promise<T>;
  
  /**
   * Gets all available channel types
   * @returns An array of available channel types
   */
  getAvailableChannels(): NotificationChannel[];
  
  /**
   * Gets the default channel for a notification type
   * @param notificationType The notification type
   * @returns The default channel for the notification type
   */
  getDefaultChannelForType(notificationType: NotificationType): NotificationChannel;
}