import { ERROR_CODES, ERROR_MESSAGES, ERROR_SEVERITY } from '../../../src/constants/errors.constants';
import { KafkaError, EventValidationError, ProducerError, ConsumerError, MessageSerializationError } from '../../../src/errors/kafka.errors';

/**
 * Mock implementation of KafkaError for testing.
 * Extends the real KafkaError but adds tracking capabilities.
 */
export class MockKafkaError extends KafkaError {
  static instances: MockKafkaError[] = [];

  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(message, code, context, cause);
    MockKafkaError.instances.push(this);
  }

  /**
   * Resets the collection of error instances for clean test state.
   */
  static reset(): void {
    MockKafkaError.instances = [];
  }

  /**
   * Finds instances by error code.
   */
  static findByCode(code: string): MockKafkaError[] {
    return MockKafkaError.instances.filter(instance => instance.code === code);
  }

  /**
   * Checks if an error with the given code was thrown.
   */
  static wasThrown(code: string): boolean {
    return MockKafkaError.instances.some(instance => instance.code === code);
  }
}

/**
 * Mock implementation of EventValidationError for testing.
 */
export class MockEventValidationError extends EventValidationError {
  static instances: MockEventValidationError[] = [];

  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(message, code, context, cause);
    MockEventValidationError.instances.push(this);
  }

  /**
   * Resets the collection of error instances for clean test state.
   */
  static reset(): void {
    MockEventValidationError.instances = [];
  }

  /**
   * Finds instances by topic.
   */
  static findByTopic(topic: string): MockEventValidationError[] {
    return MockEventValidationError.instances.filter(
      instance => instance.context?.topic === topic
    );
  }
}

/**
 * Mock implementation of ProducerError for testing.
 */
export class MockProducerError extends ProducerError {
  static instances: MockProducerError[] = [];

  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(message, code, context, cause);
    MockProducerError.instances.push(this);
  }

  /**
   * Resets the collection of error instances for clean test state.
   */
  static reset(): void {
    MockProducerError.instances = [];
  }

  /**
   * Finds instances by topic.
   */
  static findByTopic(topic: string): MockProducerError[] {
    return MockProducerError.instances.filter(
      instance => instance.context?.topic === topic
    );
  }
}

/**
 * Mock implementation of ConsumerError for testing.
 */
export class MockConsumerError extends ConsumerError {
  static instances: MockConsumerError[] = [];

  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(message, code, context, cause);
    MockConsumerError.instances.push(this);
  }

  /**
   * Resets the collection of error instances for clean test state.
   */
  static reset(): void {
    MockConsumerError.instances = [];
  }

  /**
   * Finds instances by topic.
   */
  static findByTopic(topic: string): MockConsumerError[] {
    return MockConsumerError.instances.filter(
      instance => instance.context?.topic === topic
    );
  }
}

/**
 * Mock implementation of MessageSerializationError for testing.
 */
export class MockMessageSerializationError extends MessageSerializationError {
  static instances: MockMessageSerializationError[] = [];

  constructor(
    message: string,
    code: string,
    context: Record<string, any> = {},
    cause?: Error
  ) {
    super(message, code, context, cause);
    MockMessageSerializationError.instances.push(this);
  }

  /**
   * Resets the collection of error instances for clean test state.
   */
  static reset(): void {
    MockMessageSerializationError.instances = [];
  }
}

/**
 * Interface for retry policy configuration.
 */
export interface RetryPolicyConfig {
  maxRetries: number;
  shouldFailOnRetry?: boolean;
  failOnRetryAttempt?: number;
  retryDelays?: number[];
}

/**
 * Mock implementation of a retry policy for testing.
 * Allows configuring retry behavior for predictable test scenarios.
 */
export class MockRetryPolicy {
  private retryCount = 0;
  private readonly retryHistory: Array<{ timestamp: number; attempt: number }> = [];

  constructor(private readonly config: RetryPolicyConfig) {}

  /**
   * Simulates a retry attempt and returns whether it should continue.
   * 
   * @returns Promise that resolves to true if retry should continue, false otherwise
   */
  async shouldRetry(): Promise<boolean> {
    this.retryCount++;
    
    // Record retry attempt
    this.retryHistory.push({
      timestamp: Date.now(),
      attempt: this.retryCount
    });

    // Check if we should fail on this specific retry attempt
    if (this.config.failOnRetryAttempt === this.retryCount) {
      return false;
    }

    // Check if we should fail on any retry
    if (this.config.shouldFailOnRetry) {
      return false;
    }

    // Check if we've exceeded max retries
    return this.retryCount < this.config.maxRetries;
  }

  /**
   * Gets the delay for the current retry attempt.
   * 
   * @returns The delay in milliseconds
   */
  getRetryDelay(): number {
    // If specific delays are provided, use those
    if (this.config.retryDelays && this.retryCount <= this.config.retryDelays.length) {
      return this.config.retryDelays[this.retryCount - 1];
    }

    // Default exponential backoff: 100ms, 200ms, 400ms, etc.
    return Math.min(100 * Math.pow(2, this.retryCount - 1), 30000);
  }

  /**
   * Gets the current retry count.
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Gets the history of retry attempts.
   */
  getRetryHistory(): Array<{ timestamp: number; attempt: number }> {
    return [...this.retryHistory];
  }

  /**
   * Resets the retry count and history.
   */
  reset(): void {
    this.retryCount = 0;
    this.retryHistory.length = 0;
  }
}

/**
 * Interface for DLQ producer configuration.
 */
export interface DLQProducerConfig {
  shouldFail?: boolean;
  failAfterCount?: number;
  recordOnly?: boolean;
}

/**
 * Mock implementation of a Dead Letter Queue producer for testing.
 * Tracks messages sent to the DLQ and can be configured to simulate failures.
 */
export class MockDLQProducer {
  private messagesSent: Array<{
    topic: string;
    message: any;
    key?: string;
    headers?: Record<string, string>;
    timestamp: number;
  }> = [];
  private sendCount = 0;

  constructor(private readonly config: DLQProducerConfig = {}) {}

  /**
   * Sends a message to the dead letter queue.
   * 
   * @param sourceTopic - The original topic where the message was intended
   * @param message - The message that failed processing
   * @param key - Optional message key
   * @param headers - Optional message headers with error context
   * @returns Promise that resolves when the message is sent or rejects if configured to fail
   */
  async sendToDLQ<T = any>(
    sourceTopic: string,
    message: T,
    key?: string,
    headers?: Record<string, string>
  ): Promise<void> {
    this.sendCount++;

    // Record the message
    this.messagesSent.push({
      topic: sourceTopic,
      message,
      key,
      headers,
      timestamp: Date.now()
    });

    // If we're only recording, don't simulate actual sending
    if (this.config.recordOnly) {
      return;
    }

    // Check if we should fail after a certain number of sends
    if (this.config.failAfterCount && this.sendCount >= this.config.failAfterCount) {
      throw new MockKafkaError(
        'Failed to send message to dead-letter queue',
        ERROR_CODES.DLQ_SEND_FAILED,
        { topic: sourceTopic }
      );
    }

    // Check if we should fail all sends
    if (this.config.shouldFail) {
      throw new MockKafkaError(
        'Failed to send message to dead-letter queue',
        ERROR_CODES.DLQ_SEND_FAILED,
        { topic: sourceTopic }
      );
    }
  }

  /**
   * Gets all messages sent to the DLQ.
   */
  getMessagesSent(): Array<{
    topic: string;
    message: any;
    key?: string;
    headers?: Record<string, string>;
    timestamp: number;
  }> {
    return [...this.messagesSent];
  }

  /**
   * Gets messages sent to the DLQ for a specific topic.
   */
  getMessagesByTopic(topic: string): Array<{
    topic: string;
    message: any;
    key?: string;
    headers?: Record<string, string>;
    timestamp: number;
  }> {
    return this.messagesSent.filter(msg => msg.topic === topic);
  }

  /**
   * Gets the count of messages sent to the DLQ.
   */
  getSendCount(): number {
    return this.sendCount;
  }

  /**
   * Resets the DLQ producer state.
   */
  reset(): void {
    this.messagesSent = [];
    this.sendCount = 0;
  }
}

/**
 * Interface for error handler configuration.
 */
export interface ErrorHandlerConfig {
  shouldRethrow?: boolean;
  shouldLog?: boolean;
  customHandler?: (error: Error) => Promise<void>;
}

/**
 * Mock implementation of an error handler for testing.
 * Tracks errors and can be configured with different handling strategies.
 */
export class MockErrorHandler {
  private errorsHandled: Error[] = [];

  constructor(private readonly config: ErrorHandlerConfig = {}) {}

  /**
   * Handles an error according to the configured strategy.
   * 
   * @param error - The error to handle
   * @returns Promise that resolves when handling is complete or rejects if configured to rethrow
   */
  async handleError(error: Error): Promise<void> {
    // Record the error
    this.errorsHandled.push(error);

    // Call custom handler if provided
    if (this.config.customHandler) {
      await this.config.customHandler(error);
    }

    // Log the error if configured to do so
    if (this.config.shouldLog) {
      console.error('MockErrorHandler:', error);
    }

    // Rethrow the error if configured to do so
    if (this.config.shouldRethrow) {
      throw error;
    }
  }

  /**
   * Gets all errors handled.
   */
  getErrorsHandled(): Error[] {
    return [...this.errorsHandled];
  }

  /**
   * Gets errors of a specific type.
   */
  getErrorsByType<T extends Error>(errorType: new (...args: any[]) => T): T[] {
    return this.errorsHandled.filter(error => error instanceof errorType) as T[];
  }

  /**
   * Gets Kafka errors with a specific code.
   */
  getErrorsByCode(code: string): KafkaError[] {
    return this.errorsHandled.filter(
      error => error instanceof KafkaError && error.code === code
    ) as KafkaError[];
  }

  /**
   * Checks if an error with the given code was handled.
   */
  wasErrorHandled(code: string): boolean {
    return this.errorsHandled.some(
      error => error instanceof KafkaError && error.code === code
    );
  }

  /**
   * Gets the count of errors handled.
   */
  getErrorCount(): number {
    return this.errorsHandled.length;
  }

  /**
   * Resets the error handler state.
   */
  reset(): void {
    this.errorsHandled = [];
  }
}

/**
 * Factory function to create a mock Kafka error with predefined context.
 * 
 * @param code - The error code to use
 * @param context - Additional context to include
 * @param cause - Optional cause of the error
 * @returns A new MockKafkaError instance
 */
export function createMockKafkaError(
  code: string,
  context: Record<string, any> = {},
  cause?: Error
): MockKafkaError {
  const message = ERROR_MESSAGES[code] || 'Unknown error';
  return new MockKafkaError(message, code, context, cause);
}

/**
 * Factory function to create a mock event validation error.
 * 
 * @param topic - The topic that failed validation
 * @param message - The message that failed validation
 * @param cause - Optional cause of the error
 * @returns A new MockEventValidationError instance
 */
export function createMockValidationError(
  topic: string,
  message: any,
  cause?: Error
): MockEventValidationError {
  return new MockEventValidationError(
    `Schema validation failed for topic ${topic}`,
    ERROR_CODES.SCHEMA_VALIDATION_FAILED,
    { topic, message: JSON.stringify(message).substring(0, 200) },
    cause
  );
}

/**
 * Factory function to create a mock producer error.
 * 
 * @param topic - The topic that failed production
 * @param cause - Optional cause of the error
 * @returns A new MockProducerError instance
 */
export function createMockProducerError(
  topic: string,
  cause?: Error
): MockProducerError {
  return new MockProducerError(
    `Failed to produce message to topic ${topic}`,
    ERROR_CODES.PRODUCER_SEND_FAILED,
    { topic },
    cause
  );
}

/**
 * Factory function to create a mock consumer error.
 * 
 * @param topic - The topic that failed consumption
 * @param cause - Optional cause of the error
 * @returns A new MockConsumerError instance
 */
export function createMockConsumerError(
  topic: string,
  cause?: Error
): MockConsumerError {
  return new MockConsumerError(
    `Failed to process message from topic ${topic}`,
    ERROR_CODES.CONSUMER_PROCESSING_FAILED,
    { topic },
    cause
  );
}

/**
 * Factory function to create a mock retry exhausted error.
 * 
 * @param topic - The topic for which retries were exhausted
 * @param retryCount - The number of retries attempted
 * @param maxRetries - The maximum number of retries allowed
 * @returns A new MockKafkaError instance
 */
export function createMockRetryExhaustedError(
  topic: string,
  retryCount: number,
  maxRetries: number
): MockKafkaError {
  return new MockKafkaError(
    `Maximum retry attempts exceeded for topic ${topic}`,
    ERROR_CODES.RETRY_EXHAUSTED,
    { topic, retryCount, maxRetries }
  );
}

/**
 * Factory function to create a mock serialization error.
 * 
 * @param isDeserialization - Whether this is a deserialization error
 * @param cause - Optional cause of the error
 * @returns A new MockMessageSerializationError instance
 */
export function createMockSerializationError(
  isDeserialization = false,
  cause?: Error
): MockMessageSerializationError {
  const code = isDeserialization 
    ? ERROR_CODES.MESSAGE_DESERIALIZATION_FAILED 
    : ERROR_CODES.MESSAGE_SERIALIZATION_FAILED;
  
  const message = ERROR_MESSAGES[code];
  
  return new MockMessageSerializationError(
    message,
    code,
    {},
    cause
  );
}

/**
 * Resets all mock error tracking.
 * Useful for cleaning up between tests.
 */
export function resetAllMocks(): void {
  MockKafkaError.reset();
  MockEventValidationError.reset();
  MockProducerError.reset();
  MockConsumerError.reset();
  MockMessageSerializationError.reset();
}