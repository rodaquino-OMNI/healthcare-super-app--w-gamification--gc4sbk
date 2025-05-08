import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { Span } from '@nestjs/opentelemetry';

import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { NotificationErrorCategory } from '@austa/interfaces/notification';

import { RetryService } from '../../retry/retry.service';
import { DlqService } from '../../retry/dlq/dlq.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ISmsChannel, ISmsChannelConfig, IDeliveryResult, IDeliveryError } from '../../interfaces/notification-channel.interface';
import { NotificationEntity } from '../../notifications/entities/notification.entity';
import { IRetryableOperation } from '../../retry/interfaces/retryable-operation.interface';

/**
 * Service responsible for sending SMS notifications using Twilio.
 * This service implements the ISmsChannel interface and provides enhanced
 * functionality including retry policies, error classification, and
 * integration with the dead-letter queue.
 */
@Injectable()
export class SmsService implements ISmsChannel {
  readonly channelId = 'sms';
  readonly displayName = 'SMS';
  readonly channelType = 'sms' as const;
  private twilioClient: Twilio;
  
  /**
   * Channel configuration with default values
   */
  readonly config: ISmsChannelConfig = {
    enabled: true,
    maxRetries: 3,
    retryPolicy: 'exponential-backoff',
    timeoutMs: 10000,
    useFallback: true,
    priority: 2,
    accountSid: '',
    authToken: '',
    defaultFrom: '',
    maxMessageLength: 160,
    splitLongMessages: true,
    journeyOverrides: {
      health: {
        priority: 1, // Higher priority for health-related SMS
        maxRetries: 5
      },
      care: {
        priority: 1, // Higher priority for care-related SMS
        maxRetries: 5
      }
    }
  };

  /**
   * Channel capabilities
   */
  readonly capabilities = {
    supportsRichContent: false,
    supportsAttachments: false,
    supportsDeliveryReceipts: true,
    supportsReadReceipts: false,
    supportsInteractiveElements: false,
    maxMessageSize: 1600, // 10 segments of 160 characters
    isJourneyAware: true,
    supportsOfflineDelivery: true,
    supportsPriority: true
  };

  /**
   * Channel provider information
   */
  readonly provider = {
    providerId: 'twilio',
    displayName: 'Twilio SMS',
    isAvailable: async () => {
      try {
        // Check if Twilio API is available
        await this.twilioClient.api.v2010.accounts(this.config.accountSid).fetch();
        return true;
      } catch (error) {
        this.logger.error(
          'Twilio provider availability check failed',
          error,
          'SmsService',
          { providerId: 'twilio', error: error.message }
        );
        return false;
      }
    },
    getHealthStatus: async () => {
      try {
        // Check Twilio API health
        await this.twilioClient.api.v2010.accounts(this.config.accountSid).fetch();
        return { isHealthy: true };
      } catch (error) {
        return {
          isHealthy: false,
          details: {
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
          }
        };
      }
    }
  };

  /**
   * Initializes the SmsService with the Twilio client and configuration.
   * 
   * @param configService - The NestJS config service for accessing configuration
   * @param logger - The logger service for structured logging
   * @param tracingService - The tracing service for distributed tracing
   * @param retryService - The retry service for handling failed deliveries
   * @param dlqService - The dead-letter queue service for handling exhausted retries
   * @param notificationsService - The notifications service for fallback channels
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {
    // Load configuration from environment
    this.config.accountSid = this.configService.get<string>('notification.sms.accountSid');
    this.config.authToken = this.configService.get<string>('notification.sms.authToken');
    this.config.defaultFrom = this.configService.get<string>('notification.sms.defaultFrom');
    
    // Override defaults with environment values if provided
    const maxRetries = this.configService.get<number>('notification.sms.maxRetries');
    if (maxRetries !== undefined) {
      this.config.maxRetries = maxRetries;
    }
    
    const timeoutMs = this.configService.get<number>('notification.sms.timeoutMs');
    if (timeoutMs !== undefined) {
      this.config.timeoutMs = timeoutMs;
    }
    
    const useFallback = this.configService.get<boolean>('notification.sms.useFallback');
    if (useFallback !== undefined) {
      this.config.useFallback = useFallback;
    }
    
    // Initialize Twilio client
    this.twilioClient = new Twilio(this.config.accountSid, this.config.authToken);
    
    this.logger.log('SMS Service initialized with Twilio provider', 'SmsService', {
      provider: 'twilio',
      maxRetries: this.config.maxRetries,
      useFallback: this.config.useFallback
    });
  }

  /**
   * Sends an SMS notification to a recipient.
   * 
   * @param recipientId - The recipient's phone number
   * @param notification - The notification entity to send
   * @returns A promise resolving to a delivery result
   */
  @Span('sms.send')
  async send(recipientId: string, notification: NotificationEntity): Promise<IDeliveryResult> {
    const traceId = this.tracingService.getCurrentTraceId();
    const correlationId = notification.metadata?.correlationId || traceId;
    
    try {
      // Validate content before sending
      const validationResult = await this.validateContent(notification);
      if (!validationResult.isValid) {
        throw new Error(`Invalid SMS content: ${validationResult.errors.join(', ')}`);
      }

      // Format phone number
      const formattedPhoneNumber = this.formatPhoneNumber(recipientId);
      
      // Validate phone number
      if (!this.validatePhoneNumber(formattedPhoneNumber)) {
        const error = new Error(`Invalid phone number: ${recipientId}`);
        return {
          success: false,
          timestamp: new Date(),
          error: this.classifyError(error, recipientId, notification),
          retryCount: 0,
          usedFallback: false
        };
      }

      this.logger.log(
        `Sending SMS to ${formattedPhoneNumber}`,
        'SmsService',
        { userId: notification.userId, notificationId: notification.id, phoneNumber: formattedPhoneNumber, correlationId, traceId }
      );

      // Format message based on notification content
      const message = this.formatMessage(notification);
      
      // Set timeout for the operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('SMS sending operation timed out')), this.config.timeoutMs);
      });

      // Send SMS via Twilio
      const twilioPromise = this.twilioClient.messages.create({
        body: message,
        from: this.config.defaultFrom,
        to: formattedPhoneNumber,
      });

      // Race the Twilio promise against the timeout
      const twilioResponse = await Promise.race([twilioPromise, timeoutPromise]);

      this.logger.log(
        `SMS sent successfully to ${formattedPhoneNumber}`,
        'SmsService',
        {
          userId: notification.userId,
          notificationId: notification.id,
          phoneNumber: formattedPhoneNumber,
          messageId: twilioResponse.sid,
          status: twilioResponse.status,
          correlationId,
          traceId
        }
      );

      // Return successful delivery result
      return {
        success: true,
        deliveryId: twilioResponse.sid,
        timestamp: new Date(),
        providerResponse: {
          sid: twilioResponse.sid,
          status: twilioResponse.status,
          dateCreated: twilioResponse.dateCreated,
          dateUpdated: twilioResponse.dateUpdated
        },
        retryCount: notification.metadata?.retryCount || 0,
        usedFallback: false
      };
    } catch (error) {
      // Classify the error for retry decisions
      const classifiedError = this.classifyError(error, recipientId, notification);
      
      this.logger.error(
        `Failed to send SMS to ${recipientId}: ${error.message}`,
        error,
        'SmsService',
        {
          userId: notification.userId,
          notificationId: notification.id,
          phoneNumber: recipientId,
          errorCategory: classifiedError.category,
          isTransient: classifiedError.isTransient,
          recommendedAction: classifiedError.recommendedAction,
          correlationId,
          traceId
        }
      );

      // Create a retryable operation
      if (classifiedError.recommendedAction === 'retry' && classifiedError.isTransient) {
        const retryableOperation: IRetryableOperation = {
          execute: async () => {
            return this.send(recipientId, {
              ...notification,
              metadata: {
                ...notification.metadata,
                retryCount: (notification.metadata?.retryCount || 0) + 1
              }
            });
          },
          getPayload: () => ({
            recipientId,
            notification: {
              id: notification.id,
              type: notification.type,
              title: notification.title,
              body: notification.body,
              userId: notification.userId,
              metadata: notification.metadata
            }
          }),
          getMetadata: () => ({
            notificationId: notification.id,
            userId: notification.userId,
            channel: 'sms',
            correlationId,
            traceId
          })
        };

        // Schedule retry
        await this.retryService.scheduleRetry(
          retryableOperation,
          error,
          {
            notificationId: notification.id,
            userId: notification.userId,
            channel: 'sms',
            attemptCount: notification.metadata?.retryCount || 0
          }
        );
      } else if (classifiedError.recommendedAction === 'fallback' && this.config.useFallback) {
        // Try fallback channel if configured
        await this.tryFallbackChannel(recipientId, notification, error, correlationId, traceId);
      } else if (classifiedError.recommendedAction === 'drop' || classifiedError.recommendedAction === 'alert') {
        // Move to DLQ for manual inspection
        await this.dlqService.addToDlq({
          notificationId: notification.id,
          userId: notification.userId,
          channel: 'sms',
          payload: {
            recipientId,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            metadata: notification.metadata
          },
          errorDetails: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            category: classifiedError.category,
            isTransient: classifiedError.isTransient,
            isRecipientError: classifiedError.isRecipientError,
            isProviderError: classifiedError.isProviderError,
            isContentError: classifiedError.isContentError
          },
          retryHistory: {
            attemptCount: notification.metadata?.retryCount || 0,
            lastAttemptTime: new Date().toISOString(),
            errors: [error.message]
          },
          metadata: {
            correlationId,
            traceId,
            recommendedAction: classifiedError.recommendedAction
          }
        });
      }

      // Return failed delivery result
      return {
        success: false,
        timestamp: new Date(),
        error: classifiedError,
        retryCount: notification.metadata?.retryCount || 0,
        usedFallback: false
      };
    }
  }

  /**
   * Checks if this channel can deliver to the specified recipient.
   * 
   * @param recipientId - The recipient's phone number to check
   * @returns A promise resolving to true if the channel can deliver to the recipient
   */
  @Span('sms.canDeliver')
  async canDeliver(recipientId: string): Promise<boolean> {
    // Check if the service is enabled
    if (!this.config.enabled) {
      return false;
    }
    
    // Check if the provider is available
    const isProviderAvailable = await this.provider.isAvailable();
    if (!isProviderAvailable) {
      return false;
    }
    
    // Validate the phone number
    return this.validatePhoneNumber(recipientId);
  }

  /**
   * Validates the notification content for SMS delivery.
   * 
   * @param notification - The notification to validate
   * @returns A promise resolving to a validation result
   */
  @Span('sms.validateContent')
  async validateContent(notification: NotificationEntity): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    // Check if notification has a body
    if (!notification.body) {
      errors.push('Notification body is required for SMS');
    }
    
    // Check message length
    const message = this.formatMessage(notification);
    if (message.length > this.capabilities.maxMessageSize) {
      if (!this.config.splitLongMessages) {
        errors.push(`Message exceeds maximum length of ${this.capabilities.maxMessageSize} characters`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Classifies a delivery error for retry and fallback decisions.
   * 
   * @param error - The error that occurred during delivery
   * @param recipientId - The recipient's phone number
   * @param notification - The notification that failed to deliver
   * @returns A classified delivery error
   */
  classifyError(error: Error, recipientId: string, notification: NotificationEntity): IDeliveryError {
    // Default classification
    const classification: IDeliveryError = {
      originalError: error,
      category: NotificationErrorCategory.SYSTEM,
      isTransient: false,
      isRecipientError: false,
      isProviderError: false,
      isContentError: false,
      recommendedAction: 'alert'
    };
    
    // Check for Twilio-specific error codes
    if ('code' in error) {
      const twilioError = error as any;
      const errorCode = twilioError.code;
      
      // Handle invalid phone number errors
      if (
        errorCode === 21211 || // Invalid 'To' Phone Number
        errorCode === 21214 || // 'To' phone number cannot be reached
        errorCode === 21610    // Attempt to send to unsubscribed recipient
      ) {
        classification.category = NotificationErrorCategory.CLIENT;
        classification.isRecipientError = true;
        classification.recommendedAction = 'drop';
        return classification;
      }
      
      // Handle rate limiting errors
      if (
        errorCode === 20429 || // Too many requests
        errorCode === 20003    // Limit exceeded
      ) {
        classification.category = NotificationErrorCategory.THROTTLING;
        classification.isTransient = true;
        classification.isProviderError = true;
        classification.recommendedAction = 'retry';
        classification.retryAfterMs = 60000; // 1 minute
        return classification;
      }
      
      // Handle authentication errors
      if (
        errorCode === 20003 || // Authentication error
        errorCode === 20404 || // Resource not found
        errorCode === 20008    // Account not active
      ) {
        classification.category = NotificationErrorCategory.CONFIGURATION;
        classification.isProviderError = true;
        classification.recommendedAction = 'alert';
        return classification;
      }
      
      // Handle content errors
      if (
        errorCode === 21605 || // Message body too long
        errorCode === 21606 || // Message cannot be empty
        errorCode === 21611    // Message contains invalid characters
      ) {
        classification.category = NotificationErrorCategory.CONTENT;
        classification.isContentError = true;
        classification.recommendedAction = 'alert';
        return classification;
      }
    }
    
    // Check for network-related errors
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('ECONNRESET') ||
      error.message.includes('socket hang up') ||
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      classification.category = NotificationErrorCategory.NETWORK;
      classification.isTransient = true;
      classification.isProviderError = true;
      classification.recommendedAction = 'retry';
      return classification;
    }
    
    // Check for invalid phone number format
    if (
      error.message.includes('Invalid phone number') ||
      error.message.includes('not a valid phone number')
    ) {
      classification.category = NotificationErrorCategory.CLIENT;
      classification.isRecipientError = true;
      classification.recommendedAction = 'drop';
      return classification;
    }
    
    // Default to system error for unclassified errors
    return classification;
  }

  /**
   * Validates a phone number format.
   * 
   * @param phoneNumber - Phone number to validate
   * @returns Whether the phone number is valid
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation - should be enhanced with proper phone number validation library
    // such as libphonenumber-js in a production environment
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Formats a phone number for delivery.
   * 
   * @param phoneNumber - Phone number to format
   * @returns Formatted phone number
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Ensure phone number starts with +
    if (!phoneNumber.startsWith('+')) {
      return `+${phoneNumber}`;
    }
    return phoneNumber;
  }

  /**
   * Formats a message from a notification entity.
   * 
   * @param notification - The notification entity
   * @returns Formatted message string
   * @private
   */
  private formatMessage(notification: NotificationEntity): string {
    // If notification has a specific SMS content, use that
    if (notification.channels?.sms?.content) {
      return notification.channels.sms.content;
    }
    
    // Otherwise, construct message from title and body
    let message = '';
    
    if (notification.title) {
      message += `${notification.title}\n`;
    }
    
    if (notification.body) {
      message += notification.body;
    }
    
    // Apply journey-specific formatting if applicable
    if (notification.journeyContext) {
      message = this.applyJourneyFormatting(message, notification.journeyContext);
    }
    
    return message;
  }

  /**
   * Applies journey-specific formatting to a message.
   * 
   * @param message - The original message
   * @param journeyContext - The journey context
   * @returns Formatted message
   * @private
   */
  private applyJourneyFormatting(message: string, journeyContext: string): string {
    // Apply journey-specific formatting
    switch (journeyContext) {
      case 'health':
        // Add health journey prefix
        return `[Saúde] ${message}`;
      case 'care':
        // Add care journey prefix
        return `[Cuidar] ${message}`;
      case 'plan':
        // Add plan journey prefix
        return `[Plano] ${message}`;
      default:
        return message;
    }
  }

  /**
   * Attempts to send the notification through a fallback channel.
   * 
   * @param recipientId - The recipient's phone number
   * @param notification - The notification entity
   * @param originalError - The original error that triggered the fallback
   * @param correlationId - Correlation ID for tracing
   * @param traceId - Trace ID for distributed tracing
   * @private
   */
  private async tryFallbackChannel(
    recipientId: string,
    notification: NotificationEntity,
    originalError: Error,
    correlationId: string,
    traceId: string
  ): Promise<void> {
    try {
      this.logger.log(
        `Attempting fallback delivery for failed SMS to ${recipientId}`,
        'SmsService',
        { userId: notification.userId, notificationId: notification.id, correlationId, traceId }
      );

      // Determine fallback channel - prefer push, then in-app
      const fallbackChannel = 'push';
      
      // Add fallback metadata
      const fallbackNotification = {
        ...notification,
        metadata: {
          ...notification.metadata,
          originalChannel: 'sms',
          fallbackReason: originalError.message,
          isFallback: true,
          correlationId,
          traceId
        }
      };
      
      // Send through fallback channel
      await this.notificationsService.sendThroughChannel(
        fallbackChannel,
        notification.userId,
        fallbackNotification
      );

      this.logger.log(
        `Successfully delivered notification via fallback channel ${fallbackChannel}`,
        'SmsService',
        { userId: notification.userId, notificationId: notification.id, fallbackChannel, correlationId, traceId }
      );
    } catch (fallbackError) {
      this.logger.error(
        `Fallback delivery also failed for notification ${notification.id}`,
        fallbackError,
        'SmsService',
        { userId: notification.userId, notificationId: notification.id, correlationId, traceId }
      );
      
      // Move to DLQ after fallback failure
      await this.dlqService.addToDlq({
        notificationId: notification.id,
        userId: notification.userId,
        channel: 'sms',
        payload: {
          recipientId,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          metadata: notification.metadata
        },
        errorDetails: {
          message: originalError.message,
          stack: originalError.stack,
          name: originalError.name,
          fallbackError: {
            message: fallbackError.message,
            stack: fallbackError.stack,
            name: fallbackError.name
          }
        },
        retryHistory: {
          attemptCount: notification.metadata?.retryCount || 0,
          lastAttemptTime: new Date().toISOString(),
          errors: [originalError.message, fallbackError.message]
        },
        metadata: {
          correlationId,
          traceId,
          fallbackAttempted: true,
          fallbackChannel: 'push'
        }
      });
    }
  }
}