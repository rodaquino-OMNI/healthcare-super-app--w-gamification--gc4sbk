import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';

import { NotificationsService } from '../../notifications/notifications.service';
import { RetryService } from '../../retry/retry.service';
import { DlqService } from '../../retry/dlq/dlq.service';

import { ProcessNotificationEventDto } from '../dto/process-notification-event.dto';
import { NotificationEventType } from '../dto/notification-event-type.enum';
import { INotificationEvent } from '../interfaces/notification-event.interface';
import { INotificationEventResponse } from '../interfaces/notification-event-response.interface';
import { RetryStatus } from '../../retry/interfaces/retry-status.enum';

/**
 * Consumes notification events from Kafka topics and processes them.
 * This consumer is responsible for handling events from all journeys (Health, Care, Plan)
 * and the gamification engine, forwarding them to the NotificationsService for delivery.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly journeyTopics: string[];
  private readonly groupId: string;
  private readonly maxRetryAttempts: number;
  
  /**
   * Injects the necessary services.
   * 
   * @param notificationsService Service for sending notifications
   * @param kafkaService Service for Kafka interaction
   * @param configService Service for accessing configuration
   * @param logger Service for structured logging
   * @param tracingService Service for distributed tracing
   * @param retryService Service for handling retry operations
   * @param dlqService Service for managing dead-letter queue entries
   */
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
  ) {
    // Load configuration for Kafka topics and consumer group
    const kafkaConfig = this.configService.get('kafka');
    this.journeyTopics = kafkaConfig.topics;
    this.groupId = kafkaConfig.groupId;
    this.maxRetryAttempts = this.configService.get('retry.maxAttempts', 3);
    
    this.logger.log('KafkaConsumer initialized', 'KafkaConsumerService');
  }

  /**
   * Subscribes to Kafka topics on module initialization.
   * This sets up consumers for all journey event topics and the gamification events topic.
   */
  async onModuleInit(): Promise<void> {
    const span = this.tracingService.startSpan('KafkaConsumerService.onModuleInit');
    
    try {
      // Subscribe to each journey topic
      for (const topic of this.journeyTopics) {
        await this.kafkaService.consume(
          topic,
          this.groupId,
          async (message: any, key?: string, headers?: Record<string, string>) => {
            // Extract tracing context from headers if available
            const parentContext = headers?.['trace-context'] 
              ? JSON.parse(headers['trace-context']) 
              : undefined;
            
            const messageSpan = this.tracingService.startSpan(
              `KafkaConsumerService.processMessage.${topic}`,
              { parentContext }
            );
            
            try {
              // Add correlation ID to the trace context
              const correlationId = headers?.['correlation-id'] || `notification-${Date.now()}`;
              messageSpan.setAttributes({ 'correlation.id': correlationId });
              
              // Process the message with tracing context
              await this.processMessage(message, topic, correlationId, messageSpan.context());
            } finally {
              messageSpan.end();
            }
          }
        );
        
        this.logger.log(`Subscribed to Kafka topic: ${topic}`, 'KafkaConsumerService');
      }
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to Kafka topics: ${error.message}`,
        error.stack,
        'KafkaConsumerService'
      );
    } finally {
      span.end();
    }
  }

  /**
   * Processes a message from a Kafka topic.
   * Validates the message format and forwards it to the NotificationsService for processing.
   * Implements error handling with retry mechanisms and dead-letter queue integration.
   * 
   * @param message The message to process
   * @param topic The Kafka topic the message was received from
   * @param correlationId Unique identifier for tracking the message across services
   * @param traceContext Distributed tracing context for observability
   */
  private async processMessage(
    message: any, 
    topic: string, 
    correlationId: string,
    traceContext?: any
  ): Promise<void> {
    const span = this.tracingService.startSpan(
      'KafkaConsumerService.processMessage',
      { parentContext: traceContext }
    );
    
    try {
      // Add metadata to the span for better observability
      span.setAttributes({
        'kafka.topic': topic,
        'correlation.id': correlationId,
        'message.type': message?.type || 'unknown'
      });
      
      this.logger.log(
        `Processing message from topic ${topic} with correlation ID ${correlationId}`,
        'KafkaConsumerService',
        { correlationId, topic, messageType: message?.type }
      );
      
      // Validate message structure
      if (!this.isValidMessage(message)) {
        this.logger.error(
          `Invalid message format: ${JSON.stringify(message)}`,
          '',
          'KafkaConsumerService',
          { correlationId, topic }
        );
        
        // Add to DLQ for invalid message format
        await this.dlqService.addEntry({
          payload: message,
          topic,
          errorDetails: {
            message: 'Invalid message format',
            type: ErrorType.VALIDATION,
            code: 'NOTIFICATION_EVENT_001'
          },
          correlationId,
          retryHistory: []
        });
        
        return;
      }
      
      // Convert plain object to DTO instance for validation
      const eventDto = plainToInstance(ProcessNotificationEventDto, message);
      
      // Validate against DTO schema
      const errors = validateSync(eventDto, { whitelist: true, forbidNonWhitelisted: true });
      
      if (errors.length > 0) {
        const errorMessages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        ).join('; ');
        
        this.logger.error(
          `Validation failed for message: ${errorMessages}`,
          '',
          'KafkaConsumerService',
          { correlationId, topic, errors: errorMessages }
        );
        
        // Add to DLQ for validation errors
        await this.dlqService.addEntry({
          payload: message,
          topic,
          errorDetails: {
            message: `Validation failed: ${errorMessages}`,
            type: ErrorType.VALIDATION,
            code: 'NOTIFICATION_EVENT_002'
          },
          correlationId,
          retryHistory: []
        });
        
        return;
      }
      
      // Process the validated event
      await this.processValidatedEvent(eventDto, topic, correlationId, span.context());
      
    } catch (error) {
      this.logger.error(
        `Error processing Kafka message: ${error.message}`,
        error.stack,
        'KafkaConsumerService',
        { correlationId, topic }
      );
      
      // Determine if the error is retryable
      const isRetryable = this.isRetryableError(error);
      
      if (isRetryable) {
        // Queue for retry with the original message
        await this.retryService.scheduleRetry({
          operation: 'processMessage',
          payload: message,
          metadata: {
            topic,
            correlationId,
            traceContext: span.context()
          },
          attempt: 1,
          maxAttempts: this.maxRetryAttempts,
          errorDetails: {
            message: error.message,
            type: this.getErrorType(error),
            stack: error.stack
          }
        });
      } else {
        // Add to DLQ for non-retryable errors
        await this.dlqService.addEntry({
          payload: message,
          topic,
          errorDetails: {
            message: error.message,
            type: this.getErrorType(error),
            code: error.code || 'NOTIFICATION_EVENT_003',
            stack: error.stack
          },
          correlationId,
          retryHistory: []
        });
      }
    } finally {
      span.end();
    }
  }

  /**
   * Processes a validated notification event by forwarding it to the appropriate handler.
   * 
   * @param eventDto The validated event DTO
   * @param topic The Kafka topic the event was received from
   * @param correlationId Unique identifier for tracking the event across services
   * @param traceContext Distributed tracing context for observability
   */
  private async processValidatedEvent(
    eventDto: ProcessNotificationEventDto,
    topic: string,
    correlationId: string,
    traceContext?: any
  ): Promise<void> {
    const span = this.tracingService.startSpan(
      'KafkaConsumerService.processValidatedEvent',
      { parentContext: traceContext }
    );
    
    try {
      // Add event metadata to the span
      span.setAttributes({
        'event.type': eventDto.type,
        'event.journey': eventDto.journey || 'unknown',
        'event.user_id': eventDto.userId,
        'correlation.id': correlationId
      });
      
      this.logger.log(
        `Processing validated event: ${eventDto.type} for user: ${eventDto.userId} from journey: ${eventDto.journey || 'unknown'}`,
        'KafkaConsumerService',
        { correlationId, eventType: eventDto.type, userId: eventDto.userId, journey: eventDto.journey }
      );
      
      // Handle different event types
      switch (eventDto.type) {
        case NotificationEventType.SEND_NOTIFICATION:
          await this.handleSendNotificationEvent(eventDto, correlationId, span.context());
          break;
          
        case NotificationEventType.GAMIFICATION_ACHIEVEMENT:
          await this.handleGamificationAchievementEvent(eventDto, correlationId, span.context());
          break;
          
        // Add cases for other event types as needed
        
        default:
          this.logger.warn(
            `Unhandled event type: ${eventDto.type}`,
            'KafkaConsumerService',
            { correlationId, eventType: eventDto.type }
          );
          break;
      }
      
    } catch (error) {
      // Re-throw the error to be handled by the parent processMessage method
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Handles a send notification event by forwarding it to the NotificationsService.
   * 
   * @param eventDto The event DTO containing notification details
   * @param correlationId Unique identifier for tracking the event across services
   * @param traceContext Distributed tracing context for observability
   */
  private async handleSendNotificationEvent(
    eventDto: ProcessNotificationEventDto,
    correlationId: string,
    traceContext?: any
  ): Promise<void> {
    const span = this.tracingService.startSpan(
      'KafkaConsumerService.handleSendNotificationEvent',
      { parentContext: traceContext }
    );
    
    try {
      // Map the event DTO to the format expected by NotificationsService
      const notificationDto = {
        userId: eventDto.userId,
        type: eventDto.data.notificationType || eventDto.type,
        title: eventDto.data.title,
        body: eventDto.data.body,
        data: eventDto.data.metadata || {},
        templateId: eventDto.data.templateId,
        language: eventDto.data.language || 'pt-BR',
      };
      
      // Send the notification
      const result = await this.notificationsService.sendNotification(notificationDto);
      
      this.logger.log(
        `Notification sent successfully: ${result.id}`,
        'KafkaConsumerService',
        { correlationId, notificationId: result.id, userId: eventDto.userId }
      );
      
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${error.message}`,
        error.stack,
        'KafkaConsumerService',
        { correlationId, userId: eventDto.userId }
      );
      
      // Re-throw the error to be handled by the parent method
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Handles a gamification achievement event by creating an achievement notification.
   * 
   * @param eventDto The event DTO containing achievement details
   * @param correlationId Unique identifier for tracking the event across services
   * @param traceContext Distributed tracing context for observability
   */
  private async handleGamificationAchievementEvent(
    eventDto: ProcessNotificationEventDto,
    correlationId: string,
    traceContext?: any
  ): Promise<void> {
    const span = this.tracingService.startSpan(
      'KafkaConsumerService.handleGamificationAchievementEvent',
      { parentContext: traceContext }
    );
    
    try {
      const achievement = eventDto.data.achievement;
      
      if (!achievement || !achievement.name) {
        throw new AppException(
          'Invalid achievement data',
          ErrorType.VALIDATION,
          'NOTIFICATION_EVENT_004',
          { correlationId, userId: eventDto.userId }
        );
      }
      
      // Create a notification for the achievement
      const notificationDto = {
        userId: eventDto.userId,
        type: 'achievement_unlocked',
        title: `Parabéns! Você desbloqueou ${achievement.name}`,
        body: achievement.description || 'Continue explorando para desbloquear mais conquistas!',
        data: {
          achievementId: achievement.id,
          achievementName: achievement.name,
          achievementDescription: achievement.description,
          achievementImage: achievement.image,
          points: achievement.points,
          journey: eventDto.journey
        }
      };
      
      // Send the notification
      const result = await this.notificationsService.sendNotification(notificationDto);
      
      this.logger.log(
        `Achievement notification sent successfully: ${result.id}`,
        'KafkaConsumerService',
        { correlationId, notificationId: result.id, userId: eventDto.userId, achievementId: achievement.id }
      );
      
    } catch (error) {
      this.logger.error(
        `Failed to send achievement notification: ${error.message}`,
        error.stack,
        'KafkaConsumerService',
        { correlationId, userId: eventDto.userId }
      );
      
      // Re-throw the error to be handled by the parent method
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Checks if a message has the required structure for processing.
   * 
   * @param message The message to validate
   * @returns True if the message has a valid structure, false otherwise
   */
  private isValidMessage(message: any): boolean {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      typeof message.userId === 'string' &&
      message.data !== undefined
    );
  }

  /**
   * Determines if an error is retryable based on its type and characteristics.
   * 
   * @param error The error to check
   * @returns True if the error is retryable, false otherwise
   */
  private isRetryableError(error: any): boolean {
    // Client errors (validation, bad request) are not retryable
    if (error instanceof AppException && error.type === ErrorType.VALIDATION) {
      return false;
    }
    
    // Client errors (not found, unauthorized) are not retryable
    if (error instanceof AppException && error.type === ErrorType.NOT_FOUND) {
      return false;
    }
    
    // Specific error codes that should not be retried
    const nonRetryableCodes = [
      'NOTIFICATION_EVENT_001', // Invalid message format
      'NOTIFICATION_EVENT_002', // Validation failed
      'NOTIFICATION_EVENT_004', // Invalid achievement data
    ];
    
    if (error.code && nonRetryableCodes.includes(error.code)) {
      return false;
    }
    
    // By default, consider other errors as retryable
    return true;
  }

  /**
   * Gets the error type from an error object.
   * 
   * @param error The error to get the type from
   * @returns The error type
   */
  private getErrorType(error: any): ErrorType {
    if (error instanceof AppException) {
      return error.type;
    }
    
    // Default to internal server error for unknown error types
    return ErrorType.INTERNAL;
  }
}