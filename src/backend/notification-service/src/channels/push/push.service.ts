import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Use standardized path aliases
import { LoggerService } from '@app/shared/logging';
import { RetryService } from '@app/notification/retry';
import { DlqService } from '@app/notification/retry/dlq';

// Import from @austa/interfaces for standardized schemas
import { 
  NotificationChannel, 
  NotificationType, 
  NotificationPriority 
} from '@austa/interfaces/notification/types';
import { IPushNotificationPayload } from '@austa/interfaces/notification/payload';
import { validateDeviceToken } from '@austa/interfaces/notification/validation';

// Import interfaces for channel implementation
import { 
  IPushChannel, 
  IPushChannelCapabilities, 
  IPushChannelConfig,
  IChannelDeliveryResult,
  IChannelError,
  FailureClassification,
  ChannelStatus
} from '../../interfaces/notification-channel.interface';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';

/**
 * Service responsible for sending push notifications using Firebase Cloud Messaging (FCM).
 * Provides an abstraction layer for interacting with the FCM API and handles all
 * the necessary configuration, error handling, and retry logic.
 * 
 * Implements the IPushChannel interface for standardized channel operations.
 */
@Injectable()
export class PushService implements IPushChannel {
  // Channel type identifier
  readonly channelType = NotificationChannel.PUSH;
  
  // Channel capabilities
  readonly capabilities: IPushChannelCapabilities = {
    supportsRichContent: true,
    supportsAttachments: false,
    supportsDeliveryConfirmation: true,
    supportsReadReceipts: false,
    supportsActionButtons: true,
    supportsBadges: true,
    supportsSounds: true,
    supportsImages: true,
    maxActionButtons: 3,
    maxContentSize: 4096, // FCM payload limit in bytes
    supportedPriorities: [
      NotificationPriority.LOW,
      NotificationPriority.MEDIUM,
      NotificationPriority.HIGH,
      NotificationPriority.CRITICAL
    ],
    supportedTypes: [
      // All notification types are supported for push
      NotificationType.SYSTEM,
      NotificationType.ACHIEVEMENT,
      NotificationType.APPOINTMENT,
      NotificationType.MEDICATION,
      NotificationType.CLAIM,
      NotificationType.HEALTH,
      NotificationType.PLAN,
      NotificationType.CARE
    ]
  };
  
  // Channel configuration
  readonly config: IPushChannelConfig;
  
  // Private properties
  private initialized = false;
  private readonly correlationIdKey = 'x-correlation-id';

  /**
   * Initializes the PushService with the Firebase Admin SDK and the API key.
   * @param configService The NestJS config service for accessing configuration values
   * @param logger The logger service for logging events and errors
   * @param retryService Service for handling retry operations
   * @param dlqService Service for handling dead-letter queue operations
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService
  ) {
    // Initialize configuration from environment
    this.config = {
      enabled: this.configService.get<boolean>('notification.push.enabled', true),
      maxRetryAttempts: this.configService.get<number>('notification.push.maxRetryAttempts', 3),
      retryOptions: {
        maxRetries: this.configService.get<number>('notification.push.maxRetryAttempts', 3),
        initialDelay: this.configService.get<number>('notification.push.initialRetryDelay', 1000),
        maxDelay: this.configService.get<number>('notification.push.maxRetryDelay', 60000),
        factor: this.configService.get<number>('notification.push.retryBackoffFactor', 2),
        jitter: this.configService.get<boolean>('notification.push.retryJitter', true)
      },
      providerConfig: {
        apiKey: this.configService.get<string>('notification.push.apiKey'),
        projectId: this.configService.get<string>('notification.push.projectId'),
        appId: this.configService.get<string>('notification.push.appId')
      },
      fallbackChannel: this.configService.get<NotificationChannel>('notification.push.fallbackChannel', NotificationChannel.IN_APP)
    };
    
    // Initialize Firebase Admin SDK
    this.initializeFirebaseAdmin();
  }

  /**
   * Initializes the Firebase Admin SDK for sending push notifications
   * @private
   */
  private initializeFirebaseAdmin(): void {
    if (!this.config.enabled) {
      this.logger.warn('Push notification channel is disabled', { channel: this.channelType });
      return;
    }
    
    if (!this.config.providerConfig.apiKey) {
      this.logger.warn('Push notification API key not configured', { channel: this.channelType });
      return;
    }
    
    // Only initialize if not already initialized
    if (admin.apps.length === 0) {
      try {
        // The API key could be a JSON string or a path to a service account file
        let serviceAccount;
        
        try {
          // Try to parse as JSON string
          serviceAccount = JSON.parse(this.config.providerConfig.apiKey);
        } catch (e) {
          // If not valid JSON, assume it's a path to a service account file
          serviceAccount = this.config.providerConfig.apiKey;
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.config.providerConfig.projectId
        });
        
        this.initialized = true;
        this.logger.log('Firebase Cloud Messaging initialized successfully', { 
          channel: this.channelType,
          projectId: this.config.providerConfig.projectId
        });
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Cloud Messaging', { 
          error: error.message,
          stack: error.stack,
          channel: this.channelType
        });
      }
    } else {
      this.initialized = true;
    }
  }

  /**
   * Sends a notification through this channel
   * @param token The device token to send the notification to
   * @param notification The notification entity to send
   * @returns A promise that resolves to the delivery result
   */
  async send(token: string, notification: NotificationEntity): Promise<IChannelDeliveryResult> {
    const correlationId = notification.metadata?.correlationId || uuidv4();
    const attemptId = uuidv4();
    const logContext = { 
      correlationId,
      attemptId,
      notificationId: notification.id,
      channel: this.channelType,
      tokenPreview: token ? `${token.substring(0, 8)}...` : 'undefined'
    };
    
    // Validate token
    if (!this.validateRecipient(token)) {
      const error: IChannelError = {
        code: 'INVALID_TOKEN',
        message: 'Invalid device token format',
        classification: FailureClassification.PERMANENT,
        context: { token: token ? `${token.substring(0, 8)}...` : 'undefined' }
      };
      
      this.logger.warn('Cannot send push notification: Invalid device token', {
        ...logContext,
        error: error.code
      });
      
      return {
        success: false,
        attemptId,
        timestamp: new Date(),
        error
      };
    }
    
    // Check if Firebase is initialized
    if (!this.initialized || admin.apps.length === 0) {
      const error: IChannelError = {
        code: 'FCM_NOT_INITIALIZED',
        message: 'Firebase Cloud Messaging not initialized',
        classification: FailureClassification.SERVICE_UNAVAILABLE,
        context: { initialized: this.initialized }
      };
      
      this.logger.error('Cannot send push notification: Firebase Cloud Messaging not initialized', {
        ...logContext,
        error: error.code
      });
      
      return {
        success: false,
        attemptId,
        timestamp: new Date(),
        error
      };
    }
    
    try {
      // Convert notification entity to push payload
      const payload = this.createPushPayload(notification);
      
      // Send the push notification
      const result = await this.sendPush(token, payload);
      
      // Return the delivery result
      return result;
    } catch (error) {
      // Classify the error
      const classifiedError = this.classifyError(error);
      
      this.logger.error('Failed to send push notification', {
        ...logContext,
        error: classifiedError.code,
        errorMessage: classifiedError.message,
        classification: classifiedError.classification
      });
      
      return {
        success: false,
        attemptId,
        timestamp: new Date(),
        error: classifiedError
      };
    }
  }

  /**
   * Sends a push notification with retry support
   * @param token Device token
   * @param payload Push notification payload
   * @returns A promise that resolves to the delivery result
   */
  async sendPush(token: string, payload: IPushNotificationPayload): Promise<IChannelDeliveryResult> {
    const correlationId = payload.metadata?.correlationId || uuidv4();
    const attemptId = uuidv4();
    const logContext = { 
      correlationId,
      attemptId,
      notificationId: payload.id,
      channel: this.channelType,
      tokenPreview: token ? `${token.substring(0, 8)}...` : 'undefined',
      title: payload.title,
      journey: payload.data?.journey || 'unknown'
    };
    
    try {
      // Construct the message payload with the provided title, body, and data
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: this.prepareDataPayload(payload),
        android: this.getAndroidConfig(payload),
        apns: this.getApnsConfig(payload),
        webpush: this.getWebpushConfig(payload),
        // Add correlation ID for tracing
        [this.correlationIdKey]: correlationId
      };
      
      // Send the message to the specified device token using FCM
      const response = await admin.messaging().send(message);
      
      // Logs the successful sending of the push notification
      this.logger.log('Push notification sent successfully', {
        ...logContext,
        messageId: response
      });
      
      return {
        success: true,
        attemptId,
        timestamp: new Date(),
        providerMessageId: response,
        metadata: {
          correlationId,
          journey: payload.data?.journey,
          notificationType: payload.type
        }
      };
    } catch (error) {
      // Classify the error
      const classifiedError = this.classifyError(error);
      
      this.logger.error('Failed to send push notification', {
        ...logContext,
        error: classifiedError.code,
        errorMessage: classifiedError.message,
        classification: classifiedError.classification,
        originalError: error.message
      });
      
      return {
        success: false,
        attemptId,
        timestamp: new Date(),
        error: classifiedError
      };
    }
  }

  /**
   * Prepares the data payload for FCM by ensuring all values are strings
   * @param payload The notification payload
   * @returns An object with string values for FCM data field
   */
  private prepareDataPayload(payload: IPushNotificationPayload): Record<string, string> {
    const data: Record<string, string> = {};
    
    // Add journey information
    if (payload.data?.journey) {
      data.journey = payload.data.journey;
    }
    
    // Add notification type
    if (payload.type) {
      data.type = payload.type.toString();
    }
    
    // Add notification ID if available
    if (payload.id) {
      data.notificationId = payload.id.toString();
    }
    
    // Add correlation ID for tracing
    if (payload.metadata?.correlationId) {
      data.correlationId = payload.metadata.correlationId;
    }
    
    // Add action information if available
    if (payload.data?.action) {
      data.actionType = payload.data.action.type;
      data.actionTarget = payload.data.action.target;
      
      // Convert action params to string
      if (payload.data.action.params) {
        data.actionParams = JSON.stringify(payload.data.action.params);
      }
    }
    
    // Add any additional data from the payload
    if (payload.data) {
      // Convert all values to strings as required by FCM
      Object.entries(payload.data).forEach(([key, value]) => {
        // Skip already processed fields and objects
        if (key !== 'journey' && key !== 'action' && typeof value !== 'object') {
          data[key] = String(value);
        }
      });
    }
    
    return data;
  }

  /**
   * Gets the Android-specific configuration for the notification
   * @param payload The notification payload
   * @returns Android-specific configuration
   */
  private getAndroidConfig(payload: IPushNotificationPayload): admin.messaging.AndroidConfig | undefined {
    // Return undefined if no Android-specific configuration is needed
    if (!payload.channelId && !payload.priority) {
      return undefined;
    }
    
    const androidConfig: admin.messaging.AndroidConfig = {
      priority: this.getAndroidPriority(payload.priority),
    };
    
    // Add notification channel ID if provided
    if (payload.channelId) {
      androidConfig.notification = {
        channelId: payload.channelId
      };
    }
    
    return androidConfig;
  }

  /**
   * Gets the APNS-specific configuration for the notification
   * @param payload The notification payload
   * @returns APNS-specific configuration
   */
  private getApnsConfig(payload: IPushNotificationPayload): admin.messaging.ApnsConfig | undefined {
    // Return undefined if no APNS-specific configuration is needed
    if (!payload.badge && !payload.sound && !payload.category && !payload.priority) {
      return undefined;
    }
    
    const apnsConfig: admin.messaging.ApnsConfig = {
      headers: {}
    };
    
    // Add priority header based on notification priority
    if (payload.priority) {
      apnsConfig.headers['apns-priority'] = this.getApnsPriority(payload.priority);
    }
    
    // Add payload configuration
    apnsConfig.payload = {
      aps: {}
    };
    
    // Add badge if provided
    if (payload.badge !== undefined) {
      apnsConfig.payload.aps.badge = payload.badge;
    }
    
    // Add sound if provided
    if (payload.sound) {
      apnsConfig.payload.aps.sound = payload.sound;
    }
    
    // Add category if provided
    if (payload.category) {
      apnsConfig.payload.aps.category = payload.category;
    }
    
    return apnsConfig;
  }

  /**
   * Gets the Webpush-specific configuration for the notification
   * @param payload The notification payload
   * @returns Webpush-specific configuration
   */
  private getWebpushConfig(payload: IPushNotificationPayload): admin.messaging.WebpushConfig | undefined {
    // Return undefined if no Webpush-specific configuration is needed
    return undefined;
  }

  /**
   * Maps notification priority to Android priority
   * @param priority Notification priority
   * @returns Android priority string
   */
  private getAndroidPriority(priority?: string): 'high' | 'normal' {
    if (!priority) return 'normal';
    
    switch (priority) {
      case 'high':
      case 'max':
      case NotificationPriority.HIGH:
      case NotificationPriority.CRITICAL:
        return 'high';
      default:
        return 'normal';
    }
  }

  /**
   * Maps notification priority to APNS priority
   * @param priority Notification priority
   * @returns APNS priority string
   */
  private getApnsPriority(priority?: string): string {
    if (!priority) return '5';
    
    switch (priority) {
      case 'high':
      case 'max':
      case NotificationPriority.HIGH:
      case NotificationPriority.CRITICAL:
        return '10'; // Immediate delivery
      case NotificationPriority.MEDIUM:
        return '5'; // Regular priority
      case NotificationPriority.LOW:
        return '1'; // Save battery
      default:
        return '5';
    }
  }

  /**
   * Creates a push notification payload from a notification entity
   * @param notification The notification entity
   * @returns Push notification payload
   */
  private createPushPayload(notification: NotificationEntity): IPushNotificationPayload {
    // Extract journey information from the notification
    const journey = notification.data?.journey;
    
    // Create the push payload
    const payload: IPushNotificationPayload = {
      id: notification.id,
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      timestamp: notification.createdAt.toISOString(),
      type: notification.type,
      data: notification.data,
      metadata: notification.metadata || {}
    };
    
    // Add correlation ID if not present
    if (!payload.metadata.correlationId) {
      payload.metadata.correlationId = uuidv4();
    }
    
    // Add journey-specific configurations
    if (journey) {
      // Set appropriate priority based on journey and notification type
      payload.priority = this.getJourneyPriority(journey, notification.type);
      
      // Set appropriate channel ID for Android based on journey
      payload.channelId = this.getJourneyChannelId(journey);
    }
    
    return payload;
  }

  /**
   * Gets the appropriate priority for a notification based on journey and type
   * @param journey The journey identifier
   * @param type The notification type
   * @returns The notification priority
   */
  private getJourneyPriority(journey: string, type: string): string {
    // Critical notifications for specific types
    if (
      type === 'care.appointment.reminder' || 
      type === 'care.telemedicine.ready' ||
      type === 'health.metric.critical' ||
      type === 'system.security'
    ) {
      return NotificationPriority.CRITICAL;
    }
    
    // High priority for important notifications
    if (
      type === 'care.medication.reminder' ||
      type === 'plan.claim.approved' ||
      type === 'plan.claim.rejected'
    ) {
      return NotificationPriority.HIGH;
    }
    
    // Medium priority for standard notifications
    if (
      type === 'gamification.achievement.unlocked' ||
      type === 'health.goal.achieved'
    ) {
      return NotificationPriority.MEDIUM;
    }
    
    // Default priorities based on journey
    switch (journey) {
      case 'care':
        return NotificationPriority.HIGH;
      case 'health':
      case 'plan':
        return NotificationPriority.MEDIUM;
      case 'gamification':
        return NotificationPriority.LOW;
      case 'system':
        return NotificationPriority.MEDIUM;
      default:
        return NotificationPriority.MEDIUM;
    }
  }

  /**
   * Gets the appropriate Android channel ID for a journey
   * @param journey The journey identifier
   * @returns The Android channel ID
   */
  private getJourneyChannelId(journey: string): string {
    switch (journey) {
      case 'care':
        return 'care_notifications';
      case 'health':
        return 'health_notifications';
      case 'plan':
        return 'plan_notifications';
      case 'gamification':
        return 'gamification_notifications';
      case 'system':
        return 'system_notifications';
      default:
        return 'default_channel';
    }
  }

  /**
   * Checks if this channel can handle the given notification type
   * @param notificationType The notification type to check
   * @returns True if this channel can handle the notification type
   */
  canHandle(notificationType: NotificationType): boolean {
    return this.capabilities.supportedTypes.includes(notificationType as any);
  }

  /**
   * Validates a device token for this channel
   * @param token The device token to validate
   * @returns True if the token is valid for this channel
   */
  validateRecipient(token: string): boolean {
    if (!token) return false;
    
    // Use the validation function from @austa/interfaces
    return validateDeviceToken(token);
  }

  /**
   * Gets the current status of the channel
   * @returns A promise that resolves to the channel status
   */
  async getStatus(): Promise<ChannelStatus> {
    if (!this.config.enabled) {
      return ChannelStatus.OFFLINE;
    }
    
    if (!this.initialized || admin.apps.length === 0) {
      return ChannelStatus.OFFLINE;
    }
    
    try {
      // Try to send a test message to verify FCM is working
      // This is a dry run that doesn't actually send a notification
      await admin.messaging().send({
        token: 'fcm-test-token-not-real',
        notification: { title: 'Test', body: 'Test' },
        android: { direct_boot_ok: true },
      }, true); // true = dry run
      
      return ChannelStatus.ONLINE;
    } catch (error) {
      // If the error is only about the invalid token, FCM is working
      if (error.code === 'messaging/invalid-recipient') {
        return ChannelStatus.ONLINE;
      }
      
      // For other errors, consider the service degraded
      return ChannelStatus.DEGRADED;
    }
  }

  /**
   * Gets the current retry status for a specific notification
   * @param notificationId The ID of the notification
   * @returns A promise that resolves to the retry status
   */
  async getRetryStatus(notificationId: string): Promise<RetryStatus> {
    return this.retryService.getRetryStatus(this.channelType, notificationId);
  }

  /**
   * Schedules a retry for a failed notification
   * @param token The device token
   * @param notification The notification entity
   * @param error The error that caused the failure
   * @returns A promise that resolves when the retry is scheduled
   */
  async scheduleRetry(token: string, notification: NotificationEntity, error: IChannelError): Promise<void> {
    // Don't retry if the error is permanent
    if (error.classification === FailureClassification.PERMANENT) {
      await this.sendToDlq(token, notification, error);
      return;
    }
    
    // Get the current retry count
    const retryStatus = await this.getRetryStatus(notification.id);
    const retryCount = retryStatus === RetryStatus.PENDING ? 1 : 
                       (notification.metadata?.retryCount || 0) + 1;
    
    // Check if we've exceeded the maximum retry attempts
    if (retryCount > this.config.maxRetryAttempts) {
      this.logger.warn('Maximum retry attempts exceeded for push notification', {
        notificationId: notification.id,
        channel: this.channelType,
        retryCount,
        maxRetries: this.config.maxRetryAttempts
      });
      
      await this.sendToDlq(token, notification, error);
      return;
    }
    
    // Update the notification metadata with retry information
    const updatedNotification = { ...notification };
    if (!updatedNotification.metadata) {
      updatedNotification.metadata = {};
    }
    
    updatedNotification.metadata.retryCount = retryCount;
    updatedNotification.metadata.lastRetryAt = new Date().toISOString();
    updatedNotification.metadata.lastError = error.code;
    
    // Schedule the retry with exponential backoff
    await this.retryService.scheduleRetry({
      channel: this.channelType,
      notificationId: notification.id,
      recipient: token,
      notification: updatedNotification,
      retryCount,
      error
    });
    
    this.logger.log('Scheduled retry for push notification', {
      notificationId: notification.id,
      channel: this.channelType,
      retryCount,
      nextRetryAt: new Date(Date.now() + this.calculateBackoff(retryCount)).toISOString()
    });
  }

  /**
   * Sends a failed notification to the dead-letter queue
   * @param token The device token
   * @param notification The notification entity
   * @param error The error that caused the failure
   * @returns A promise that resolves when the notification is sent to the DLQ
   */
  private async sendToDlq(token: string, notification: NotificationEntity, error: IChannelError): Promise<void> {
    await this.dlqService.addToDlq({
      notificationId: notification.id,
      userId: notification.userId,
      channel: this.channelType,
      recipient: token,
      payload: notification,
      errorDetails: error,
      retryHistory: notification.metadata?.retryHistory || [],
      metadata: {
        correlationId: notification.metadata?.correlationId,
        journey: notification.data?.journey,
        notificationType: notification.type
      }
    });
    
    this.logger.log('Push notification sent to dead-letter queue', {
      notificationId: notification.id,
      channel: this.channelType,
      errorCode: error.code,
      errorClassification: error.classification
    });
  }

  /**
   * Calculates the backoff time for a retry attempt
   * @param retryCount The current retry count
   * @returns The backoff time in milliseconds
   */
  private calculateBackoff(retryCount: number): number {
    const { initialDelay, maxDelay, factor, jitter } = this.config.retryOptions;
    
    // Calculate exponential backoff: initialDelay * (factor ^ retryCount)
    let delay = initialDelay * Math.pow(factor, retryCount - 1);
    
    // Apply maximum delay cap
    delay = Math.min(delay, maxDelay);
    
    // Apply jitter to prevent thundering herd problem
    if (jitter) {
      // Add random jitter between 0% and 25%
      const jitterAmount = delay * 0.25 * Math.random();
      delay = delay + jitterAmount;
    }
    
    return delay;
  }

  /**
   * Classifies an error to determine retry strategy
   * @param error The error to classify
   * @returns The classified error with failure classification
   */
  classifyError(error: any): IChannelError {
    // Default error information
    const classifiedError: IChannelError = {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      classification: FailureClassification.UNKNOWN,
      originalError: error
    };
    
    // If it's already a classified error, return it
    if (error.classification) {
      return error;
    }
    
    // Firebase error codes
    if (error.code) {
      switch (error.code) {
        // Permanent errors - don't retry
        case 'messaging/invalid-argument':
        case 'messaging/invalid-recipient':
        case 'messaging/invalid-registration-token':
        case 'messaging/registration-token-not-registered':
          return {
            code: error.code,
            message: error.message,
            classification: FailureClassification.PERMANENT,
            originalError: error
          };
        
        // Rate limiting errors - retry with backoff
        case 'messaging/quota-exceeded':
        case 'messaging/device-message-rate-exceeded':
        case 'messaging/topics-message-rate-exceeded':
          return {
            code: error.code,
            message: error.message,
            classification: FailureClassification.RATE_LIMITED,
            originalError: error
          };
        
        // Authentication errors - may require manual intervention
        case 'messaging/authentication-error':
        case 'messaging/server-unavailable':
          return {
            code: error.code,
            message: error.message,
            classification: FailureClassification.AUTH_ERROR,
            originalError: error
          };
        
        // Transient errors - retry
        case 'messaging/internal-error':
        case 'messaging/server-unavailable':
        case 'messaging/timeout':
        case 'messaging/network-error':
          return {
            code: error.code,
            message: error.message,
            classification: FailureClassification.TRANSIENT,
            originalError: error
          };
        
        // Service unavailable - retry
        case 'messaging/third-party-auth-error':
        case 'messaging/unknown-error':
          return {
            code: error.code,
            message: error.message,
            classification: FailureClassification.SERVICE_UNAVAILABLE,
            originalError: error
          };
      }
    }
    
    // Network errors - retry
    if (error.name === 'NetworkError' || 
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        classification: FailureClassification.TRANSIENT,
        originalError: error
      };
    }
    
    // Return the default classification
    return classifiedError;
  }
}