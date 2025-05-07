import { Injectable, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@app/shared/logging/logger.service';
import { KafkaService } from './kafka.service';
import { KafkaModuleOptions } from '../kafka.module';

/**
 * Retry policy types supported by the retry service
 */
export enum RetryPolicyType {
  FIXED_INTERVAL = 'FIXED_INTERVAL',
  EXPONENTIAL_BACKOFF = 'EXPONENTIAL_BACKOFF',
}

/**
 * Status of a retry operation
 */
export enum RetryStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  EXHAUSTED = 'EXHAUSTED',
}

/**
 * Options for retry operations
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries: number;
  
  /**
   * Initial delay between retries in milliseconds
   */
  initialDelay: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelay?: number;
  
  /**
   * Type of retry policy to use
   */
  policyType: RetryPolicyType;
  
  /**
   * Factor to multiply the delay by for exponential backoff
   */
  backoffFactor?: number;
  
  /**
   * Whether to add jitter to the delay to prevent thundering herd
   */
  jitter?: boolean;
}

/**
 * Information about a message being retried
 */
export interface RetryableMessage {
  /**
   * Topic the message was originally sent to
   */
  topic: string;
  
  /**
   * Original message payload
   */
  message: any;
  
  /**
   * Optional message key
   */
  key?: string;
  
  /**
   * Optional message headers
   */
  headers?: Record<string, string>;
  
  /**
   * Number of retry attempts so far
   */
  attempts: number;
  
  /**
   * Error that caused the retry
   */
  error: Error;
  
  /**
   * Timestamp when the message was first received
   */
  originalTimestamp: Date;
  
  /**
   * Timestamp when the next retry should be attempted
   */
  nextRetryTime: Date;
  
  /**
   * Current status of the retry operation
   */
  status: RetryStatus;
}

/**
 * Service for handling retry logic for failed Kafka operations
 * 
 * Implements multiple retry policies (fixed interval, exponential backoff)
 * and manages the retry queue for failed messages.
 */
@Injectable()
export class KafkaRetryService implements OnModuleInit {
  private retryQueue: Map<string, RetryableMessage> = new Map();
  private retryInterval: NodeJS.Timeout;
  private readonly defaultRetryOptions: RetryOptions;
  
  /**
   * Creates an instance of KafkaRetryService
   * 
   * @param kafkaService Core Kafka service for broker communication
   * @param logger Logger service for structured logging
   * @param options Kafka module options
   */
  constructor(
    private readonly kafkaService: KafkaService,
    private readonly logger: LoggerService,
    private readonly options: KafkaModuleOptions,
  ) {
    this.defaultRetryOptions = {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.retryInterval || 1000,
      maxDelay: 30000,
      policyType: RetryPolicyType.EXPONENTIAL_BACKOFF,
      backoffFactor: 2,
      jitter: true,
    };
    
    this.logger.log('KafkaRetryService initialized', 'KafkaRetryService');
  }

  /**
   * Starts the retry processor on module initialization
   */
  async onModuleInit(): Promise<void> {
    this.startRetryProcessor();
    this.logger.log('Retry processor started', 'KafkaRetryService');
  }

  /**
   * Schedules a message for retry
   * 
   * @param topic Topic the message was originally sent to
   * @param message Original message payload
   * @param error Error that caused the retry
   * @param key Optional message key
   * @param headers Optional message headers
   * @param options Optional retry options
   * @returns The created retryable message
   */
  scheduleRetry(
    topic: string,
    message: any,
    error: Error,
    key?: string,
    headers?: Record<string, string>,
    options?: Partial<RetryOptions>,
  ): RetryableMessage {
    const retryOptions = { ...this.defaultRetryOptions, ...options };
    const messageId = this.generateMessageId(topic, message, key);
    
    // Check if message is already in retry queue
    const existingMessage = this.retryQueue.get(messageId);
    if (existingMessage) {
      existingMessage.attempts += 1;
      existingMessage.error = error;
      existingMessage.nextRetryTime = this.calculateNextRetryTime(
        existingMessage.attempts,
        retryOptions,
      );
      existingMessage.status = RetryStatus.PENDING;
      
      this.logger.log(
        `Updated retry for message ${messageId} (attempt ${existingMessage.attempts}/${retryOptions.maxRetries})`,
        'KafkaRetryService',
      );
      
      return existingMessage;
    }
    
    // Create new retryable message
    const retryableMessage: RetryableMessage = {
      topic,
      message,
      key,
      headers: { ...headers, 'x-retry': 'true' },
      attempts: 1,
      error,
      originalTimestamp: new Date(),
      nextRetryTime: this.calculateNextRetryTime(1, retryOptions),
      status: RetryStatus.PENDING,
    };
    
    this.retryQueue.set(messageId, retryableMessage);
    
    this.logger.log(
      `Scheduled retry for message to topic ${topic} (attempt 1/${retryOptions.maxRetries})`,
      'KafkaRetryService',
    );
    
    return retryableMessage;
  }

  /**
   * Starts the retry processor that periodically checks for messages to retry
   */
  private startRetryProcessor(): void {
    // Clear any existing interval
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
    }
    
    // Process retries every second
    this.retryInterval = setInterval(() => this.processRetries(), 1000);
  }

  /**
   * Processes all pending retries that are due
   */
  private async processRetries(): Promise<void> {
    const now = new Date();
    const messagesToRetry: [string, RetryableMessage][] = [];
    
    // Find messages that are due for retry
    for (const [messageId, message] of this.retryQueue.entries()) {
      if (message.status === RetryStatus.PENDING && message.nextRetryTime <= now) {
        messagesToRetry.push([messageId, message]);
      }
    }
    
    if (messagesToRetry.length === 0) {
      return;
    }
    
    this.logger.log(`Processing ${messagesToRetry.length} retries`, 'KafkaRetryService');
    
    // Process each message
    for (const [messageId, message] of messagesToRetry) {
      await this.retryMessage(messageId, message);
    }
  }

  /**
   * Retries a single message
   * 
   * @param messageId ID of the message
   * @param message Retryable message
   */
  private async retryMessage(messageId: string, message: RetryableMessage): Promise<void> {
    try {
      message.status = RetryStatus.IN_PROGRESS;
      
      this.logger.log(
        `Retrying message to topic ${message.topic} (attempt ${message.attempts})`,
        'KafkaRetryService',
      );
      
      // Add retry metadata to headers
      const retryHeaders = {
        ...message.headers,
        'x-retry-count': String(message.attempts),
        'x-original-timestamp': message.originalTimestamp.toISOString(),
      };
      
      await this.kafkaService.produce(
        message.topic,
        message.message,
        message.key,
        retryHeaders,
      );
      
      message.status = RetryStatus.SUCCEEDED;
      this.logger.log(`Successfully retried message to topic ${message.topic}`, 'KafkaRetryService');
      
      // Remove from retry queue on success
      this.retryQueue.delete(messageId);
    } catch (error) {
      message.error = error;
      
      // Check if we've exceeded max retries
      if (message.attempts >= this.defaultRetryOptions.maxRetries) {
        message.status = RetryStatus.EXHAUSTED;
        
        this.logger.warn(
          `Max retries (${this.defaultRetryOptions.maxRetries}) exceeded for message to topic ${message.topic}`,
          'KafkaRetryService',
        );
        
        // Move to DLQ (handled by DLQ service)
        this.retryQueue.delete(messageId);
        this.emitRetryExhausted(message);
      } else {
        message.status = RetryStatus.FAILED;
        message.attempts += 1;
        message.nextRetryTime = this.calculateNextRetryTime(
          message.attempts,
          this.defaultRetryOptions,
        );
        
        this.logger.warn(
          `Retry failed for message to topic ${message.topic}: ${error.message}. ` +
          `Will retry again in ${this.getDelayInSeconds(message.nextRetryTime)}s`,
          'KafkaRetryService',
        );
      }
    }
  }

  /**
   * Calculates the next retry time based on the retry policy
   * 
   * @param attempt Current attempt number
   * @param options Retry options
   * @returns Date when the next retry should be attempted
   */
  private calculateNextRetryTime(attempt: number, options: RetryOptions): Date {
    let delay: number;
    
    if (options.policyType === RetryPolicyType.EXPONENTIAL_BACKOFF) {
      // Calculate exponential backoff: initialDelay * (backoffFactor ^ (attempt - 1))
      const backoffFactor = options.backoffFactor || 2;
      delay = options.initialDelay * Math.pow(backoffFactor, attempt - 1);
      
      // Apply maximum delay cap if specified
      if (options.maxDelay && delay > options.maxDelay) {
        delay = options.maxDelay;
      }
    } else {
      // Fixed interval
      delay = options.initialDelay;
    }
    
    // Add jitter to prevent thundering herd problem
    if (options.jitter) {
      // Add random jitter between -25% and +25%
      const jitterFactor = 0.25;
      const jitterAmount = delay * jitterFactor;
      delay = delay - jitterAmount + (Math.random() * jitterAmount * 2);
    }
    
    return new Date(Date.now() + delay);
  }

  /**
   * Generates a unique ID for a message
   * 
   * @param topic Topic the message was sent to
   * @param message Message payload
   * @param key Optional message key
   * @returns Unique message ID
   */
  private generateMessageId(topic: string, message: any, key?: string): string {
    let messageString: string;
    
    if (typeof message === 'object' && message !== null) {
      // For objects, use a stable JSON representation
      const sortedMessage = this.sortObjectKeys(message);
      messageString = JSON.stringify(sortedMessage);
    } else {
      messageString = String(message);
    }
    
    // Create a hash of the message content
    const hash = this.simpleHash(messageString);
    
    return `${topic}:${key || 'nokey'}:${hash}`;
  }

  /**
   * Creates a simple hash of a string
   * 
   * @param str String to hash
   * @returns Hash value
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Sorts object keys to create a stable JSON representation
   * 
   * @param obj Object to sort keys for
   * @returns Object with sorted keys
   */
  private sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }
    
    const sortedObj: any = {};
    const sortedKeys = Object.keys(obj).sort();
    
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sortedObj;
  }

  /**
   * Gets the delay in seconds until the next retry
   * 
   * @param nextRetryTime Next retry time
   * @returns Delay in seconds
   */
  private getDelayInSeconds(nextRetryTime: Date): number {
    const delayMs = nextRetryTime.getTime() - Date.now();
    return Math.round(delayMs / 1000);
  }

  /**
   * Emits an event when retries are exhausted for a message
   * 
   * @param message Retryable message that has exhausted retries
   */
  private emitRetryExhausted(message: RetryableMessage): void {
    // This will be handled by the DLQ service
    const event = {
      type: 'RETRY_EXHAUSTED',
      topic: message.topic,
      message: message.message,
      key: message.key,
      headers: message.headers,
      error: {
        message: message.error.message,
        stack: message.error.stack,
        name: message.error.name,
      },
      attempts: message.attempts,
      originalTimestamp: message.originalTimestamp,
      timestamp: new Date(),
    };
    
    // Emit event for DLQ service to pick up
    process.nextTick(() => {
      process.emit('kafka:retry:exhausted', event);
    });
  }
}