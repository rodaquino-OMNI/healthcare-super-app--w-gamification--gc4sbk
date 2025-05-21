import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaMessage } from 'kafkajs';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from '@app/shared/kafka/kafka.service';
import { TransientException } from '../../common/exceptions/transient.exception';

/**
 * Interface for retry strategy configuration options
 */
export interface RetryStrategyOptions {
  /** Base delay in milliseconds for the first retry attempt */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between retry attempts */
  maxDelayMs: number;
  /** Maximum number of retry attempts before sending to dead-letter queue */
  maxRetries: number;
  /** Jitter factor (0-1) to randomize delay and prevent thundering herd */
  jitterFactor: number;
  /** Dead letter queue topic name */
  deadLetterQueueTopic: string;
}

/**
 * Interface for retry metadata stored with each message
 */
export interface RetryMetadata {
  /** Number of retry attempts made so far */
  attemptCount: number;
  /** Original topic the message was published to */
  originalTopic: string;
  /** Timestamp when the message was first received */
  firstAttemptTimestamp: number;
  /** Timestamp of the most recent retry attempt */
  lastAttemptTimestamp: number;
  /** Error messages from previous retry attempts */
  errorHistory: string[];
  /** Original message headers */
  originalHeaders: Record<string, any>;
}

/**
 * Enum representing the status of a retry operation
 */
export enum RetryStatus {
  /** The operation is scheduled for retry */
  PENDING = 'PENDING',
  /** The operation is currently being retried */
  IN_PROGRESS = 'IN_PROGRESS',
  /** The operation succeeded after one or more retries */
  SUCCEEDED = 'SUCCEEDED',
  /** The operation failed but is eligible for another retry */
  FAILED = 'FAILED',
  /** The operation failed and has exhausted all retry attempts */
  EXHAUSTED = 'EXHAUSTED',
}

/**
 * Implementation of an exponential backoff retry strategy for Kafka message consumption
 * in the gamification engine. This strategy calculates retry intervals with jitter,
 * tracks retry attempts, and handles dead-letter queue integration for exhausted retries.
 */
@Injectable()
export class KafkaRetryStrategy {
  private readonly logger = new Logger(KafkaRetryStrategy.name);
  private readonly options: RetryStrategyOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly kafkaService: KafkaService,
  ) {
    // Load configuration with defaults
    this.options = {
      baseDelayMs: this.configService.get<number>('gamificationEngine.kafka.retry.baseDelayMs', 1000),
      maxDelayMs: this.configService.get<number>('gamificationEngine.kafka.retry.maxDelayMs', 60000),
      maxRetries: this.configService.get<number>('gamificationEngine.kafka.retry.maxRetries', 5),
      jitterFactor: this.configService.get<number>('gamificationEngine.kafka.retry.jitterFactor', 0.2),
      deadLetterQueueTopic: this.configService.get<string>(
        'gamificationEngine.kafka.retry.deadLetterQueueTopic',
        'gamification.events.dlq'
      ),
    };

    this.loggerService.log(
      'Initialized Kafka retry strategy',
      {
        baseDelayMs: this.options.baseDelayMs,
        maxDelayMs: this.options.maxDelayMs,
        maxRetries: this.options.maxRetries,
        jitterFactor: this.options.jitterFactor,
        deadLetterQueueTopic: this.options.deadLetterQueueTopic,
      },
      KafkaRetryStrategy.name
    );
  }

  /**
   * Determines if a message should be retried based on the error and retry metadata
   * @param error The error that occurred during message processing
   * @param metadata The retry metadata for the message
   * @returns A boolean indicating if the message should be retried
   */
  public shouldRetry(error: Error, metadata: RetryMetadata): boolean {
    // Don't retry if we've exceeded the maximum retry count
    if (metadata.attemptCount >= this.options.maxRetries) {
      return false;
    }

    // Always retry transient errors
    if (error instanceof TransientException) {
      return true;
    }

    // Check for specific error types that should be retried
    // This can be expanded based on the application's needs
    const retryableErrors = [
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'EHOSTUNREACH',
      'EAI_AGAIN',
      'NetworkError',
      'ConnectionError',
      'RequestTimeoutError',
      'KafkaJSConnectionError',
      'KafkaJSRequestTimeoutError',
      'KafkaJSBrokerNotFound',
    ];

    // Check if the error name or message indicates a retryable error
    return retryableErrors.some(retryableError => 
      error.name.includes(retryableError) || 
      error.message.includes(retryableError)
    );
  }

  /**
   * Calculates the next retry delay using exponential backoff with jitter
   * @param attemptCount The current retry attempt count
   * @returns The delay in milliseconds before the next retry attempt
   */
  public calculateRetryDelay(attemptCount: number): number {
    // Calculate exponential backoff: baseDelay * 2^attemptCount
    const exponentialDelay = this.options.baseDelayMs * Math.pow(2, attemptCount);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, this.options.maxDelayMs);
    
    // Apply jitter to prevent thundering herd problem
    // Formula: delay = cappedDelay * (1 ± jitterFactor)
    const jitterMultiplier = 1 - this.options.jitterFactor + (Math.random() * this.options.jitterFactor * 2);
    
    // Calculate final delay with jitter
    const finalDelay = Math.floor(cappedDelay * jitterMultiplier);
    
    return finalDelay;
  }

  /**
   * Extracts retry metadata from a Kafka message or initializes new metadata
   * @param message The Kafka message
   * @param topic The topic the message was consumed from
   * @returns The retry metadata
   */
  public extractRetryMetadata(message: KafkaMessage, topic: string): RetryMetadata {
    try {
      // Check if the message has retry metadata in the headers
      if (message.headers && message.headers['retry-metadata']) {
        const metadataStr = message.headers['retry-metadata'].toString();
        return JSON.parse(metadataStr) as RetryMetadata;
      }
    } catch (error) {
      this.loggerService.warn(
        'Failed to parse retry metadata from message headers, initializing new metadata',
        { error: error.message, topic },
        KafkaRetryStrategy.name
      );
    }

    // Initialize new retry metadata
    return {
      attemptCount: 0,
      originalTopic: topic,
      firstAttemptTimestamp: Date.now(),
      lastAttemptTimestamp: Date.now(),
      errorHistory: [],
      originalHeaders: this.extractOriginalHeaders(message),
    };
  }

  /**
   * Extracts original headers from a Kafka message
   * @param message The Kafka message
   * @returns The original headers as a record
   */
  private extractOriginalHeaders(message: KafkaMessage): Record<string, any> {
    const headers: Record<string, any> = {};
    
    if (message.headers) {
      Object.entries(message.headers).forEach(([key, value]) => {
        // Skip retry-specific headers
        if (!key.startsWith('retry-')) {
          headers[key] = value.toString();
        }
      });
    }
    
    return headers;
  }

  /**
   * Updates retry metadata for a failed message and schedules a retry
   * @param message The Kafka message that failed processing
   * @param topic The topic the message was consumed from
   * @param error The error that occurred during processing
   * @returns A promise that resolves to the retry status
   */
  public async handleFailedMessage(
    message: KafkaMessage, 
    topic: string, 
    error: Error
  ): Promise<RetryStatus> {
    // Extract or initialize retry metadata
    const metadata = this.extractRetryMetadata(message, topic);
    
    // Update retry metadata
    metadata.attemptCount += 1;
    metadata.lastAttemptTimestamp = Date.now();
    metadata.errorHistory.push(error.message);
    
    // Check if we should retry
    if (this.shouldRetry(error, metadata)) {
      // Calculate delay for next retry
      const retryDelay = this.calculateRetryDelay(metadata.attemptCount);
      
      // Log retry attempt
      this.loggerService.log(
        `Scheduling retry attempt ${metadata.attemptCount} of ${this.options.maxRetries} after ${retryDelay}ms`,
        {
          topic,
          messageKey: message.key?.toString(),
          attemptCount: metadata.attemptCount,
          error: error.message,
          retryDelay,
        },
        KafkaRetryStrategy.name
      );
      
      // Schedule retry after delay
      setTimeout(async () => {
        try {
          // Prepare headers with retry metadata
          const headers = {
            ...this.extractOriginalHeaders(message),
            'retry-metadata': Buffer.from(JSON.stringify(metadata)),
            'retry-attempt': Buffer.from(metadata.attemptCount.toString()),
            'retry-original-topic': Buffer.from(metadata.originalTopic),
          };
          
          // Send message back to original topic for retry
          await this.kafkaService.send({
            topic: metadata.originalTopic,
            messages: [
              {
                key: message.key,
                value: message.value,
                headers,
              },
            ],
          });
          
          this.loggerService.log(
            `Retry attempt ${metadata.attemptCount} sent to topic ${metadata.originalTopic}`,
            {
              topic: metadata.originalTopic,
              messageKey: message.key?.toString(),
              attemptCount: metadata.attemptCount,
            },
            KafkaRetryStrategy.name
          );
        } catch (retryError) {
          this.loggerService.error(
            `Failed to send retry attempt ${metadata.attemptCount}`,
            {
              error: retryError.message,
              topic: metadata.originalTopic,
              messageKey: message.key?.toString(),
              attemptCount: metadata.attemptCount,
            },
            KafkaRetryStrategy.name
          );
          
          // If we fail to send the retry, send to DLQ
          await this.sendToDeadLetterQueue(message, metadata, retryError);
        }
      }, retryDelay);
      
      return RetryStatus.PENDING;
    } else {
      // We've exhausted retries, send to dead letter queue
      await this.sendToDeadLetterQueue(message, metadata, error);
      return RetryStatus.EXHAUSTED;
    }
  }

  /**
   * Sends a message to the dead letter queue after retry attempts are exhausted
   * @param message The original Kafka message
   * @param metadata The retry metadata
   * @param error The last error that occurred
   * @returns A promise that resolves when the message is sent to the DLQ
   */
  private async sendToDeadLetterQueue(
    message: KafkaMessage, 
    metadata: RetryMetadata, 
    error: Error
  ): Promise<void> {
    try {
      // Prepare DLQ message with comprehensive metadata
      const dlqMessage = {
        originalMessage: {
          key: message.key?.toString(),
          value: message.value?.toString(),
          headers: this.extractOriginalHeaders(message),
          partition: message.partition,
          offset: message.offset,
          timestamp: message.timestamp,
        },
        retryMetadata: metadata,
        finalError: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        processInfo: {
          serviceName: 'gamification-engine',
          timestamp: new Date().toISOString(),
          nodeEnv: process.env.NODE_ENV || 'development',
        },
      };
      
      // Send to DLQ topic
      await this.kafkaService.send({
        topic: this.options.deadLetterQueueTopic,
        messages: [
          {
            // Use original key if available, or generate a new one
            key: message.key || Buffer.from(`dlq-${Date.now()}`),
            // Stringify the entire DLQ message with all metadata
            value: Buffer.from(JSON.stringify(dlqMessage)),
            headers: {
              'dlq-original-topic': Buffer.from(metadata.originalTopic),
              'dlq-error-type': Buffer.from(error.name),
              'dlq-retry-count': Buffer.from(metadata.attemptCount.toString()),
              'dlq-timestamp': Buffer.from(Date.now().toString()),
            },
          },
        ],
      });
      
      this.loggerService.warn(
        `Message sent to dead letter queue after ${metadata.attemptCount} failed attempts`,
        {
          originalTopic: metadata.originalTopic,
          dlqTopic: this.options.deadLetterQueueTopic,
          messageKey: message.key?.toString(),
          attemptCount: metadata.attemptCount,
          finalError: error.message,
          errorHistory: metadata.errorHistory,
        },
        KafkaRetryStrategy.name
      );
    } catch (dlqError) {
      // Critical failure - we couldn't even send to the DLQ
      this.loggerService.error(
        'Failed to send message to dead letter queue',
        {
          originalTopic: metadata.originalTopic,
          dlqTopic: this.options.deadLetterQueueTopic,
          messageKey: message.key?.toString(),
          attemptCount: metadata.attemptCount,
          dlqError: dlqError.message,
          originalError: error.message,
        },
        KafkaRetryStrategy.name
      );
    }
  }
}