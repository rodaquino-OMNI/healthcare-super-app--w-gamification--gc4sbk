/**
 * @file error-handler.ts
 * @description Provides standardized error handling patterns for Kafka operations.
 * Classifies errors into retriable vs. terminal categories, manages retry decision logic,
 * logs detailed error context, and ensures proper correlation ID propagation for distributed tracing.
 * 
 * This file is part of the AUSTA SuperApp gamification engine and implements the
 * error handling requirements from the technical specification.
 * 
 * @see Technical Specification Section 5.4.3 - Error Handling Patterns
 * @see Technical Specification Section 0.2.3 - Phase 4: Gamification Event Architecture
 */

import { Injectable, Logger } from '@nestjs/common';
import { KafkaMessage } from 'kafkajs';

// Import from @austa/logging for structured logging
import { LoggerService } from '@austa/logging';

// Import from @austa/tracing for distributed tracing
import { TracingService } from '@austa/tracing';

// Import from @austa/errors for error handling
import { ErrorReporter } from '@austa/errors';

// Import Kafka-specific exception
import KafkaException, { KafkaErrorType } from '../exceptions/kafka.exception';

// Import Kafka types
import {
  KafkaHeaders,
  KafkaErrorType as KafkaErrorTypeEnum,
  KafkaError,
  TypedKafkaMessage,
  MessageHandlerContext,
  RetryStrategy,
  ErrorHandler
} from './kafka.types';

/**
 * Configuration options for the Kafka error handler
 */
export interface KafkaErrorHandlerOptions {
  /** Service name for error context */
  serviceName: string;
  /** Default topic for error context */
  defaultTopic?: string;
  /** Default consumer group for error context */
  defaultGroupId?: string;
  /** Base retry delay in milliseconds */
  baseRetryDelayMs?: number;
  /** Maximum retry delay in milliseconds */
  maxRetryDelayMs?: number;
  /** Maximum number of retry attempts */
  maxRetryAttempts?: number;
  /** Whether to use jitter in retry delay calculation */
  useJitter?: boolean;
  /** Custom error mapping function */
  errorMapper?: (error: Error) => KafkaException;
  /** Logger instance */
  logger?: Logger;
}

/**
 * Error context for Kafka operations
 */
export interface KafkaErrorContext {
  /** Topic where the error occurred */
  topic?: string;
  /** Partition where the error occurred */
  partition?: number;
  /** Offset of the message */
  offset?: string;
  /** Consumer group ID */
  groupId?: string;
  /** Message key */
  messageKey?: string;
  /** Message headers */
  messageHeaders?: KafkaHeaders;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Number of retry attempts */
  retryCount?: number;
  /** Operation type (produce, consume) */
  operation?: 'produce' | 'consume' | 'admin' | 'connect';
  /** Additional context */
  [key: string]: any;
}

/**
 * Service that provides standardized error handling for Kafka operations.
 * 
 * This service is responsible for:
 * - Classifying errors into retriable vs. terminal categories
 * - Managing retry decision logic with exponential backoff
 * - Logging detailed error context for troubleshooting
 * - Ensuring proper correlation ID propagation for distributed tracing
 * - Determining when to send messages to the dead letter queue
 */
@Injectable()
export class KafkaErrorHandler {
  private readonly logger: Logger;
  private readonly serviceName: string;
  private readonly defaultTopic: string;
  private readonly defaultGroupId: string;
  private readonly baseRetryDelayMs: number;
  private readonly maxRetryDelayMs: number;
  private readonly maxRetryAttempts: number;
  private readonly useJitter: boolean;
  private readonly errorMapper?: (error: Error) => KafkaException;

  /**
   * Creates a new KafkaErrorHandler instance
   * 
   * @param options Configuration options
   * @param loggerService Logger service for structured logging
   * @param tracingService Tracing service for distributed tracing
   * @param errorReporter Error reporter for error tracking
   */
  constructor(
    private readonly options: KafkaErrorHandlerOptions,
    private readonly loggerService?: LoggerService,
    private readonly tracingService?: TracingService,
    private readonly errorReporter?: ErrorReporter
  ) {
    this.logger = options.logger || new Logger(KafkaErrorHandler.name);
    this.serviceName = options.serviceName;
    this.defaultTopic = options.defaultTopic || 'unknown';
    this.defaultGroupId = options.defaultGroupId || 'unknown';
    this.baseRetryDelayMs = options.baseRetryDelayMs || 1000;
    this.maxRetryDelayMs = options.maxRetryDelayMs || 30000;
    this.maxRetryAttempts = options.maxRetryAttempts || 5;
    this.useJitter = options.useJitter !== undefined ? options.useJitter : true;
    this.errorMapper = options.errorMapper;
  }

  /**
   * Handles a Kafka error and determines the appropriate action
   * 
   * @param error The error that occurred
   * @param message The Kafka message being processed (if available)
   * @param context Additional context about the error
   * @returns Promise that resolves when error handling is complete
   */
  async handleError(error: Error, message?: KafkaMessage, context: KafkaErrorContext = {}): Promise<void> {
    // Convert to KafkaException for consistent handling
    const kafkaError = this.convertToKafkaException(error, message, context);
    
    // Extract correlation ID from message headers or context
    const correlationId = this.extractCorrelationId(message, context);
    
    // Create structured error context for logging
    const errorContext = this.createErrorContext(kafkaError, message, context, correlationId);
    
    // Log the error with context
    this.logError(kafkaError, errorContext);
    
    // Report the error to monitoring systems
    this.reportError(kafkaError, errorContext);
    
    // Create a span for the error in distributed tracing
    this.traceError(kafkaError, errorContext, correlationId);
    
    // Determine if the message should be sent to DLQ
    const sendToDlq = this.shouldSendToDlq(kafkaError, context.retryCount);
    
    // If we should send to DLQ, log that decision
    if (sendToDlq) {
      this.logger.warn(
        `Message will be sent to DLQ: ${errorContext.topic}:${errorContext.partition}:${errorContext.offset}`,
        { correlationId, ...errorContext }
      );
    }
  }

  /**
   * Creates a retry strategy function that can be used with Kafka consumers
   * 
   * @returns A retry strategy function
   */
  createRetryStrategy(): RetryStrategy {
    return (error: Error, retryCount: number, message?: KafkaMessage, retryContext?: any): number => {
      // Convert to KafkaException for consistent handling
      const kafkaError = this.convertToKafkaException(error, message, {
        retryCount,
        ...retryContext
      });
      
      // If the error is not retriable or we've exceeded max retries, don't retry
      if (!kafkaError.isRetryable() || retryCount >= this.maxRetryAttempts) {
        return -1; // Signal that we should not retry
      }
      
      // Calculate retry delay with exponential backoff
      return kafkaError.calculateRetryDelay(this.baseRetryDelayMs, this.maxRetryDelayMs);
    };
  }

  /**
   * Creates an error handler function that can be used with Kafka consumers
   * 
   * @returns An error handler function
   */
  createErrorHandler(): ErrorHandler {
    return async (error: Error, message?: KafkaMessage, handlerContext?: any): Promise<void> => {
      await this.handleError(error, message, handlerContext);
    };
  }

  /**
   * Handles an error that occurred during message processing
   * 
   * @param error The error that occurred
   * @param message The typed Kafka message being processed
   * @param context The message handler context
   * @returns Promise that resolves when error handling is complete
   */
  async handleProcessingError<T>(error: Error, message: TypedKafkaMessage<T>, context: MessageHandlerContext): Promise<void> {
    // Extract topic and partition from context or use defaults
    const topic = context.originalTopic || this.defaultTopic;
    const partition = context.partition || 0;
    
    // Create error context with message details
    const errorContext: KafkaErrorContext = {
      topic,
      partition,
      offset: message.offset,
      correlationId: context.correlationId,
      retryCount: context.retryCount || 0,
      operation: 'consume',
      messageKey: message.key?.toString(),
      messageHeaders: message.headers,
      messageValue: this.sanitizeMessageValue(message.value),
      journeyContext: context.journeyContext,
      userId: context.userId,
      processingStartTime: context.processingStartTime
    };
    
    // Handle the error with the created context
    await this.handleError(error, message as unknown as KafkaMessage, errorContext);
  }

  /**
   * Converts any error to a KafkaException for consistent handling
   * 
   * @param error The original error
   * @param message The Kafka message (if available)
   * @param context Additional context
   * @returns A KafkaException representing the error
   */
  private convertToKafkaException(error: Error, message?: KafkaMessage, context: KafkaErrorContext = {}): KafkaException {
    // If it's already a KafkaException, return it
    if (error instanceof KafkaException) {
      return error;
    }
    
    // If it's a KafkaError from kafka.types.ts, convert it
    if (error instanceof KafkaError) {
      return this.convertKafkaErrorToException(error, message, context);
    }
    
    // If we have a custom error mapper, use it
    if (this.errorMapper) {
      return this.errorMapper(error);
    }
    
    // Extract message key and value for context
    const messageKey = message?.key?.toString();
    const messageValue = message?.value ? this.sanitizeMessageValue(JSON.parse(message.value.toString())) : undefined;
    
    // Create a KafkaException from the generic error
    return KafkaException.fromKafkaError(error, {
      topic: context.topic,
      groupId: context.groupId || this.defaultGroupId,
      messageKey,
      messageValue,
      retryAttempts: context.retryCount,
      maxRetryAttempts: this.maxRetryAttempts
    });
  }

  /**
   * Converts a KafkaError from kafka.types.ts to a KafkaException
   * 
   * @param error The KafkaError to convert
   * @param message The Kafka message (if available)
   * @param context Additional context
   * @returns A KafkaException representing the error
   */
  private convertKafkaErrorToException(error: KafkaError, message?: KafkaMessage, context: KafkaErrorContext = {}): KafkaException {
    // Map KafkaErrorType from kafka.types.ts to KafkaErrorType from kafka.exception.ts
    const errorTypeMap: Record<KafkaErrorTypeEnum, KafkaErrorType> = {
      [KafkaErrorTypeEnum.CONNECTION]: KafkaErrorType.CONNECTION,
      [KafkaErrorTypeEnum.AUTHENTICATION]: KafkaErrorType.AUTHENTICATION,
      [KafkaErrorTypeEnum.AUTHORIZATION]: KafkaErrorType.AUTHENTICATION,
      [KafkaErrorTypeEnum.MESSAGE_FORMAT]: KafkaErrorType.SERIALIZATION,
      [KafkaErrorTypeEnum.SCHEMA_VALIDATION]: KafkaErrorType.VALIDATION,
      [KafkaErrorTypeEnum.PROCESSING]: KafkaErrorType.CONSUMER,
      [KafkaErrorTypeEnum.TIMEOUT]: KafkaErrorType.CONNECTION,
      [KafkaErrorTypeEnum.BROKER]: KafkaErrorType.BROKER,
      [KafkaErrorTypeEnum.UNKNOWN]: KafkaErrorType.UNKNOWN
    };
    
    // Map the error type
    const kafkaErrorType = errorTypeMap[error.type] || KafkaErrorType.UNKNOWN;
    
    // Extract message key and value for context
    const messageKey = message?.key?.toString();
    const messageValue = message?.value ? this.sanitizeMessageValue(JSON.parse(message.value.toString())) : undefined;
    
    // Create a KafkaException with the mapped error type
    return new KafkaException(error.message, {
      cause: error.originalError,
      kafkaErrorType,
      kafkaErrorCode: error.code,
      topic: context.topic,
      groupId: context.groupId || this.defaultGroupId,
      messageKey,
      messageValue,
      retryAttempts: context.retryCount,
      maxRetryAttempts: this.maxRetryAttempts,
      details: error.context
    });
  }

  /**
   * Extracts the correlation ID from message headers or context
   * 
   * @param message The Kafka message (if available)
   * @param context Additional context
   * @returns The correlation ID or undefined if not found
   */
  private extractCorrelationId(message?: KafkaMessage, context: KafkaErrorContext = {}): string | undefined {
    // First try to get from context
    if (context.correlationId) {
      return context.correlationId;
    }
    
    // Then try to get from message headers
    if (message?.headers) {
      const correlationIdHeader = Object.entries(message.headers)
        .find(([key]) => key.toLowerCase() === 'correlationid');
      
      if (correlationIdHeader) {
        const [, value] = correlationIdHeader;
        return value?.toString();
      }
    }
    
    // Generate a new correlation ID if none exists
    return `kafka-error-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Creates a structured error context for logging and reporting
   * 
   * @param kafkaError The KafkaException
   * @param message The Kafka message (if available)
   * @param context Additional context
   * @param correlationId The correlation ID for tracing
   * @returns Structured error context
   */
  private createErrorContext(
    kafkaError: KafkaException,
    message?: KafkaMessage,
    context: KafkaErrorContext = {},
    correlationId?: string
  ): Record<string, any> {
    // Start with basic error information
    const errorContext: Record<string, any> = {
      errorType: kafkaError.kafkaErrorType,
      errorCode: kafkaError.kafkaErrorCode,
      errorMessage: kafkaError.message,
      serviceName: this.serviceName,
      topic: context.topic || this.defaultTopic,
      partition: context.partition,
      offset: context.offset || message?.offset,
      groupId: context.groupId || kafkaError.groupId || this.defaultGroupId,
      correlationId,
      retryCount: context.retryCount || kafkaError.retryAttempts || 0,
      maxRetryAttempts: this.maxRetryAttempts,
      isRetryable: kafkaError.isRetryable(),
      sendToDlq: kafkaError.sendToDlq,
      timestamp: new Date().toISOString(),
      operation: context.operation || 'unknown'
    };
    
    // Add message information if available
    if (message) {
      errorContext.messageKey = message.key?.toString();
      errorContext.messageTimestamp = message.timestamp;
      
      // Add sanitized headers
      if (message.headers) {
        errorContext.messageHeaders = this.sanitizeHeaders(message.headers);
      }
      
      // Add sanitized message value
      if (message.value) {
        try {
          errorContext.messageValue = this.sanitizeMessageValue(JSON.parse(message.value.toString()));
        } catch (e) {
          errorContext.messageValue = 'Failed to parse message value';
          errorContext.messageValueParseError = e.message;
        }
      }
    }
    
    // Add journey context if available
    if (context.journeyContext) {
      errorContext.journeyContext = context.journeyContext;
    }
    
    // Add user ID if available
    if (context.userId) {
      errorContext.userId = context.userId;
    }
    
    // Add processing start time if available
    if (context.processingStartTime) {
      errorContext.processingStartTime = context.processingStartTime;
      errorContext.processingDuration = Date.now() - new Date(context.processingStartTime).getTime();
    }
    
    // Add stack trace if available
    if (kafkaError.stack) {
      errorContext.stack = kafkaError.stack;
    }
    
    // Add original error if available
    if (kafkaError.cause) {
      errorContext.originalError = {
        name: kafkaError.cause.name,
        message: kafkaError.cause.message,
        stack: kafkaError.cause.stack
      };
    }
    
    return errorContext;
  }

  /**
   * Logs the error with structured context
   * 
   * @param kafkaError The KafkaException
   * @param errorContext Structured error context
   */
  private logError(kafkaError: KafkaException, errorContext: Record<string, any>): void {
    // Use structured logger if available
    if (this.loggerService) {
      this.loggerService.error(
        `Kafka error: ${kafkaError.message}`,
        errorContext,
        kafkaError.stack
      );
      return;
    }
    
    // Otherwise use the standard logger
    const logMethod = kafkaError.isRetryable() ? this.logger.warn : this.logger.error;
    
    logMethod.call(
      this.logger,
      `Kafka error: ${kafkaError.message}`,
      { correlationId: errorContext.correlationId, ...errorContext }
    );
  }

  /**
   * Reports the error to monitoring systems
   * 
   * @param kafkaError The KafkaException
   * @param errorContext Structured error context
   */
  private reportError(kafkaError: KafkaException, errorContext: Record<string, any>): void {
    // Use error reporter if available
    if (this.errorReporter) {
      this.errorReporter.report(kafkaError, errorContext);
    }
  }

  /**
   * Creates a span for the error in distributed tracing
   * 
   * @param kafkaError The KafkaException
   * @param errorContext Structured error context
   * @param correlationId The correlation ID for tracing
   */
  private traceError(kafkaError: KafkaException, errorContext: Record<string, any>, correlationId?: string): void {
    // Use tracing service if available
    if (this.tracingService) {
      this.tracingService.recordError(kafkaError, {
        spanName: `kafka.error.${kafkaError.kafkaErrorType.toLowerCase()}`,
        correlationId,
        attributes: errorContext
      });
    }
  }

  /**
   * Determines if a message should be sent to the dead letter queue
   * 
   * @param kafkaError The KafkaException
   * @param retryCount The current retry count
   * @returns True if the message should be sent to DLQ, false otherwise
   */
  private shouldSendToDlq(kafkaError: KafkaException, retryCount?: number): boolean {
    // If the KafkaException has an explicit sendToDlq flag, use it
    if (kafkaError.sendToDlq !== undefined) {
      return kafkaError.sendToDlq;
    }
    
    // If retry count exceeds max retries, send to DLQ
    if (retryCount !== undefined && retryCount >= this.maxRetryAttempts) {
      return true;
    }
    
    // If the error is not retriable, send to DLQ
    if (!kafkaError.isRetryable()) {
      return true;
    }
    
    // By default, don't send to DLQ
    return false;
  }

  /**
   * Sanitizes message headers to remove sensitive information
   * 
   * @param headers The message headers
   * @returns Sanitized headers
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    // Copy all headers except sensitive ones
    Object.entries(headers).forEach(([key, value]) => {
      // Skip binary values
      if (value instanceof Buffer) {
        sanitized[key] = '[binary data]';
        return;
      }
      
      // Skip sensitive headers
      if (key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('auth')) {
        sanitized[key] = '[redacted]';
        return;
      }
      
      // Include other headers
      sanitized[key] = value?.toString();
    });
    
    return sanitized;
  }

  /**
   * Sanitizes message value to remove sensitive information and truncate large objects
   * 
   * @param value The message value
   * @returns Sanitized message value
   */
  private sanitizeMessageValue(value: any): any {
    // Handle null or undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle primitive values
    if (typeof value !== 'object') {
      return value;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      // Truncate large arrays
      if (value.length > 10) {
        return [...value.slice(0, 10), `... (${value.length - 10} more items)`];
      }
      
      // Recursively sanitize array items
      return value.map(item => this.sanitizeMessageValue(item));
    }
    
    // Handle objects
    const sanitized: Record<string, any> = {};
    
    // Recursively sanitize object properties
    Object.entries(value).forEach(([key, val]) => {
      // Redact sensitive fields
      if (key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('auth') ||
          key.toLowerCase().includes('credit') ||
          key.toLowerCase().includes('card')) {
        sanitized[key] = '[redacted]';
        return;
      }
      
      // Recursively sanitize other fields
      sanitized[key] = this.sanitizeMessageValue(val);
    });
    
    return sanitized;
  }
}

/**
 * Factory function to create a KafkaErrorHandler instance
 * 
 * @param options Configuration options
 * @param loggerService Optional logger service
 * @param tracingService Optional tracing service
 * @param errorReporter Optional error reporter
 * @returns A new KafkaErrorHandler instance
 */
export function createKafkaErrorHandler(
  options: KafkaErrorHandlerOptions,
  loggerService?: LoggerService,
  tracingService?: TracingService,
  errorReporter?: ErrorReporter
): KafkaErrorHandler {
  return new KafkaErrorHandler(options, loggerService, tracingService, errorReporter);
}

/**
 * Default retry strategy with exponential backoff and jitter
 * 
 * @param baseDelayMs Base delay in milliseconds (default: 1000)
 * @param maxDelayMs Maximum delay in milliseconds (default: 30000)
 * @param maxRetries Maximum number of retries (default: 5)
 * @param useJitter Whether to use jitter (default: true)
 * @returns A retry strategy function
 */
export function createDefaultRetryStrategy(
  baseDelayMs = 1000,
  maxDelayMs = 30000,
  maxRetries = 5,
  useJitter = true
): RetryStrategy {
  return (error: Error, retryCount: number, message?: KafkaMessage, context?: any): number => {
    // If we've exceeded max retries, don't retry
    if (retryCount >= maxRetries) {
      return -1;
    }
    
    // Convert to KafkaException if it's not already
    let kafkaError: KafkaException;
    
    if (error instanceof KafkaException) {
      kafkaError = error;
    } else if (error instanceof KafkaError) {
      // Map KafkaError to KafkaException
      const errorTypeMap: Record<KafkaErrorTypeEnum, KafkaErrorType> = {
        [KafkaErrorTypeEnum.CONNECTION]: KafkaErrorType.CONNECTION,
        [KafkaErrorTypeEnum.AUTHENTICATION]: KafkaErrorType.AUTHENTICATION,
        [KafkaErrorTypeEnum.AUTHORIZATION]: KafkaErrorType.AUTHENTICATION,
        [KafkaErrorTypeEnum.MESSAGE_FORMAT]: KafkaErrorType.SERIALIZATION,
        [KafkaErrorTypeEnum.SCHEMA_VALIDATION]: KafkaErrorType.VALIDATION,
        [KafkaErrorTypeEnum.PROCESSING]: KafkaErrorType.CONSUMER,
        [KafkaErrorTypeEnum.TIMEOUT]: KafkaErrorType.CONNECTION,
        [KafkaErrorTypeEnum.BROKER]: KafkaErrorType.BROKER,
        [KafkaErrorTypeEnum.UNKNOWN]: KafkaErrorType.UNKNOWN
      };
      
      kafkaError = new KafkaException(error.message, {
        cause: error.originalError,
        kafkaErrorType: errorTypeMap[error.type] || KafkaErrorType.UNKNOWN,
        kafkaErrorCode: error.code,
        retryAttempts: retryCount,
        maxRetryAttempts: maxRetries
      });
    } else {
      // Create a new KafkaException from the generic error
      kafkaError = KafkaException.fromKafkaError(error, {
        retryAttempts: retryCount,
        maxRetryAttempts: maxRetries
      });
    }
    
    // If the error is not retriable, don't retry
    if (!kafkaError.isRetryable()) {
      return -1;
    }
    
    // Calculate exponential backoff: baseDelay * 2^retryCount
    const exponentialDelay = baseDelayMs * Math.pow(2, retryCount);
    
    // Apply jitter if enabled
    if (useJitter) {
      // Apply a random jitter of up to 25% to prevent thundering herd problem
      const jitter = Math.random() * 0.25 * exponentialDelay;
      
      // Apply the jitter (randomly add or subtract)
      const delayWithJitter = Math.random() > 0.5 
        ? exponentialDelay + jitter 
        : Math.max(baseDelayMs, exponentialDelay - jitter);
      
      // Ensure we don't exceed the maximum delay
      return Math.min(delayWithJitter, maxDelayMs);
    }
    
    // Without jitter, just cap at maximum delay
    return Math.min(exponentialDelay, maxDelayMs);
  };
}

/**
 * Default error handler that logs errors and reports them to monitoring systems
 * 
 * @param serviceName Name of the service for error context
 * @param logger Logger instance
 * @returns An error handler function
 */
export function createDefaultErrorHandler(
  serviceName: string,
  logger: Logger = new Logger('KafkaErrorHandler')
): ErrorHandler {
  return async (error: Error, message?: KafkaMessage, context?: any): Promise<void> => {
    // Convert to KafkaException if it's not already
    let kafkaError: KafkaException;
    
    if (error instanceof KafkaException) {
      kafkaError = error;
    } else if (error instanceof KafkaError) {
      // Map KafkaError to KafkaException
      const errorTypeMap: Record<KafkaErrorTypeEnum, KafkaErrorType> = {
        [KafkaErrorTypeEnum.CONNECTION]: KafkaErrorType.CONNECTION,
        [KafkaErrorTypeEnum.AUTHENTICATION]: KafkaErrorType.AUTHENTICATION,
        [KafkaErrorTypeEnum.AUTHORIZATION]: KafkaErrorType.AUTHENTICATION,
        [KafkaErrorTypeEnum.MESSAGE_FORMAT]: KafkaErrorType.SERIALIZATION,
        [KafkaErrorTypeEnum.SCHEMA_VALIDATION]: KafkaErrorType.VALIDATION,
        [KafkaErrorTypeEnum.PROCESSING]: KafkaErrorType.CONSUMER,
        [KafkaErrorTypeEnum.TIMEOUT]: KafkaErrorType.CONNECTION,
        [KafkaErrorTypeEnum.BROKER]: KafkaErrorType.BROKER,
        [KafkaErrorTypeEnum.UNKNOWN]: KafkaErrorType.UNKNOWN
      };
      
      kafkaError = new KafkaException(error.message, {
        cause: error.originalError,
        kafkaErrorType: errorTypeMap[error.type] || KafkaErrorType.UNKNOWN,
        kafkaErrorCode: error.code,
        retryAttempts: context?.retryCount,
        maxRetryAttempts: context?.maxRetryAttempts
      });
    } else {
      // Create a new KafkaException from the generic error
      kafkaError = KafkaException.fromKafkaError(error, {
        retryAttempts: context?.retryCount,
        maxRetryAttempts: context?.maxRetryAttempts
      });
    }
    
    // Extract correlation ID from message headers or context
    let correlationId = context?.correlationId;
    
    if (!correlationId && message?.headers) {
      const correlationIdHeader = Object.entries(message.headers)
        .find(([key]) => key.toLowerCase() === 'correlationid');
      
      if (correlationIdHeader) {
        const [, value] = correlationIdHeader;
        correlationId = value?.toString();
      }
    }
    
    // If still no correlation ID, generate one
    if (!correlationId) {
      correlationId = `kafka-error-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    // Create error context
    const errorContext: Record<string, any> = {
      errorType: kafkaError.kafkaErrorType,
      errorCode: kafkaError.kafkaErrorCode,
      serviceName,
      topic: context?.topic || 'unknown',
      partition: context?.partition,
      offset: message?.offset,
      correlationId,
      retryCount: context?.retryCount || 0,
      isRetryable: kafkaError.isRetryable(),
      timestamp: new Date().toISOString()
    };
    
    // Log the error
    const logMethod = kafkaError.isRetryable() ? logger.warn : logger.error;
    
    logMethod.call(
      logger,
      `Kafka error: ${kafkaError.message}`,
      { correlationId, ...errorContext }
    );
  };
}

// Export all types and functions
export {
  KafkaException,
  KafkaErrorType,
  KafkaError,
  KafkaErrorTypeEnum
};