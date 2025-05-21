/**
 * @file base.consumer.ts
 * @description Abstract base class that implements common functionality for all reward event consumers
 * in the gamification engine. Provides dead letter queue handling, exponential backoff retry strategies,
 * structured error handling, and centralized event processing for rewards across all journeys.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Consumer, ConsumerSubscribeTopics, Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType } from '@austa/errors';
import { IVersionedEvent } from '@austa/interfaces';

import { DlqService } from '../../common/kafka/dlq.service';
import { RetryStrategy } from '../../common/kafka/retry.strategy';
import { RewardsService } from '../rewards.service';
import { EventProcessingError } from '../../common/exceptions/event-processing.error';

/**
 * Configuration options for the base reward consumer
 */
export interface RewardConsumerOptions {
  /**
   * Kafka consumer group ID
   */
  groupId: string;
  
  /**
   * Topics to subscribe to
   */
  topics: string[];
  
  /**
   * Maximum number of retry attempts before sending to DLQ
   * @default 5
   */
  maxRetries?: number;
  
  /**
   * Initial delay for retry in milliseconds
   * @default 1000
   */
  initialRetryDelay?: number;
  
  /**
   * Maximum delay for retry in milliseconds
   * @default 60000
   */
  maxRetryDelay?: number;
  
  /**
   * Jitter factor to add randomness to retry delays (0-1)
   * @default 0.1
   */
  jitterFactor?: number;
}

/**
 * Base abstract class for all reward event consumers
 * 
 * Provides common functionality for:
 * - Dead letter queue handling for failed events
 * - Exponential backoff retry strategy
 * - Structured error logging with correlation IDs
 * - Centralized event processing
 */
@Injectable()
export abstract class BaseConsumer implements OnModuleInit, OnModuleDestroy {
  protected consumer: Consumer;
  protected readonly retryStrategy: RetryStrategy;
  protected readonly logger: Logger;
  
  /**
   * Default consumer options
   */
  private readonly defaultOptions: Partial<RewardConsumerOptions> = {
    maxRetries: 5,
    initialRetryDelay: 1000, // 1 second
    maxRetryDelay: 60000,    // 1 minute
    jitterFactor: 0.1,       // 10% jitter
  };
  
  /**
   * Consumer options with defaults applied
   */
  protected readonly options: RewardConsumerOptions;

  /**
   * Creates a new BaseConsumer instance
   * 
   * @param kafkaClient - Kafka client instance
   * @param rewardsService - Service for processing rewards
   * @param dlqService - Dead letter queue service
   * @param loggerService - Logger service for structured logging
   * @param consumerOptions - Consumer configuration options
   */
  constructor(
    protected readonly kafkaClient: Kafka,
    protected readonly rewardsService: RewardsService,
    protected readonly dlqService: DlqService,
    protected readonly loggerService: LoggerService,
    protected readonly consumerOptions: RewardConsumerOptions,
  ) {
    this.options = {
      ...this.defaultOptions,
      ...consumerOptions,
    };
    
    this.consumer = this.kafkaClient.consumer({
      groupId: this.options.groupId,
      // Enable manual control of message commits for at-least-once delivery
      allowAutoTopicCreation: false,
    });
    
    this.retryStrategy = new RetryStrategy({
      maxRetries: this.options.maxRetries,
      initialDelay: this.options.initialRetryDelay,
      maxDelay: this.options.maxRetryDelay,
      jitterFactor: this.options.jitterFactor,
    });
    
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Lifecycle hook that runs when the module is initialized
   * Sets up the Kafka consumer and message handlers
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.consumer.connect();
      
      const topics: ConsumerSubscribeTopics = {
        topics: this.options.topics,
        fromBeginning: false,
      };
      
      await this.consumer.subscribe(topics);
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message, heartbeat }) => {
          const correlationId = message.headers?.correlationId?.toString() || uuidv4();
          const messageId = message.key?.toString() || uuidv4();
          
          const logContext = {
            correlationId,
            messageId,
            topic,
            partition,
          };
          
          try {
            this.loggerService.debug(
              `Processing reward event from ${topic}`,
              { ...logContext, headers: message.headers }
            );
            
            // Parse the message payload
            const payload = message.value ? JSON.parse(message.value.toString()) : null;
            
            if (!payload) {
              throw new EventProcessingError(
                'Empty event payload received',
                ErrorType.VALIDATION_ERROR,
                { topic, correlationId }
              );
            }
            
            // Process the event with the journey-specific implementation
            await this.processEvent(payload, correlationId);
            
            // Commit the message after successful processing
            await this.consumer.commitOffsets([{
              topic,
              partition,
              offset: (parseInt(message.offset, 10) + 1).toString(),
            }]);
            
            this.loggerService.debug(
              `Successfully processed reward event from ${topic}`,
              logContext
            );
          } catch (error) {
            await this.handleProcessingError(
              error,
              topic,
              partition,
              message,
              correlationId,
              messageId
            );
          }
        },
      });
      
      this.loggerService.log(
        `Reward consumer initialized and subscribed to topics: ${this.options.topics.join(', ')}`,
        { groupId: this.options.groupId }
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to initialize reward consumer: ${error.message}`,
        error.stack,
        { groupId: this.options.groupId, error }
      );
      throw error;
    }
  }

  /**
   * Handles processing errors with retry logic and dead letter queue
   * 
   * @param error - The error that occurred during processing
   * @param topic - Kafka topic
   * @param partition - Kafka partition
   * @param message - Original Kafka message
   * @param correlationId - Correlation ID for tracing
   * @param messageId - Unique message identifier
   */
  private async handleProcessingError(
    error: any,
    topic: string,
    partition: number,
    message: any,
    correlationId: string,
    messageId: string,
  ): Promise<void> {
    const baseError = error instanceof BaseError 
      ? error 
      : new EventProcessingError(
          error.message || 'Unknown error during event processing',
          ErrorType.SYSTEM_ERROR,
          { cause: error, correlationId }
        );
    
    const retryCount = parseInt(message.headers?.retryCount?.toString() || '0', 10);
    const logContext = {
      correlationId,
      messageId,
      topic,
      partition,
      retryCount,
      errorType: baseError.type,
      errorMessage: baseError.message,
    };
    
    // Check if we should retry based on error type and retry count
    const shouldRetry = this.retryStrategy.shouldRetry(baseError, retryCount);
    
    if (shouldRetry) {
      const nextRetryDelay = this.retryStrategy.calculateNextRetryDelay(retryCount);
      
      this.loggerService.warn(
        `Reward event processing failed, scheduling retry ${retryCount + 1}/${this.options.maxRetries} in ${nextRetryDelay}ms`,
        { ...logContext, nextRetryDelay }
      );
      
      // Update retry count in headers
      const headers = {
        ...message.headers,
        retryCount: Buffer.from((retryCount + 1).toString()),
        correlationId: Buffer.from(correlationId),
      };
      
      // Schedule retry after delay
      setTimeout(async () => {
        try {
          await this.kafkaClient.producer().send({
            topic,
            messages: [{
              key: message.key,
              value: message.value,
              headers,
            }],
          });
          
          this.loggerService.debug(
            `Retry ${retryCount + 1} scheduled for reward event`,
            logContext
          );
        } catch (retryError) {
          this.loggerService.error(
            `Failed to schedule retry for reward event: ${retryError.message}`,
            retryError.stack,
            { ...logContext, retryError }
          );
          
          // If retry scheduling fails, send to DLQ
          await this.sendToDlq(message, baseError, correlationId, topic, retryCount);
        }
      }, nextRetryDelay);
    } else {
      // Max retries exceeded or non-retriable error, send to DLQ
      this.loggerService.error(
        `Reward event processing failed after ${retryCount} retries or non-retriable error`,
        baseError.stack,
        logContext
      );
      
      await this.sendToDlq(message, baseError, correlationId, topic, retryCount);
    }
    
    // Commit the message to avoid reprocessing the same failed message
    await this.consumer.commitOffsets([{
      topic,
      partition,
      offset: (parseInt(message.offset, 10) + 1).toString(),
    }]);
  }

  /**
   * Sends a failed message to the Dead Letter Queue
   * 
   * @param message - The original Kafka message
   * @param error - The error that caused the failure
   * @param correlationId - Correlation ID for tracing
   * @param sourceTopic - Original topic the message was from
   * @param retryCount - Number of retry attempts made
   */
  private async sendToDlq(
    message: any,
    error: BaseError,
    correlationId: string,
    sourceTopic: string,
    retryCount: number,
  ): Promise<void> {
    try {
      const payload = message.value ? JSON.parse(message.value.toString()) : null;
      
      await this.dlqService.sendToDlq({
        payload,
        error: {
          message: error.message,
          type: error.type,
          stack: error.stack,
          context: error.context,
        },
        metadata: {
          correlationId,
          sourceTopic,
          retryCount,
          timestamp: new Date().toISOString(),
          headers: message.headers,
        },
      });
      
      this.loggerService.debug(
        `Reward event sent to DLQ after ${retryCount} failed attempts`,
        { correlationId, sourceTopic, errorType: error.type }
      );
    } catch (dlqError) {
      this.loggerService.error(
        `Failed to send reward event to DLQ: ${dlqError.message}`,
        dlqError.stack,
        { correlationId, sourceTopic, originalError: error, dlqError }
      );
    }
  }

  /**
   * Abstract method that must be implemented by journey-specific consumers
   * to process events according to their specific requirements
   * 
   * @param payload - The event payload to process
   * @param correlationId - Correlation ID for tracing
   */
  protected abstract processEvent(payload: any, correlationId: string): Promise<void>;
  
  /**
   * Validates that an event has the required properties
   * 
   * @param event - The event to validate
   * @param correlationId - Correlation ID for tracing
   */
  protected validateEvent(event: any, correlationId: string): void {
    if (!event) {
      throw new EventProcessingError(
        'Event is null or undefined',
        ErrorType.VALIDATION_ERROR,
        { correlationId }
      );
    }
    
    if (!event.type) {
      throw new EventProcessingError(
        'Event is missing required "type" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, event }
      );
    }
    
    if (!event.payload) {
      throw new EventProcessingError(
        'Event is missing required "payload" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, eventType: event.type }
      );
    }
    
    if (!event.payload.userId) {
      throw new EventProcessingError(
        'Event payload is missing required "userId" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, eventType: event.type }
      );
    }
    
    if (!event.payload.timestamp) {
      throw new EventProcessingError(
        'Event payload is missing required "timestamp" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, eventType: event.type }
      );
    }
  }
  
  /**
   * Validates that an event has proper versioning information
   * 
   * @param event - The event to validate
   * @param correlationId - Correlation ID for tracing
   */
  protected validateVersionedEvent(event: any, correlationId: string): void {
    this.validateEvent(event, correlationId);
    
    if (!event.version) {
      throw new EventProcessingError(
        'Versioned event is missing required "version" property',
        ErrorType.VALIDATION_ERROR,
        { correlationId, eventType: event.type }
      );
    }
  }
  
  /**
   * Gracefully shuts down the consumer
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumer.disconnect();
      this.loggerService.log(
        'Reward consumer disconnected gracefully',
        { groupId: this.options.groupId }
      );
    } catch (error) {
      this.loggerService.error(
        `Error during reward consumer shutdown: ${error.message}`,
        error.stack,
        { groupId: this.options.groupId, error }
      );
    }
  }
}