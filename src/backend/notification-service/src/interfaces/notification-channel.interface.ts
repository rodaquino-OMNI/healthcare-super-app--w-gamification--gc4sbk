/**
 * @file notification-channel.interface.ts
 * @description Defines interfaces for notification channel configurations, capabilities, and integration with the retry subsystem.
 * This file provides a unified interface hierarchy for all notification delivery methods in the AUSTA SuperApp.
 */

import { NotificationEntity } from '../notifications/entities/notification.entity';
import { RetryPolicy } from '../retry/policies/retry-policy.interface';
import { NotificationErrorCategory } from '@austa/interfaces/notification';

/**
 * Defines the base capabilities that a notification channel can support.
 * Used for feature detection and fallback decision making.
 */
export interface IChannelCapabilities {
  /** Whether the channel supports rich content (HTML, formatting, etc.) */
  supportsRichContent: boolean;
  /** Whether the channel supports attachments (files, images, etc.) */
  supportsAttachments: boolean;
  /** Whether the channel supports delivery receipts */
  supportsDeliveryReceipts: boolean;
  /** Whether the channel supports read receipts */
  supportsReadReceipts: boolean;
  /** Whether the channel supports user interaction (buttons, actions, etc.) */
  supportsInteractiveElements: boolean;
  /** Maximum message size in bytes (if applicable) */
  maxMessageSize?: number;
  /** Whether the channel is journey-aware (can handle journey-specific formatting) */
  isJourneyAware: boolean;
  /** Whether the channel supports offline delivery (store and forward) */
  supportsOfflineDelivery: boolean;
  /** Whether the channel supports priority levels */
  supportsPriority: boolean;
}

/**
 * Base configuration interface for all notification channels.
 * Provides common configuration properties that all channels should implement.
 */
export interface IChannelConfig {
  /** Whether the channel is enabled */
  enabled: boolean;
  /** Maximum number of retries for failed deliveries */
  maxRetries: number;
  /** Retry policy to use for failed deliveries */
  retryPolicy: RetryPolicy;
  /** Timeout in milliseconds for delivery attempts */
  timeoutMs: number;
  /** Whether to use fallback channels if delivery fails */
  useFallback: boolean;
  /** Priority of this channel (lower number = higher priority) */
  priority: number;
  /** Journey-specific configuration overrides */
  journeyOverrides?: {
    [journeyKey: string]: Partial<IChannelConfig>;
  };
}

/**
 * Error classification for notification delivery failures.
 * Used to determine appropriate retry and fallback strategies.
 */
export interface IDeliveryError {
  /** Original error that caused the failure */
  originalError: Error;
  /** Error category for classification */
  category: NotificationErrorCategory;
  /** Whether this error is considered transient (temporary) */
  isTransient: boolean;
  /** Whether this error is related to the recipient (e.g., invalid email) */
  isRecipientError: boolean;
  /** Whether this error is related to the channel provider (e.g., SMS service down) */
  isProviderError: boolean;
  /** Whether this error is related to the message content (e.g., message too large) */
  isContentError: boolean;
  /** Recommended action for handling this error */
  recommendedAction: 'retry' | 'fallback' | 'drop' | 'alert';
  /** Time to wait before retrying (in milliseconds) */
  retryAfterMs?: number;
}

/**
 * Base interface for all notification channel providers.
 * Defines the contract that all channel providers must implement.
 */
export interface IChannelProvider {
  /** Unique identifier for this provider */
  readonly providerId: string;
  /** Display name of this provider */
  readonly displayName: string;
  /** Whether this provider is currently available */
  isAvailable(): Promise<boolean>;
  /** Get the current health status of this provider */
  getHealthStatus(): Promise<{
    isHealthy: boolean;
    details?: Record<string, any>;
  }>;
}

/**
 * Base interface for all notification channels.
 * Defines the core functionality that all notification channels must implement.
 */
export interface INotificationChannel<TConfig extends IChannelConfig = IChannelConfig> {
  /** Unique identifier for this channel */
  readonly channelId: string;
  /** Display name of this channel */
  readonly displayName: string;
  /** Channel type (email, sms, push, in-app) */
  readonly channelType: 'email' | 'sms' | 'push' | 'in-app';
  /** Channel provider */
  readonly provider: IChannelProvider;
  /** Channel configuration */
  readonly config: TConfig;
  /** Channel capabilities */
  readonly capabilities: IChannelCapabilities;
  
  /**
   * Sends a notification through this channel.
   * @param recipientId - ID of the recipient (user ID, email, phone number, etc.)
   * @param notification - The notification entity to send
   * @returns A promise that resolves to a delivery result
   */
  send(recipientId: string, notification: NotificationEntity): Promise<IDeliveryResult>;
  
  /**
   * Checks if this channel can deliver to the specified recipient.
   * @param recipientId - ID of the recipient to check
   * @returns A promise that resolves to true if the channel can deliver to the recipient
   */
  canDeliver(recipientId: string): Promise<boolean>;
  
  /**
   * Validates the notification content for this channel.
   * @param notification - The notification to validate
   * @returns A promise that resolves to a validation result
   */
  validateContent(notification: NotificationEntity): Promise<{
    isValid: boolean;
    errors?: string[];
  }>;
  
  /**
   * Classifies a delivery error for retry and fallback decisions.
   * @param error - The error that occurred during delivery
   * @param recipientId - ID of the recipient
   * @param notification - The notification that failed to deliver
   * @returns A classified delivery error
   */
  classifyError(error: Error, recipientId: string, notification: NotificationEntity): IDeliveryError;
}

/**
 * Result of a notification delivery attempt.
 * Contains information about the delivery status and any errors that occurred.
 */
export interface IDeliveryResult {
  /** Whether the delivery was successful */
  success: boolean;
  /** Unique identifier for this delivery attempt */
  deliveryId?: string;
  /** Timestamp when the delivery was attempted */
  timestamp: Date;
  /** Error that occurred during delivery (if any) */
  error?: IDeliveryError;
  /** Provider-specific response details */
  providerResponse?: Record<string, any>;
  /** Number of retry attempts made */
  retryCount: number;
  /** Whether this was delivered through a fallback channel */
  usedFallback: boolean;
  /** ID of the fallback channel used (if any) */
  fallbackChannelId?: string;
}

/**
 * Email channel specific configuration.
 */
export interface IEmailChannelConfig extends IChannelConfig {
  /** SMTP host */
  host: string;
  /** SMTP port */
  port: number;
  /** Whether to use secure connection */
  secure: boolean;
  /** SMTP authentication user */
  user: string;
  /** SMTP authentication password */
  password: string;
  /** Default sender email address */
  from: string;
  /** Whether to use HTML content by default */
  useHtml: boolean;
  /** Maximum attachment size in bytes */
  maxAttachmentSize: number;
}

/**
 * SMS channel specific configuration.
 */
export interface ISmsChannelConfig extends IChannelConfig {
  /** SMS provider account SID */
  accountSid: string;
  /** SMS provider authentication token */
  authToken: string;
  /** Default sender phone number */
  defaultFrom: string;
  /** Maximum message length */
  maxMessageLength: number;
  /** Whether to split long messages */
  splitLongMessages: boolean;
}

/**
 * Push notification channel specific configuration.
 */
export interface IPushChannelConfig extends IChannelConfig {
  /** Firebase Cloud Messaging API key or service account */
  apiKey: string;
  /** Default notification icon */
  defaultIcon?: string;
  /** Default notification sound */
  defaultSound?: string;
  /** Whether to use high priority by default */
  highPriorityByDefault: boolean;
  /** Time-to-live in seconds */
  ttlSeconds: number;
  /** Platform-specific configuration */
  platformConfig?: {
    android?: Record<string, any>;
    ios?: Record<string, any>;
    web?: Record<string, any>;
  };
}

/**
 * In-app notification channel specific configuration.
 */
export interface IInAppChannelConfig extends IChannelConfig {
  /** Whether to persist notifications */
  persistNotifications: boolean;
  /** Time-to-live in seconds for persisted notifications */
  persistenceTtlSeconds: number;
  /** Maximum number of notifications to keep per user */
  maxNotificationsPerUser: number;
  /** Whether to mark notifications as read when delivered */
  markAsReadOnDelivery: boolean;
  /** Whether to use WebSockets for delivery */
  useWebSockets: boolean;
  /** Fallback polling interval in milliseconds (if WebSockets not available) */
  pollingIntervalMs?: number;
}

/**
 * Email channel specific interface.
 */
export interface IEmailChannel extends INotificationChannel<IEmailChannelConfig> {
  /**
   * Sends an email with attachments.
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param content - Email content (HTML or plain text)
   * @param attachments - Optional attachments
   * @returns A promise that resolves to a delivery result
   */
  sendWithAttachments(to: string, subject: string, content: string, attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>): Promise<IDeliveryResult>;
  
  /**
   * Validates an email address.
   * @param email - Email address to validate
   * @returns Whether the email address is valid
   */
  validateEmailAddress(email: string): boolean;
}

/**
 * SMS channel specific interface.
 */
export interface ISmsChannel extends INotificationChannel<ISmsChannelConfig> {
  /**
   * Validates a phone number.
   * @param phoneNumber - Phone number to validate
   * @returns Whether the phone number is valid
   */
  validatePhoneNumber(phoneNumber: string): boolean;
  
  /**
   * Formats a phone number for delivery.
   * @param phoneNumber - Phone number to format
   * @returns Formatted phone number
   */
  formatPhoneNumber(phoneNumber: string): string;
}

/**
 * Push notification channel specific interface.
 */
export interface IPushChannel extends INotificationChannel<IPushChannelConfig> {
  /**
   * Registers a device token for a user.
   * @param userId - User ID
   * @param token - Device token
   * @param platform - Device platform (ios, android, web)
   * @returns A promise that resolves when the token is registered
   */
  registerDeviceToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void>;
  
  /**
   * Unregisters a device token for a user.
   * @param userId - User ID
   * @param token - Device token to unregister
   * @returns A promise that resolves when the token is unregistered
   */
  unregisterDeviceToken(userId: string, token: string): Promise<void>;
  
  /**
   * Gets all device tokens for a user.
   * @param userId - User ID
   * @returns A promise that resolves to an array of device tokens
   */
  getDeviceTokens(userId: string): Promise<Array<{
    token: string;
    platform: 'ios' | 'android' | 'web';
    lastUsed: Date;
  }>>;
}

/**
 * In-app notification channel specific interface.
 */
export interface IInAppChannel extends INotificationChannel<IInAppChannelConfig> {
  /**
   * Checks if a user is currently connected.
   * @param userId - User ID to check
   * @returns A promise that resolves to true if the user is connected
   */
  isUserConnected(userId: string): Promise<boolean>;
  
  /**
   * Gets all pending notifications for a user.
   * @param userId - User ID
   * @returns A promise that resolves to an array of pending notifications
   */
  getPendingNotifications(userId: string): Promise<NotificationEntity[]>;
  
  /**
   * Marks a notification as read.
   * @param userId - User ID
   * @param notificationId - Notification ID to mark as read
   * @returns A promise that resolves when the notification is marked as read
   */
  markAsRead(userId: string, notificationId: string): Promise<void>;
  
  /**
   * Marks all notifications as read for a user.
   * @param userId - User ID
   * @returns A promise that resolves when all notifications are marked as read
   */
  markAllAsRead(userId: string): Promise<void>;
}