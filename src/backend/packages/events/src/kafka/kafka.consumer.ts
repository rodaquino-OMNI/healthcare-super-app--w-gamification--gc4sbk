import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Consumer, ConsumerSubscribeTopics, KafkaMessage as KafkaJsMessage } from 'kafkajs';

import { IKafkaConsumer, KafkaMessage, KafkaMessageBatch, KafkaMessageHandler, KafkaBatchMessageHandler } from './kafka.interfaces';
import { KafkaService } from './kafka.service';
import { 
  CircuitBreaker, 
  CircuitBreakerOptions, 
  CircuitBreakerState,
  DeadLetterQueue, 
  DeadLetterQueueOptions, 
  KafkaConsumerError, 
  KafkaDeserializationError, 
  KafkaErrorDetails, 
  createKafkaError 
} from './kafka.errors';

/**
 * Configuration options for the AbstractKafkaConsumer
 */
export interface KafkaConsumerOptions {
  /**
   * Consumer group ID
   */
  groupId: string;
  
  /**
   * Topics to subscribe to
   */
  topics: string[];
  
  /**
   * Whether to consume from the beginning of the topic
   * @default false
   */
  fromBeginning?: boolean;
  
  /**
   * Whether to enable batch processing
   * @default false
   */
  batchProcessing?: boolean;
  
  /**
   * Maximum number of messages to process in a batch
   * @default 100
   */
  batchSize?: number;
  
  /**
   * Batch processing timeout in milliseconds
   * @default 1000
   */
  batchTimeoutMs?: number;
  
  /**
   * Whether to enable dead letter queue
   * @default true
   */
  enableDeadLetterQueue?: boolean;
  
  /**
   * Dead letter queue options
   */
  deadLetterQueueOptions?: DeadLetterQueueOptions;
  
  /**
   * Whether to enable circuit breaker
   * @default true
   */
  enableCircuitBreaker?: boolean;
  
  /**
   * Circuit breaker options
   */
  circuitBreakerOptions?: CircuitBreakerOptions;
  
  /**
   * Whether to auto-commit offsets
   * @default true
   */
  autoCommit?: boolean;
  
  /**
   * Maximum number of retries for message processing
   * @default 3
   */
  maxRetries?: number;
  
  /**
   * Whether to enable health check reporting
   * @default true
   */
  enableHealthCheck?: boolean;
  
  /**
   * Custom deserializer for messages
   */
  deserializer?: (message: KafkaJsMessage) => any;
  
  /**
   * Custom validator for messages
   */
  validator?: (message: any) => Promise<boolean>;
  
  /**
   * Custom error handler for message processing errors
   */
  errorHandler?: (error: Error, message: KafkaMessage) => Promise<void>;
}

/**
 * Health status of the Kafka consumer
 */
export interface KafkaConsumerHealth {
  /**
   * Whether the consumer is connected
   */
  isConnected: boolean;
  
  /**
   * Whether the consumer is running
   */
  isRunning: boolean;
  
  /**
   * The current circuit breaker state
   */
  circuitBreakerState?: CircuitBreakerState;
  
  /**
   * The number of messages processed
   */
  messagesProcessed: number;
  
  /**
   * The number of messages failed
   */
  messagesFailed: number;
  
  /**
   * The number of messages sent to dead letter queue
   */
  messagesSentToDLQ: number;
  
  /**
   * The topics subscribed to
   */
  subscribedTopics: string[];
  
  /**
   * The consumer group ID
   */
  groupId: string;
  
  /**
   * The last error message, if any
   */
  lastError?: string;
  
  /**
   * The timestamp of the last error
   */
  lastErrorTimestamp?: number;
}

/**
 * Abstract base class for Kafka consumers.
 * This class provides a standardized way to consume messages from Kafka topics
 * with features like validation, error handling, dead letter queue, circuit breaker,
 * batch processing, and health check reporting.
 * 
 * Service-specific consumers should extend this class and implement the abstract methods.
 */
@Injectable()
export abstract class AbstractKafkaConsumer implements OnModuleInit, OnModuleDestroy, IKafkaConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected consumer: Consumer;
  protected isInitialized = false;
  protected isRunning = false;
  protected circuitBreaker: CircuitBreaker | null = null;
  protected deadLetterQueue: DeadLetterQueue | null = null;
  protected messagesProcessed = 0;
  protected messagesFailed = 0;
  protected messagesSentToDLQ = 0;
  protected lastError: Error | null = null;
  protected lastErrorTimestamp: number | null = null;
  protected pausedTopics: Set<string> = new Set();
  protected subscribedTopics: Set<string> = new Set();
  
  /**
   * Creates an instance of AbstractKafkaConsumer.
   * 
   * @param kafkaService The Kafka service for interacting with Kafka
   * @param options Configuration options for the consumer
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly options: KafkaConsumerOptions
  ) {
    // Set default options
    this.options = {
      fromBeginning: false,
      batchProcessing: false,
      batchSize: 100,
      batchTimeoutMs: 1000,
      enableDeadLetterQueue: true,
      enableCircuitBreaker: true,
      autoCommit: true,
      maxRetries: 3,
      enableHealthCheck: true,
      ...options
    };
    
    // Initialize consumer
    this.consumer = this.kafkaService.getConsumer();
    
    // Initialize circuit breaker if enabled
    if (this.options.enableCircuitBreaker) {
      this.circuitBreaker = new CircuitBreaker({
        failureThreshold: 5,
        successThreshold: 2,
        resetTimeout: 30000,
        ...this.options.circuitBreakerOptions,
        onStateChange: (from, to) => {
          this.logger.log(`Circuit breaker state changed from ${from} to ${to}`);
          this.onCircuitBreakerStateChange(from, to);
        }
      });
    }
    
    // Initialize dead letter queue if enabled
    if (this.options.enableDeadLetterQueue && this.options.deadLetterQueueOptions) {
      this.deadLetterQueue = new DeadLetterQueue(this.options.deadLetterQueueOptions);
    }
    
    this.logger.log(`Kafka consumer initialized with options: ${JSON.stringify({
      groupId: this.options.groupId,
      topics: this.options.topics,
      fromBeginning: this.options.fromBeginning,
      batchProcessing: this.options.batchProcessing,
      enableDeadLetterQueue: this.options.enableDeadLetterQueue,
      enableCircuitBreaker: this.options.enableCircuitBreaker,
      autoCommit: this.options.autoCommit
    })}`);
  }
  
  /**
   * Initializes the consumer on module initialization.
   * Connects to Kafka and subscribes to the configured topics.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.connect();
      await this.subscribe(this.options.topics, this.options.fromBeginning);
      await this.startConsuming();
      this.isInitialized = true;
      this.logger.log('Kafka consumer initialized and started consuming');
    } catch (error) {
      this.handleInitializationError(error as Error);
    }
  }
  
  /**
   * Cleans up resources on module destruction.
   * Disconnects from Kafka and disposes of the circuit breaker.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.disconnect();
      
      if (this.circuitBreaker) {
        this.circuitBreaker.dispose();
      }
      
      this.logger.log('Kafka consumer destroyed');
    } catch (error) {
      this.logger.error(`Error destroying Kafka consumer: ${(error as Error).message}`, (error as Error).stack);
    }
  }
  
  /**
   * Connects the consumer to Kafka.
   */
  async connect(): Promise<void> {
    try {
      if (this.isConnected()) {
        this.logger.log('Kafka consumer already connected');
        return;
      }
      
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected');
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { consumerGroup: this.options.groupId });
      this.logger.error(`Error connecting Kafka consumer: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }
  
  /**
   * Disconnects the consumer from Kafka.
   */
  async disconnect(): Promise<void> {
    try {
      if (!this.isConnected()) {
        this.logger.log('Kafka consumer already disconnected');
        return;
      }
      
      await this.consumer.disconnect();
      this.isRunning = false;
      this.logger.log('Kafka consumer disconnected');
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { consumerGroup: this.options.groupId });
      this.logger.error(`Error disconnecting Kafka consumer: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }
  
  /**
   * Subscribes to the specified topics.
   * 
   * @param topics The topics to subscribe to
   * @param fromBeginning Whether to consume from the beginning of the topic
   */
  async subscribe(topics: string | string[], fromBeginning = false): Promise<void> {
    try {
      const topicsArray = Array.isArray(topics) ? topics : [topics];
      
      if (topicsArray.length === 0) {
        this.logger.warn('No topics specified for subscription');
        return;
      }
      
      const subscribeTopics: ConsumerSubscribeTopics = {
        topics: topicsArray,
        fromBeginning
      };
      
      await this.consumer.subscribe(subscribeTopics);
      
      // Update subscribed topics
      topicsArray.forEach(topic => this.subscribedTopics.add(topic));
      
      this.logger.log(`Subscribed to topics: ${topicsArray.join(', ')}${fromBeginning ? ' (from beginning)' : ''}`);
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { 
        consumerGroup: this.options.groupId,
        topic: Array.isArray(topics) ? topics.join(',') : topics
      });
      this.logger.error(`Error subscribing to topics: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }
  
  /**
   * Starts consuming messages from subscribed topics.
   * 
   * @param handler Optional custom message handler
   */
  async consume(handler?: KafkaMessageHandler): Promise<void> {
    if (this.isRunning) {
      this.logger.log('Kafka consumer already running');
      return;
    }
    
    try {
      // Use the provided handler or the internal handler
      const messageHandler = handler || this.handleMessage.bind(this);
      
      // Start consuming with the appropriate handler based on batch processing setting
      if (this.options.batchProcessing) {
        await this.startBatchConsumer(messageHandler);
      } else {
        await this.startIndividualConsumer(messageHandler);
      }
      
      this.isRunning = true;
      this.logger.log('Kafka consumer started consuming messages');
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { consumerGroup: this.options.groupId });
      this.logger.error(`Error starting Kafka consumer: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }
  
  /**
   * Pauses consumption from specified topics.
   * 
   * @param topics The topics to pause
   */
  pause(topics: string[]): void {
    try {
      if (topics.length === 0) {
        return;
      }
      
      // Filter topics that are subscribed
      const topicsToPause = topics.filter(topic => this.subscribedTopics.has(topic));
      
      if (topicsToPause.length === 0) {
        this.logger.warn('No subscribed topics to pause');
        return;
      }
      
      this.consumer.pause(topicsToPause.map(topic => ({ topic })));
      
      // Update paused topics
      topicsToPause.forEach(topic => this.pausedTopics.add(topic));
      
      this.logger.log(`Paused consumption from topics: ${topicsToPause.join(', ')}`);
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { 
        consumerGroup: this.options.groupId,
        topic: topics.join(',')
      });
      this.logger.error(`Error pausing topics: ${kafkaError.message}`, kafkaError.stack);
    }
  }
  
  /**
   * Resumes consumption from specified topics.
   * 
   * @param topics The topics to resume
   */
  resume(topics: string[]): void {
    try {
      if (topics.length === 0) {
        return;
      }
      
      // Filter topics that are paused
      const topicsToResume = topics.filter(topic => this.pausedTopics.has(topic));
      
      if (topicsToResume.length === 0) {
        this.logger.warn('No paused topics to resume');
        return;
      }
      
      this.consumer.resume(topicsToResume.map(topic => ({ topic })));
      
      // Update paused topics
      topicsToResume.forEach(topic => this.pausedTopics.delete(topic));
      
      this.logger.log(`Resumed consumption from topics: ${topicsToResume.join(', ')}`);
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { 
        consumerGroup: this.options.groupId,
        topic: topics.join(',')
      });
      this.logger.error(`Error resuming topics: ${kafkaError.message}`, kafkaError.stack);
    }
  }
  
  /**
   * Seeks to a specific offset in a topic partition.
   * 
   * @param topic The topic to seek in
   * @param partition The partition to seek in
   * @param offset The offset to seek to
   */
  async seek(topic: string, partition: number, offset: number): Promise<void> {
    try {
      await this.consumer.seek({
        topic,
        partition,
        offset: offset.toString()
      });
      
      this.logger.log(`Sought to offset ${offset} in topic ${topic} partition ${partition}`);
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { 
        consumerGroup: this.options.groupId,
        topic,
        partition
      });
      this.logger.error(`Error seeking to offset: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }
  
  /**
   * Commits offsets for the consumer.
   */
  async commitOffsets(): Promise<void> {
    try {
      await this.consumer.commitOffsets();
      this.logger.debug('Committed offsets');
    } catch (error) {
      const kafkaError = createKafkaError(error as Error, { consumerGroup: this.options.groupId });
      this.logger.error(`Error committing offsets: ${kafkaError.message}`, kafkaError.stack);
      throw kafkaError;
    }
  }
  
  /**
   * Checks if the consumer is connected to Kafka.
   * 
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.consumer && (this.consumer as any).connected;
  }
  
  /**
   * Gets the health status of the consumer.
   * 
   * @returns The health status
   */
  getHealth(): KafkaConsumerHealth {
    return {
      isConnected: this.isConnected(),
      isRunning: this.isRunning,
      circuitBreakerState: this.circuitBreaker?.getState(),
      messagesProcessed: this.messagesProcessed,
      messagesFailed: this.messagesFailed,
      messagesSentToDLQ: this.messagesSentToDLQ,
      subscribedTopics: Array.from(this.subscribedTopics),
      groupId: this.options.groupId,
      lastError: this.lastError?.message,
      lastErrorTimestamp: this.lastErrorTimestamp || undefined
    };
  }
  
  /**
   * Starts consuming messages individually.
   * 
   * @param handler The message handler
   */
  private async startIndividualConsumer(handler: KafkaMessageHandler): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          // Convert KafkaJS message to our internal format
          const kafkaMessage: KafkaMessage = {
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: this.deserializeMessage(message),
            headers: this.deserializeHeaders(message.headers),
            timestamp: message.timestamp
          };
          
          // Process the message with circuit breaker if enabled
          if (this.circuitBreaker) {
            await this.circuitBreaker.execute(async () => {
              await handler(kafkaMessage);
            });
          } else {
            await handler(kafkaMessage);
          }
          
          // Commit offsets if auto-commit is enabled
          if (this.options.autoCommit) {
            await this.commitOffsets();
          }
        } catch (error) {
          await this.handleConsumerError(error as Error, { topic, partition, message });
        }
      }
    });
  }
  
  /**
   * Starts consuming messages in batches.
   * 
   * @param handler The message handler
   */
  private async startBatchConsumer(handler: KafkaMessageHandler): Promise<void> {
    await this.consumer.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        const { topic, partition, messages } = batch;
        
        if (!isRunning() || isStale()) {
          return;
        }
        
        try {
          // Process messages in batches
          const kafkaMessages: KafkaMessage[] = messages.map(message => ({
            topic,
            partition,
            offset: message.offset,
            key: message.key?.toString(),
            value: this.deserializeMessage(message),
            headers: this.deserializeHeaders(message.headers),
            timestamp: message.timestamp
          }));
          
          // Process the batch with circuit breaker if enabled
          if (this.circuitBreaker) {
            await this.circuitBreaker.execute(async () => {
              await this.handleBatch({
                topic,
                partition,
                messages: kafkaMessages
              });
            });
          } else {
            await this.handleBatch({
              topic,
              partition,
              messages: kafkaMessages
            });
          }
          
          // Resolve the last offset
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            resolveOffset(lastMessage.offset);
          }
          
          // Send heartbeat to avoid consumer group rebalancing
          await heartbeat();
          
          // Commit offsets if auto-commit is enabled
          if (this.options.autoCommit) {
            await this.commitOffsets();
          }
        } catch (error) {
          await this.handleBatchError(error as Error, batch);
        }
      }
    });
  }
  
  /**
   * Handles a batch of messages.
   * By default, processes each message individually, but can be overridden for true batch processing.
   * 
   * @param batch The batch of messages
   */
  protected async handleBatch(batch: KafkaMessageBatch): Promise<void> {
    // Default implementation processes each message individually
    // Subclasses can override this for true batch processing
    for (const message of batch.messages) {
      try {
        await this.handleMessage(message);
      } catch (error) {
        // Continue processing other messages in the batch
        this.logger.error(
          `Error processing message in batch (topic: ${batch.topic}, partition: ${batch.partition}, offset: ${message.offset}): ${(error as Error).message}`,
          (error as Error).stack
        );
      }
    }
  }
  
  /**
   * Handles a single message.
   * This is the main method that subclasses should override to implement their specific message processing logic.
   * 
   * @param message The message to handle
   */
  protected async handleMessage(message: KafkaMessage): Promise<void> {
    try {
      // Validate the message
      const validationResult = await this.validateMessage(message.value);
      
      if (!validationResult.isValid) {
        throw new KafkaDeserializationError(
          `Invalid message format: ${validationResult.errors.join(', ')}`,
          {
            topic: message.topic,
            partition: message.partition,
            offset: message.offset,
            kafkaMessage: message
          }
        );
      }
      
      // Transform the message if needed
      const transformedMessage = await this.transformMessage(message.value);
      
      // Process the message
      await this.processMessage(transformedMessage, message);
      
      // Increment processed count
      this.messagesProcessed++;
      
      // Log success
      this.logMessageProcessed(message);
    } catch (error) {
      // Handle the error
      await this.handleMessageError(error as Error, message);
    }
  }
  
  /**
   * Processes a message.
   * This is an abstract method that subclasses must implement to define their specific message processing logic.
   * 
   * @param messageValue The deserialized and validated message value
   * @param originalMessage The original Kafka message
   */
  protected abstract processMessage(messageValue: any, originalMessage: KafkaMessage): Promise<void>;
  
  /**
   * Validates a message.
   * By default, uses class-validator if a DTO class is provided, otherwise uses the custom validator if provided.
   * 
   * @param message The message to validate
   * @returns Validation result with isValid flag and error messages
   */
  protected async validateMessage(message: any): Promise<{ isValid: boolean; errors: string[] }> {
    // Use custom validator if provided
    if (this.options.validator) {
      try {
        const isValid = await this.options.validator(message);
        return { isValid, errors: isValid ? [] : ['Custom validation failed'] };
      } catch (error) {
        return { isValid: false, errors: [(error as Error).message] };
      }
    }
    
    // Default validation
    try {
      // Get the DTO class for this message type
      const DtoClass = this.getMessageDtoClass(message);
      
      if (!DtoClass) {
        // No DTO class, consider valid
        return { isValid: true, errors: [] };
      }
      
      // Convert plain object to class instance
      const instance = plainToInstance(DtoClass, message);
      
      // Validate using class-validator
      const errors = await validate(instance);
      
      if (errors.length > 0) {
        // Format validation errors
        const formattedErrors = this.formatValidationErrors(errors);
        return { isValid: false, errors: formattedErrors };
      }
      
      return { isValid: true, errors: [] };
    } catch (error) {
      return { isValid: false, errors: [`Validation error: ${(error as Error).message}`] };
    }
  }
  
  /**
   * Gets the DTO class for a message type.
   * Subclasses should override this to provide the appropriate DTO class for each message type.
   * 
   * @param message The message to get the DTO class for
   * @returns The DTO class or undefined if no validation is needed
   */
  protected getMessageDtoClass(message: any): any {
    // Default implementation returns undefined (no validation)
    // Subclasses should override this to provide the appropriate DTO class
    return undefined;
  }
  
  /**
   * Transforms a message before processing.
   * Subclasses can override this to transform messages before processing.
   * 
   * @param message The message to transform
   * @returns The transformed message
   */
  protected async transformMessage(message: any): Promise<any> {
    // Default implementation returns the message unchanged
    // Subclasses can override this to transform messages
    return message;
  }
  
  /**
   * Handles an error that occurs during message processing.
   * 
   * @param error The error that occurred
   * @param message The message that caused the error
   */
  protected async handleMessageError(error: Error, message: KafkaMessage): Promise<void> {
    // Increment failed count
    this.messagesFailed++;
    
    // Update last error
    this.lastError = error;
    this.lastErrorTimestamp = Date.now();
    
    // Log the error
    this.logMessageError(error, message);
    
    // Use custom error handler if provided
    if (this.options.errorHandler) {
      try {
        await this.options.errorHandler(error, message);
        return;
      } catch (handlerError) {
        this.logger.error(
          `Error in custom error handler: ${(handlerError as Error).message}`,
          (handlerError as Error).stack
        );
      }
    }
    
    // Send to dead letter queue if enabled
    if (this.deadLetterQueue && this.options.enableDeadLetterQueue) {
      await this.sendToDeadLetterQueue(error, message);
    }
  }
  
  /**
   * Handles an error that occurs during batch processing.
   * 
   * @param error The error that occurred
   * @param batch The batch that caused the error
   */
  protected async handleBatchError(error: Error, batch: any): Promise<void> {
    // Update last error
    this.lastError = error;
    this.lastErrorTimestamp = Date.now();
    
    // Log the error
    this.logger.error(
      `Error processing batch (topic: ${batch.topic}, partition: ${batch.partition}): ${error.message}`,
      error.stack
    );
    
    // Increment failed count for each message in the batch
    if (batch.messages && Array.isArray(batch.messages)) {
      this.messagesFailed += batch.messages.length;
    }
  }
  
  /**
   * Handles an error that occurs during consumer operation.
   * 
   * @param error The error that occurred
   * @param messageDetails Details about the message that caused the error
   */
  protected async handleConsumerError(error: Error, messageDetails: { topic: string; partition: number; message: KafkaJsMessage }): Promise<void> {
    // Update last error
    this.lastError = error;
    this.lastErrorTimestamp = Date.now();
    
    // Create Kafka error with details
    const kafkaError = createKafkaError(error, {
      topic: messageDetails.topic,
      partition: messageDetails.partition,
      offset: messageDetails.message.offset,
      consumerGroup: this.options.groupId,
      messageKey: messageDetails.message.key?.toString(),
      kafkaMessage: {
        topic: messageDetails.topic,
        partition: messageDetails.partition,
        offset: messageDetails.message.offset,
        key: messageDetails.message.key?.toString(),
        value: this.deserializeMessage(messageDetails.message),
        headers: this.deserializeHeaders(messageDetails.message.headers),
        timestamp: messageDetails.message.timestamp
      }
    });
    
    // Log the error
    this.logger.error(
      `Error in consumer (topic: ${messageDetails.topic}, partition: ${messageDetails.partition}, offset: ${messageDetails.message.offset}): ${kafkaError.message}`,
      kafkaError.stack
    );
    
    // Increment failed count
    this.messagesFailed++;
  }
  
  /**
   * Handles an error that occurs during initialization.
   * 
   * @param error The error that occurred
   */
  protected handleInitializationError(error: Error): void {
    // Update last error
    this.lastError = error;
    this.lastErrorTimestamp = Date.now();
    
    // Create Kafka error with details
    const kafkaError = createKafkaError(error, {
      consumerGroup: this.options.groupId
    });
    
    // Log the error
    this.logger.error(
      `Error initializing Kafka consumer: ${kafkaError.message}`,
      kafkaError.stack
    );
    
    // Throw the error to prevent the application from starting with a broken consumer
    throw new KafkaConsumerError(
      `Failed to initialize Kafka consumer: ${kafkaError.message}`,
      { consumerGroup: this.options.groupId },
      kafkaError
    );
  }
  
  /**
   * Sends a message to the dead letter queue.
   * 
   * @param error The error that occurred
   * @param message The message to send to the DLQ
   */
  protected async sendToDeadLetterQueue(error: Error, message: KafkaMessage): Promise<void> {
    if (!this.deadLetterQueue) {
      return;
    }
    
    try {
      // Prepare the message for DLQ
      const dlqMessage = this.deadLetterQueue.prepareMessage(
        message as any,
        error,
        this.messagesFailed
      );
      
      // Send to DLQ
      await this.kafkaService.send({
        topic: this.deadLetterQueue.getTopic(),
        messages: [{
          key: message.key ? Buffer.from(message.key) : null,
          value: typeof dlqMessage.value === 'string' 
            ? Buffer.from(dlqMessage.value) 
            : Buffer.from(JSON.stringify(dlqMessage.value)),
          headers: dlqMessage.headers as any
        }]
      });
      
      // Increment DLQ count
      this.messagesSentToDLQ++;
      
      this.logger.log(
        `Sent message to dead letter queue (topic: ${message.topic}, partition: ${message.partition}, offset: ${message.offset})`
      );
    } catch (dlqError) {
      this.logger.error(
        `Error sending message to dead letter queue: ${(dlqError as Error).message}`,
        (dlqError as Error).stack
      );
    }
  }
  
  /**
   * Deserializes a message from Kafka.
   * 
   * @param message The Kafka message to deserialize
   * @returns The deserialized message
   */
  protected deserializeMessage(message: KafkaJsMessage): any {
    // Use custom deserializer if provided
    if (this.options.deserializer) {
      return this.options.deserializer(message);
    }
    
    // Default deserialization
    if (!message.value) {
      return null;
    }
    
    try {
      const value = message.value.toString();
      return JSON.parse(value);
    } catch (error) {
      // If JSON parsing fails, return the raw string
      return message.value.toString();
    }
  }
  
  /**
   * Deserializes message headers from Kafka.
   * 
   * @param headers The Kafka message headers to deserialize
   * @returns The deserialized headers
   */
  protected deserializeHeaders(headers: Record<string, Buffer> | undefined): Record<string, string> | undefined {
    if (!headers) {
      return undefined;
    }
    
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      if (value) {
        result[key] = value.toString();
      }
    }
    
    return result;
  }
  
  /**
   * Formats validation errors from class-validator.
   * 
   * @param errors The validation errors
   * @returns Formatted error messages
   */
  protected formatValidationErrors(errors: ValidationError[]): string[] {
    const result: string[] = [];
    
    for (const error of errors) {
      if (error.constraints) {
        result.push(...Object.values(error.constraints));
      }
      
      if (error.children && error.children.length > 0) {
        result.push(...this.formatValidationErrors(error.children));
      }
    }
    
    return result;
  }
  
  /**
   * Logs a processed message.
   * 
   * @param message The processed message
   */
  protected logMessageProcessed(message: KafkaMessage): void {
    this.logger.debug(
      `Processed message (topic: ${message.topic}, partition: ${message.partition}, offset: ${message.offset})`
    );
  }
  
  /**
   * Logs a message processing error.
   * 
   * @param error The error that occurred
   * @param message The message that caused the error
   */
  protected logMessageError(error: Error, message: KafkaMessage): void {
    this.logger.error(
      `Error processing message (topic: ${message.topic}, partition: ${message.partition}, offset: ${message.offset}): ${error.message}`,
      error.stack
    );
  }
  
  /**
   * Handles a circuit breaker state change.
   * Subclasses can override this to implement custom behavior when the circuit breaker state changes.
   * 
   * @param from The previous state
   * @param to The new state
   */
  protected onCircuitBreakerStateChange(from: CircuitBreakerState, to: CircuitBreakerState): void {
    // Default implementation logs the state change
    // Subclasses can override this to implement custom behavior
    if (to === CircuitBreakerState.OPEN) {
      this.logger.warn('Circuit breaker opened, pausing message consumption');
    } else if (from === CircuitBreakerState.OPEN && to === CircuitBreakerState.HALF_OPEN) {
      this.logger.log('Circuit breaker half-open, testing message consumption');
    } else if (to === CircuitBreakerState.CLOSED) {
      this.logger.log('Circuit breaker closed, resuming normal message consumption');
    }
  }
  
  /**
   * Starts consuming messages.
   * Helper method to start the consumer with the appropriate handler.
   */
  private async startConsuming(): Promise<void> {
    await this.consume();
  }
}