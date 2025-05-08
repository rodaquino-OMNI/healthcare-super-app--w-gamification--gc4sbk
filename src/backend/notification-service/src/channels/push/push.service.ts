import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '@app/shared/logging/logger.service';
import { RetryService } from '@app/notification/retry/retry.service';
import { DlqService } from '@app/notification/retry/dlq/dlq.service';
import { TracingService } from '@austa/tracing';
import { 
  NotificationPriority,
  NotificationChannel,
  PushNotificationPayload,
  JourneyType
} from '@austa/interfaces/notification/types';
import { validatePushToken } from '@austa/interfaces/notification/validation';
import { 
  ExternalApiError, 
  ExternalDependencyUnavailableError,
  TimeoutError
} from '@austa/errors/categories';

/**
 * Service responsible for sending push notifications using Firebase Cloud Messaging (FCM).
 * Provides an abstraction layer for interacting with the FCM API and handles all
 * the necessary configuration and error handling with retry capabilities and DLQ integration.
 */
@Injectable()
export class PushService {
  private readonly apiKey: string;
  private readonly logger: LoggerService;
  private readonly defaultRetryOptions = {
    maxRetries: 3,
    initialDelay: 500, // ms
    maxDelay: 5000, // ms
    backoffFactor: 2,
    jitter: 0.2 // 20% jitter
  };

  /**
   * Initializes the PushService with the Firebase Admin SDK and the API key.
   * @param configService The NestJS config service for accessing configuration values
   * @param logger The logger service for logging events and errors
   * @param retryService Service for handling retries of failed operations
   * @param dlqService Service for managing dead-letter queue entries
   * @param tracingService Service for distributed tracing
   */
  constructor(
    private readonly configService: ConfigService,
    logger: LoggerService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    private readonly tracingService: TracingService
  ) {
    this.logger = logger;
    
    // Retrieve the push notification API key from the configuration
    this.apiKey = this.configService.get<string>('notification.push.apiKey');
    
    // Initialize Firebase Admin SDK
    this.initializeFirebaseAdmin();
  }

  /**
   * Initializes the Firebase Admin SDK for sending push notifications
   * @private
   */
  private initializeFirebaseAdmin(): void {
    if (!this.apiKey) {
      this.logger.warn('Push notification API key not configured', 'PushService');
      return;
    }
    
    // Only initialize if not already initialized
    if (admin.apps.length === 0) {
      try {
        // The API key could be a JSON string or a path to a service account file
        let serviceAccount;
        
        try {
          // Try to parse as JSON string
          serviceAccount = JSON.parse(this.apiKey);
        } catch (e) {
          // If not valid JSON, assume it's a path to a service account file
          serviceAccount = this.apiKey;
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        this.logger.log('Firebase Cloud Messaging initialized successfully', 'PushService');
      } catch (error) {
        this.logger.error(
          `Failed to initialize Firebase Cloud Messaging: ${error.message}`, 
          error.stack, 
          'PushService'
        );
      }
    }
  }

  /**
   * Sends a push notification to a user's device using FCM with retry capabilities.
   * @param token The device token to send the notification to
   * @param payload The notification payload containing title, body, and additional data
   * @param correlationId Optional correlation ID for request tracing
   * @returns A promise that resolves when the notification is sent successfully
   */
  async send(
    token: string, 
    payload: PushNotificationPayload, 
    correlationId?: string
  ): Promise<void> {
    // Generate correlation ID if not provided
    const traceId = correlationId || uuidv4();
    
    // Create a new span for this operation
    const span = this.tracingService.createSpan('push.send', { traceId });
    
    try {
      // Validate the token format
      if (!token || !validatePushToken(token)) {
        this.logger.warn(
          'Cannot send push notification: Invalid device token provided', 
          { token, traceId },
          'PushService'
        );
        throw new Error('Invalid device token format');
      }
      
      if (admin.apps.length === 0) {
        this.logger.error(
          'Cannot send push notification: Firebase Cloud Messaging not initialized', 
          { traceId },
          'PushService'
        );
        throw new ExternalDependencyUnavailableError(
          'Firebase Cloud Messaging not initialized',
          { service: 'FCM', correlationId: traceId }
        );
      }
      
      // Use retry service to handle potential transient errors
      await this.retryService.executeWithRetry(
        async () => this.sendNotification(token, payload, traceId),
        {
          ...this.defaultRetryOptions,
          context: {
            notificationId: payload.id,
            userId: payload.userId,
            channel: NotificationChannel.PUSH,
            correlationId: traceId
          }
        }
      );
    } catch (error) {
      // Add error to the span
      span.setError(error);
      
      // If retries are exhausted, send to DLQ
      if (error.retryExhausted) {
        await this.dlqService.addEntry({
          notificationId: payload.id,
          userId: payload.userId,
          channel: NotificationChannel.PUSH,
          payload,
          errorDetails: {
            message: error.message,
            stack: error.stack,
            type: error.name,
            code: error.code || 'UNKNOWN'
          },
          retryHistory: error.retryHistory || [],
          correlationId: traceId
        });
        
        this.logger.error(
          `Push notification failed after ${this.defaultRetryOptions.maxRetries} retries, sent to DLQ`, 
          {
            error: error.message,
            notificationId: payload.id,
            userId: payload.userId,
            traceId
          },
          'PushService'
        );
      } else {
        // For non-retry errors (like validation errors), just log and rethrow
        this.logger.error(
          `Failed to send push notification: ${error.message}`,
          {
            error: error.stack,
            notificationId: payload.id,
            userId: payload.userId,
            traceId
          },
          'PushService'
        );
        throw error;
      }
    } finally {
      // End the span
      span.end();
    }
  }

  /**
   * Internal method to send the notification to FCM
   * @param token Device token
   * @param payload Notification payload
   * @param correlationId Correlation ID for tracing
   * @private
   */
  private async sendNotification(
    token: string, 
    payload: PushNotificationPayload, 
    correlationId: string
  ): Promise<string> {
    try {
      // Construct the message payload with the provided title, body, and data
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      };
      
      // Add platform-specific configurations if provided
      if (payload.android) message.android = payload.android;
      if (payload.apns) message.apns = payload.apns;
      if (payload.webpush) message.webpush = payload.webpush;
      
      // Set priority based on notification priority or journey type
      this.applyPrioritySettings(message, payload);
      
      // Send the message to the specified device token using FCM
      const response = await this.executeWithTimeout(
        admin.messaging().send(message),
        10000, // 10 second timeout
        correlationId
      );
      
      // Logs the successful sending of the push notification
      this.logger.log(
        `Push notification sent successfully`,
        {
          messageId: response,
          tokenPreview: `${token.substring(0, 8)}...`,
          title: payload.title,
          journey: payload.journey || 'unknown',
          traceId: correlationId
        },
        'PushService'
      );
      
      return response;
    } catch (error) {
      // Classify FCM errors for better retry handling
      this.classifyAndEnhanceFcmError(error, correlationId);
      throw error;
    }
  }

  /**
   * Applies priority settings to the message based on notification priority or journey type
   * @param message FCM message object
   * @param payload Notification payload
   * @private
   */
  private applyPrioritySettings(
    message: admin.messaging.Message, 
    payload: PushNotificationPayload
  ): void {
    // If explicit priority is set, use it
    if (payload.priority) {
      switch (payload.priority) {
        case NotificationPriority.HIGH:
        case NotificationPriority.CRITICAL:
          if (message.android) {
            message.android.priority = 'high';
          }
          if (message.apns) {
            message.apns.headers = {
              ...message.apns.headers,
              'apns-priority': '10',
            };
          }
          break;
          
        case NotificationPriority.MEDIUM:
          // Default priorities are fine
          break;
          
        case NotificationPriority.LOW:
          if (message.android) {
            message.android.priority = 'normal';
          }
          if (message.apns) {
            message.apns.headers = {
              ...message.apns.headers,
              'apns-priority': '5',
            };
          }
          break;
      }
      return;
    }
    
    // If no explicit priority, infer from journey type
    if (payload.journey) {
      switch (payload.journey) {
        case JourneyType.CARE:
          // Care notifications are typically high priority (appointments, medication reminders)
          if (message.android) {
            message.android.priority = 'high';
          }
          if (message.apns) {
            message.apns.headers = {
              ...message.apns.headers,
              'apns-priority': '10',
            };
          }
          break;
          
        case JourneyType.HEALTH:
        case JourneyType.PLAN:
          // Default priorities are fine for health and plan journeys
          break;
      }
    }
  }

  /**
   * Executes a promise with a timeout
   * @param promise The promise to execute
   * @param timeoutMs Timeout in milliseconds
   * @param correlationId Correlation ID for tracing
   * @private
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    correlationId: string
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new TimeoutError(
          `Operation timed out after ${timeoutMs}ms`,
          { timeoutMs, correlationId }
        ));
      }, timeoutMs);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Classifies FCM errors and enhances them with additional context for better retry handling
   * @param error The original error from FCM
   * @param correlationId Correlation ID for tracing
   * @private
   */
  private classifyAndEnhanceFcmError(error: any, correlationId: string): void {
    // Already classified errors don't need further processing
    if (error.isClassified) return;
    
    const context = { service: 'FCM', correlationId };
    
    // FCM error codes that should be retried (transient errors)
    const retryableCodes = [
      'messaging/server-unavailable',
      'messaging/internal-error',
      'messaging/timeout',
      'messaging/network-error',
      'messaging/too-many-requests',
    ];
    
    // FCM error codes that should not be retried (permanent errors)
    const permanentCodes = [
      'messaging/invalid-argument',
      'messaging/invalid-recipient',
      'messaging/authentication-error',
      'messaging/unregistered',
    ];
    
    // Enhance the error with classification and context
    if (error.code) {
      if (retryableCodes.includes(error.code)) {
        // For retryable errors, convert to ExternalApiError with retryable flag
        Object.assign(error, new ExternalApiError(
          error.message || 'FCM transient error',
          { ...context, code: error.code, retryable: true }
        ));
      } else if (permanentCodes.includes(error.code)) {
        // For permanent errors, convert to ExternalApiError with non-retryable flag
        Object.assign(error, new ExternalApiError(
          error.message || 'FCM permanent error',
          { ...context, code: error.code, retryable: false }
        ));
      } else {
        // For unknown error codes, default to ExternalApiError
        Object.assign(error, new ExternalApiError(
          error.message || 'FCM unknown error',
          { ...context, code: error.code }
        ));
      }
    } else {
      // For errors without codes, use a generic ExternalApiError
      Object.assign(error, new ExternalApiError(
        error.message || 'FCM error',
        context
      ));
    }
    
    // Mark as classified to avoid double processing
    error.isClassified = true;
  }
}