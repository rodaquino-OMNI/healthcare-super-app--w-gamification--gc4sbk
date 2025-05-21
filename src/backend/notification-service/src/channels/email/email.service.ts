import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '@austa/logging/logger.service';
import { TracingService } from '@austa/tracing/tracing.service';

import { NotificationEntity } from '@app/notifications/entities/notification.entity';
import { RetryService } from '@app/retry/retry.service';
import { TemplatesService } from '@app/templates/templates.service';

import {
  IEmailChannel,
  IEmailChannelCapabilities,
  IEmailChannelConfig,
  IChannelDeliveryResult,
  FailureClassification,
  IChannelError,
  ChannelStatus,
} from '@app/interfaces/notification-channel.interface';

import { RetryStatus } from '@app/retry/interfaces/retry-status.enum';
import { IRetryOptions } from '@app/retry/interfaces/retry-options.interface';

// Import from @austa/interfaces package for standardized schemas
import { 
  NotificationChannel, 
  NotificationType, 
  NotificationPriority 
} from '@austa/interfaces/notification/types';

/**
 * Service responsible for sending email notifications.
 * Implements the IEmailChannel interface for standardized channel behavior.
 * Uses nodemailer to handle email delivery through a configured SMTP provider.
 * Integrates with retry mechanism for handling transient failures.
 */
@Injectable()
export class EmailService implements IEmailChannel {
  private transporter: nodemailer.Transporter;
  readonly channelType = NotificationChannel.EMAIL;
  
  /**
   * Email channel capabilities defining what features are supported
   */
  readonly capabilities: IEmailChannelCapabilities = {
    supportsRichContent: true,
    supportsAttachments: true,
    supportsDeliveryConfirmation: false,
    supportsReadReceipts: false,
    maxContentSize: 10 * 1024 * 1024, // 10MB
    supportedPriorities: [
      NotificationPriority.LOW,
      NotificationPriority.MEDIUM,
      NotificationPriority.HIGH,
    ],
    supportedTypes: [
      NotificationType.ACHIEVEMENT,
      NotificationType.APPOINTMENT_REMINDER,
      NotificationType.CLAIM_STATUS,
      NotificationType.MEDICATION_REMINDER,
      NotificationType.SYSTEM,
    ],
    supportsHtml: true,
    supportsInlineCSS: true,
    maxAttachmentSize: 5 * 1024 * 1024, // 5MB
    supportedAttachmentTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/csv',
    ],
  };

  /**
   * Email channel configuration with default values
   */
  readonly config: IEmailChannelConfig;

  /**
   * Creates an instance of EmailService.
   * Initializes the nodemailer transporter with configuration from ConfigService.
   * 
   * @param configService - NestJS ConfigService for accessing configuration settings
   * @param logger - Logger service for logging events
   * @param tracing - Tracing service for distributed tracing
   * @param retryService - Service for handling retry operations
   * @param templatesService - Service for managing notification templates
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
    @Inject(forwardRef(() => RetryService))
    private readonly retryService: RetryService,
    private readonly templatesService: TemplatesService,
  ) {
    // Initialize email configuration from config service
    this.config = {
      enabled: this.configService.get<boolean>('email.enabled', true),
      maxRetryAttempts: this.configService.get<number>('email.maxRetryAttempts', 3),
      retryOptions: {
        maxRetries: this.configService.get<number>('email.maxRetries', 3),
        initialDelay: this.configService.get<number>('email.initialDelay', 5000),
        maxDelay: this.configService.get<number>('email.maxDelay', 300000),
        backoffFactor: this.configService.get<number>('email.backoffFactor', 2),
        jitter: this.configService.get<boolean>('email.jitter', true),
      },
      defaultSender: this.configService.get<string>('email.from'),
      rateLimits: {
        requestsPerMinute: this.configService.get<number>('email.rateLimits.requestsPerMinute', 100),
        requestsPerHour: this.configService.get<number>('email.rateLimits.requestsPerHour', 1000),
        requestsPerDay: this.configService.get<number>('email.rateLimits.requestsPerDay', 10000),
      },
      providerConfig: {
        host: this.configService.get<string>('email.host'),
        port: this.configService.get<number>('email.port'),
        secure: this.configService.get<boolean>('email.secure', false),
        auth: {
          user: this.configService.get<string>('email.user'),
          pass: this.configService.get<string>('email.password'),
        },
        from: this.configService.get<string>('email.from'),
      },
      fallbackChannel: this.configService.get<NotificationChannel>(
        'email.fallbackChannel', 
        NotificationChannel.IN_APP
      ),
    };

    // Initialize nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.config.providerConfig.host,
      port: this.config.providerConfig.port,
      secure: this.config.providerConfig.secure,
      auth: this.config.providerConfig.auth,
    });

    this.logger.log('Email service initialized', 'EmailService');
  }

  /**
   * Sends a notification through the email channel
   * 
   * @param recipient The recipient email address
   * @param notification The notification entity to send
   * @returns A promise that resolves to the delivery result
   */
  async send(recipient: string, notification: NotificationEntity): Promise<IChannelDeliveryResult> {
    const span = this.tracing.startSpan('EmailService.send');
    const correlationId = uuidv4();
    
    try {
      span.setAttributes({
        'notification.id': notification.id,
        'notification.type': notification.type,
        'notification.recipient': recipient,
        'correlation.id': correlationId,
      });
      
      this.logger.log(
        `Sending email notification ${notification.id} to ${recipient}`,
        'EmailService',
        { correlationId, notificationId: notification.id }
      );
      
      // Validate recipient email address
      if (!this.validateRecipient(recipient)) {
        const error: IChannelError = {
          code: 'INVALID_RECIPIENT',
          message: `Invalid email recipient: ${recipient}`,
          classification: FailureClassification.PERMANENT,
          context: { recipient, notificationId: notification.id },
        };
        
        return this.createFailureResult(correlationId, error);
      }
      
      // Check if this notification type can be handled by email channel
      if (!this.canHandle(notification.type as NotificationType)) {
        const error: IChannelError = {
          code: 'UNSUPPORTED_NOTIFICATION_TYPE',
          message: `Email channel does not support notification type: ${notification.type}`,
          classification: FailureClassification.PERMANENT,
          context: { notificationType: notification.type, notificationId: notification.id },
        };
        
        return this.createFailureResult(correlationId, error);
      }
      
      // Get journey-specific template if available
      let emailHtml = notification.body;
      let emailSubject = notification.title;
      
      if (notification.journeyContext) {
        try {
          // Try to get a template for this notification type and journey
          const template = await this.templatesService.getTemplateForNotification(
            notification.type,
            'pt-BR', // Default language, could be made configurable
            notification.journeyContext
          );
          
          // Format template with notification data
          const formattedTemplate = this.templatesService.formatTemplateWithData(
            template,
            {
              title: notification.title,
              body: notification.body,
              userId: notification.userId,
              // Add other notification properties as needed
            }
          );
          
          // Use formatted template for email content
          emailSubject = formattedTemplate.title;
          emailHtml = formattedTemplate.body;
        } catch (templateError) {
          // Log template error but continue with default content
          this.logger.warn(
            `Failed to get template for notification ${notification.id}: ${templateError.message}`,
            'EmailService',
            { correlationId, notificationId: notification.id, error: templateError }
          );
          // Continue with default content from notification
        }
      }
      
      // Send the email
      const result = await this.sendEmail(recipient, emailSubject, emailHtml);
      
      // Update notification status based on result
      if (result.success) {
        this.logger.log(
          `Email sent successfully to ${recipient} for notification ${notification.id}`,
          'EmailService',
          { correlationId, notificationId: notification.id, messageId: result.providerMessageId }
        );
      } else {
        this.logger.error(
          `Failed to send email to ${recipient} for notification ${notification.id}: ${result.error.message}`,
          null,
          'EmailService',
          { correlationId, notificationId: notification.id, error: result.error }
        );
        
        // Schedule retry if appropriate
        if (this.shouldRetryError(result.error)) {
          await this.scheduleRetry(recipient, notification, result.error);
        }
      }
      
      return result;
    } catch (error) {
      const channelError = this.normalizeError(error);
      
      this.logger.error(
        `Error sending email to ${recipient} for notification ${notification.id}: ${channelError.message}`,
        error,
        'EmailService',
        { correlationId, notificationId: notification.id }
      );
      
      // Schedule retry if appropriate
      if (this.shouldRetryError(channelError)) {
        await this.scheduleRetry(recipient, notification, channelError);
      }
      
      return this.createFailureResult(correlationId, channelError);
    } finally {
      span.end();
    }
  }

  /**
   * Sends an email with attachments
   * 
   * @param to Recipient email address
   * @param subject Email subject
   * @param html Email HTML content
   * @param attachments Optional email attachments
   * @returns A promise that resolves to the delivery result
   */
  async sendEmail(
    to: string, 
    subject: string, 
    html: string, 
    attachments?: any[]
  ): Promise<IChannelDeliveryResult> {
    const correlationId = uuidv4();
    const attemptId = uuidv4();
    
    try {
      this.logger.log(
        `Attempting to send email to ${to}`,
        'EmailService',
        { correlationId, attemptId }
      );
      
      const from = this.config.providerConfig.from;
      
      const mailOptions = {
        from,
        to,
        subject,
        html,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(
        `Email sent successfully to ${to}`,
        'EmailService',
        { correlationId, attemptId, messageId: info.messageId }
      );
      
      return {
        success: true,
        attemptId,
        timestamp: new Date(),
        providerMessageId: info.messageId,
        metadata: {
          correlationId,
          response: info.response,
          envelope: info.envelope,
        },
      };
    } catch (error) {
      const channelError = this.normalizeError(error);
      
      this.logger.error(
        `Failed to send email to ${to}: ${channelError.message}`,
        error,
        'EmailService',
        { correlationId, attemptId }
      );
      
      return this.createFailureResult(attemptId, channelError);
    }
  }

  /**
   * Checks if this channel can handle the given notification type
   * 
   * @param notificationType The notification type to check
   * @returns True if this channel can handle the notification type
   */
  canHandle(notificationType: NotificationType): boolean {
    return this.capabilities.supportedTypes.includes(notificationType);
  }

  /**
   * Validates a recipient email address
   * 
   * @param recipient The email address to validate
   * @returns True if the email address is valid
   */
  validateRecipient(recipient: string): boolean {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(recipient);
  }

  /**
   * Gets the current status of the email channel
   * 
   * @returns A promise that resolves to the channel status
   */
  async getStatus(): Promise<ChannelStatus> {
    try {
      // Verify connection to SMTP server
      await this.transporter.verify();
      return ChannelStatus.ONLINE;
    } catch (error) {
      this.logger.error(
        `Email channel status check failed: ${error.message}`,
        error,
        'EmailService'
      );
      return ChannelStatus.OFFLINE;
    }
  }

  /**
   * Gets the current retry status for a specific notification
   * 
   * @param notificationId The ID of the notification
   * @returns A promise that resolves to the retry status
   */
  async getRetryStatus(notificationId: string): Promise<RetryStatus> {
    return this.retryService.getRetryStatus(parseInt(notificationId, 10));
  }

  /**
   * Schedules a retry for a failed notification
   * 
   * @param recipient The recipient email address
   * @param notification The notification entity
   * @param error The error that caused the failure
   * @returns A promise that resolves when the retry is scheduled
   */
  async scheduleRetry(
    recipient: string,
    notification: NotificationEntity,
    error: IChannelError
  ): Promise<void> {
    // Create payload for retry
    const payload = {
      userId: notification.userId,
      content: {
        title: notification.title,
        body: notification.body,
      },
      recipient,
      journeyContext: notification.journeyContext,
      history: [],
    };
    
    // Convert IChannelError to standard Error for retry service
    const retryError = new Error(error.message);
    (retryError as any).code = error.code;
    (retryError as any).classification = error.classification;
    
    // Schedule retry with retry service
    await this.retryService.scheduleRetry(
      notification.id,
      this.channelType,
      retryError,
      payload,
      notification.retryCount,
      this.config.retryOptions
    );
  }

  /**
   * Classifies an error to determine retry strategy
   * 
   * @param error The error to classify
   * @returns The failure classification
   */
  classifyError(error: any): FailureClassification {
    // Already classified errors
    if (error.classification) {
      return error.classification;
    }
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toString() || '';
    
    // Rate limiting errors
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorCode === '429' ||
      errorCode.includes('rate')
    ) {
      return FailureClassification.RATE_LIMITED;
    }
    
    // Authentication errors
    if (
      errorMessage.includes('auth') ||
      errorMessage.includes('login') ||
      errorMessage.includes('credentials') ||
      errorCode === '401' ||
      errorCode === '403' ||
      errorCode.includes('auth')
    ) {
      return FailureClassification.AUTH_ERROR;
    }
    
    // Service unavailable errors
    if (
      errorMessage.includes('unavailable') ||
      errorMessage.includes('temporarily') ||
      errorCode === '503' ||
      errorCode === '502' ||
      errorCode === '500'
    ) {
      return FailureClassification.SERVICE_UNAVAILABLE;
    }
    
    // Network/connection errors (transient)
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('temporary') ||
      errorMessage.includes('dns') ||
      errorCode.includes('ECONNRESET') ||
      errorCode.includes('ETIMEDOUT') ||
      errorCode.includes('ENOTFOUND')
    ) {
      return FailureClassification.TRANSIENT;
    }
    
    // Invalid request errors (permanent)
    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('malformed') ||
      errorMessage.includes('not found') ||
      errorCode === '400' ||
      errorCode === '404'
    ) {
      return FailureClassification.INVALID_REQUEST;
    }
    
    // Default to unknown classification
    return FailureClassification.UNKNOWN;
  }

  /**
   * Determines if an error should be retried based on its classification
   * 
   * @param error The error to check
   * @returns True if the error should be retried
   * @private
   */
  private shouldRetryError(error: IChannelError): boolean {
    const retriableClassifications = [
      FailureClassification.TRANSIENT,
      FailureClassification.RATE_LIMITED,
      FailureClassification.SERVICE_UNAVAILABLE,
      FailureClassification.UNKNOWN,
    ];
    
    return retriableClassifications.includes(error.classification);
  }

  /**
   * Normalizes an error into a standardized IChannelError format
   * 
   * @param error The error to normalize
   * @returns Standardized channel error
   * @private
   */
  private normalizeError(error: any): IChannelError {
    // If already in the correct format, return as is
    if (error.code && error.message && error.classification) {
      return error as IChannelError;
    }
    
    // Normalize the error
    const classification = this.classifyError(error);
    
    return {
      code: error.code || 'EMAIL_ERROR',
      message: error.message || 'Unknown email error',
      classification,
      originalError: error,
      context: {
        timestamp: new Date().toISOString(),
        service: 'EmailService',
      },
    };
  }

  /**
   * Creates a standardized failure result
   * 
   * @param attemptId The ID of the delivery attempt
   * @param error The error that caused the failure
   * @returns Standardized delivery failure result
   * @private
   */
  private createFailureResult(attemptId: string, error: IChannelError): IChannelDeliveryResult {
    return {
      success: false,
      attemptId,
      timestamp: new Date(),
      error,
      metadata: {
        errorCode: error.code,
        classification: error.classification,
      },
    };
  }

  /**
   * Implements the execute method required by IRetryableOperation interface
   * This is called by the retry service when processing retries
   * 
   * @param params Parameters for the operation
   * @returns A promise that resolves to the operation result
   */
  async execute(params: any): Promise<any> {
    const { recipient, notification } = params;
    return this.send(recipient, notification);
  }

  /**
   * Gets the operation metadata required by IRetryableOperation interface
   * 
   * @returns Operation metadata
   */
  getOperationMetadata(): Record<string, any> {
    return {
      channelType: this.channelType,
      maxRetries: this.config.retryOptions.maxRetries,
      backoffFactor: this.config.retryOptions.backoffFactor,
    };
  }
}