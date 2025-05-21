import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationsService } from '../../notifications/notifications.service';
import { RetryService } from '../../retry/retry.service';
import { DlqService } from '../../retry/dlq/dlq.service';

import { KafkaService } from '../../../shared/src/kafka/kafka.service';
import { LoggerService } from '../../../shared/src/logging/logger.service';
import { TracingService } from '../../../shared/src/tracing/tracing.service';

import { 
  isNotificationEvent,
  isJourneyNotificationEvent,
  isVersionedNotificationEvent,
  INotificationEvent
} from '../interfaces/notification-event.interface';

/**
 * Consumes notification events from Kafka topics and processes them.
 * This consumer is responsible for handling events from all journeys (Health, Care, Plan)
 * and the Gamification Engine, forwarding them to the NotificationsService for delivery.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly journeyTopics: string[];
  private readonly groupId: string;
  private readonly maxRetries: number;
  
  /**
   * Injects the necessary services.
   * 
   * @param notificationsService Service for sending notifications
   * @param retryService Service for handling retry operations
   * @param dlqService Service for dead-letter queue operations
   * @param kafkaService Service for Kafka interaction
   * @param configService Service for application configuration
   * @param logger Service for structured logging
   * @param tracing Service for distributed tracing
   */
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracing: TracingService,
  ) {
    // Get configuration values
    this.journeyTopics = this.configService.get<string[]>('kafka.topics', [
      'health.notifications',
      'care.notifications',
      'plan.notifications',
      'gamification.events'
    ]);
    
    this.groupId = this.configService.get<string>('kafka.groupId', 'notification-service');
    this.maxRetries = this.configService.get<number>('kafka.maxRetries', 3);
    
    this.logger.log('KafkaConsumer initialized', 'KafkaConsumer');
  }

  /**
   * Subscribes to Kafka topics on module initialization.
   * This sets up consumers for all journey notification topics and the gamification events topic.
   */
  async onModuleInit(): Promise<void> {
    const span = this.tracing.startSpan('KafkaConsumer.onModuleInit');
    
    try {
      for (const topic of this.journeyTopics) {
        await this.kafkaService.consume(
          topic,
          this.groupId,
          async (message: any, key?: string, headers?: Record<string, string>) => {
            await this.processMessage(message, topic, key, headers);
          }
        );
        
        this.logger.log(`Subscribed to Kafka topic: ${topic}`, 'KafkaConsumer');
      }
      
      this.logger.log(
        `Successfully subscribed to ${this.journeyTopics.length} Kafka topics`,
        'KafkaConsumer'
      );
    } catch (error) {
      this.logger.error(
        'Failed to subscribe to Kafka topics',
        error,
        'KafkaConsumer'
      );
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Processes a message from a Kafka topic.
   * Validates the message format and forwards it to the NotificationsService for processing.
   * 
   * @param message The message to process
   * @param topic The topic from which the message was received
   * @param key Optional message key
   * @param headers Optional message headers
   */
  private async processMessage(
    message: any,
    topic: string,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    // Extract correlation ID from headers or generate a new one
    const correlationId = headers?.['correlation-id'] || this.tracing.generateId();
    const span = this.tracing.startSpan('KafkaConsumer.processMessage', { correlationId });
    
    try {
      span.setAttributes({
        'messaging.system': 'kafka',
        'messaging.destination': topic,
        'messaging.destination_kind': 'topic',
        'messaging.operation': 'process',
        'messaging.message_id': key,
      });
      
      // Add correlation ID to the logger context
      const contextLogger = this.logger.withContext({ correlationId });
      
      contextLogger.log(
        `Processing message from topic: ${topic}`,
        'KafkaConsumer'
      );
      
      // Validate message structure
      if (!this.validateMessage(message, contextLogger)) {
        return;
      }
      
      // Add journey context to span attributes if available
      if (isJourneyNotificationEvent(message)) {
        span.setAttributes({
          'notification.journey': message.metadata.journey,
          'notification.type': message.type,
          'notification.userId': message.metadata.userId,
        });
      } else if (isNotificationEvent(message)) {
        span.setAttributes({
          'notification.type': message.type,
          'notification.userId': message.metadata?.userId,
        });
      }
      
      // Process the notification event
      await this.processNotificationEvent(message, correlationId, contextLogger);
      
      contextLogger.log(
        `Successfully processed message from topic: ${topic}`,
        'KafkaConsumer'
      );
    } catch (error) {
      this.handleProcessingError(error, message, topic, key, correlationId, span);
    } finally {
      span.end();
    }
  }
  
  /**
   * Validates that a message has the required structure for a notification event.
   * 
   * @param message The message to validate
   * @param logger Logger instance with correlation ID context
   * @returns Boolean indicating if the message is valid
   */
  private validateMessage(message: any, logger: LoggerService): boolean {
    // Check if message is an object
    if (!message || typeof message !== 'object') {
      logger.error(
        `Invalid message format: not an object`,
        'KafkaConsumer'
      );
      return false;
    }
    
    // Check if message is a notification event
    if (!isNotificationEvent(message)) {
      logger.error(
        `Invalid message format: not a notification event`,
        'KafkaConsumer'
      );
      return false;
    }
    
    // Check for required fields
    if (!message.type) {
      logger.error(
        `Invalid notification event: missing type`,
        'KafkaConsumer'
      );
      return false;
    }
    
    if (!message.payload) {
      logger.error(
        `Invalid notification event: missing payload`,
        'KafkaConsumer'
      );
      return false;
    }
    
    // Check for user ID in either payload or metadata
    const userId = message.payload.userId || message.metadata?.userId;
    if (!userId) {
      logger.error(
        `Invalid notification event: missing userId`,
        'KafkaConsumer'
      );
      return false;
    }
    
    // If it's a versioned event, check version compatibility
    if (isVersionedNotificationEvent(message)) {
      // In a real implementation, we would check version compatibility here
      // For now, we'll just log the version
      logger.debug(
        `Processing versioned notification event: v${message.version.major}.${message.version.minor}.${message.version.patch}`,
        'KafkaConsumer'
      );
      
      // Check if the event is deprecated
      if (message.deprecated) {
        logger.warn(
          `Processing deprecated notification event: ${message.type}`,
          'KafkaConsumer'
        );
      }
    }
    
    return true;
  }
  
  /**
   * Processes a validated notification event by forwarding it to the NotificationsService.
   * 
   * @param event The notification event to process
   * @param correlationId Correlation ID for tracing
   * @param logger Logger instance with correlation ID context
   */
  private async processNotificationEvent(
    event: INotificationEvent,
    correlationId: string,
    logger: LoggerService
  ): Promise<void> {
    const span = this.tracing.startSpan('KafkaConsumer.processNotificationEvent', { correlationId });
    
    try {
      span.setAttributes({
        'notification.type': event.type,
        'notification.priority': event.priority || 'normal',
      });
      
      // Extract user ID from either payload or metadata
      const userId = event.payload.userId || event.metadata?.userId;
      
      // Prepare notification DTO from the event
      const notificationDto = {
        userId,
        type: event.type,
        title: event.payload.title,
        body: event.payload.body,
        data: event.payload.data || {},
        channels: event.channels,
        templateId: event.payload.templateId,
        language: event.payload.language,
        priority: event.priority || 'normal',
        correlationId,
      };
      
      // Check if this is a scheduled notification
      if (event.scheduledFor) {
        const scheduledTime = new Date(event.scheduledFor);
        const now = new Date();
        
        // If scheduled for the future, handle scheduling
        if (scheduledTime > now) {
          logger.log(
            `Scheduling notification for future delivery at ${scheduledTime.toISOString()}`,
            'KafkaConsumer'
          );
          
          // In a real implementation, we would schedule the notification here
          // For now, we'll just process it immediately
          logger.warn(
            `Scheduled notifications not fully implemented, processing immediately`,
            'KafkaConsumer'
          );
        }
      }
      
      // Check if the notification has expired
      if (event.expiresAt) {
        const expiryTime = new Date(event.expiresAt);
        const now = new Date();
        
        if (expiryTime < now) {
          logger.warn(
            `Notification has expired and will not be delivered (expired at ${expiryTime.toISOString()})`,
            'KafkaConsumer'
          );
          return;
        }
      }
      
      // Send the notification
      logger.log(
        `Sending notification of type ${event.type} to user ${userId}`,
        'KafkaConsumer'
      );
      
      const results = await this.notificationsService.sendNotification(notificationDto);
      
      logger.log(
        `Notification sent with results: ${JSON.stringify(results)}`,
        'KafkaConsumer'
      );
    } catch (error) {
      logger.error(
        `Error processing notification event: ${error.message}`,
        error.stack,
        'KafkaConsumer'
      );
      throw error; // Re-throw to trigger retry logic
    } finally {
      span.end();
    }
  }
  
  /**
   * Handles errors that occur during message processing.
   * Implements retry logic and dead-letter queue forwarding for failed messages.
   * 
   * @param error The error that occurred
   * @param message The original message
   * @param topic The topic from which the message was received
   * @param key The message key
   * @param correlationId Correlation ID for tracing
   * @param span The current tracing span
   */
  private handleProcessingError(
    error: Error,
    message: any,
    topic: string,
    key: string,
    correlationId: string,
    span: any
  ): void {
    // Add error details to span
    span.setStatus({
      code: 'ERROR',
      message: error.message,
    });
    
    span.recordException({
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // Create logger with correlation ID context
    const contextLogger = this.logger.withContext({ correlationId });
    
    contextLogger.error(
      `Error processing message from topic ${topic}: ${error.message}`,
      error.stack,
      'KafkaConsumer'
    );
    
    // Get retry count from message headers or default to 0
    const retryCount = message.metadata?.retryCount || 0;
    
    // Check if we should retry
    if (retryCount < this.maxRetries) {
      contextLogger.log(
        `Scheduling retry ${retryCount + 1}/${this.maxRetries} for message from topic ${topic}`,
        'KafkaConsumer'
      );
      
      // Update retry count in metadata
      const updatedMessage = {
        ...message,
        metadata: {
          ...(message.metadata || {}),
          retryCount: retryCount + 1,
          lastError: error.message,
          correlationId,
        },
      };
      
      // Schedule retry using RetryService
      this.scheduleRetry(updatedMessage, topic, key, correlationId, contextLogger);
    } else {
      contextLogger.warn(
        `Maximum retry attempts (${this.maxRetries}) reached for message from topic ${topic}, sending to DLQ`,
        'KafkaConsumer'
      );
      
      // Send to dead-letter queue
      this.sendToDlq(message, topic, error, correlationId, contextLogger);
    }
  }
  
  /**
   * Schedules a retry for a failed message.
   * 
   * @param message The message to retry
   * @param topic The original topic
   * @param key The message key
   * @param correlationId Correlation ID for tracing
   * @param logger Logger instance with correlation ID context
   */
  private async scheduleRetry(
    message: any,
    topic: string,
    key: string,
    correlationId: string,
    logger: LoggerService
  ): Promise<void> {
    try {
      // In a real implementation, we would use the RetryService to schedule the retry
      // For now, we'll republish the message to the same topic with updated metadata
      
      // Add a delay based on retry count (exponential backoff)
      const retryCount = message.metadata.retryCount;
      const delayMs = Math.pow(2, retryCount) * 1000; // 2^retryCount seconds
      
      logger.log(
        `Scheduling retry in ${delayMs}ms for message from topic ${topic}`,
        'KafkaConsumer'
      );
      
      // Wait for the delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Republish the message
      await this.kafkaService.produce(
        topic,
        message,
        key,
        { 'correlation-id': correlationId }
      );
      
      logger.log(
        `Successfully scheduled retry for message from topic ${topic}`,
        'KafkaConsumer'
      );
    } catch (error) {
      logger.error(
        `Failed to schedule retry for message from topic ${topic}: ${error.message}`,
        error.stack,
        'KafkaConsumer'
      );
      
      // If retry scheduling fails, send to DLQ
      this.sendToDlq(message, topic, error, correlationId, logger);
    }
  }
  
  /**
   * Sends a failed message to the dead-letter queue.
   * 
   * @param message The failed message
   * @param topic The original topic
   * @param error The error that caused the failure
   * @param correlationId Correlation ID for tracing
   * @param logger Logger instance with correlation ID context
   */
  private async sendToDlq(
    message: any,
    topic: string,
    error: Error,
    correlationId: string,
    logger: LoggerService
  ): Promise<void> {
    try {
      // Extract user ID from message
      const userId = message.payload?.userId || message.metadata?.userId || 'unknown';
      
      // Create DLQ entry
      await this.dlqService.addEntry({
        notificationId: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        userId,
        channel: 'kafka',
        payload: message,
        errorDetails: {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: (error as any).code,
          attemptsMade: message.metadata?.retryCount || 0,
          providerDetails: {
            topic,
            correlationId,
          },
        },
        retryHistory: message.metadata?.retryHistory || [],
      });
      
      logger.log(
        `Successfully sent message from topic ${topic} to DLQ`,
        'KafkaConsumer'
      );
      
      // Also publish to a specific DLQ topic for monitoring
      const dlqTopic = `${topic}.dlq`;
      
      await this.kafkaService.produce(
        dlqTopic,
        {
          originalMessage: message,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
            code: (error as any).code,
          },
          metadata: {
            topic,
            correlationId,
            timestamp: new Date().toISOString(),
            retryCount: message.metadata?.retryCount || 0,
          },
        },
        `${userId}-${Date.now()}`,
        { 'correlation-id': correlationId }
      );
      
      logger.log(
        `Successfully published message to DLQ topic ${dlqTopic}`,
        'KafkaConsumer'
      );
    } catch (dlqError) {
      logger.error(
        `Failed to send message to DLQ: ${dlqError.message}`,
        dlqError.stack,
        'KafkaConsumer'
      );
      
      // At this point, we've done our best to handle the failure
      // The message will be lost if we can't send it to the DLQ
    }
  }
}