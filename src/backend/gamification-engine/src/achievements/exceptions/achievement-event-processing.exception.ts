import { HttpStatus } from '@nestjs/common';
import { SystemException } from '@app/common/exceptions/system.exception';
import { ErrorType } from '@app/common/exceptions/error-types.enum';
import { RetryableError } from '@app/common/interfaces/error.interface';
import { KafkaMessage } from '@app/events/interfaces/kafka.interface';

/**
 * Interface for achievement event processing metadata
 */
export interface AchievementEventProcessingMetadata {
  /** The event ID or correlation ID */
  eventId: string;
  /** The Kafka topic the event was consumed from */
  topic: string;
  /** The partition the event was consumed from */
  partition?: number;
  /** The offset of the event in the Kafka topic */
  offset?: string;
  /** The journey type (health, care, plan) */
  journeyType: string;
  /** The processing stage where the failure occurred */
  processingStage: AchievementProcessingStage;
  /** The original event payload (sanitized for sensitive data) */
  eventPayload?: Record<string, any>;
  /** Error details from the original exception */
  originalError?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Interface for retry information
 */
export interface RetryInfo {
  /** Current retry attempt count */
  attemptCount: number;
  /** Maximum number of retry attempts allowed */
  maxAttempts: number;
  /** Delay in milliseconds before the next retry attempt */
  nextRetryDelayMs: number;
  /** Whether the event should be sent to the dead letter queue */
  sendToDlq: boolean;
  /** The dead letter queue topic name */
  dlqTopic?: string;
}

/**
 * Enum for achievement processing stages
 */
export enum AchievementProcessingStage {
  /** Event validation stage */
  VALIDATION = 'validation',
  /** Event deserialization stage */
  DESERIALIZATION = 'deserialization',
  /** Achievement rule evaluation stage */
  RULE_EVALUATION = 'rule_evaluation',
  /** Achievement unlocking stage */
  ACHIEVEMENT_UNLOCKING = 'achievement_unlocking',
  /** Notification stage */
  NOTIFICATION = 'notification',
  /** Database persistence stage */
  PERSISTENCE = 'persistence',
  /** Unknown or unspecified stage */
  UNKNOWN = 'unknown'
}

/**
 * Exception class for handling failures in achievement event processing.
 * This system/transient error includes event details, processing stage, and retry information.
 * It's thrown when Kafka event processing fails within the achievement consumers.
 * The exception supports the retry and dead letter queue mechanisms.
 */
export class AchievementEventProcessingException extends SystemException implements RetryableError {
  /** Retry information */
  private readonly retryInfo: RetryInfo;
  
  /** Event processing metadata */
  private readonly eventMetadata: AchievementEventProcessingMetadata;

  /**
   * Creates a new instance of AchievementEventProcessingException
   * 
   * @param message - Error message
   * @param metadata - Event processing metadata
   * @param retryInfo - Retry information
   * @param cause - Original error that caused this exception
   */
  constructor(
    message: string,
    metadata: AchievementEventProcessingMetadata,
    retryInfo: RetryInfo,
    cause?: Error
  ) {
    super(
      message,
      ErrorType.ACHIEVEMENT_EVENT_PROCESSING_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      {
        ...metadata,
        retryAttempt: retryInfo.attemptCount,
        maxRetries: retryInfo.maxAttempts,
        sendToDlq: retryInfo.sendToDlq
      },
      cause
    );

    this.eventMetadata = metadata;
    this.retryInfo = retryInfo;

    // Ensure prototype chain is properly maintained
    Object.setPrototypeOf(this, AchievementEventProcessingException.prototype);
  }

  /**
   * Gets the retry information for this exception
   * 
   * @returns Retry information
   */
  getRetryInfo(): RetryInfo {
    return this.retryInfo;
  }

  /**
   * Gets the event metadata for this exception
   * 
   * @returns Event metadata
   */
  getEventMetadata(): AchievementEventProcessingMetadata {
    return this.eventMetadata;
  }

  /**
   * Determines if the event should be retried
   * 
   * @returns True if the event should be retried, false otherwise
   */
  shouldRetry(): boolean {
    return this.retryInfo.attemptCount < this.retryInfo.maxAttempts;
  }

  /**
   * Determines if the event should be sent to the dead letter queue
   * 
   * @returns True if the event should be sent to the DLQ, false otherwise
   */
  shouldSendToDlq(): boolean {
    return this.retryInfo.sendToDlq || this.retryInfo.attemptCount >= this.retryInfo.maxAttempts;
  }

  /**
   * Gets the dead letter queue topic for this event
   * 
   * @returns The DLQ topic name or undefined if not configured
   */
  getDlqTopic(): string | undefined {
    return this.retryInfo.dlqTopic;
  }

  /**
   * Gets the delay in milliseconds before the next retry attempt
   * 
   * @returns Delay in milliseconds
   */
  getNextRetryDelayMs(): number {
    return this.retryInfo.nextRetryDelayMs;
  }

  /**
   * Creates a new instance with incremented retry count
   * 
   * @param nextRetryDelayMs - Optional override for the next retry delay
   * @returns A new exception instance with updated retry information
   */
  incrementRetryCount(nextRetryDelayMs?: number): AchievementEventProcessingException {
    const newRetryInfo: RetryInfo = {
      ...this.retryInfo,
      attemptCount: this.retryInfo.attemptCount + 1,
      nextRetryDelayMs: nextRetryDelayMs ?? this.calculateNextRetryDelay(),
      sendToDlq: this.retryInfo.attemptCount + 1 >= this.retryInfo.maxAttempts
    };

    return new AchievementEventProcessingException(
      this.message,
      this.eventMetadata,
      newRetryInfo,
      this.cause
    );
  }

  /**
   * Calculates the next retry delay using exponential backoff with jitter
   * 
   * @returns Delay in milliseconds for the next retry attempt
   */
  private calculateNextRetryDelay(): number {
    // Base delay of 1 second
    const baseDelayMs = 1000;
    
    // Calculate exponential backoff: baseDelay * 2^attemptCount
    const exponentialDelay = baseDelayMs * Math.pow(2, this.retryInfo.attemptCount);
    
    // Add jitter (random value between 0 and 1000ms) to prevent thundering herd
    const jitter = Math.floor(Math.random() * 1000);
    
    // Cap maximum delay at 1 minute
    const maxDelayMs = 60000;
    
    return Math.min(exponentialDelay + jitter, maxDelayMs);
  }

  /**
   * Factory method to create an exception from a Kafka message and error
   * 
   * @param message - Error message
   * @param kafkaMessage - The Kafka message that failed processing
   * @param stage - The processing stage where the failure occurred
   * @param journeyType - The journey type (health, care, plan)
   * @param error - The original error
   * @param retryAttempt - Current retry attempt (defaults to 0)
   * @param maxRetries - Maximum retry attempts (defaults to 3)
   * @param dlqTopic - Dead letter queue topic (optional)
   * @returns A new AchievementEventProcessingException
   */
  static fromKafkaMessage(
    message: string,
    kafkaMessage: KafkaMessage,
    stage: AchievementProcessingStage,
    journeyType: string,
    error: Error,
    retryAttempt = 0,
    maxRetries = 3,
    dlqTopic?: string
  ): AchievementEventProcessingException {
    // Extract event ID from headers or generate one
    const eventId = kafkaMessage.headers?.['event-id'] 
      ? Buffer.from(kafkaMessage.headers['event-id']).toString()
      : `unknown-${Date.now()}`;

    // Safely parse and sanitize the event payload
    let eventPayload: Record<string, any> | undefined;
    try {
      if (kafkaMessage.value) {
        const rawPayload = typeof kafkaMessage.value === 'string'
          ? JSON.parse(kafkaMessage.value)
          : Buffer.isBuffer(kafkaMessage.value)
            ? JSON.parse(kafkaMessage.value.toString('utf-8'))
            : kafkaMessage.value;
            
        // Basic sanitization - remove potentially sensitive fields
        const sensitiveFields = ['password', 'token', 'secret', 'credential', 'ssn', 'socialSecurityNumber'];
        eventPayload = Object.entries(rawPayload).reduce((acc, [key, value]) => {
          if (!sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
      }
    } catch (e) {
      eventPayload = { parseError: 'Failed to parse event payload' };
    }

    // Create metadata
    const metadata: AchievementEventProcessingMetadata = {
      eventId,
      topic: kafkaMessage.topic,
      partition: kafkaMessage.partition,
      offset: kafkaMessage.offset?.toString(),
      journeyType,
      processingStage: stage,
      eventPayload,
      originalError: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    };

    // Calculate next retry delay using exponential backoff
    const baseDelayMs = 1000;
    const nextRetryDelayMs = baseDelayMs * Math.pow(2, retryAttempt) + Math.floor(Math.random() * 1000);

    // Create retry info
    const retryInfo: RetryInfo = {
      attemptCount: retryAttempt,
      maxAttempts: maxRetries,
      nextRetryDelayMs,
      sendToDlq: retryAttempt >= maxRetries,
      dlqTopic
    };

    return new AchievementEventProcessingException(message, metadata, retryInfo, error);
  }
}