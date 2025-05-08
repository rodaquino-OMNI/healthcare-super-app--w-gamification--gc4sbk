import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import from @austa/interfaces package for standardized schemas
import { 
  INotificationEvent, 
  INotificationDeliveryStatus,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  JourneyType,
  IBaseEvent,
  IEventMetadata
} from '@austa/interfaces';

// Import DTOs
import { ProcessNotificationEventDto } from './dto/process-notification-event.dto';
import { NotificationDeliveryStatusDto } from './dto/notification-delivery-status.dto';
import { NotificationEventResponseDto } from './dto/notification-event-response.dto';

// Import interfaces
import { 
  INotificationEventHandler, 
  INotificationEventResponse,
  IRetryableOperation,
  RetryStatus
} from './interfaces';

// Import entities
import { NotificationDeliveryStatus } from '../events/entities/notification-delivery-status.entity';

// Import services
import { KafkaService } from '@austa/events';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { RetryService } from '../retry/retry.service';

/**
 * Service responsible for managing notification event processing, publication, and tracking.
 * It provides methods for publishing notification events to Kafka topics, processing
 * delivery status updates, and integrating with the retry system for failed delivery attempts.
 * This service ensures reliable event routing and maintains consistent event schemas across
 * the platform.
 */
@Injectable()
export class EventsService {
  // Topic names for Kafka
  private readonly NOTIFICATION_EVENTS_TOPIC = 'notification-events';
  private readonly NOTIFICATION_STATUS_TOPIC = 'notification-status';
  private readonly NOTIFICATION_DLQ_TOPIC = 'notification-dlq';
  
  // Default retry options
  private readonly DEFAULT_RETRY_OPTIONS = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 60000, // 1 minute
    backoffFactor: 2,
    jitter: 0.1
  };
  
  // Delivery status tracking metrics
  private deliveryMetrics = {
    total: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    channelMetrics: new Map<string, { total: number, successful: number, failed: number }>()
  };

  /**
   * Initializes the EventsService with required dependencies.
   * 
   * @param kafkaService - Service for Kafka event streaming
   * @param loggerService - Service for structured logging
   * @param tracingService - Service for distributed tracing
   * @param retryService - Service for handling retry operations
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService,
    @InjectRepository(NotificationDeliveryStatus)
    private readonly deliveryStatusRepository: Repository<NotificationDeliveryStatus>
  ) {
    this.loggerService.setContext('EventsService');
    this.loggerService.log('EventsService initialized');
  }

  /**
   * Publishes a notification event to the appropriate Kafka topic.
   * Includes distributed tracing context and handles errors with retry logic.
   * 
   * @param event - The notification event to publish
   * @returns A promise that resolves with the result of the event publication
   */
  async publishNotificationEvent(event: INotificationEvent): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('publishNotificationEvent');
    
    try {
      span.setAttributes({
        'notification.type': event.type,
        'notification.userId': event.userId,
        'notification.journey': event.journeyContext?.journey || 'unknown'
      });

      this.loggerService.debug(
        `Publishing notification event: ${event.type} for user ${event.userId}`,
        { event: { ...event, data: '...' } } // Log event without sensitive data
      );

      // Ensure event has required fields
      if (!event.userId || !event.type) {
        throw new Error('Invalid notification event: missing required fields');
      }

      // Add timestamp if not present
      if (!event.timestamp) {
        event.timestamp = new Date().toISOString();
      }

      // Add version if not present
      if (!event.version) {
        event.version = '1.0.0';
      }

      // Create a retryable operation for Kafka publishing
      const publishOperation: IRetryableOperation = {
        execute: async () => {
          return this.kafkaService.produce(
            this.NOTIFICATION_EVENTS_TOPIC,
            event,
            event.userId // Use userId as key for consistent partitioning
          );
        },
        getMetadata: () => ({
          operationType: 'kafka_publish',
          entityType: 'notification_event',
          entityId: `${event.type}_${event.userId}_${Date.now()}`,
          context: {
            userId: event.userId,
            eventType: event.type,
            journey: event.journeyContext?.journey
          }
        })
      };

      // Execute with retry capability
      const result = await this.retryService.executeWithRetry(
        publishOperation,
        this.DEFAULT_RETRY_OPTIONS
      );

      this.loggerService.log(
        `Successfully published notification event: ${event.type} for user ${event.userId}`
      );

      return {
        success: true,
        eventId: result.messageId || `${event.type}_${event.userId}_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.loggerService.error(
        `Failed to publish notification event: ${event.type} for user ${event.userId}`,
        error.stack
      );

      span.setStatus({
        code: 2, // ERROR
        message: error.message
      });

      return {
        success: false,
        error: {
          message: error.message,
          code: 'NOTIFICATION_EVENT_PUBLISH_FAILED',
          details: error.stack
        },
        timestamp: new Date().toISOString()
      };
    } finally {
      span.end();
    }
  }

  /**
   * Processes a notification event received from Kafka.
   * Routes the event to the appropriate handler based on event type.
   * 
   * @param event - The notification event to process
   * @param handler - The handler for processing the event
   * @returns A promise that resolves with the result of the event processing
   */
  async processNotificationEvent(
    event: ProcessNotificationEventDto,
    handler: INotificationEventHandler
  ): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('processNotificationEvent');
    
    try {
      span.setAttributes({
        'notification.type': event.type,
        'notification.userId': event.userId,
        'notification.journey': event.journeyContext?.journey || 'unknown'
      });

      this.loggerService.debug(
        `Processing notification event: ${event.type} for user ${event.userId}`,
        { eventType: event.type, userId: event.userId }
      );

      // Validate event
      if (!event.userId || !event.type) {
        throw new Error('Invalid notification event: missing required fields');
      }

      // Process the event with the provided handler
      const result = await handler.handleEvent(event);

      // If processing failed, schedule a retry
      if (!result.success) {
        this.loggerService.warn(
          `Failed to process notification event: ${event.type} for user ${event.userId}. Scheduling retry.`,
          { error: result.error }
        );

        // Create a retryable operation for event processing
        const retryOperation: IRetryableOperation = {
          execute: async () => handler.handleEvent(event),
          getMetadata: () => ({
            operationType: 'event_processing',
            entityType: 'notification_event',
            entityId: `${event.type}_${event.userId}_${Date.now()}`,
            context: {
              userId: event.userId,
              eventType: event.type,
              journey: event.journeyContext?.journey
            }
          })
        };

        // Schedule retry with appropriate options
        await this.retryService.scheduleRetry(
          retryOperation,
          this.DEFAULT_RETRY_OPTIONS
        );

        return {
          success: false,
          error: result.error,
          retryScheduled: true,
          timestamp: new Date().toISOString()
        };
      }

      this.loggerService.log(
        `Successfully processed notification event: ${event.type} for user ${event.userId}`
      );

      return {
        success: true,
        eventId: result.eventId || `${event.type}_${event.userId}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        data: result.data
      };
    } catch (error) {
      this.loggerService.error(
        `Error processing notification event: ${event.type} for user ${event.userId}`,
        error.stack
      );

      span.setStatus({
        code: 2, // ERROR
        message: error.message
      });

      return {
        success: false,
        error: {
          message: error.message,
          code: 'NOTIFICATION_EVENT_PROCESSING_FAILED',
          details: error.stack
        },
        timestamp: new Date().toISOString()
      };
    } finally {
      span.end();
    }
  }

  /**
   * Publishes a notification delivery status update to Kafka.
   * Tracks the status of notification delivery across various channels.
   * 
   * @param statusUpdate - The delivery status update to publish
   * @returns A promise that resolves with the result of the status update publication
   */
  async publishDeliveryStatus(
    statusUpdate: NotificationDeliveryStatusDto
  ): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('publishDeliveryStatus');
    
    try {
      span.setAttributes({
        'notification.id': statusUpdate.notificationId,
        'notification.channel': statusUpdate.channel,
        'notification.status': statusUpdate.status,
        'notification.userId': statusUpdate.userId
      });

      this.loggerService.debug(
        `Publishing delivery status update for notification ${statusUpdate.notificationId}`,
        { status: statusUpdate.status, channel: statusUpdate.channel }
      );

      // Ensure status update has required fields
      if (!statusUpdate.notificationId || !statusUpdate.status || !statusUpdate.channel) {
        throw new Error('Invalid delivery status update: missing required fields');
      }

      // Add timestamp if not present
      if (!statusUpdate.timestamp) {
        statusUpdate.timestamp = new Date().toISOString();
      }

      // Create a retryable operation for Kafka publishing
      const publishOperation: IRetryableOperation = {
        execute: async () => {
          return this.kafkaService.produce(
            this.NOTIFICATION_STATUS_TOPIC,
            statusUpdate,
            statusUpdate.notificationId // Use notificationId as key for consistent partitioning
          );
        },
        getMetadata: () => ({
          operationType: 'kafka_publish',
          entityType: 'notification_status',
          entityId: `${statusUpdate.notificationId}_${statusUpdate.status}`,
          context: {
            userId: statusUpdate.userId,
            channel: statusUpdate.channel,
            status: statusUpdate.status
          }
        })
      };

      // Execute with retry capability
      const result = await this.retryService.executeWithRetry(
        publishOperation,
        this.DEFAULT_RETRY_OPTIONS
      );

      this.loggerService.log(
        `Successfully published delivery status update for notification ${statusUpdate.notificationId}`
      );

      return {
        success: true,
        eventId: result.messageId || `${statusUpdate.notificationId}_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.loggerService.error(
        `Failed to publish delivery status update for notification ${statusUpdate.notificationId}`,
        error.stack
      );

      span.setStatus({
        code: 2, // ERROR
        message: error.message
      });

      return {
        success: false,
        error: {
          message: error.message,
          code: 'DELIVERY_STATUS_PUBLISH_FAILED',
          details: error.stack
        },
        timestamp: new Date().toISOString()
      };
    } finally {
      span.end();
    }
  }

  /**
   * Processes a delivery status update received from Kafka.
   * Updates notification records and triggers appropriate actions based on status.
   * 
   * @param statusUpdate - The delivery status update to process
   * @returns A promise that resolves with the result of the status update processing
   */
  async processDeliveryStatus(
    statusUpdate: NotificationDeliveryStatusDto
  ): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('processDeliveryStatus');
    
    try {
      span.setAttributes({
        'notification.id': statusUpdate.notificationId,
        'notification.channel': statusUpdate.channel,
        'notification.status': statusUpdate.status
      });

      this.loggerService.debug(
        `Processing delivery status update for notification ${statusUpdate.notificationId}`,
        { status: statusUpdate.status, channel: statusUpdate.channel }
      );

      // Validate status update
      if (!statusUpdate.notificationId || !statusUpdate.status || !statusUpdate.channel) {
        throw new Error('Invalid delivery status update: missing required fields');
      }

      // Save status update to database for tracking and analytics
      await this.saveDeliveryStatus(statusUpdate);
      
      // Handle different status types
      switch (statusUpdate.status) {
        case NotificationStatus.DELIVERED:
          // Update notification record as delivered
          this.loggerService.log(
            `Notification ${statusUpdate.notificationId} marked as delivered via ${statusUpdate.channel}`
          );
          break;

        case NotificationStatus.FAILED:
          // Handle failed delivery
          this.loggerService.warn(
            `Notification ${statusUpdate.notificationId} failed to deliver via ${statusUpdate.channel}`,
            { error: statusUpdate.error }
          );

          // If there's an error and it's retryable, schedule a retry
          if (statusUpdate.error && this.isRetryableError(statusUpdate.error)) {
            await this.handleFailedDelivery(statusUpdate);
          } else {
            // Non-retryable error, send to DLQ
            await this.sendToDeadLetterQueue(statusUpdate);
          }
          break;

        case NotificationStatus.READ:
          // Update notification record as read
          this.loggerService.log(
            `Notification ${statusUpdate.notificationId} marked as read by user ${statusUpdate.userId}`
          );
          break;

        default:
          this.loggerService.log(
            `Notification ${statusUpdate.notificationId} status updated to ${statusUpdate.status}`
          );
      }

      return {
        success: true,
        eventId: `${statusUpdate.notificationId}_${statusUpdate.status}_${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.loggerService.error(
        `Error processing delivery status update for notification ${statusUpdate.notificationId}`,
        error.stack
      );

      span.setStatus({
        code: 2, // ERROR
        message: error.message
      });

      return {
        success: false,
        error: {
          message: error.message,
          code: 'DELIVERY_STATUS_PROCESSING_FAILED',
          details: error.stack
        },
        timestamp: new Date().toISOString()
      };
    } finally {
      span.end();
    }
  }

  /**
   * Handles a failed notification delivery by scheduling a retry.
   * Uses the retry service to implement exponential backoff.
   * 
   * @param statusUpdate - The failed delivery status update
   * @returns A promise that resolves when the retry is scheduled
   * @private
   */
  private async handleFailedDelivery(
    statusUpdate: NotificationDeliveryStatusDto
  ): Promise<void> {
    this.loggerService.log(
      `Scheduling retry for failed notification ${statusUpdate.notificationId} via ${statusUpdate.channel}`
    );

    // Create a retryable operation for the failed delivery
    const retryOperation: IRetryableOperation = {
      execute: async () => {
        // This would typically call a method to retry sending the notification
        // For now, we'll just return a success response
        return { success: true };
      },
      getMetadata: () => ({
        operationType: 'notification_delivery',
        entityType: 'notification',
        entityId: statusUpdate.notificationId,
        context: {
          userId: statusUpdate.userId,
          channel: statusUpdate.channel,
          notificationType: statusUpdate.notificationType,
          journey: statusUpdate.journeyContext?.journey
        }
      })
    };

    // Determine retry options based on channel and error type
    const retryOptions = this.getRetryOptionsForChannel(statusUpdate.channel);

    // Schedule the retry
    await this.retryService.scheduleRetry(retryOperation, retryOptions);
  }

  /**
   * Sends a failed notification to the dead letter queue after exhausting retries.
   * 
   * @param statusUpdate - The failed delivery status update
   * @returns A promise that resolves when the notification is sent to the DLQ
   * @private
   */
  /**
   * Saves a delivery status update to the database for tracking and analytics.
   * 
   * @param statusUpdate - The delivery status update to save
   * @returns A promise that resolves when the status is saved
   * @private
   */
  private async saveDeliveryStatus(
    statusUpdate: NotificationDeliveryStatusDto
  ): Promise<NotificationDeliveryStatus> {
    try {
      // Update metrics
      this.updateDeliveryMetrics(statusUpdate);
      
      // Create entity
      const deliveryStatus = this.deliveryStatusRepository.create({
        notificationId: statusUpdate.notificationId,
        userId: statusUpdate.userId,
        channel: statusUpdate.channel,
        status: statusUpdate.status,
        errorMessage: statusUpdate.error?.message,
        errorCode: statusUpdate.error?.code,
        retryCount: statusUpdate.retryCount || 0,
        notificationType: statusUpdate.notificationType,
        journeyType: statusUpdate.journeyContext?.journey,
        metadata: JSON.stringify(statusUpdate.metadata || {}),
        createdAt: new Date()
      });
      
      // Save to database
      return await this.deliveryStatusRepository.save(deliveryStatus);
    } catch (error) {
      this.loggerService.error(
        `Failed to save delivery status for notification ${statusUpdate.notificationId}`,
        error.stack
      );
      // Non-blocking - we don't want to fail status processing if DB save fails
      return null;
    }
  }
  
  /**
   * Updates delivery metrics for monitoring and reporting.
   * 
   * @param statusUpdate - The delivery status update
   * @private
   */
  private updateDeliveryMetrics(statusUpdate: NotificationDeliveryStatusDto): void {
    // Update total count
    this.deliveryMetrics.total++;
    
    // Update status-specific counts
    if (statusUpdate.status === NotificationStatus.DELIVERED) {
      this.deliveryMetrics.successful++;
    } else if (statusUpdate.status === NotificationStatus.FAILED) {
      this.deliveryMetrics.failed++;
    }
    
    // Update retry count if applicable
    if (statusUpdate.retryCount && statusUpdate.retryCount > 0) {
      this.deliveryMetrics.retried++;
    }
    
    // Update channel-specific metrics
    const channel = statusUpdate.channel;
    if (!this.deliveryMetrics.channelMetrics.has(channel)) {
      this.deliveryMetrics.channelMetrics.set(channel, { total: 0, successful: 0, failed: 0 });
    }
    
    const channelMetrics = this.deliveryMetrics.channelMetrics.get(channel);
    channelMetrics.total++;
    
    if (statusUpdate.status === NotificationStatus.DELIVERED) {
      channelMetrics.successful++;
    } else if (statusUpdate.status === NotificationStatus.FAILED) {
      channelMetrics.failed++;
    }
  }
  
  /**
   * Sends a failed notification to the dead letter queue after exhausting retries.
   * 
   * @param statusUpdate - The failed delivery status update
   * @returns A promise that resolves when the notification is sent to the DLQ
   * @private
   */
  private async sendToDeadLetterQueue(
    statusUpdate: NotificationDeliveryStatusDto
  ): Promise<void> {
    this.loggerService.warn(
      `Sending failed notification ${statusUpdate.notificationId} to DLQ after exhausting retries`
    );

    try {
      // Prepare DLQ entry
      const dlqEntry = {
        notificationId: statusUpdate.notificationId,
        userId: statusUpdate.userId,
        channel: statusUpdate.channel,
        status: NotificationStatus.FAILED,
        error: statusUpdate.error,
        retryCount: statusUpdate.retryCount || 0,
        originalPayload: statusUpdate.originalPayload,
        timestamp: new Date().toISOString()
      };

      // Publish to DLQ topic
      await this.kafkaService.produce(
        this.NOTIFICATION_DLQ_TOPIC,
        dlqEntry,
        statusUpdate.notificationId
      );

      this.loggerService.log(
        `Successfully sent notification ${statusUpdate.notificationId} to DLQ`
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to send notification ${statusUpdate.notificationId} to DLQ`,
        error.stack
      );
      // Even if DLQ fails, we don't retry to avoid infinite loops
    }
  }

  /**
   * Determines if an error is retryable based on error type and code.
   * 
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   * @private
   */
  private isRetryableError(error: any): boolean {
    // If no error, not retryable
    if (!error) return false;

    // Check for network errors, which are typically retryable
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ESOCKETTIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'EAI_AGAIN'
    ) {
      return true;
    }

    // Check for rate limiting errors
    if (error.code === 'RATE_LIMITED' || error.code === 'TOO_MANY_REQUESTS') {
      return true;
    }

    // Check for temporary service unavailability
    if (error.code === 'SERVICE_UNAVAILABLE' || error.code === 'TEMPORARY_ERROR') {
      return true;
    }

    // If error has a retryable flag, use that
    if (error.retryable !== undefined) {
      return error.retryable;
    }

    // Default to not retryable for unknown errors
    return false;
  }

  /**
   * Gets delivery metrics for monitoring and reporting.
   * 
   * @returns Current delivery metrics
   */
  getDeliveryMetrics(): any {
    return {
      ...this.deliveryMetrics,
      channelMetrics: Object.fromEntries(this.deliveryMetrics.channelMetrics)
    };
  }
  
  /**
   * Gets retry options specific to a notification channel.
   * Different channels may have different retry strategies.
   * 
   * @param channel - The notification channel
   * @returns Retry options for the specified channel
   * @private
   */
  private getRetryOptionsForChannel(channel: NotificationChannel): any {
    // Default retry options
    const defaultOptions = { ...this.DEFAULT_RETRY_OPTIONS };

    // Channel-specific retry options
    switch (channel) {
      case NotificationChannel.EMAIL:
        // Emails can be retried more times with longer delays
        return {
          ...defaultOptions,
          maxRetries: 5,
          initialDelay: 5000, // 5 seconds
          maxDelay: 3600000 // 1 hour
        };

      case NotificationChannel.SMS:
        // SMS is more time-sensitive, so fewer retries with shorter delays
        return {
          ...defaultOptions,
          maxRetries: 2,
          initialDelay: 1000, // 1 second
          maxDelay: 30000 // 30 seconds
        };

      case NotificationChannel.PUSH:
        // Push notifications are also time-sensitive
        return {
          ...defaultOptions,
          maxRetries: 3,
          initialDelay: 1000, // 1 second
          maxDelay: 60000 // 1 minute
        };

      case NotificationChannel.IN_APP:
        // In-app notifications can be retried more aggressively
        return {
          ...defaultOptions,
          maxRetries: 5,
          initialDelay: 500, // 0.5 seconds
          maxDelay: 10000 // 10 seconds
        };

      default:
        return defaultOptions;
    }
  }

  /**
   * Creates a notification event with proper structure and defaults.
   * 
   * @param type - The notification type
   * @param userId - The user ID
   * @param data - Additional data for the notification
   * @param journey - The journey context (health, care, plan)
   * @returns A properly structured notification event
   */
  createNotificationEvent(
    type: NotificationType,
    userId: string,
    data: any = {},
    journey?: JourneyType
  ): INotificationEvent {
    return {
      type,
      userId,
      data,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      journeyContext: journey ? { journey } : undefined
    };
  }

  /**
   * Creates a delivery status update with proper structure and defaults.
   * 
   * @param notificationId - The notification ID
   * @param status - The delivery status
   * @param channel - The notification channel
   * @param userId - The user ID
   * @param error - Optional error information
   * @returns A properly structured delivery status update
   */
  createDeliveryStatus(
    notificationId: string,
    status: NotificationStatus,
    channel: NotificationChannel,
    userId: string,
    error?: any,
    notificationType?: NotificationType,
    journeyContext?: { journey: JourneyType }
  ): INotificationDeliveryStatus {
    return {
      notificationId,
      status,
      channel,
      userId,
      timestamp: new Date().toISOString(),
      error: error ? {
        message: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.stack || ''
      } : undefined,
      retryCount: 0,
      notificationType,
      journeyContext
    };
  }
}