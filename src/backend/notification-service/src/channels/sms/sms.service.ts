import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { v4 as uuidv4 } from 'uuid';

// Import from @austa/interfaces for standardized schemas
import { NotificationChannel, NotificationType } from '@austa/interfaces/notification/types';

// Import from local interfaces
import { 
  ISmsChannel, 
  ISmsChannelCapabilities, 
  ISmsChannelConfig,
  IChannelDeliveryResult,
  IChannelError,
  FailureClassification,
  ChannelStatus
} from '../../interfaces/notification-channel.interface';
import { ISmsNotificationPayload } from '../../interfaces/notification-payload.interface';

// Import from retry module
import { RetryService } from '../../retry/retry.service';
import { DlqService } from '../../retry/dlq/dlq.service';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';
import { ExponentialBackoffPolicy } from '../../retry/policies/exponential-backoff.policy';

// Import from shared modules
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { NotificationEntity } from '../../notifications/entities/notification.entity';

/**
 * Service responsible for sending SMS notifications using Twilio.
 * This service implements the ISmsChannel interface and includes retry policies,
 * error classification, dead-letter queue integration, and fallback mechanisms.
 */
@Injectable()
export class SmsService implements ISmsChannel {
  private twilioClient: Twilio;
  private readonly channelType = NotificationChannel.SMS;
  
  // Define channel capabilities
  public readonly capabilities: ISmsChannelCapabilities = {
    supportsRichContent: false,
    supportsAttachments: false,
    supportsDeliveryConfirmation: true,
    supportsReadReceipts: false,
    maxContentSize: 1600, // Standard SMS concatenation limit
    maxMessageLength: 1600,
    supportsUnicode: true,
    supportsConcatenation: true,
    supportedPriorities: ['low', 'medium', 'high', 'critical'],
    supportedTypes: [
      'care.appointment.reminder',
      'care.appointment.confirmed',
      'care.appointment.cancelled',
      'care.medication.reminder',
      'health.goal.achieved',
      'plan.claim.approved',
      'plan.claim.rejected',
      'gamification.achievement.unlocked',
      'system.security'
    ]
  };
  
  // Channel configuration
  public readonly config: ISmsChannelConfig;

  /**
   * Initializes the SmsService with the Twilio client and configuration.
   * @param configService - The NestJS config service for accessing configuration
   * @param logger - The logger service for logging events and errors
   * @param retryService - Service for handling retry operations
   * @param dlqService - Service for handling dead-letter queue operations
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    private readonly tracingService: TracingService,
  ) {
    // Initialize configuration from environment
    const accountSid = this.configService.get<string>('notification.sms.accountSid');
    const authToken = this.configService.get<string>('notification.sms.authToken');
    const defaultFrom = this.configService.get<string>('notification.sms.defaultFrom');
    
    // Initialize Twilio client
    this.twilioClient = new Twilio(accountSid, authToken);
    
    // Set up channel configuration
    this.config = {
      enabled: this.configService.get<boolean>('notification.sms.enabled', true),
      maxRetryAttempts: this.configService.get<number>('notification.sms.maxRetryAttempts', 3),
      retryOptions: {
        maxRetries: this.configService.get<number>('notification.sms.maxRetryAttempts', 3),
        initialDelay: this.configService.get<number>('notification.sms.initialRetryDelay', 1000),
        maxDelay: this.configService.get<number>('notification.sms.maxRetryDelay', 60000),
        backoffFactor: this.configService.get<number>('notification.sms.backoffFactor', 2),
        jitter: this.configService.get<boolean>('notification.sms.retryJitter', true)
      },
      providerConfig: {
        accountSid,
        authToken,
        defaultFrom
      },
      fallbackChannel: this.configService.get<NotificationChannel>(
        'notification.sms.fallbackChannel', 
        NotificationChannel.EMAIL
      )
    };
    
    this.logger.log('SMS Service initialized', { 
      service: 'SmsService',
      enabled: this.config.enabled,
      maxRetryAttempts: this.config.maxRetryAttempts
    });
  }

  /**
   * Sends an SMS message using the Twilio API with retry support.
   * @param phoneNumber - The recipient's phone number 
   * @param message - The message content to send
   * @returns A promise that resolves to the delivery result
   */
  async sendSms(phoneNumber: string, message: string): Promise<IChannelDeliveryResult> {
    const correlationId = uuidv4();
    const attemptId = uuidv4();
    
    // Create span for tracing
    const span = this.tracingService.createSpan('sms.send', { 
      correlationId, 
      phoneNumber: this.maskPhoneNumber(phoneNumber),
      messageLength: message.length
    });
    
    try {
      this.logger.debug('Sending SMS', { 
        correlationId,
        attemptId,
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        messageLength: message.length
      });
      
      // Check if service is enabled
      if (!this.config.enabled) {
        throw new Error('SMS service is disabled');
      }
      
      // Validate phone number
      if (!this.validateRecipient(phoneNumber)) {
        throw new Error(`Invalid phone number format: ${this.maskPhoneNumber(phoneNumber)}`);
      }
      
      // Send SMS via Twilio
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.config.providerConfig.defaultFrom,
        to: phoneNumber,
      });
      
      this.logger.info('SMS sent successfully', { 
        correlationId,
        attemptId,
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        messageLength: message.length,
        messageId: result.sid
      });
      
      // Return successful delivery result
      return {
        success: true,
        attemptId,
        timestamp: new Date(),
        providerMessageId: result.sid,
        metadata: {
          status: result.status,
          price: result.price,
          priceUnit: result.priceUnit,
          correlationId
        }
      };
    } catch (error) {
      // Classify the error
      const classification = this.classifyError(error);
      
      // Create standardized error object
      const channelError: IChannelError = {
        code: error.code || 'SMS_DELIVERY_ERROR',
        message: error.message || 'Failed to send SMS',
        classification,
        originalError: error,
        context: {
          correlationId,
          attemptId,
          phoneNumber: this.maskPhoneNumber(phoneNumber),
          messageLength: message.length
        }
      };
      
      this.logger.error('SMS delivery failed', { 
        correlationId,
        attemptId,
        phoneNumber: this.maskPhoneNumber(phoneNumber),
        errorCode: channelError.code,
        errorMessage: channelError.message,
        classification,
        stack: error.stack
      });
      
      // Return failed delivery result
      return {
        success: false,
        attemptId,
        timestamp: new Date(),
        error: channelError,
        metadata: { correlationId }
      };
    } finally {
      // End the tracing span
      span.end();
    }
  }
  
  /**
   * Sends a notification through this channel
   * @param recipient The recipient phone number
   * @param notification The notification entity to send
   * @returns A promise that resolves to the delivery result
   */
  async send(recipient: string, notification: NotificationEntity): Promise<IChannelDeliveryResult> {
    const correlationId = uuidv4();
    
    try {
      // Format the message based on notification type and journey
      const message = this.formatMessage(notification);
      
      // Send the SMS
      const result = await this.sendSms(recipient, message);
      
      // If successful, return the result
      if (result.success) {
        return result;
      }
      
      // If failed but retryable, schedule a retry
      if (this.isRetryable(result.error)) {
        await this.scheduleRetry(recipient, notification, result.error);
        return result;
      }
      
      // If failed and not retryable, try fallback channel if configured
      if (this.config.fallbackChannel && this.config.fallbackChannel !== this.channelType) {
        this.logger.info('Attempting fallback channel delivery', {
          correlationId,
          originalChannel: this.channelType,
          fallbackChannel: this.config.fallbackChannel,
          notificationId: notification.id
        });
        
        // Note: The actual fallback logic would be handled by the NotificationService
        // which would call the appropriate channel service
      }
      
      // If failed and exceeded retry attempts, send to DLQ
      if (result.error.classification !== FailureClassification.TRANSIENT) {
        await this.sendToDlq(recipient, notification, result.error);
      }
      
      return result;
    } catch (error) {
      this.logger.error('Unexpected error in SMS channel', {
        correlationId,
        recipient: this.maskPhoneNumber(recipient),
        notificationId: notification.id,
        error: error.message,
        stack: error.stack
      });
      
      // Return a generic error result
      return {
        success: false,
        attemptId: uuidv4(),
        timestamp: new Date(),
        error: {
          code: 'UNEXPECTED_ERROR',
          message: 'An unexpected error occurred while processing the SMS notification',
          classification: FailureClassification.UNKNOWN,
          originalError: error
        },
        metadata: { correlationId }
      };
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
   * Validates a recipient phone number for this channel
   * @param phoneNumber The phone number to validate
   * @returns True if the phone number is valid for this channel
   */
  validateRecipient(phoneNumber: string): boolean {
    // Basic phone number validation - could be enhanced with more sophisticated validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
  
  /**
   * Gets the current status of the channel
   * @returns A promise that resolves to the channel status
   */
  async getStatus(): Promise<ChannelStatus> {
    try {
      // Perform a simple API call to check if Twilio is accessible
      await this.twilioClient.api.v2010.accounts.list({ limit: 1 });
      return ChannelStatus.ONLINE;
    } catch (error) {
      this.logger.error('SMS channel status check failed', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Determine if service is degraded or completely offline
      if (error.status === 429 || error.code === 20429) {
        return ChannelStatus.DEGRADED; // Rate limited
      }
      
      return ChannelStatus.OFFLINE;
    }
  }
  
  /**
   * Gets the current retry status for a specific notification
   * @param notificationId The ID of the notification
   * @returns A promise that resolves to the retry status
   */
  async getRetryStatus(notificationId: string): Promise<RetryStatus> {
    return this.retryService.getRetryStatus(notificationId, this.channelType);
  }
  
  /**
   * Schedules a retry for a failed notification
   * @param recipient The recipient phone number
   * @param notification The notification entity
   * @param error The error that caused the failure
   * @returns A promise that resolves when the retry is scheduled
   */
  async scheduleRetry(
    recipient: string, 
    notification: NotificationEntity, 
    error: IChannelError
  ): Promise<void> {
    // Only retry if within max attempts and error is retryable
    if (!this.isRetryable(error)) {
      this.logger.debug('Not scheduling retry - error is not retryable', {
        notificationId: notification.id,
        errorCode: error.code,
        classification: error.classification
      });
      return;
    }
    
    const retryableOperation = {
      id: notification.id,
      type: 'sms_notification',
      execute: async () => this.send(recipient, notification),
      getMetadata: () => ({
        notificationId: notification.id,
        recipient: this.maskPhoneNumber(recipient),
        channel: this.channelType,
        notificationType: notification.type
      })
    };
    
    // Use exponential backoff policy for retries
    const policy = new ExponentialBackoffPolicy(this.config.retryOptions);
    
    await this.retryService.scheduleRetry(
      retryableOperation,
      error,
      policy,
      this.channelType
    );
    
    this.logger.info('Scheduled retry for failed SMS notification', {
      notificationId: notification.id,
      recipient: this.maskPhoneNumber(recipient),
      errorCode: error.code,
      classification: error.classification,
      retryPolicy: policy.getName()
    });
  }
  
  /**
   * Classifies an error to determine retry strategy
   * @param error The error to classify
   * @returns The failure classification
   */
  classifyError(error: any): FailureClassification {
    // Twilio-specific error codes
    // See: https://www.twilio.com/docs/api/errors
    
    // No error code, treat as unknown
    if (!error.code) {
      return FailureClassification.UNKNOWN;
    }
    
    // Convert string error codes to numbers if possible
    const errorCode = typeof error.code === 'string' ? 
      parseInt(error.code, 10) || error.code : 
      error.code;
    
    // Authentication errors
    if ([20003, 20004, 20005, 20006, 20007, 20008].includes(errorCode)) {
      return FailureClassification.AUTH_ERROR;
    }
    
    // Rate limiting errors
    if ([20429, 20001, 20002, 20422].includes(errorCode)) {
      return FailureClassification.RATE_LIMITED;
    }
    
    // Invalid request errors (not retryable)
    if (
      [21211, 21602, 21408, 21610, 21612, 21614].includes(errorCode) || // Invalid phone number
      [21605, 21606, 21611, 21613].includes(errorCode) || // Message content issues
      [21607, 21608, 21609, 21615, 21616].includes(errorCode) // Sender issues
    ) {
      return FailureClassification.INVALID_REQUEST;
    }
    
    // Service unavailable errors
    if ([50001, 50002, 50003, 50004].includes(errorCode)) {
      return FailureClassification.SERVICE_UNAVAILABLE;
    }
    
    // Network or transient errors
    if (
      error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ESOCKETTIMEDOUT' || 
      error.code === 'ECONNREFUSED' || 
      error.code === 'ENOTFOUND' || 
      error.code === 'EAI_AGAIN'
    ) {
      return FailureClassification.TRANSIENT;
    }
    
    // Default to unknown for any other errors
    return FailureClassification.UNKNOWN;
  }
  
  /**
   * Determines if an error is retryable based on its classification
   * @param error The channel error
   * @returns True if the error is retryable
   */
  private isRetryable(error: IChannelError): boolean {
    return [
      FailureClassification.TRANSIENT,
      FailureClassification.RATE_LIMITED,
      FailureClassification.SERVICE_UNAVAILABLE,
      FailureClassification.UNKNOWN
    ].includes(error.classification);
  }
  
  /**
   * Sends a failed notification to the dead-letter queue
   * @param recipient The recipient phone number
   * @param notification The notification entity
   * @param error The error that caused the failure
   * @returns A promise that resolves when the notification is sent to the DLQ
   */
  private async sendToDlq(
    recipient: string, 
    notification: NotificationEntity, 
    error: IChannelError
  ): Promise<void> {
    await this.dlqService.addEntry({
      notificationId: notification.id,
      userId: notification.userId,
      channel: this.channelType,
      payload: {
        recipient: this.maskPhoneNumber(recipient),
        notificationType: notification.type,
        content: notification.content
      },
      errorDetails: {
        code: error.code,
        message: error.message,
        classification: error.classification,
        timestamp: new Date().toISOString()
      },
      retryHistory: await this.retryService.getRetryHistory(notification.id, this.channelType)
    });
    
    this.logger.info('Notification sent to dead-letter queue', {
      notificationId: notification.id,
      recipient: this.maskPhoneNumber(recipient),
      channel: this.channelType,
      errorCode: error.code
    });
  }
  
  /**
   * Formats a notification entity into an SMS message
   * @param notification The notification entity to format
   * @returns The formatted SMS message
   */
  private formatMessage(notification: NotificationEntity): string {
    // Basic formatting - in a real implementation, this would use templates
    // and journey-specific formatting logic
    let message = `${notification.title}\n\n${notification.content}`;
    
    // Add action text if available
    if (notification.data?.action?.type === 'navigate') {
      message += `\n\nTap to view: ${notification.data.action.target}`;
    }
    
    // Ensure message doesn't exceed max length
    if (message.length > this.capabilities.maxMessageLength) {
      message = message.substring(0, this.capabilities.maxMessageLength - 3) + '...';
    }
    
    return message;
  }
  
  /**
   * Masks a phone number for logging (privacy protection)
   * @param phoneNumber The phone number to mask
   * @returns The masked phone number
   */
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 8) {
      return '***masked***';
    }
    
    // Keep country code and last 4 digits, mask the rest
    const countryCodeEnd = phoneNumber.startsWith('+') ? 3 : 1;
    const lastFourStart = phoneNumber.length - 4;
    
    return (
      phoneNumber.substring(0, countryCodeEnd) + 
      '*'.repeat(lastFourStart - countryCodeEnd) + 
      phoneNumber.substring(lastFourStart)
    );
  }
}