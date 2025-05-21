import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import from @austa/interfaces for standardized notification payload schemas
import { 
  NotificationEventType,
  INotificationEvent,
  INotificationDeliveryStatus,
  IJourneyNotificationEvent,
  INotificationEventResponse
} from '@austa/interfaces';

// Import local interfaces and DTOs
import { NotificationStatus } from '../events/interfaces/notification-status.interface';
import { ProcessNotificationEventDto } from './dto/process-notification-event.dto';
import { NotificationDeliveryStatusDto } from './dto/notification-delivery-status.dto';
import { NotificationEventResponseDto } from './dto/notification-event-response.dto';

// Import services
import { NotificationsService } from '../notifications/notifications.service';
import { RetryService } from '../retry/retry.service';
import { DlqService } from '../retry/dlq/dlq.service';

// Import shared services
import { LoggerService } from '../../shared/src/logging/logger.service';
import { TracingService } from '../../shared/src/tracing/tracing.service';
import { KafkaService } from '../../shared/src/kafka/kafka.service';

/**
 * Service responsible for managing notification event processing, publication, and tracking.
 * It provides methods for publishing notification events to Kafka topics, processing
 * delivery status updates, and integrating with the retry system for failed delivery attempts.
 * This service ensures reliable event routing and maintains consistent event schemas.
 */
@Injectable()
export class EventsService {
  // Kafka topics for notification events
  private readonly NOTIFICATION_EVENTS_TOPIC = 'notification-events';
  private readonly NOTIFICATION_STATUS_TOPIC = 'notification-status';
  private readonly NOTIFICATION_DLQ_TOPIC = 'notification-dlq';
  
  // Journey-specific topics
  private readonly JOURNEY_TOPICS = {
    health: 'health-journey-notifications',
    care: 'care-journey-notifications',
    plan: 'plan-journey-notifications',
    gamification: 'gamification-notifications'
  };

  /**
   * Creates an instance of the EventsService.
   * 
   * @param notificationsService - Service for sending notifications
   * @param retryService - Service for handling retry logic
   * @param dlqService - Service for managing dead-letter queue
   * @param kafkaService - Service for Kafka integration
   * @param loggerService - Service for structured logging
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger.log('EventsService initialized', 'EventsService');
  }

  /**
   * Processes a notification event received from Kafka.
   * Validates the event, routes it to the appropriate handler,
   * and tracks delivery status.
   * 
   * @param event - The notification event to process
   * @returns A promise resolving to the notification processing result
   */
  async processEvent(event: ProcessNotificationEventDto): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('processNotificationEvent', {
      'event.type': event.type,
      'user.id': event.userId,
      'journey': event.journeyContext || 'unknown'
    });

    try {
      this.logger.log(
        `Processing notification event: ${event.type} for user ${event.userId}`,
        'EventsService'
      );

      // Validate event schema based on type
      this.validateEventSchema(event);

      // Process the notification based on event type
      let result;
      switch (event.type) {
        case NotificationEventType.SEND_NOTIFICATION:
          result = await this.processNotificationRequest(event);
          break;
        case NotificationEventType.UPDATE_PREFERENCES:
          // Handle preference updates (not implemented in this version)
          result = { success: true, message: 'Preferences updated' };
          break;
        default:
          this.logger.warn(
            `Unknown notification event type: ${event.type}`,
            'EventsService'
          );
          return { 
            success: false, 
            error: {
              code: 'UNKNOWN_EVENT_TYPE',
              message: `Unknown notification event type: ${event.type}`
            }
          };
      }

      this.logger.log(
        `Successfully processed notification event: ${event.type} for user ${event.userId}`,
        'EventsService'
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error processing notification event: ${event.type} for user ${event.userId}`,
        error,
        'EventsService'
      );

      // Determine if this error is retryable
      const isRetryable = this.isRetryableError(error);

      if (isRetryable) {
        // Schedule retry with appropriate policy
        await this.scheduleRetry(event, error);
        
        return { 
          success: false, 
          error: {
            code: 'PROCESSING_ERROR',
            message: error.message,
            retryScheduled: true
          }
        };
      } else {
        // Send to dead-letter queue for non-retryable errors
        await this.sendToDlq(event, error);
        
        return { 
          success: false, 
          error: {
            code: 'FATAL_PROCESSING_ERROR',
            message: error.message,
            retryScheduled: false
          }
        };
      }
    } finally {
      span.end();
    }
  }

  /**
   * Processes a notification request event by sending the notification
   * through the NotificationsService.
   * 
   * @param event - The notification request event
   * @returns A promise resolving to the notification processing result
   * @private
   */
  private async processNotificationRequest(event: ProcessNotificationEventDto): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('processNotificationRequest', {
      'event.type': event.type,
      'user.id': event.userId,
      'journey': event.journeyContext || 'unknown'
    });

    try {
      // Convert event to SendNotificationDto format
      const notificationDto = {
        userId: event.userId,
        type: event.notificationType || 'general',
        title: event.title,
        body: event.body,
        data: event.data || {},
        templateId: event.templateId,
        language: event.language || 'pt-BR',
      };

      // Send notification through NotificationsService
      await this.notificationsService.sendNotification(notificationDto);

      // Publish delivery status event
      await this.publishDeliveryStatus({
        notificationId: event.id || `${Date.now()}`,
        userId: event.userId,
        status: NotificationStatus.SENT,
        timestamp: new Date().toISOString(),
        channels: event.channels || ['in-app'],
        journeyContext: event.journeyContext,
        metadata: {
          eventId: event.id,
          eventType: event.type
        }
      });

      return { 
        success: true, 
        notificationId: event.id || `${Date.now()}`,
        status: NotificationStatus.SENT
      };
    } catch (error) {
      this.logger.error(
        `Error sending notification for user ${event.userId}`,
        error,
        'EventsService'
      );

      // Publish failed delivery status
      await this.publishDeliveryStatus({
        notificationId: event.id || `${Date.now()}`,
        userId: event.userId,
        status: NotificationStatus.FAILED,
        timestamp: new Date().toISOString(),
        channels: event.channels || ['in-app'],
        journeyContext: event.journeyContext,
        error: {
          code: error.code || 'NOTIFICATION_DELIVERY_ERROR',
          message: error.message,
          details: error.stack
        },
        metadata: {
          eventId: event.id,
          eventType: event.type
        }
      });

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Publishes a notification event to the appropriate Kafka topic.
   * 
   * @param event - The notification event to publish
   * @returns A promise that resolves when the event is published
   */
  async publishEvent(event: INotificationEvent): Promise<void> {
    const span = this.tracingService.startSpan('publishNotificationEvent', {
      'event.type': event.type,
      'user.id': event.userId,
      'journey': event.journeyContext || 'unknown'
    });

    try {
      this.logger.log(
        `Publishing notification event: ${event.type} for user ${event.userId}`,
        'EventsService'
      );

      // Add metadata for tracing and versioning
      const enrichedEvent = {
        ...event,
        timestamp: event.timestamp || new Date().toISOString(),
        version: event.version || '1.0.0',
        traceId: span.context().traceId,
      };

      // Determine the appropriate topic based on journey context
      let topic = this.NOTIFICATION_EVENTS_TOPIC;
      if (event.journeyContext && this.JOURNEY_TOPICS[event.journeyContext]) {
        topic = this.JOURNEY_TOPICS[event.journeyContext];
      }

      // Publish to Kafka with the user ID as the key for consistent partitioning
      await this.kafkaService.produce(
        topic,
        enrichedEvent,
        event.userId
      );

      this.logger.log(
        `Successfully published notification event to topic ${topic}`,
        'EventsService'
      );
    } catch (error) {
      this.logger.error(
        `Error publishing notification event: ${event.type}`,
        error,
        'EventsService'
      );

      // Determine if this error is retryable
      const isRetryable = this.isRetryableError(error);

      if (isRetryable) {
        // Schedule retry for publishing
        await this.retryService.scheduleRetry({
          operation: 'publishEvent',
          params: { event },
          error,
          context: {
            userId: event.userId,
            eventType: event.type,
            journeyContext: event.journeyContext
          }
        });
      } else {
        // For non-retryable errors, send to DLQ
        await this.dlqService.addToDlq({
          payload: JSON.stringify(event),
          errorDetails: {
            message: error.message,
            stack: error.stack,
            code: error.code || 'KAFKA_PUBLISH_ERROR'
          },
          userId: event.userId,
          notificationId: event.id,
          channel: 'kafka',
          retryHistory: []
        });
      }

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Publishes a notification delivery status update to Kafka.
   * 
   * @param status - The delivery status update
   * @returns A promise that resolves when the status is published
   */
  async publishDeliveryStatus(status: NotificationDeliveryStatusDto): Promise<void> {
    const span = this.tracingService.startSpan('publishDeliveryStatus', {
      'notification.id': status.notificationId,
      'user.id': status.userId,
      'status': status.status,
      'journey': status.journeyContext || 'unknown'
    });

    try {
      this.logger.log(
        `Publishing delivery status ${status.status} for notification ${status.notificationId}`,
        'EventsService'
      );

      // Add metadata for tracing
      const enrichedStatus = {
        ...status,
        timestamp: status.timestamp || new Date().toISOString(),
        traceId: span.context().traceId,
      };

      // Publish to Kafka with the notification ID as the key
      await this.kafkaService.produce(
        this.NOTIFICATION_STATUS_TOPIC,
        enrichedStatus,
        status.notificationId
      );

      this.logger.log(
        `Successfully published delivery status for notification ${status.notificationId}`,
        'EventsService'
      );
    } catch (error) {
      this.logger.error(
        `Error publishing delivery status for notification ${status.notificationId}`,
        error,
        'EventsService'
      );

      // Determine if this error is retryable
      const isRetryable = this.isRetryableError(error);

      if (isRetryable) {
        // Schedule retry for publishing status
        await this.retryService.scheduleRetry({
          operation: 'publishDeliveryStatus',
          params: { status },
          error,
          context: {
            userId: status.userId,
            notificationId: status.notificationId,
            status: status.status
          }
        });
      }

      // Non-blocking - we continue even if status publishing fails
      // as this is a secondary operation
    } finally {
      span.end();
    }
  }

  /**
   * Updates the delivery status of a notification.
   * 
   * @param notificationId - ID of the notification
   * @param status - New status of the notification
   * @param userId - ID of the user
   * @param metadata - Additional metadata for the status update
   * @returns A promise that resolves when the status is updated
   */
  async updateDeliveryStatus(
    notificationId: string,
    status: NotificationStatus,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const span = this.tracingService.startSpan('updateDeliveryStatus', {
      'notification.id': notificationId,
      'user.id': userId,
      'status': status
    });

    try {
      this.logger.log(
        `Updating delivery status to ${status} for notification ${notificationId}`,
        'EventsService'
      );

      // Create status update DTO
      const statusUpdate: NotificationDeliveryStatusDto = {
        notificationId,
        userId,
        status,
        timestamp: new Date().toISOString(),
        channels: metadata?.channels || ['in-app'],
        journeyContext: metadata?.journeyContext,
        metadata: metadata || {}
      };

      // Publish status update to Kafka
      await this.publishDeliveryStatus(statusUpdate);

      this.logger.log(
        `Successfully updated delivery status for notification ${notificationId}`,
        'EventsService'
      );
    } catch (error) {
      this.logger.error(
        `Error updating delivery status for notification ${notificationId}`,
        error,
        'EventsService'
      );

      // Schedule retry for status update
      await this.scheduleRetry({
        notificationId,
        userId,
        status,
        metadata
      }, error);

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Processes a journey-specific notification event.
   * 
   * @param event - The journey notification event
   * @returns A promise resolving to the notification processing result
   */
  async processJourneyEvent(event: IJourneyNotificationEvent): Promise<INotificationEventResponse> {
    const span = this.tracingService.startSpan('processJourneyEvent', {
      'event.type': event.type,
      'user.id': event.userId,
      'journey': event.journeyContext
    });

    try {
      this.logger.log(
        `Processing journey notification event from ${event.journeyContext} journey for user ${event.userId}`,
        'EventsService'
      );

      // Convert journey event to standard notification event
      const notificationEvent: ProcessNotificationEventDto = {
        id: event.id || `${Date.now()}`,
        type: NotificationEventType.SEND_NOTIFICATION,
        userId: event.userId,
        title: event.title,
        body: event.body,
        data: event.data || {},
        notificationType: event.notificationType || 'journey',
        journeyContext: event.journeyContext,
        channels: event.channels || ['in-app'],
        templateId: event.templateId,
        language: event.language || 'pt-BR',
      };

      // Process the notification event
      return await this.processEvent(notificationEvent);
    } catch (error) {
      this.logger.error(
        `Error processing journey notification event for user ${event.userId}`,
        error,
        'EventsService'
      );

      // Determine if this error is retryable
      const isRetryable = this.isRetryableError(error);

      if (isRetryable) {
        // Schedule retry with appropriate policy
        await this.scheduleRetry(event, error);
        
        return { 
          success: false, 
          error: {
            code: 'JOURNEY_PROCESSING_ERROR',
            message: error.message,
            retryScheduled: true
          }
        };
      } else {
        // Send to dead-letter queue for non-retryable errors
        await this.sendToDlq(event, error);
        
        return { 
          success: false, 
          error: {
            code: 'FATAL_JOURNEY_PROCESSING_ERROR',
            message: error.message,
            retryScheduled: false
          }
        };
      }
    } finally {
      span.end();
    }
  }

  /**
   * Validates the schema of a notification event.
   * 
   * @param event - The event to validate
   * @throws Error if the event schema is invalid
   * @private
   */
  private validateEventSchema(event: any): void {
    // Basic validation
    if (!event) {
      throw new Error('Event cannot be null or undefined');
    }

    if (!event.type) {
      throw new Error('Event must have a type');
    }

    if (!event.userId) {
      throw new Error('Event must have a userId');
    }

    // Type-specific validation
    if (event.type === NotificationEventType.SEND_NOTIFICATION) {
      if (!event.title && !event.templateId) {
        throw new Error('Notification event must have either a title or a templateId');
      }

      if (!event.body && !event.templateId) {
        throw new Error('Notification event must have either a body or a templateId');
      }
    }

    // Journey-specific validation
    if (event.journeyContext) {
      const validJourneys = ['health', 'care', 'plan', 'gamification'];
      if (!validJourneys.includes(event.journeyContext)) {
        throw new Error(`Invalid journey context: ${event.journeyContext}`);
      }
    }
  }

  /**
   * Determines if an error is retryable based on its type and properties.
   * 
   * @param error - The error to check
   * @returns True if the error is retryable, false otherwise
   * @private
   */
  private isRetryableError(error: any): boolean {
    // Non-retryable errors
    const nonRetryableCodes = [
      'INVALID_SCHEMA',
      'INVALID_USER',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
      'VALIDATION_ERROR'
    ];

    // Check if error has a code that indicates it's non-retryable
    if (error.code && nonRetryableCodes.includes(error.code)) {
      return false;
    }

    // Check for specific error types that are always non-retryable
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return false;
    }

    // By default, consider errors retryable
    // This is safer as it allows the retry system to handle transient issues
    return true;
  }

  /**
   * Schedules a retry for a failed operation using the RetryService.
   * 
   * @param event - The event that failed processing
   * @param error - The error that occurred
   * @returns A promise that resolves when the retry is scheduled
   * @private
   */
  private async scheduleRetry(event: any, error: any): Promise<void> {
    try {
      // Determine the appropriate retry policy based on the error and event type
      const policyType = this.determineRetryPolicy(event, error);

      // Schedule the retry with the RetryService
      await this.retryService.scheduleRetry({
        operation: 'processEvent',
        params: { event },
        error,
        policyType,
        context: {
          userId: event.userId,
          eventType: event.type,
          journeyContext: event.journeyContext
        }
      });

      this.logger.log(
        `Scheduled retry for event ${event.type} with policy ${policyType}`,
        'EventsService'
      );
    } catch (retryError) {
      this.logger.error(
        `Failed to schedule retry for event ${event.type}`,
        retryError,
        'EventsService'
      );

      // If retry scheduling fails, send to DLQ as a fallback
      await this.sendToDlq(event, error);
    }
  }

  /**
   * Determines the appropriate retry policy based on the event and error.
   * 
   * @param event - The event that failed processing
   * @param error - The error that occurred
   * @returns The name of the retry policy to use
   * @private
   */
  private determineRetryPolicy(event: any, error: any): string {
    // Default to exponential backoff for most errors
    let policyType = 'exponentialBackoff';

    // Use fixed interval for rate limiting errors
    if (error.code === 'RATE_LIMITED' || error.message?.includes('rate limit')) {
      policyType = 'fixedInterval';
    }

    // Use shorter retry intervals for high-priority notifications
    if (event.priority === 'high' || event.notificationType === 'emergency') {
      policyType = 'highPriorityExponentialBackoff';
    }

    return policyType;
  }

  /**
   * Sends a failed event to the dead-letter queue.
   * 
   * @param event - The event that failed processing
   * @param error - The error that occurred
   * @returns A promise that resolves when the event is sent to the DLQ
   * @private
   */
  private async sendToDlq(event: any, error: any): Promise<void> {
    try {
      // Add the event to the DLQ
      await this.dlqService.addToDlq({
        payload: JSON.stringify(event),
        errorDetails: {
          message: error.message,
          stack: error.stack,
          code: error.code || 'PROCESSING_ERROR'
        },
        userId: event.userId,
        notificationId: event.id,
        channel: event.channels?.[0] || 'unknown',
        retryHistory: []
      });

      this.logger.log(
        `Sent failed event ${event.type} to DLQ`,
        'EventsService'
      );

      // Also publish to the DLQ Kafka topic for monitoring
      try {
        await this.kafkaService.produce(
          this.NOTIFICATION_DLQ_TOPIC,
          {
            event,
            error: {
              message: error.message,
              code: error.code || 'PROCESSING_ERROR',
              timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
          },
          event.id || event.userId
        );
      } catch (kafkaError) {
        // Non-blocking - we continue even if Kafka publishing fails
        this.logger.error(
          `Failed to publish DLQ event to Kafka`,
          kafkaError,
          'EventsService'
        );
      }
    } catch (dlqError) {
      this.logger.error(
        `Failed to send event to DLQ`,
        dlqError,
        'EventsService'
      );
      // At this point, we've exhausted all recovery options
      // The error will be propagated up the call stack
    }
  }
}