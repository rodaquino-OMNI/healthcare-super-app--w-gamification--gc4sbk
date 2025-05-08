import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { TracingService } from '@austa/tracing';
import { LoggerService } from '@austa/logging';
import { ErrorType, JourneyErrorCategory } from '@austa/errors';

import {
  IEmailTemplate,
  IEmailRecipient,
  IEmailAttachment,
  IEmailOptions,
  IJourneyEmailContext,
} from '@austa/interfaces/notification';
import {
  INotificationChannel,
  IDeliveryStatus,
  IDeliveryAttempt,
} from '../../interfaces';
import { RetryService } from '../../retry/retry.service';
import { DlqService } from '../../retry/dlq/dlq.service';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';
import { IRetryableOperation } from '../../retry/interfaces/retryable-operation.interface';
import { IExponentialBackoffOptions } from '../../retry/interfaces/retry-options.interface';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * Service responsible for sending email notifications.
 * Uses nodemailer to handle email delivery through a configured SMTP provider.
 * Implements retry mechanisms, dead-letter queue support, and fallback logic.
 */
@Injectable()
export class EmailService implements INotificationChannel {
  private transporter: nodemailer.Transporter;
  private readonly channelType = 'email';
  private readonly defaultRetryOptions: IExponentialBackoffOptions = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 60000, // 1 minute
    backoffFactor: 2,
    jitter: 0.2, // 20% jitter
  };

  /**
   * Creates an instance of EmailService.
   * Initializes the nodemailer transporter with configuration from ConfigService.
   * 
   * @param configService - NestJS ConfigService for accessing configuration settings
   * @param logger - Logger service for logging events
   * @param tracingService - Service for distributed tracing
   * @param retryService - Service for handling retry operations
   * @param dlqService - Service for managing dead-letter queue entries
   * @param notificationsService - Service for notification management (used for fallback)
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
    const emailConfig = {
      host: this.configService.get<string>('email.host'),
      port: this.configService.get<number>('email.port'),
      secure: this.configService.get<boolean>('email.secure', false),
      auth: {
        user: this.configService.get<string>('email.user'),
        pass: this.configService.get<string>('email.password'),
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);
    this.logger.log('Email service initialized', { context: 'EmailService' });
  }

  /**
   * Sends an email notification with retry capabilities and fallback logic.
   * 
   * @param recipient - Recipient information including email address and user details
   * @param template - Email template with subject and content
   * @param options - Additional email options like attachments and journey context
   * @returns A promise that resolves to a delivery status object
   */
  async sendNotification(
    recipient: IEmailRecipient,
    template: IEmailTemplate,
    options?: IEmailOptions,
  ): Promise<IDeliveryStatus> {
    const correlationId = options?.correlationId || this.tracingService.generateId();
    const span = this.tracingService.startSpan('email.send', { correlationId });
    
    try {
      this.logger.log('Preparing to send email notification', {
        context: 'EmailService',
        correlationId,
        recipient: recipient.email,
        templateId: template.id,
        journeyType: options?.journeyContext?.journeyType,
      });

      // Validate recipient email
      this.validateRecipient(recipient);
      
      // Apply journey-specific styling if applicable
      const journeyContext = options?.journeyContext;
      const htmlContent = journeyContext 
        ? this.applyJourneyTheming(template.html, journeyContext)
        : template.html;
      
      // Create email operation for retry handling
      const emailOperation = this.createEmailOperation(
        recipient,
        template.subject,
        htmlContent,
        options?.attachments,
        correlationId,
      );
      
      // Send with retry capability
      const result = await this.retryService.executeWithRetry(
        emailOperation,
        options?.retryOptions || this.defaultRetryOptions,
      );
      
      if (result.status === RetryStatus.SUCCEEDED) {
        this.logger.log('Email sent successfully', {
          context: 'EmailService',
          correlationId,
          recipient: recipient.email,
          templateId: template.id,
        });
        
        return {
          status: 'delivered',
          channel: this.channelType,
          timestamp: new Date(),
          attempts: result.attempts,
          metadata: {
            messageId: result.result?.messageId,
            templateId: template.id,
          },
        };
      } else if (result.status === RetryStatus.EXHAUSTED) {
        // All retries failed, try fallback if available
        if (options?.enableFallback) {
          return this.handleFallback(recipient, template, options, correlationId, result.error);
        } else {
          // No fallback, add to DLQ
          await this.addToDlq(recipient, template, options, correlationId, result.error);
          
          return {
            status: 'failed',
            channel: this.channelType,
            timestamp: new Date(),
            attempts: result.attempts,
            error: {
              code: result.error?.code || 'EMAIL_DELIVERY_FAILED',
              message: result.error?.message || 'Failed to deliver email after multiple attempts',
              details: result.error,
            },
          };
        }
      } else {
        // This shouldn't happen with proper retry configuration
        throw new Error(`Unexpected retry status: ${result.status}`);
      }
    } catch (error) {
      this.logger.error('Error in email notification flow', {
        context: 'EmailService',
        correlationId,
        error,
        recipient: recipient.email,
        templateId: template.id,
      });
      
      return {
        status: 'failed',
        channel: this.channelType,
        timestamp: new Date(),
        attempts: 1,
        error: {
          code: 'EMAIL_PROCESSING_ERROR',
          message: 'Error processing email notification',
          details: error,
        },
      };
    } finally {
      span.end();
    }
  }

  /**
   * Creates a retryable operation for sending an email.
   * 
   * @param recipient - Email recipient information
   * @param subject - Email subject
   * @param html - Email HTML content
   * @param attachments - Optional email attachments
   * @param correlationId - Correlation ID for tracing
   * @returns A retryable operation object
   */
  private createEmailOperation(
    recipient: IEmailRecipient,
    subject: string,
    html: string,
    attachments?: IEmailAttachment[],
    correlationId?: string,
  ): IRetryableOperation<nodemailer.SentMessageInfo> {
    return {
      execute: async () => {
        const span = this.tracingService.startSpan('email.transport.send', { correlationId });
        
        try {
          const from = this.configService.get<string>('email.from');
          
          const mailOptions: nodemailer.SendMailOptions = {
            from,
            to: recipient.email,
            subject,
            html,
            headers: {
              'X-Correlation-ID': correlationId,
            },
          };
          
          if (attachments?.length) {
            mailOptions.attachments = attachments.map(attachment => ({
              filename: attachment.filename,
              content: attachment.content,
              contentType: attachment.contentType,
            }));
          }
          
          const result = await this.transporter.sendMail(mailOptions);
          
          this.logger.debug('Email transport result', {
            context: 'EmailService',
            correlationId,
            messageId: result.messageId,
            response: result.response,
          });
          
          return result;
        } catch (error) {
          // Classify error for retry decision
          const errorType = this.classifyError(error);
          error.errorType = errorType;
          
          this.logger.warn('Email transport error', {
            context: 'EmailService',
            correlationId,
            error,
            errorType,
            recipient: recipient.email,
          });
          
          throw error;
        } finally {
          span.end();
        }
      },
      getMetadata: () => ({
        operationType: 'email_send',
        recipient: recipient.email,
        userId: recipient.userId,
        correlationId,
      }),
      shouldRetry: (error) => {
        // Only retry transient errors
        return error.errorType === ErrorType.TRANSIENT || 
               error.errorType === ErrorType.EXTERNAL;
      },
    };
  }

  /**
   * Classifies an email delivery error to determine if it's retryable.
   * 
   * @param error - The error to classify
   * @returns The error type classification
   */
  private classifyError(error: any): ErrorType {
    // SMTP error codes that indicate transient issues
    const transientErrorCodes = [
      421, // Service not available, closing transmission channel
      450, // Requested mail action not taken: mailbox unavailable
      451, // Requested action aborted: local error in processing
      452, // Requested action not taken: insufficient system storage
      447, // Timeout
    ];
    
    // SMTP error codes that indicate permanent issues
    const permanentErrorCodes = [
      500, // Syntax error, command unrecognized
      501, // Syntax error in parameters or arguments
      502, // Command not implemented
      503, // Bad sequence of commands
      504, // Command parameter not implemented
      550, // Requested action not taken: mailbox unavailable
      551, // User not local
      552, // Requested mail action aborted: exceeded storage allocation
      553, // Requested action not taken: mailbox name not allowed
      554, // Transaction failed
    ];
    
    // Network or connection errors are typically transient
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ENETUNREACH' ||
      error.code === 'EHOSTUNREACH' ||
      error.code === 'ESOCKET'
    ) {
      return ErrorType.TRANSIENT;
    }
    
    // Check SMTP response code if available
    if (error.responseCode) {
      const code = parseInt(error.responseCode, 10);
      
      if (transientErrorCodes.includes(code)) {
        return ErrorType.TRANSIENT;
      }
      
      if (permanentErrorCodes.includes(code)) {
        return ErrorType.PERMANENT;
      }
    }
    
    // Authentication errors
    if (
      error.code === 'EAUTH' ||
      error.message?.includes('authentication') ||
      error.message?.includes('credentials')
    ) {
      return ErrorType.CONFIGURATION;
    }
    
    // Rate limiting or quota issues
    if (
      error.message?.includes('rate limit') ||
      error.message?.includes('quota') ||
      error.message?.includes('too many')
    ) {
      return ErrorType.RATE_LIMIT;
    }
    
    // Default to external error for unknown issues
    return ErrorType.EXTERNAL;
  }

  /**
   * Validates the email recipient information.
   * 
   * @param recipient - The recipient to validate
   * @throws Error if validation fails
   */
  private validateRecipient(recipient: IEmailRecipient): void {
    if (!recipient) {
      throw new Error('Recipient is required');
    }
    
    if (!recipient.email) {
      throw new Error('Recipient email is required');
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.email)) {
      throw new Error(`Invalid email format: ${recipient.email}`);
    }
    
    if (!recipient.userId) {
      throw new Error('Recipient userId is required');
    }
  }

  /**
   * Applies journey-specific theming to email HTML content.
   * 
   * @param html - Original HTML content
   * @param journeyContext - Journey context with theming information
   * @returns HTML content with journey-specific styling applied
   */
  private applyJourneyTheming(html: string, journeyContext: IJourneyEmailContext): string {
    if (!journeyContext || !journeyContext.journeyType) {
      return html;
    }
    
    // Get journey-specific styling
    const journeyStyles = this.getJourneyStyles(journeyContext.journeyType);
    
    // Apply journey-specific CSS variables
    let themedHtml = html;
    
    // Add journey-specific CSS to the head section
    if (journeyStyles && html.includes('<head>')) {
      const styleTag = `<style type="text/css">
        ${journeyStyles}
      </style>`;
      
      themedHtml = html.replace('<head>', `<head>${styleTag}`);
    }
    
    // Add journey-specific class to the body
    if (html.includes('<body')) {
      themedHtml = themedHtml.replace('<body', `<body class="journey-${journeyContext.journeyType}"`);
    }
    
    return themedHtml;
  }

  /**
   * Gets journey-specific CSS styles based on journey type.
   * 
   * @param journeyType - The type of journey (health, care, plan)
   * @returns CSS styles for the specified journey
   */
  private getJourneyStyles(journeyType: string): string {
    const journeyStyles: Record<string, string> = {
      health: `
        :root {
          --primary-color: #3498db;
          --secondary-color: #2ecc71;
          --accent-color: #9b59b6;
          --background-color: #f8f9fa;
          --text-color: #2c3e50;
        }
        .journey-health .header {
          background-color: var(--primary-color);
          color: white;
        }
        .journey-health .button {
          background-color: var(--secondary-color);
        }
      `,
      care: `
        :root {
          --primary-color: #e74c3c;
          --secondary-color: #f39c12;
          --accent-color: #d35400;
          --background-color: #fff5f5;
          --text-color: #34495e;
        }
        .journey-care .header {
          background-color: var(--primary-color);
          color: white;
        }
        .journey-care .button {
          background-color: var(--secondary-color);
        }
      `,
      plan: `
        :root {
          --primary-color: #1abc9c;
          --secondary-color: #3498db;
          --accent-color: #2980b9;
          --background-color: #f0f8ff;
          --text-color: #2c3e50;
        }
        .journey-plan .header {
          background-color: var(--primary-color);
          color: white;
        }
        .journey-plan .button {
          background-color: var(--secondary-color);
        }
      `,
    };
    
    return journeyStyles[journeyType] || '';
  }

  /**
   * Handles fallback to alternative notification channels when email delivery fails.
   * 
   * @param recipient - Email recipient information
   * @param template - Email template
   * @param options - Email options
   * @param correlationId - Correlation ID for tracing
   * @param error - The error that triggered the fallback
   * @returns A delivery status object from the fallback channel
   */
  private async handleFallback(
    recipient: IEmailRecipient,
    template: IEmailTemplate,
    options: IEmailOptions,
    correlationId: string,
    error: any,
  ): Promise<IDeliveryStatus> {
    this.logger.log('Attempting fallback for failed email delivery', {
      context: 'EmailService',
      correlationId,
      recipient: recipient.email,
      templateId: template.id,
      fallbackChannels: options.fallbackChannels,
    });
    
    // Add the original failure to DLQ for tracking
    await this.addToDlq(recipient, template, options, correlationId, error);
    
    // Try fallback channels in order of preference
    const fallbackChannels = options.fallbackChannels || ['in-app', 'push'];
    
    for (const channel of fallbackChannels) {
      try {
        // Create fallback notification payload
        const fallbackPayload = {
          userId: recipient.userId,
          channel,
          template: {
            id: template.id,
            title: template.subject,
            body: this.extractTextFromHtml(template.html),
          },
          options: {
            correlationId,
            journeyContext: options.journeyContext,
            metadata: {
              ...options.metadata,
              originalChannel: this.channelType,
              fallbackReason: error?.message || 'Email delivery failed',
            },
            // Don't enable further fallbacks to prevent loops
            enableFallback: false,
          },
        };
        
        // Send via fallback channel
        const result = await this.notificationsService.sendNotification(fallbackPayload);
        
        if (result.status === 'delivered') {
          this.logger.log('Fallback notification delivered successfully', {
            context: 'EmailService',
            correlationId,
            fallbackChannel: channel,
            recipient: recipient.userId,
          });
          
          return {
            status: 'delivered',
            channel: channel,
            timestamp: new Date(),
            attempts: 1,
            metadata: {
              originalChannel: this.channelType,
              fallbackReason: error?.message || 'Email delivery failed',
              ...result.metadata,
            },
          };
        }
      } catch (fallbackError) {
        this.logger.error('Fallback notification failed', {
          context: 'EmailService',
          correlationId,
          fallbackChannel: channel,
          error: fallbackError,
          recipient: recipient.userId,
        });
        // Continue to next fallback channel
      }
    }
    
    // All fallbacks failed
    return {
      status: 'failed',
      channel: this.channelType,
      timestamp: new Date(),
      attempts: 1,
      error: {
        code: 'ALL_FALLBACKS_FAILED',
        message: 'Failed to deliver notification through any channel',
        details: {
          originalError: error,
          triedChannels: [this.channelType, ...fallbackChannels],
        },
      },
    };
  }

  /**
   * Adds a failed notification to the dead-letter queue.
   * 
   * @param recipient - Email recipient information
   * @param template - Email template
   * @param options - Email options
   * @param correlationId - Correlation ID for tracing
   * @param error - The error that caused the failure
   */
  private async addToDlq(
    recipient: IEmailRecipient,
    template: IEmailTemplate,
    options: IEmailOptions,
    correlationId: string,
    error: any,
  ): Promise<void> {
    try {
      await this.dlqService.addEntry({
        channel: this.channelType,
        userId: recipient.userId,
        notificationId: options?.metadata?.notificationId,
        payload: {
          recipient,
          template,
          options,
        },
        errorDetails: {
          message: error?.message || 'Unknown error',
          code: error?.code || 'EMAIL_DELIVERY_FAILED',
          errorType: error?.errorType || ErrorType.EXTERNAL,
          journeyErrorCategory: JourneyErrorCategory.NOTIFICATION,
          stack: error?.stack,
          timestamp: new Date(),
        },
        metadata: {
          correlationId,
          templateId: template.id,
          journeyType: options?.journeyContext?.journeyType,
          ...options?.metadata,
        },
      });
      
      this.logger.log('Added failed email notification to DLQ', {
        context: 'EmailService',
        correlationId,
        recipient: recipient.email,
        templateId: template.id,
        errorCode: error?.code,
      });
    } catch (dlqError) {
      this.logger.error('Failed to add entry to DLQ', {
        context: 'EmailService',
        correlationId,
        error: dlqError,
        originalError: error,
        recipient: recipient.email,
      });
    }
  }

  /**
   * Extracts plain text from HTML content for use in fallback notifications.
   * 
   * @param html - HTML content to convert to plain text
   * @returns Plain text version of the HTML content
   */
  private extractTextFromHtml(html: string): string {
    if (!html) return '';
    
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li>/gi, '  * ')
      .replace(/<\/ul>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .trim();
  }
}