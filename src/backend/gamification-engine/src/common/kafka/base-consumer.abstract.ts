import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { LoggerService } from '@app/shared/logging/logger.service';

// Import interfaces from @austa/interfaces for type-safe event schema validation
import { GamificationEvent } from '@austa/interfaces/gamification/events';

/**
 * Abstract base class for Kafka consumers in the gamification engine.
 * Provides common functionality for consuming messages from Kafka topics,
 * including automatic topic subscription, error handling with retry attempts,
 * and dead letter queue routing for persistently failed messages.
 *
 * Features:
 * - Implements OnModuleInit lifecycle hook for automatic topic subscription
 * - Provides error handling with configurable retry attempts
 * - Implements exponential backoff retry mechanism with configurable parameters
 * - Enables dead letter queue routing for persistently failed messages
 * - Adds correlation ID tracking for distributed tracing
 * - Implements message validation with @austa/interfaces schema integration
 *
 * @abstract
 */
@Injectable()
export abstract class BaseKafkaConsumer implements OnModuleInit {
  protected readonly logger: Logger;

  /**
   * Maximum number of retry attempts for failed message processing
   * @protected
   */
  protected maxRetries = 3;

  /**
   * Initial delay in milliseconds for retry attempts
   * @protected
   */
  protected retryDelayMs = 1000;

  /**
   * Multiplier for exponential backoff between retry attempts
   * @protected
   */
  protected retryMultiplier = 2;

  /**
   * Creates an instance of BaseKafkaConsumer.
   * @param kafkaService - Service for interacting with Kafka
   * @param loggerService - Service for logging
   */
  constructor(
    protected readonly kafkaService: KafkaService,
    protected readonly loggerService: LoggerService,
  ) {
    this.logger = new Logger(this.constructor.name);
    this.loggerService.log(`${this.constructor.name} initialized`, this.constructor.name);
  }

  /**
   * Subscribes to Kafka topics on module initialization.
   * This method is called automatically by NestJS when the module is initialized.
   */
  async onModuleInit(): Promise<void> {
    const topics = this.getTopics();
    const groupId = this.getGroupId();

    for (const topic of topics) {
      await this.kafkaService.consume(
        topic,
        groupId,
        async (message: any, key?: string, headers?: Record<string, string>) => {
          const correlationId = headers?.['correlation-id'] || this.generateCorrelationId();
          await this.handleMessage(message, correlationId, 0);
        }
      );
      
      this.loggerService.log(`Subscribed to Kafka topic: ${topic}`, this.constructor.name);
    }
  }

  /**
   * Handles an incoming message from Kafka.
   * Validates the message, processes it, and handles any errors with retry logic.
   * 
   * @param message - The message to process
   * @param correlationId - Correlation ID for distributed tracing
   * @param retryCount - Current retry attempt count
   * @private
   */
  private async handleMessage(message: unknown, correlationId: string, retryCount: number): Promise<void> {
    try {
      // Validate message structure
      if (!this.validateMessage(message)) {
        this.loggerService.error(
          `Invalid message format: ${JSON.stringify(message)}`,
          '',
          this.constructor.name,
          { correlationId }
        );
        return;
      }

      // Process the validated message
      await this.processMessage(message as GamificationEvent, correlationId);
      
      this.loggerService.log(
        `Successfully processed message: ${this.getMessageIdentifier(message)}`,
        this.constructor.name,
        { correlationId }
      );
    } catch (error) {
      // Handle error with retry logic
      if (retryCount < this.maxRetries) {
        const nextRetryDelay = this.calculateRetryDelay(retryCount);
        const nextRetryCount = retryCount + 1;
        
        this.loggerService.warn(
          `Error processing message: ${this.getMessageIdentifier(message)}. ` +
          `Retrying (${nextRetryCount}/${this.maxRetries}) in ${nextRetryDelay}ms`,
          this.constructor.name,
          { correlationId, error: this.formatError(error), retryCount: nextRetryCount }
        );
        
        // Wait for the retry delay
        await new Promise(resolve => setTimeout(resolve, nextRetryDelay));
        
        // Retry processing the message
        await this.handleMessage(message, correlationId, nextRetryCount);
      } else {
        // Max retries exceeded, send to dead letter queue
        this.loggerService.error(
          `Max retries (${this.maxRetries}) exceeded for message: ${this.getMessageIdentifier(message)}. ` +
          `Sending to dead letter queue.`,
          this.formatError(error),
          this.constructor.name,
          { correlationId, retryCount }
        );
        
        await this.sendToDeadLetterQueue(message, correlationId, error);
      }
    }
  }

  /**
   * Sends a failed message to the dead letter queue.
   * 
   * @param message - The failed message
   * @param correlationId - Correlation ID for distributed tracing
   * @param error - The error that caused the failure
   * @private
   */
  private async sendToDeadLetterQueue(message: unknown, correlationId: string, error: unknown): Promise<void> {
    try {
      const deadLetterTopic = this.getDeadLetterTopic();
      const errorInfo = this.formatError(error);
      
      // Create a dead letter message with error information and metadata
      const deadLetterMessage = {
        originalMessage: message,
        error: errorInfo,
        timestamp: new Date().toISOString(),
        consumer: this.constructor.name,
      };
      
      // Send to dead letter topic
      await this.kafkaService.produce(
        deadLetterTopic,
        deadLetterMessage,
        undefined, // key
        { 'correlation-id': correlationId }
      );
      
      this.loggerService.log(
        `Message sent to dead letter queue: ${deadLetterTopic}`,
        this.constructor.name,
        { correlationId }
      );
    } catch (dlqError) {
      // If sending to DLQ fails, log the error but don't retry to avoid infinite loops
      this.loggerService.error(
        `Failed to send message to dead letter queue: ${this.formatError(dlqError)}`,
        '',
        this.constructor.name,
        { correlationId }
      );
    }
  }

  /**
   * Calculates the delay for the next retry attempt using exponential backoff.
   * 
   * @param retryCount - Current retry attempt count
   * @returns Delay in milliseconds
   * @private
   */
  private calculateRetryDelay(retryCount: number): number {
    return this.retryDelayMs * Math.pow(this.retryMultiplier, retryCount);
  }

  /**
   * Formats an error object for logging.
   * 
   * @param error - The error to format
   * @returns Formatted error string
   * @private
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.message}\n${error.stack || ''}`;
    }
    return String(error);
  }

  /**
   * Generates a correlation ID for distributed tracing.
   * 
   * @returns Generated correlation ID
   * @private
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Gets an identifier for a message for logging purposes.
   * 
   * @param message - The message
   * @returns Message identifier
   * @private
   */
  private getMessageIdentifier(message: unknown): string {
    if (message && typeof message === 'object') {
      // Try to extract meaningful identifiers from the message
      const type = message.type || 'unknown-type';
      const userId = message.userId || 'unknown-user';
      return `${type} for user ${userId}`;
    }
    return 'unknown-message';
  }

  /**
   * Validates that a message has the required structure.
   * Default implementation checks for basic structure of a GamificationEvent.
   * Override in subclasses for more specific validation.
   * 
   * @param message - The message to validate
   * @returns Whether the message is valid
   * @protected
   */
  protected validateMessage(message: unknown): boolean {
    // Basic validation for GamificationEvent structure
    if (!message || typeof message !== 'object') return false;
    
    // Check for required fields in GamificationEvent
    if (!message.type || typeof message.type !== 'string') return false;
    if (!message.userId || typeof message.userId !== 'string') return false;
    if (!message.data || typeof message.data !== 'object') return false;
    
    // Additional validation can be implemented in subclasses
    return true;
  }

  /**
   * Processes a validated message.
   * This method must be implemented by subclasses.
   * 
   * @param message - The validated message to process (typically a GamificationEvent)
   * @param correlationId - Correlation ID for distributed tracing
   * @abstract
   */
  protected abstract processMessage(message: GamificationEvent, correlationId: string): Promise<void>;

  /**
   * Gets the list of Kafka topics to subscribe to.
   * This method must be implemented by subclasses.
   * 
   * @returns List of topics
   * @abstract
   */
  protected abstract getTopics(): string[];

  /**
   * Gets the consumer group ID for Kafka subscription.
   * This method must be implemented by subclasses.
   * 
   * @returns Consumer group ID
   * @abstract
   */
  protected abstract getGroupId(): string;

  /**
   * Gets the dead letter topic for failed messages.
   * This method must be implemented by subclasses.
   * 
   * @returns Dead letter topic
   * @abstract
   */
  protected abstract getDeadLetterTopic(): string;
}