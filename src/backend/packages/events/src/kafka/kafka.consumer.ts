import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaMessage } from 'kafkajs';
import { validate, ValidatorOptions } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { IKafkaMessage, IKafkaConsumer, IKafkaHeaders, IKafkaTopicPartition } from './kafka.interfaces';
import { KafkaService } from './kafka.service';
import { KafkaCircuitBreaker, CircuitState, KafkaError, KafkaConsumerError, createKafkaError, isRetryableKafkaError, getKafkaErrorRetryDelay } from './kafka.errors';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { KAFKA_DEFAULT_GROUP_ID, KAFKA_MAX_RETRY_ATTEMPTS, KAFKA_DLQ_TOPIC_PREFIX } from './kafka.constants';

/**
 * Configuration options for the Kafka consumer
 */
export interface KafkaConsumerOptions {
  /**
   * Consumer group ID
   * @default 'default-consumer-group'
   */
  groupId?: string;

  /**
   * Topics to subscribe to
   */
  topics: string[];

  /**
   * Whether to enable schema validation
   * @default true
   */
  enableSchemaValidation?: boolean;

  /**
   * Validator options for class-validator
   */
  validatorOptions?: ValidatorOptions;

  /**
   * Whether to enable dead letter queue for failed messages
   * @default true
   */
  enableDeadLetterQueue?: boolean;

  /**
   * Maximum number of retry attempts for failed messages
   * @default 3
   */
  maxRetryAttempts?: number;

  /**
   * Whether to enable batch processing
   * @default false
   */
  enableBatchProcessing?: boolean;

  /**
   * Maximum batch size for batch processing
   * @default 100
   */
  maxBatchSize?: number;

  /**
   * Whether to enable circuit breaker
   * @default true
   */
  enableCircuitBreaker?: boolean;

  /**
   * Circuit breaker options
   */
  circuitBreakerOptions?: {
    failureThreshold?: number;
    resetTimeout?: number;
    successThreshold?: number;
  };

  /**
   * Whether to enable health check reporting
   * @default true
   */
  enableHealthCheck?: boolean;

  /**
   * Whether to auto-commit offsets
   * @default true
   */
  autoCommit?: boolean;

  /**
   * Whether to consume from the beginning of the topic
   * @default false
   */
  fromBeginning?: boolean;
}

/**
 * Health status of the Kafka consumer
 */
export interface KafkaConsumerHealth {
  /**
   * Whether the consumer is healthy
   */
  isHealthy: boolean;

  /**
   * Current circuit breaker state
   */
  circuitState?: CircuitState;

  /**
   * Number of messages processed
   */
  messagesProcessed: number;

  /**
   * Number of messages failed
   */
  messagesFailed: number;

  /**
   * Number of messages sent to DLQ
   */
  messagesSentToDlq: number;

  /**
   * Number of retries attempted
   */
  retryAttempts: number;

  /**
   * Average processing time in milliseconds
   */
  averageProcessingTimeMs: number;

  /**
   * Last error message
   */
  lastErrorMessage?: string;

  /**
   * Last error timestamp
   */
  lastErrorTimestamp?: string;

  /**
   * Subscribed topics
   */
  subscribedTopics: string[];

  /**
   * Consumer group ID
   */
  groupId: string;

  /**
   * Whether the consumer is connected
   */
  isConnected: boolean;
}

/**
 * Abstract base class for Kafka consumers
 * Provides standardized message processing, error handling, and lifecycle management
 */
@Injectable()
export abstract class KafkaConsumer<T extends IBaseEvent = IBaseEvent> implements OnModuleInit, OnModuleDestroy {
  protected consumer: IKafkaConsumer | null = null;
  protected isInitialized = false;
  protected isPaused = false;
  protected circuitBreaker: KafkaCircuitBreaker | null = null;
  protected readonly logger = new Logger(this.constructor.name);
  
  // Health metrics
  protected messagesProcessed = 0;
  protected messagesFailed = 0;
  protected messagesSentToDlq = 0;
  protected retryAttempts = 0;
  protected processingTimes: number[] = [];
  protected lastError: Error | null = null;
  protected lastErrorTimestamp: Date | null = null;

  /**
   * Creates an instance of KafkaConsumer
   * @param kafkaService The Kafka service for broker interaction
   * @param options Consumer configuration options
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly options: KafkaConsumerOptions
  ) {
    // Set default options
    this.options = {
      groupId: KAFKA_DEFAULT_GROUP_ID,
      enableSchemaValidation: true,
      enableDeadLetterQueue: true,
      maxRetryAttempts: KAFKA_MAX_RETRY_ATTEMPTS,
      enableBatchProcessing: false,
      maxBatchSize: 100,
      enableCircuitBreaker: true,
      enableHealthCheck: true,
      autoCommit: true,
      fromBeginning: false,
      ...options
    };

    // Initialize circuit breaker if enabled
    if (this.options.enableCircuitBreaker) {
      this.circuitBreaker = new KafkaCircuitBreaker(this.options.circuitBreakerOptions);
    }

    this.logger.log(`Initialized with options: ${JSON.stringify({
      groupId: this.options.groupId,
      topics: this.options.topics,
      enableSchemaValidation: this.options.enableSchemaValidation,
      enableDeadLetterQueue: this.options.enableDeadLetterQueue,
      enableBatchProcessing: this.options.enableBatchProcessing,
      enableCircuitBreaker: this.options.enableCircuitBreaker,
      enableHealthCheck: this.options.enableHealthCheck
    })}`);
  }

  /**
   * Initializes the consumer on module initialization
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initialize();
    } catch (error) {
      this.logger.error(`Failed to initialize consumer: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Cleans up resources on module destruction
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnect();
    } catch (error) {
      this.logger.error(`Failed to disconnect consumer: ${error.message}`, error.stack);
    }
  }

  /**
   * Initializes the consumer and subscribes to topics
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get consumer instance from Kafka service
      this.consumer = this.kafkaService.getConsumer(this.options.groupId);
      
      // Connect to Kafka broker
      await this.consumer.connect();
      
      // Subscribe to topics
      await this.consumer.subscribe(this.options.topics);
      
      // Start consuming messages
      await this.startConsuming();
      
      this.isInitialized = true;
      this.logger.log(`Successfully subscribed to topics: ${this.options.topics.join(', ')}`);
    } catch (error) {
      const kafkaError = createKafkaError(error, { groupId: this.options.groupId });
      this.logger.error(
        `Failed to initialize consumer: ${kafkaError.message}`,
        kafkaError.stack
      );
      throw kafkaError;
    }
  }

  /**
   * Disconnects the consumer
   */
  async disconnect(): Promise<void> {
    if (!this.isInitialized || !this.consumer) {
      return;
    }

    try {
      await this.consumer.disconnect();
      this.isInitialized = false;
      this.logger.log('Successfully disconnected consumer');
    } catch (error) {
      const kafkaError = createKafkaError(error, { groupId: this.options.groupId });
      this.logger.error(
        `Failed to disconnect consumer: ${kafkaError.message}`,
        kafkaError.stack
      );
      throw kafkaError;
    }
  }

  /**
   * Starts consuming messages from subscribed topics
   */
  protected async startConsuming(): Promise<void> {
    if (!this.consumer) {
      throw new KafkaConsumerError('Consumer not initialized', { groupId: this.options.groupId });
    }

    try {
      // Start consuming messages
      const consumer = this.consumer;
      const consumerOptions = {
        autoCommit: this.options.autoCommit,
        fromBeginning: this.options.fromBeginning,
        maxBatchSize: this.options.enableBatchProcessing ? this.options.maxBatchSize : 1
      };

      // Subscribe to the consumer observable
      const subscription = consumer.consume(consumerOptions).subscribe({
        next: async (message) => {
          if (this.isPaused) {
            return;
          }

          if (this.options.enableBatchProcessing && Array.isArray(message)) {
            await this.processBatch(message);
          } else {
            await this.processMessage(message as IKafkaMessage<any>);
          }
        },
        error: (error) => {
          const kafkaError = createKafkaError(error, { groupId: this.options.groupId });
          this.logger.error(
            `Error in consumer subscription: ${kafkaError.message}`,
            kafkaError.stack
          );
          this.lastError = kafkaError;
          this.lastErrorTimestamp = new Date();
          this.messagesFailed++;

          // Try to restart consuming after a delay if the error is retryable
          if (isRetryableKafkaError(kafkaError)) {
            const delay = getKafkaErrorRetryDelay(kafkaError);
            this.logger.log(`Attempting to restart consumer after ${delay}ms`);
            setTimeout(() => this.startConsuming(), delay);
          }
        }
      });

      // Store subscription for cleanup
      this.logger.log('Started consuming messages');
    } catch (error) {
      const kafkaError = createKafkaError(error, { groupId: this.options.groupId });
      this.logger.error(
        `Failed to start consuming messages: ${kafkaError.message}`,
        kafkaError.stack
      );
      throw kafkaError;
    }
  }

  /**
   * Processes a batch of messages
   * @param messages Batch of messages to process
   */
  protected async processBatch(messages: IKafkaMessage<any>[]): Promise<void> {
    if (!messages || messages.length === 0) {
      return;
    }

    this.logger.debug(`Processing batch of ${messages.length} messages`);
    const startTime = Date.now();

    try {
      // Execute with circuit breaker if enabled
      if (this.circuitBreaker) {
        await this.circuitBreaker.execute(async () => {
          // Transform messages if needed
          const transformedMessages = await this.transformBatch(messages);
          
          // Validate messages if schema validation is enabled
          if (this.options.enableSchemaValidation) {
            await this.validateBatch(transformedMessages);
          }
          
          // Process the batch with the implementation-specific handler
          await this.handleBatch(transformedMessages);
        });
      } else {
        // Transform messages if needed
        const transformedMessages = await this.transformBatch(messages);
        
        // Validate messages if schema validation is enabled
        if (this.options.enableSchemaValidation) {
          await this.validateBatch(transformedMessages);
        }
        
        // Process the batch with the implementation-specific handler
        await this.handleBatch(transformedMessages);
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);
      this.messagesProcessed += messages.length;

      // Keep only the last 100 processing times for average calculation
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      this.logger.debug(`Batch processed successfully in ${processingTime}ms`);
    } catch (error) {
      this.messagesFailed += messages.length;
      this.lastError = error;
      this.lastErrorTimestamp = new Date();

      const kafkaError = error instanceof KafkaError ? error : createKafkaError(error, {
        groupId: this.options.groupId,
        topic: messages[0]?.topic
      });

      this.logger.error(
        `Failed to process batch: ${kafkaError.message}`,
        kafkaError.stack
      );

      // Handle failed messages
      await this.handleFailedBatch(messages, kafkaError);
    }
  }

  /**
   * Processes a single message
   * @param message Message to process
   */
  protected async processMessage(message: IKafkaMessage<any>): Promise<void> {
    if (!message) {
      return;
    }

    const { topic, partition, offset, key, value, headers } = message;
    this.logger.debug(`Processing message from topic ${topic}, partition ${partition}, offset ${offset}`);
    const startTime = Date.now();

    try {
      // Execute with circuit breaker if enabled
      if (this.circuitBreaker) {
        await this.circuitBreaker.execute(async () => {
          // Transform message if needed
          const transformedValue = await this.transformMessage(value, headers);
          
          // Validate message if schema validation is enabled
          if (this.options.enableSchemaValidation) {
            await this.validateMessage(transformedValue);
          }
          
          // Process the message with the implementation-specific handler
          await this.handleMessage(transformedValue, key, headers);
        });
      } else {
        // Transform message if needed
        const transformedValue = await this.transformMessage(value, headers);
        
        // Validate message if schema validation is enabled
        if (this.options.enableSchemaValidation) {
          await this.validateMessage(transformedValue);
        }
        
        // Process the message with the implementation-specific handler
        await this.handleMessage(transformedValue, key, headers);
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.processingTimes.push(processingTime);
      this.messagesProcessed++;

      // Keep only the last 100 processing times for average calculation
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      this.logger.debug(`Message processed successfully in ${processingTime}ms`);
    } catch (error) {
      this.messagesFailed++;
      this.lastError = error;
      this.lastErrorTimestamp = new Date();

      const kafkaError = error instanceof KafkaError ? error : createKafkaError(error, {
        topic,
        partition,
        offset,
        groupId: this.options.groupId
      });

      this.logger.error(
        `Failed to process message from topic ${topic}, partition ${partition}, offset ${offset}: ${kafkaError.message}`,
        kafkaError.stack
      );

      // Handle failed message
      await this.handleFailedMessage(message, kafkaError);
    }
  }

  /**
   * Handles a failed message with retry logic and dead letter queue
   * @param message Failed message
   * @param error Error that occurred during processing
   */
  protected async handleFailedMessage(message: IKafkaMessage<any>, error: KafkaError): Promise<void> {
    const { topic, key, value, headers } = message;
    const retryCount = this.getRetryCount(headers);

    // Check if the error is retryable and we haven't exceeded max retries
    if (isRetryableKafkaError(error) && retryCount < this.options.maxRetryAttempts!) {
      await this.retryMessage(message, retryCount);
    } else if (this.options.enableDeadLetterQueue) {
      // Send to dead letter queue if enabled
      await this.sendToDlq(message, error, retryCount);
    }
  }

  /**
   * Handles a failed batch with retry logic and dead letter queue
   * @param messages Failed batch of messages
   * @param error Error that occurred during processing
   */
  protected async handleFailedBatch(messages: IKafkaMessage<any>[], error: KafkaError): Promise<void> {
    // Process each message in the batch individually for retry/DLQ
    for (const message of messages) {
      await this.handleFailedMessage(message, error);
    }
  }

  /**
   * Retries a failed message
   * @param message Message to retry
   * @param currentRetryCount Current retry count
   */
  protected async retryMessage(message: IKafkaMessage<any>, currentRetryCount: number): Promise<void> {
    const { topic, key, value, headers } = message;
    const newRetryCount = currentRetryCount + 1;
    this.retryAttempts++;

    // Update headers with retry count
    const newHeaders = {
      ...headers,
      'retry-count': Buffer.from(newRetryCount.toString())
    };

    // Calculate delay based on exponential backoff
    const delay = Math.min(100 * Math.pow(2, currentRetryCount), 30000); // Max 30 seconds

    this.logger.log(`Retrying message from topic ${topic}, retry ${newRetryCount}/${this.options.maxRetryAttempts} after ${delay}ms`);

    // Schedule retry after delay
    setTimeout(async () => {
      try {
        // Send the message back to the same topic for reprocessing
        await this.kafkaService.getProducer().send({
          topic,
          key: key,
          value,
          headers: newHeaders
        });
      } catch (error) {
        const kafkaError = createKafkaError(error, {
          topic,
          groupId: this.options.groupId,
          retryCount: newRetryCount
        });

        this.logger.error(
          `Failed to retry message: ${kafkaError.message}`,
          kafkaError.stack
        );

        // If retry fails and DLQ is enabled, send to DLQ
        if (this.options.enableDeadLetterQueue) {
          await this.sendToDlq(message, kafkaError, newRetryCount);
        }
      }
    }, delay);
  }

  /**
   * Sends a failed message to the dead letter queue
   * @param message Failed message
   * @param error Error that occurred during processing
   * @param retryCount Number of retry attempts made
   */
  protected async sendToDlq(message: IKafkaMessage<any>, error: KafkaError, retryCount: number): Promise<void> {
    const { topic, key, value, headers } = message;
    const dlqTopic = `${KAFKA_DLQ_TOPIC_PREFIX}${topic}`;
    this.messagesSentToDlq++;

    // Add error information to headers
    const dlqHeaders = {
      ...headers,
      'error-message': Buffer.from(error.message),
      'error-type': Buffer.from(error.name),
      'original-topic': Buffer.from(topic),
      'retry-count': Buffer.from(retryCount.toString()),
      'timestamp': Buffer.from(new Date().toISOString())
    };

    try {
      // Send to DLQ topic
      await this.kafkaService.getProducer().send({
        topic: dlqTopic,
        key: key,
        value,
        headers: dlqHeaders
      });

      this.logger.log(`Message sent to DLQ topic ${dlqTopic} after ${retryCount} retry attempts`);
    } catch (dlqError) {
      const kafkaDlqError = createKafkaError(dlqError, {
        topic: dlqTopic,
        groupId: this.options.groupId,
        retryCount
      });

      this.logger.error(
        `Failed to send message to DLQ topic ${dlqTopic}: ${kafkaDlqError.message}`,
        kafkaDlqError.stack
      );
    }
  }

  /**
   * Gets the retry count from message headers
   * @param headers Message headers
   * @returns Retry count
   */
  protected getRetryCount(headers?: IKafkaHeaders): number {
    if (!headers || !headers['retry-count']) {
      return 0;
    }

    const retryCountBuffer = headers['retry-count'];
    const retryCount = parseInt(retryCountBuffer.toString(), 10);
    return isNaN(retryCount) ? 0 : retryCount;
  }

  /**
   * Validates a message against its schema
   * @param message Message to validate
   */
  protected async validateMessage(message: any): Promise<void> {
    if (!message) {
      throw new KafkaConsumerError('Message validation failed: Message is null or undefined');
    }

    // Get the DTO class for this message type
    const dtoClass = this.getMessageDtoClass(message);
    if (!dtoClass) {
      // If no DTO class is defined, skip validation
      return;
    }

    // Convert plain object to class instance
    const instance = plainToInstance(dtoClass, message);

    // Validate using class-validator
    const errors = await validate(instance, this.options.validatorOptions);
    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints || {};
        return Object.values(constraints).join(', ');
      }).join('; ');

      throw new KafkaConsumerError(`Message validation failed: ${errorMessages}`, {
        validationErrors: errors
      });
    }
  }

  /**
   * Validates a batch of messages against their schemas
   * @param messages Batch of messages to validate
   */
  protected async validateBatch(messages: any[]): Promise<void> {
    if (!messages || messages.length === 0) {
      return;
    }

    // Validate each message in the batch
    for (const message of messages) {
      await this.validateMessage(message);
    }
  }

  /**
   * Transforms a message before processing
   * Hook for subclasses to implement custom transformation logic
   * @param message Original message value
   * @param headers Message headers
   * @returns Transformed message
   */
  protected async transformMessage(message: any, headers?: IKafkaHeaders): Promise<T> {
    // Default implementation returns the message as is
    // Subclasses can override this method to implement custom transformation logic
    return message as T;
  }

  /**
   * Transforms a batch of messages before processing
   * Hook for subclasses to implement custom batch transformation logic
   * @param messages Original batch of messages
   * @returns Transformed batch of messages
   */
  protected async transformBatch(messages: IKafkaMessage<any>[]): Promise<T[]> {
    // Default implementation transforms each message individually
    const transformedMessages: T[] = [];
    
    for (const message of messages) {
      const transformedMessage = await this.transformMessage(message.value, message.headers);
      transformedMessages.push(transformedMessage);
    }
    
    return transformedMessages;
  }

  /**
   * Gets the DTO class for a message type
   * Subclasses should override this method to provide the appropriate DTO class for each message type
   * @param message Message to get DTO class for
   * @returns DTO class for the message type, or null if no validation is needed
   */
  protected getMessageDtoClass(message: any): any | null {
    // Default implementation returns null (no validation)
    // Subclasses should override this method to provide the appropriate DTO class
    return null;
  }

  /**
   * Pauses message consumption
   * @param topics Optional list of topics to pause, or all subscribed topics if not specified
   */
  async pause(topics?: string[]): Promise<void> {
    if (!this.consumer || !this.isInitialized) {
      throw new KafkaConsumerError('Cannot pause: Consumer not initialized');
    }

    try {
      const topicsToUse = topics || this.options.topics;
      const topicPartitions: IKafkaTopicPartition[] = topicsToUse.map(topic => ({ topic, partition: 0 }));
      
      await this.consumer.pause(topicPartitions);
      this.isPaused = true;
      
      this.logger.log(`Paused consumption from topics: ${topicsToUse.join(', ')}`);
    } catch (error) {
      const kafkaError = createKafkaError(error, { groupId: this.options.groupId });
      this.logger.error(
        `Failed to pause consumer: ${kafkaError.message}`,
        kafkaError.stack
      );
      throw kafkaError;
    }
  }

  /**
   * Resumes message consumption
   * @param topics Optional list of topics to resume, or all subscribed topics if not specified
   */
  async resume(topics?: string[]): Promise<void> {
    if (!this.consumer || !this.isInitialized) {
      throw new KafkaConsumerError('Cannot resume: Consumer not initialized');
    }

    try {
      const topicsToUse = topics || this.options.topics;
      const topicPartitions: IKafkaTopicPartition[] = topicsToUse.map(topic => ({ topic, partition: 0 }));
      
      await this.consumer.resume(topicPartitions);
      this.isPaused = false;
      
      this.logger.log(`Resumed consumption from topics: ${topicsToUse.join(', ')}`);
    } catch (error) {
      const kafkaError = createKafkaError(error, { groupId: this.options.groupId });
      this.logger.error(
        `Failed to resume consumer: ${kafkaError.message}`,
        kafkaError.stack
      );
      throw kafkaError;
    }
  }

  /**
   * Gets the health status of the consumer
   * @returns Health status
   */
  getHealth(): KafkaConsumerHealth {
    const averageProcessingTimeMs = this.processingTimes.length > 0
      ? this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length
      : 0;

    return {
      isHealthy: this.isInitialized && !this.lastError,
      circuitState: this.circuitBreaker?.getState(),
      messagesProcessed: this.messagesProcessed,
      messagesFailed: this.messagesFailed,
      messagesSentToDlq: this.messagesSentToDlq,
      retryAttempts: this.retryAttempts,
      averageProcessingTimeMs,
      lastErrorMessage: this.lastError?.message,
      lastErrorTimestamp: this.lastErrorTimestamp?.toISOString(),
      subscribedTopics: this.options.topics,
      groupId: this.options.groupId!,
      isConnected: this.consumer?.isConnected() || false
    };
  }

  /**
   * Resets health metrics
   */
  resetMetrics(): void {
    this.messagesProcessed = 0;
    this.messagesFailed = 0;
    this.messagesSentToDlq = 0;
    this.retryAttempts = 0;
    this.processingTimes = [];
    this.lastError = null;
    this.lastErrorTimestamp = null;
  }

  /**
   * Handles a message
   * Abstract method that must be implemented by subclasses
   * @param message Transformed and validated message
   * @param key Optional message key
   * @param headers Optional message headers
   */
  protected abstract handleMessage(message: T, key?: string | Buffer, headers?: IKafkaHeaders): Promise<void>;

  /**
   * Handles a batch of messages
   * Can be implemented by subclasses for batch processing
   * @param messages Transformed and validated batch of messages
   */
  protected async handleBatch(messages: T[]): Promise<void> {
    // Default implementation processes each message individually
    for (const message of messages) {
      await this.handleMessage(message);
    }
  }
}