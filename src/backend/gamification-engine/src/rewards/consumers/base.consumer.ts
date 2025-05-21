import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { RewardsService } from '../rewards.service';
import { DLQService } from '../../common/kafka/dlq.service';
import { RetryStrategy } from '../../common/kafka/retry.strategy';
import { GamificationEvent } from '@austa/interfaces/gamification';

/**
 * Configuration options for the base consumer
 */
export interface BaseConsumerOptions {
  /**
   * Kafka client instance
   */
  kafka: Kafka;
  
  /**
   * Consumer group ID
   */
  groupId: string;
  
  /**
   * Topics to subscribe to
   */
  topics: string[];
  
  /**
   * Maximum number of retry attempts before sending to DLQ
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Initial retry delay in milliseconds
   * @default 1000
   */
  initialRetryDelay?: number;
  
  /**
   * Maximum retry delay in milliseconds
   * @default 30000
   */
  maxRetryDelay?: number;
}

/**
 * Abstract base class for all reward event consumers in the gamification engine.
 * Provides common functionality for event processing, error handling, and retry logic.
 */
@Injectable()
export abstract class BaseConsumer implements OnModuleInit {
  protected consumer: Consumer;
  protected logger: Logger;
  protected retryStrategy: RetryStrategy;
  protected options: BaseConsumerOptions;
  
  /**
   * Creates a new instance of the BaseConsumer
   * 
   * @param rewardsService - Service for processing rewards
   * @param dlqService - Service for handling dead letter queue messages
   * @param options - Consumer configuration options
   */
  constructor(
    protected readonly rewardsService: RewardsService,
    protected readonly dlqService: DLQService,
    options: BaseConsumerOptions,
  ) {
    this.options = {
      maxRetries: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      ...options,
    };
    
    this.consumer = this.options.kafka.consumer({ groupId: this.options.groupId });
    this.logger = new Logger(this.constructor.name);
    this.retryStrategy = new RetryStrategy({
      maxRetries: this.options.maxRetries,
      initialDelayMs: this.options.initialRetryDelay,
      maxDelayMs: this.options.maxRetryDelay,
    });
  }
  
  /**
   * Lifecycle hook that runs when the module is initialized.
   * Connects to Kafka and subscribes to the configured topics.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topics: this.options.topics, fromBeginning: false });
      
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const correlationId = message.headers?.correlationId?.toString() || uuidv4();
          const messageId = message.headers?.messageId?.toString() || uuidv4();
          
          this.logger.log({
            message: `Processing reward event from topic ${topic}`,
            correlationId,
            messageId,
            partition,
            offset: message.offset,
          });
          
          try {
            await this.processMessage(message, correlationId);
          } catch (error) {
            await this.handleError(error, message, topic, partition, correlationId);
          }
        },
      });
      
      this.logger.log(`Consumer subscribed to topics: ${this.options.topics.join(', ')}`);
    } catch (error) {
      this.logger.error({
        message: 'Failed to initialize consumer',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  
  /**
   * Processes a Kafka message containing a reward event
   * 
   * @param message - The Kafka message to process
   * @param correlationId - Correlation ID for distributed tracing
   */
  private async processMessage(message: KafkaMessage, correlationId: string): Promise<void> {
    if (!message.value) {
      this.logger.warn({
        message: 'Received empty message',
        correlationId,
      });
      return;
    }
    
    try {
      const event = this.parseEvent(message);
      
      // Validate the event before processing
      if (!this.validateEvent(event)) {
        this.logger.warn({
          message: 'Invalid event format',
          correlationId,
          event,
        });
        return;
      }
      
      // Process the event based on its type
      await this.processRewardEvent(event, correlationId);
      
      this.logger.log({
        message: 'Successfully processed reward event',
        correlationId,
        eventType: event.type,
        userId: event.userId,
      });
    } catch (error) {
      // Let the outer error handler deal with retries
      throw error;
    }
  }
  
  /**
   * Handles errors that occur during message processing
   * Implements exponential backoff retry strategy and dead letter queue
   * 
   * @param error - The error that occurred
   * @param message - The Kafka message that caused the error
   * @param topic - The topic the message was consumed from
   * @param partition - The partition the message was consumed from
   * @param correlationId - Correlation ID for distributed tracing
   */
  private async handleError(
    error: Error,
    message: KafkaMessage,
    topic: string,
    partition: number,
    correlationId: string,
  ): Promise<void> {
    const retryCount = this.getRetryCount(message);
    const shouldRetry = this.retryStrategy.shouldRetry(retryCount, error);
    
    this.logger.error({
      message: `Error processing reward event: ${error.message}`,
      correlationId,
      error: error.message,
      stack: error.stack,
      topic,
      partition,
      offset: message.offset,
      retryCount,
      willRetry: shouldRetry,
    });
    
    if (shouldRetry) {
      const delayMs = this.retryStrategy.getDelayMs(retryCount);
      
      this.logger.log({
        message: `Retrying message after ${delayMs}ms (attempt ${retryCount + 1} of ${this.options.maxRetries})`,
        correlationId,
        retryCount: retryCount + 1,
        delayMs,
      });
      
      // Increment retry count in headers
      const updatedMessage = this.incrementRetryCount(message, retryCount);
      
      // Wait for the calculated delay before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Retry processing the message
      try {
        await this.processMessage(updatedMessage, correlationId);
      } catch (retryError) {
        // If we still have retries left, the next iteration will handle it
        // Otherwise, it will go to the DLQ in the next block
        if (retryCount + 1 >= this.options.maxRetries) {
          await this.sendToDLQ(retryError, updatedMessage, topic, correlationId);
        }
      }
    } else {
      // Send to dead letter queue if we've exhausted retries or the error is non-retriable
      await this.sendToDLQ(error, message, topic, correlationId);
    }
  }
  
  /**
   * Sends a failed message to the dead letter queue
   * 
   * @param error - The error that caused the message to be sent to the DLQ
   * @param message - The Kafka message to send to the DLQ
   * @param sourceTopic - The original topic the message was consumed from
   * @param correlationId - Correlation ID for distributed tracing
   */
  private async sendToDLQ(
    error: Error,
    message: KafkaMessage,
    sourceTopic: string,
    correlationId: string,
  ): Promise<void> {
    try {
      await this.dlqService.sendToDLQ({
        message,
        sourceTopic,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        metadata: {
          correlationId,
          timestamp: new Date().toISOString(),
          consumer: this.constructor.name,
        },
      });
      
      this.logger.log({
        message: 'Message sent to dead letter queue',
        correlationId,
        sourceTopic,
      });
    } catch (dlqError) {
      this.logger.error({
        message: 'Failed to send message to dead letter queue',
        correlationId,
        error: dlqError.message,
        originalError: error.message,
      });
    }
  }
  
  /**
   * Gets the current retry count from the message headers
   * 
   * @param message - The Kafka message
   * @returns The current retry count, or 0 if not present
   */
  private getRetryCount(message: KafkaMessage): number {
    const retryHeader = message.headers?.retryCount;
    if (retryHeader) {
      return parseInt(retryHeader.toString(), 10);
    }
    return 0;
  }
  
  /**
   * Increments the retry count in the message headers
   * 
   * @param message - The Kafka message
   * @param currentRetryCount - The current retry count
   * @returns A new message with updated headers
   */
  private incrementRetryCount(message: KafkaMessage, currentRetryCount: number): KafkaMessage {
    const newHeaders = {
      ...message.headers,
      retryCount: Buffer.from((currentRetryCount + 1).toString()),
    };
    
    return {
      ...message,
      headers: newHeaders,
    };
  }
  
  /**
   * Parses the event from the Kafka message
   * 
   * @param message - The Kafka message to parse
   * @returns The parsed gamification event
   */
  protected parseEvent(message: KafkaMessage): GamificationEvent {
    try {
      return JSON.parse(message.value.toString()) as GamificationEvent;
    } catch (error) {
      this.logger.error({
        message: 'Failed to parse event',
        error: error.message,
        rawMessage: message.value.toString(),
      });
      throw new Error(`Failed to parse event: ${error.message}`);
    }
  }
  
  /**
   * Validates that the event has the required properties
   * 
   * @param event - The event to validate
   * @returns True if the event is valid, false otherwise
   */
  protected validateEvent(event: GamificationEvent): boolean {
    return !!event && 
           !!event.type && 
           !!event.userId && 
           !!event.timestamp && 
           !!event.payload;
  }
  
  /**
   * Abstract method that must be implemented by subclasses to process specific reward events
   * 
   * @param event - The gamification event to process
   * @param correlationId - Correlation ID for distributed tracing
   */
  protected abstract processRewardEvent(event: GamificationEvent, correlationId: string): Promise<void>;
  
  /**
   * Gracefully disconnects the consumer when the application is shutting down
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Disconnecting consumer');
      await this.consumer.disconnect();
    } catch (error) {
      this.logger.error({
        message: 'Error disconnecting consumer',
        error: error.message,
      });
    }
  }
}