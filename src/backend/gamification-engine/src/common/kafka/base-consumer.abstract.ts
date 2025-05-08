import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

// Import error types from @austa/errors package
import {
  ExternalDependencyUnavailableError,
  ValidationError,
  DataProcessingError,
  RetryWithBackoff,
  WithErrorContext
} from '@austa/errors';

// Import interfaces from @austa/interfaces package
import {
  GamificationEvent,
  EventType,
  JourneyType,
  EventVersion
} from '@austa/interfaces/gamification';

// Import local types and services
import { DlqService } from './dlq.service';
import { RetryStrategy } from './retry.strategy';
import { KafkaMessage, KafkaHeaders, ConsumerConfig, MessageHandler } from './kafka.types';

/**
 * Configuration options for the BaseKafkaConsumer
 */
export interface KafkaConsumerOptions {
  /**
   * The Kafka topic to subscribe to
   */
  topic: string;
  
  /**
   * The consumer group ID
   */
  groupId: string;
  
  /**
   * Maximum number of retry attempts before sending to DLQ
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Base delay in milliseconds for exponential backoff
   * @default 1000 (1 second)
   */
  retryBaseDelay?: number;
  
  /**
   * Maximum delay in milliseconds for exponential backoff
   * @default 30000 (30 seconds)
   */
  retryMaxDelay?: number;
  
  /**
   * Whether to enable jitter in retry delays to prevent thundering herd
   * @default true
   */
  retryJitter?: boolean;
  
  /**
   * Whether to enable dead letter queue for failed messages
   * @default true
   */
  enableDlq?: boolean;
  
  /**
   * Additional consumer configuration options
   */
  consumerConfig?: ConsumerConfig;
}

/**
 * Context object passed to message handlers
 */
export interface MessageContext {
  /**
   * Correlation ID for distributed tracing
   */
  correlationId: string;
  
  /**
   * Current retry attempt (0 for first attempt)
   */
  retryAttempt: number;
  
  /**
   * Original Kafka message headers
   */
  headers: KafkaHeaders;
  
  /**
   * Timestamp when the message was received
   */
  receivedAt: Date;
}

/**
 * Abstract base class for Kafka consumers in the gamification engine.
 * Provides common functionality for message consumption, validation, error handling,
 * retry with exponential backoff, and dead letter queue integration.
 * 
 * @template T - The type of message payload expected by this consumer
 * @template R - The type of result returned by message processing
 */
@Injectable()
export abstract class BaseKafkaConsumer<T extends GamificationEvent, R = any> implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly options: Required<KafkaConsumerOptions>;
  private readonly retryStrategy: RetryStrategy;
  
  /**
   * Creates a new instance of BaseKafkaConsumer
   * 
   * @param configService - NestJS ConfigService for accessing configuration
   * @param dlqService - Service for handling dead letter queue operations
   * @param options - Consumer configuration options
   */
  constructor(
    protected readonly configService: ConfigService,
    protected readonly dlqService: DlqService,
    options: KafkaConsumerOptions
  ) {
    // Set default options
    this.options = {
      maxRetries: 3,
      retryBaseDelay: 1000,
      retryMaxDelay: 30000,
      retryJitter: true,
      enableDlq: true,
      consumerConfig: {},
      ...options
    };
    
    // Initialize retry strategy
    this.retryStrategy = new RetryStrategy({
      baseDelay: this.options.retryBaseDelay,
      maxDelay: this.options.retryMaxDelay,
      maxRetries: this.options.maxRetries,
      useJitter: this.options.retryJitter
    });
    
    this.logger.log(`Initialized Kafka consumer for topic: ${this.options.topic}`);
  }
  
  /**
   * Lifecycle hook that is called once the module has been initialized.
   * Subscribes to the configured Kafka topic and starts consuming messages.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.subscribeToTopic();
      this.logger.log(`Successfully subscribed to topic: ${this.options.topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to topic: ${this.options.topic}`,
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }
  
  /**
   * Subscribes to the configured Kafka topic.
   * This method should be implemented by concrete classes to handle the actual
   * subscription using the appropriate Kafka client library.
   */
  protected abstract subscribeToTopic(): Promise<void>;
  
  /**
   * Validates the message payload against the expected schema.
   * Uses class-validator and class-transformer to validate the message.
   * 
   * @param message - The message to validate
   * @param messageClass - The class to validate against
   * @returns The validated message instance
   * @throws ValidationError if the message fails validation
   */
  @WithErrorContext()
  protected async validateMessage<V>(message: any, messageClass: new () => V): Promise<V> {
    try {
      // Transform plain object to class instance
      const instance = plainToInstance(messageClass, message);
      
      // Validate the instance
      const errors = await validate(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true
      });
      
      if (errors.length > 0) {
        const formattedErrors = errors.map(error => ({
          property: error.property,
          constraints: error.constraints,
          value: error.value
        }));
        
        throw new ValidationError(
          'Message validation failed',
          {
            errors: formattedErrors,
            messageType: messageClass.name
          }
        );
      }
      
      return instance;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new ValidationError(
        'Failed to validate message',
        {
          originalError: error instanceof Error ? error.message : String(error),
          messageType: messageClass.name
        }
      );
    }
  }
  
  /**
   * Processes a Kafka message with retry capability and error handling.
   * This is the main entry point for message processing that should be called
   * by concrete implementations when a message is received.
   * 
   * @param kafkaMessage - The raw Kafka message
   * @param messageHandler - The handler function to process the message
   * @returns The result of message processing
   */
  @RetryWithBackoff({
    maxRetries: 'options.maxRetries',
    baseDelay: 'options.retryBaseDelay',
    maxDelay: 'options.retryMaxDelay',
    useJitter: 'options.retryJitter',
    retryableErrors: [
      ExternalDependencyUnavailableError,
      // Add other retryable error types here
    ]
  })
  @WithErrorContext()
  protected async processMessage(
    kafkaMessage: KafkaMessage,
    messageHandler: MessageHandler<T, R>
  ): Promise<R> {
    // Extract or generate correlation ID
    const correlationId = this.extractCorrelationId(kafkaMessage.headers) || uuidv4();
    
    // Create message context
    const context: MessageContext = {
      correlationId,
      retryAttempt: this.getRetryAttempt(kafkaMessage.headers),
      headers: kafkaMessage.headers,
      receivedAt: new Date()
    };
    
    try {
      // Parse and validate the message
      const parsedMessage = this.parseMessage(kafkaMessage);
      
      // Log message receipt
      this.logger.debug(
        `Processing message: ${JSON.stringify(parsedMessage)} (correlationId: ${correlationId})`,
        { correlationId, topic: this.options.topic, messageType: parsedMessage.type }
      );
      
      // Process the message using the provided handler
      const result = await messageHandler(parsedMessage, context);
      
      // Log successful processing
      this.logger.debug(
        `Successfully processed message (correlationId: ${correlationId})`,
        { correlationId, topic: this.options.topic, messageType: parsedMessage.type }
      );
      
      return result;
    } catch (error) {
      // Handle processing error
      await this.handleProcessingError(error, kafkaMessage, context);
      
      // Rethrow the error to trigger retry or propagate to caller
      throw error;
    }
  }
  
  /**
   * Parses a Kafka message into the expected type.
   * This method should be implemented by concrete classes to handle
   * message deserialization and type conversion.
   * 
   * @param kafkaMessage - The raw Kafka message
   * @returns The parsed message
   */
  protected abstract parseMessage(kafkaMessage: KafkaMessage): T;
  
  /**
   * Handles errors that occur during message processing.
   * Implements retry logic and dead letter queue routing for failed messages.
   * 
   * @param error - The error that occurred
   * @param kafkaMessage - The original Kafka message
   * @param context - The message processing context
   */
  protected async handleProcessingError(
    error: any,
    kafkaMessage: KafkaMessage,
    context: MessageContext
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log the error with context
    this.logger.error(
      `Error processing message (correlationId: ${context.correlationId}): ${errorMessage}`,
      errorStack,
      { correlationId: context.correlationId, topic: this.options.topic, retryAttempt: context.retryAttempt }
    );
    
    // Check if we've exceeded max retries
    if (context.retryAttempt >= this.options.maxRetries) {
      this.logger.warn(
        `Max retry attempts (${this.options.maxRetries}) exceeded for message (correlationId: ${context.correlationId})`,
        { correlationId: context.correlationId, topic: this.options.topic }
      );
      
      // Send to dead letter queue if enabled
      if (this.options.enableDlq) {
        await this.sendToDlq(kafkaMessage, error, context);
      }
      
      // Wrap in DataProcessingError to provide more context
      throw new DataProcessingError(
        `Failed to process message after ${context.retryAttempt + 1} attempts: ${errorMessage}`,
        {
          correlationId: context.correlationId,
          topic: this.options.topic,
          retryAttempt: context.retryAttempt,
          originalError: error
        }
      );
    }
    
    // Calculate next retry delay
    const nextRetryDelay = this.retryStrategy.getDelayForAttempt(context.retryAttempt);
    
    this.logger.log(
      `Scheduling retry ${context.retryAttempt + 1}/${this.options.maxRetries} in ${nextRetryDelay}ms (correlationId: ${context.correlationId})`,
      { correlationId: context.correlationId, topic: this.options.topic, retryAttempt: context.retryAttempt }
    );
  }
  
  /**
   * Sends a failed message to the dead letter queue.
   * 
   * @param kafkaMessage - The original Kafka message
   * @param error - The error that caused the failure
   * @param context - The message processing context
   */
  private async sendToDlq(
    kafkaMessage: KafkaMessage,
    error: any,
    context: MessageContext
  ): Promise<void> {
    try {
      await this.dlqService.sendToDlq({
        topic: this.options.topic,
        originalMessage: kafkaMessage,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : String(error),
        context: {
          correlationId: context.correlationId,
          retryAttempt: context.retryAttempt,
          receivedAt: context.receivedAt.toISOString(),
          failedAt: new Date().toISOString()
        }
      });
      
      this.logger.log(
        `Message sent to DLQ (correlationId: ${context.correlationId})`,
        { correlationId: context.correlationId, topic: this.options.topic }
      );
    } catch (dlqError) {
      this.logger.error(
        `Failed to send message to DLQ (correlationId: ${context.correlationId}): ${dlqError instanceof Error ? dlqError.message : String(dlqError)}`,
        dlqError instanceof Error ? dlqError.stack : undefined,
        { correlationId: context.correlationId, topic: this.options.topic }
      );
    }
  }
  
  /**
   * Extracts the correlation ID from message headers.
   * 
   * @param headers - The Kafka message headers
   * @returns The correlation ID if present, otherwise undefined
   */
  private extractCorrelationId(headers: KafkaHeaders): string | undefined {
    return headers['x-correlation-id'] || headers['X-Correlation-ID'];
  }
  
  /**
   * Gets the current retry attempt from message headers.
   * 
   * @param headers - The Kafka message headers
   * @returns The retry attempt count (0 for first attempt)
   */
  private getRetryAttempt(headers: KafkaHeaders): number {
    const retryHeader = headers['x-retry-count'] || headers['X-Retry-Count'];
    return retryHeader ? parseInt(retryHeader, 10) : 0;
  }
}