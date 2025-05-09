import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CircuitBreaker, CircuitBreakerState } from 'opossum';

import { KafkaService } from './kafka.service';
import { KafkaConsumerConfig, KafkaMessage, KafkaMessageHandler, KafkaBatchMessageHandler } from './kafka.interfaces';
import { IEventValidator } from '../interfaces/event-validation.interface';
import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import { EventProcessingError, EventValidationError, KafkaConnectionError } from '../errors/event-errors';
import { sendToDlq } from '../errors/dlq';
import { createRetryPolicy } from '../errors/retry-policies';
import { KAFKA_DEFAULT_GROUP_ID, KAFKA_DEFAULT_RETRY_ATTEMPTS } from './kafka.constants';

/**
 * Abstract base class for Kafka consumers in the AUSTA SuperApp.
 * Provides standardized subscription, message processing, validation, and error handling.
 * 
 * Service-specific consumers should extend this class and implement the abstract methods.
 */
@Injectable()
export abstract class KafkaConsumer<T extends IVersionedEvent = IVersionedEvent> implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(this.constructor.name);
  private circuitBreaker: CircuitBreaker;
  private isConsuming = false;
  private healthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  private validators: IEventValidator[] = [];
  
  /**
   * Creates a new KafkaConsumer instance.
   * 
   * @param kafkaService The Kafka service for message consumption
   * @param config Optional consumer configuration
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly config: KafkaConsumerConfig = {}
  ) {
    // Initialize circuit breaker for Kafka operations
    this.circuitBreaker = new CircuitBreaker(this.processMessageSafely.bind(this), {
      timeout: config.circuitBreaker?.timeout || 10000,
      resetTimeout: config.circuitBreaker?.resetTimeout || 30000,
      errorThresholdPercentage: config.circuitBreaker?.errorThresholdPercentage || 50,
      rollingCountTimeout: config.circuitBreaker?.rollingCountTimeout || 60000,
      rollingCountBuckets: config.circuitBreaker?.rollingCountBuckets || 10,
    });

    // Set up circuit breaker event listeners
    this.circuitBreaker.on('open', () => {
      this.logger.warn('Circuit breaker opened - stopping message processing temporarily');
      this.healthStatus = 'degraded';
    });

    this.circuitBreaker.on('close', () => {
      this.logger.log('Circuit breaker closed - resuming normal message processing');
      this.healthStatus = 'healthy';
    });

    this.circuitBreaker.on('halfOpen', () => {
      this.logger.log('Circuit breaker half-open - testing message processing');
    });

    this.circuitBreaker.on('fallback', (error) => {
      this.logger.error(`Circuit breaker fallback triggered: ${error.message}`, error.stack);
    });
  }

  /**
   * Initializes the consumer when the module is initialized.
   * Subscribes to the configured topics and starts consuming messages.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initializeValidators();
      await this.subscribe();
      this.isConsuming = true;
      this.logger.log(`Subscribed to topics: ${this.getTopics().join(', ')}`);
    } catch (error) {
      this.healthStatus = 'unhealthy';
      this.logger.error(
        `Failed to initialize Kafka consumer: ${error.message}`,
        error.stack,
        this.constructor.name
      );
      // Re-throw to allow NestJS to handle the initialization failure
      throw new KafkaConnectionError(
        `Failed to initialize Kafka consumer: ${error.message}`,
        { cause: error }
      );
    }
  }

  /**
   * Cleans up resources when the module is destroyed.
   * Unsubscribes from topics and closes connections.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.isConsuming) {
        await this.pause();
        this.logger.log('Kafka consumer stopped and connections closed');
      }
    } catch (error) {
      this.logger.error(
        `Error during Kafka consumer cleanup: ${error.message}`,
        error.stack,
        this.constructor.name
      );
    }
  }

  /**
   * Subscribes to the configured Kafka topics.
   * This method handles both individual and batch message processing modes.
   */
  protected async subscribe(): Promise<void> {
    const topics = this.getTopics();
    const groupId = this.getGroupId();

    if (this.config.batchProcessing) {
      // Batch processing mode
      await this.kafkaService.consumeBatch(
        topics,
        groupId,
        this.handleBatchMessages.bind(this),
        this.config.batchOptions
      );
    } else {
      // Individual message processing mode
      for (const topic of topics) {
        await this.kafkaService.consume(
          topic,
          groupId,
          this.handleMessage.bind(this)
        );
      }
    }
  }

  /**
   * Pauses message consumption from all subscribed topics.
   * Can be used for graceful shutdown or temporary pause during high load.
   */
  async pause(): Promise<void> {
    try {
      const topics = this.getTopics();
      const groupId = this.getGroupId();

      for (const topic of topics) {
        await this.kafkaService.pauseConsumer(topic, groupId);
      }

      this.isConsuming = false;
      this.logger.log('Kafka consumer paused');
    } catch (error) {
      this.logger.error(
        `Failed to pause Kafka consumer: ${error.message}`,
        error.stack,
        this.constructor.name
      );
      throw error;
    }
  }

  /**
   * Resumes message consumption for all subscribed topics.
   * Used to restart consumption after a pause.
   */
  async resume(): Promise<void> {
    try {
      const topics = this.getTopics();
      const groupId = this.getGroupId();

      for (const topic of topics) {
        await this.kafkaService.resumeConsumer(topic, groupId);
      }

      this.isConsuming = true;
      this.logger.log('Kafka consumer resumed');
    } catch (error) {
      this.logger.error(
        `Failed to resume Kafka consumer: ${error.message}`,
        error.stack,
        this.constructor.name
      );
      throw error;
    }
  }

  /**
   * Returns the current health status of the consumer.
   * Used by health check endpoints to monitor consumer status.
   */
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; details?: Record<string, any> } {
    return {
      status: this.healthStatus,
      details: {
        isConsuming: this.isConsuming,
        circuitBreakerState: this.getCircuitBreakerState(),
        topics: this.getTopics(),
        groupId: this.getGroupId(),
      },
    };
  }

  /**
   * Handles an individual Kafka message.
   * This is the entry point for message processing that includes validation,
   * circuit breaking, and error handling.
   * 
   * @param message The Kafka message to process
   * @param key Optional message key
   * @param headers Optional message headers
   */
  private async handleMessage(message: any, key?: string, headers?: Record<string, string>): Promise<void> {
    const kafkaMessage: KafkaMessage = { message, key, headers };
    
    try {
      // Use circuit breaker to handle potential failures
      await this.circuitBreaker.fire(kafkaMessage);
    } catch (error) {
      // Circuit breaker is open or an unhandled error occurred
      this.logger.error(
        `Failed to process Kafka message: ${error.message}`,
        error.stack,
        this.constructor.name
      );

      // Send to DLQ if circuit breaker is open (service degraded)
      if (this.healthStatus !== 'healthy') {
        await this.handleProcessingFailure(kafkaMessage, error);
      }
    }
  }

  /**
   * Handles a batch of Kafka messages.
   * Processes multiple messages in a single call for better performance.
   * 
   * @param messages Array of messages to process
   * @param keys Optional array of message keys
   * @param headers Optional array of message headers
   */
  private async handleBatchMessages(
    messages: any[],
    keys?: string[],
    headers?: Record<string, string>[]
  ): Promise<void> {
    const kafkaMessages: KafkaMessage[] = messages.map((message, index) => ({
      message,
      key: keys?.[index],
      headers: headers?.[index],
    }));

    // Process each message in the batch
    const results = await Promise.allSettled(
      kafkaMessages.map(msg => this.circuitBreaker.fire(msg))
    );

    // Handle any failed messages
    const failedMessages = results
      .map((result, index) => (result.status === 'rejected' ? { error: result.reason, message: kafkaMessages[index] } : null))
      .filter(Boolean);

    if (failedMessages.length > 0) {
      this.logger.warn(`${failedMessages.length} of ${messages.length} batch messages failed processing`);
      
      // Send failed messages to DLQ
      await Promise.all(
        failedMessages.map(({ message, error }) => this.handleProcessingFailure(message, error))
      );
    }
  }

  /**
   * Safely processes a Kafka message with validation and error handling.
   * This method is wrapped by the circuit breaker.
   * 
   * @param kafkaMessage The Kafka message to process
   */
  private async processMessageSafely(kafkaMessage: KafkaMessage): Promise<void> {
    const { message, key, headers } = kafkaMessage;
    const retryCount = parseInt(headers?.['retry-count'] || '0', 10);
    const maxRetries = this.config.maxRetries || KAFKA_DEFAULT_RETRY_ATTEMPTS;

    try {
      // Transform the raw message into the expected event type
      const transformedMessage = await this.transformMessage(message);
      
      // Validate the message format
      await this.validateMessage(transformedMessage);
      
      // Process the validated message
      await this.processMessage(transformedMessage, key, headers);
      
      this.logger.debug(
        `Successfully processed message${key ? ` with key ${key}` : ''}`,
        { messageType: this.getEventType(transformedMessage) }
      );
    } catch (error) {
      // Handle different types of errors
      if (error instanceof EventValidationError) {
        this.logger.warn(
          `Invalid message format: ${error.message}`,
          { key, validationErrors: error.validationErrors }
        );
        
        // Validation errors are not retried - send directly to DLQ
        await this.sendToDlq(kafkaMessage, error, retryCount);
        return;
      }
      
      // For other errors, implement retry logic
      if (retryCount < maxRetries) {
        await this.retryMessage(kafkaMessage, error, retryCount);
      } else {
        this.logger.error(
          `Max retries (${maxRetries}) exceeded for message${key ? ` with key ${key}` : ''}`,
          error.stack
        );
        await this.sendToDlq(kafkaMessage, error, retryCount);
      }
      
      // Re-throw the error to be caught by the circuit breaker
      throw error;
    }
  }

  /**
   * Validates a message against the registered validators.
   * 
   * @param message The message to validate
   * @throws EventValidationError if validation fails
   */
  private async validateMessage(message: any): Promise<void> {
    // Skip validation if no validators are registered
    if (this.validators.length === 0) {
      return;
    }

    // Check if message is an object
    if (!message || typeof message !== 'object') {
      throw new EventValidationError('Message is not an object', {
        validationErrors: [{ property: 'message', constraints: { isObject: 'Message must be an object' } }],
      });
    }

    // Run all registered validators
    for (const validator of this.validators) {
      const result = await validator.validate(message);
      if (!result.isValid) {
        throw new EventValidationError('Message validation failed', {
          validationErrors: result.errors,
        });
      }
    }

    // If using class-validator, convert plain object to class instance and validate
    if (this.getEventClass()) {
      const eventClass = this.getEventClass();
      const eventInstance = plainToInstance(eventClass, message);
      const errors = await validate(eventInstance);

      if (errors.length > 0) {
        throw new EventValidationError('Class validation failed', {
          validationErrors: errors,
        });
      }
    }
  }

  /**
   * Handles a processing failure by sending the message to the dead letter queue.
   * 
   * @param kafkaMessage The failed Kafka message
   * @param error The error that occurred during processing
   */
  private async handleProcessingFailure(kafkaMessage: KafkaMessage, error: Error): Promise<void> {
    const { message, key, headers } = kafkaMessage;
    const retryCount = parseInt(headers?.['retry-count'] || '0', 10);

    try {
      await this.sendToDlq(kafkaMessage, error, retryCount);
    } catch (dlqError) {
      this.logger.error(
        `Failed to send message to DLQ: ${dlqError.message}`,
        dlqError.stack,
        this.constructor.name
      );
    }
  }

  /**
   * Sends a failed message to the dead letter queue.
   * 
   * @param kafkaMessage The failed Kafka message
   * @param error The error that occurred during processing
   * @param retryCount The number of retry attempts made
   */
  private async sendToDlq(kafkaMessage: KafkaMessage, error: Error, retryCount: number): Promise<void> {
    const { message, key, headers } = kafkaMessage;
    const dlqTopic = this.getDlqTopic();
    
    if (!dlqTopic) {
      this.logger.warn('No DLQ topic configured, failed message will be lost');
      return;
    }

    try {
      // Get the journey from the message if possible
      let journey = 'unknown';
      if (message && typeof message === 'object' && 'journey' in message) {
        journey = message.journey;
      }

      await sendToDlq({
        topic: dlqTopic,
        message,
        key,
        headers: {
          ...headers,
          'error-message': error.message,
          'error-type': error.constructor.name,
          'retry-count': retryCount.toString(),
          'failed-at': new Date().toISOString(),
          'consumer-group': this.getGroupId(),
          'source-topic': this.getTopics().join(','),
          'journey': journey,
        },
        error,
        kafkaService: this.kafkaService,
      });

      this.logger.log(`Message sent to DLQ topic ${dlqTopic}`);
    } catch (dlqError) {
      this.logger.error(
        `Failed to send message to DLQ: ${dlqError.message}`,
        dlqError.stack,
        this.constructor.name
      );
      throw dlqError;
    }
  }

  /**
   * Retries a failed message with exponential backoff.
   * 
   * @param kafkaMessage The failed Kafka message
   * @param error The error that occurred during processing
   * @param retryCount The current retry count
   */
  private async retryMessage(kafkaMessage: KafkaMessage, error: Error, retryCount: number): Promise<void> {
    const { message, key, headers } = kafkaMessage;
    const retryPolicy = createRetryPolicy(this.config.retryPolicy);
    const delay = retryPolicy.getDelay(retryCount, error);

    this.logger.log(
      `Retrying message${key ? ` with key ${key}` : ''} (attempt ${retryCount + 1}) after ${delay}ms`,
      { errorType: error.constructor.name }
    );

    // Wait for the calculated delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Republish the message to the original topic with updated retry count
    const retryTopic = this.getTopics()[0]; // Use the first topic for retries
    await this.kafkaService.produce({
      topic: retryTopic,
      messages: [
        {
          value: JSON.stringify(message),
          key: key,
          headers: {
            ...headers,
            'retry-count': (retryCount + 1).toString(),
            'last-error': error.message,
            'retry-timestamp': new Date().toISOString(),
          },
        },
      ],
    });
  }

  /**
   * Returns the current state of the circuit breaker.
   */
  private getCircuitBreakerState(): string {
    switch (this.circuitBreaker.status.state) {
      case CircuitBreakerState.CLOSED:
        return 'closed';
      case CircuitBreakerState.OPEN:
        return 'open';
      case CircuitBreakerState.HALF_OPEN:
        return 'half-open';
      default:
        return 'unknown';
    }
  }

  /**
   * Initializes validators for message validation.
   * Override this method to add custom validators.
   */
  protected async initializeValidators(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to add validators
  }

  /**
   * Transforms a raw message into the expected event type.
   * Override this method to implement custom transformation logic.
   * 
   * @param message The raw message to transform
   * @returns The transformed message
   */
  protected async transformMessage(message: any): Promise<T> {
    // Default implementation assumes message is already in the correct format
    // or needs to be parsed from JSON
    if (typeof message === 'string') {
      try {
        return JSON.parse(message) as T;
      } catch (error) {
        throw new EventValidationError('Failed to parse message as JSON', { cause: error });
      }
    }
    return message as T;
  }

  /**
   * Returns the class type for validation.
   * Override this method to provide a class for class-validator validation.
   */
  protected getEventClass(): any {
    // Default implementation returns null (no class validation)
    // Subclasses should override to provide a specific class
    return null;
  }

  /**
   * Returns the event type from a message.
   * Used for logging and monitoring.
   * 
   * @param message The message to extract the type from
   */
  protected getEventType(message: any): string {
    if (message && typeof message === 'object') {
      return message.type || message.eventType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Returns the dead letter queue topic for failed messages.
   * Override this method to provide a custom DLQ topic.
   */
  protected getDlqTopic(): string {
    // Default implementation uses the first topic with a .dlq suffix
    const topics = this.getTopics();
    if (topics.length > 0) {
      return `${topics[0]}.dlq`;
    }
    return null;
  }

  /**
   * Returns the consumer group ID.
   * Override this method to provide a custom group ID.
   */
  protected getGroupId(): string {
    return this.config.groupId || KAFKA_DEFAULT_GROUP_ID;
  }

  /**
   * Abstract method that must be implemented by subclasses.
   * Returns the list of topics to subscribe to.
   */
  protected abstract getTopics(): string[];

  /**
   * Abstract method that must be implemented by subclasses.
   * Processes a validated message.
   * 
   * @param message The validated message to process
   * @param key Optional message key
   * @param headers Optional message headers
   */
  protected abstract processMessage(message: T, key?: string, headers?: Record<string, string>): Promise<void>;
}