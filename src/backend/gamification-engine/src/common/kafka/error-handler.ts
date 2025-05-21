/**
 * @file error-handler.ts
 * @description Provides standardized error handling patterns for Kafka operations.
 * Classifies errors into retriable vs. terminal categories, manages retry decision logic,
 * logs detailed error context, and ensures proper correlation ID propagation for distributed tracing.
 */

import { Injectable, Logger } from '@nestjs/common';
import { KafkaError, KafkaErrorType, KafkaHeaders, KafkaMessage, RetryInfo } from './kafka.types';

/**
 * Common Kafka error codes that can be used to classify errors
 */
export enum KafkaErrorCode {
  // Connection errors
  CONNECTION_ERROR = 'KAFKA_CONNECTION_ERROR',
  BROKER_NOT_AVAILABLE = 'KAFKA_BROKER_NOT_AVAILABLE',
  NETWORK_ERROR = 'KAFKA_NETWORK_ERROR',
  
  // Authentication/Authorization errors
  AUTHENTICATION_ERROR = 'KAFKA_AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'KAFKA_AUTHORIZATION_ERROR',
  
  // Message errors
  MESSAGE_TOO_LARGE = 'KAFKA_MESSAGE_TOO_LARGE',
  INVALID_MESSAGE = 'KAFKA_INVALID_MESSAGE',
  SERIALIZATION_ERROR = 'KAFKA_SERIALIZATION_ERROR',
  
  // Topic/Partition errors
  TOPIC_NOT_FOUND = 'KAFKA_TOPIC_NOT_FOUND',
  INVALID_PARTITIONS = 'KAFKA_INVALID_PARTITIONS',
  UNKNOWN_TOPIC_OR_PARTITION = 'KAFKA_UNKNOWN_TOPIC_OR_PARTITION',
  
  // Consumer errors
  OFFSET_OUT_OF_RANGE = 'KAFKA_OFFSET_OUT_OF_RANGE',
  GROUP_LOAD_IN_PROGRESS = 'KAFKA_GROUP_LOAD_IN_PROGRESS',
  UNKNOWN_MEMBER_ID = 'KAFKA_UNKNOWN_MEMBER_ID',
  REBALANCE_IN_PROGRESS = 'KAFKA_REBALANCE_IN_PROGRESS',
  
  // Producer errors
  PRODUCER_FENCED = 'KAFKA_PRODUCER_FENCED',
  INVALID_PRODUCER_EPOCH = 'KAFKA_INVALID_PRODUCER_EPOCH',
  
  // Processing errors
  PROCESSING_ERROR = 'KAFKA_PROCESSING_ERROR',
  VALIDATION_ERROR = 'KAFKA_VALIDATION_ERROR',
  SCHEMA_VALIDATION_ERROR = 'KAFKA_SCHEMA_VALIDATION_ERROR',
  
  // Unknown errors
  UNKNOWN_ERROR = 'KAFKA_UNKNOWN_ERROR'
}

/**
 * Error handler service for Kafka operations
 * Provides standardized error handling patterns, classification, and logging
 */
@Injectable()
export class KafkaErrorHandler {
  private readonly logger = new Logger(KafkaErrorHandler.name);
  
  /**
   * Creates a properly formatted Kafka error with classification
   * @param message Error message
   * @param type Error type for classification
   * @param code Error code for programmatic handling
   * @param originalError Original error that caused this error
   * @param metadata Additional metadata about the error
   * @returns Properly formatted Kafka error
   */
  createError(
    message: string,
    type: KafkaErrorType,
    code: string = KafkaErrorCode.UNKNOWN_ERROR,
    originalError?: Error,
    metadata?: Record<string, unknown>
  ): KafkaError {
    // Determine if the error is retriable based on its type
    const retriable = this.isRetriable(type);
    
    // Create the error object
    const error = new Error(message) as KafkaError;
    error.name = `KafkaError[${type}]`;
    error.type = type;
    error.code = code;
    error.originalError = originalError;
    error.retriable = retriable;
    error.metadata = metadata || {};
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, this.createError);
    }
    
    return error;
  }
  
  /**
   * Classifies an error based on its properties and determines its type
   * @param error Error to classify
   * @returns Classified Kafka error type
   */
  classifyError(error: Error): KafkaErrorType {
    // If it's already a KafkaError, return its type
    if (this.isKafkaError(error)) {
      return error.type;
    }
    
    // Check error message for classification hints
    const errorMessage = error.message.toLowerCase();
    
    // Connection errors
    if (
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('broker') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('unreachable')
    ) {
      return KafkaErrorType.CONNECTION;
    }
    
    // Authentication errors
    if (
      errorMessage.includes('authentication') ||
      errorMessage.includes('auth') ||
      errorMessage.includes('credentials') ||
      errorMessage.includes('login')
    ) {
      return KafkaErrorType.AUTHENTICATION;
    }
    
    // Authorization errors
    if (
      errorMessage.includes('authorization') ||
      errorMessage.includes('permission') ||
      errorMessage.includes('access') ||
      errorMessage.includes('forbidden')
    ) {
      return KafkaErrorType.AUTHORIZATION;
    }
    
    // Validation errors
    if (
      errorMessage.includes('validation') ||
      errorMessage.includes('schema') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('format')
    ) {
      return KafkaErrorType.VALIDATION;
    }
    
    // Processing errors
    if (
      errorMessage.includes('processing') ||
      errorMessage.includes('failed to process') ||
      errorMessage.includes('error processing')
    ) {
      return KafkaErrorType.PROCESSING;
    }
    
    // Default to unknown
    return KafkaErrorType.UNKNOWN;
  }
  
  /**
   * Determines if an error is retriable based on its type
   * @param errorType Error type to check
   * @returns Whether the error is retriable
   */
  isRetriable(errorType: KafkaErrorType): boolean {
    // These error types are considered retriable
    const retriableTypes = [
      KafkaErrorType.RETRIABLE,
      KafkaErrorType.CONNECTION,
      KafkaErrorType.PROCESSING
    ];
    
    return retriableTypes.includes(errorType);
  }
  
  /**
   * Determines if an error is a KafkaError
   * @param error Error to check
   * @returns Whether the error is a KafkaError
   */
  isKafkaError(error: Error): error is KafkaError {
    return (
      error !== null &&
      typeof error === 'object' &&
      'type' in error &&
      'retriable' in error
    );
  }
  
  /**
   * Handles an error that occurred during Kafka operations
   * Logs the error with context and determines if it should be retried
   * @param error Error that occurred
   * @param context Context information about the operation
   * @returns Decision about whether to retry the operation
   */
  handleError(
    error: Error,
    context: {
      operation: string;
      topic?: string;
      message?: KafkaMessage;
      retryInfo?: RetryInfo;
      correlationId?: string;
    }
  ): { shouldRetry: boolean; error: KafkaError } {
    // Classify the error if it's not already a KafkaError
    const kafkaError = this.isKafkaError(error)
      ? error
      : this.createError(
          error.message,
          this.classifyError(error),
          KafkaErrorCode.UNKNOWN_ERROR,
          error
        );
    
    // Extract correlation ID from context or message headers
    const correlationId =
      context.correlationId ||
      (context.message?.headers as KafkaHeaders)?.correlationId ||
      'unknown';
    
    // Create structured error metadata
    const errorMetadata = {
      ...kafkaError.metadata,
      operation: context.operation,
      topic: context.topic,
      correlationId,
      messageKey: context.message?.key,
      messageOffset: context.message?.offset,
      messagePartition: context.message?.partition,
      retryAttempt: context.retryInfo?.attemptCount,
      maxRetryAttempts: context.retryInfo?.maxAttempts
    };
    
    // Update error metadata
    kafkaError.metadata = errorMetadata;
    
    // Log the error with context
    this.logError(kafkaError, errorMetadata);
    
    // Determine if the operation should be retried
    const shouldRetry = this.shouldRetry(kafkaError, context.retryInfo);
    
    return { shouldRetry, error: kafkaError };
  }
  
  /**
   * Determines if an operation should be retried based on the error and retry information
   * @param error Error that occurred
   * @param retryInfo Current retry information
   * @returns Whether the operation should be retried
   */
  shouldRetry(error: KafkaError, retryInfo?: RetryInfo): boolean {
    // If the error is not retriable, don't retry
    if (!error.retriable) {
      return false;
    }
    
    // If there's no retry info, assume it's the first attempt
    if (!retryInfo) {
      return true;
    }
    
    // If we've reached the maximum number of attempts, don't retry
    if (retryInfo.attemptCount >= retryInfo.maxAttempts) {
      return false;
    }
    
    // Otherwise, retry
    return true;
  }
  
  /**
   * Logs an error with structured metadata
   * @param error Error to log
   * @param metadata Additional metadata about the error
   */
  logError(error: KafkaError, metadata?: Record<string, unknown>): void {
    const errorContext = {
      errorType: error.type,
      errorCode: error.code,
      retriable: error.retriable,
      ...metadata,
      originalError: error.originalError
        ? {
            message: error.originalError.message,
            name: error.originalError.name,
            stack: error.originalError.stack
          }
        : undefined
    };
    
    this.logger.error(
      `Kafka error: ${error.message}`,
      error.stack,
      errorContext
    );
  }
  
  /**
   * Creates a connection error
   * @param message Error message
   * @param code Error code
   * @param originalError Original error
   * @returns Kafka connection error
   */
  createConnectionError(
    message: string,
    code: string = KafkaErrorCode.CONNECTION_ERROR,
    originalError?: Error
  ): KafkaError {
    return this.createError(
      message,
      KafkaErrorType.CONNECTION,
      code,
      originalError
    );
  }
  
  /**
   * Creates an authentication error
   * @param message Error message
   * @param code Error code
   * @param originalError Original error
   * @returns Kafka authentication error
   */
  createAuthenticationError(
    message: string,
    code: string = KafkaErrorCode.AUTHENTICATION_ERROR,
    originalError?: Error
  ): KafkaError {
    return this.createError(
      message,
      KafkaErrorType.AUTHENTICATION,
      code,
      originalError
    );
  }
  
  /**
   * Creates an authorization error
   * @param message Error message
   * @param code Error code
   * @param originalError Original error
   * @returns Kafka authorization error
   */
  createAuthorizationError(
    message: string,
    code: string = KafkaErrorCode.AUTHORIZATION_ERROR,
    originalError?: Error
  ): KafkaError {
    return this.createError(
      message,
      KafkaErrorType.AUTHORIZATION,
      code,
      originalError
    );
  }
  
  /**
   * Creates a validation error
   * @param message Error message
   * @param code Error code
   * @param originalError Original error
   * @returns Kafka validation error
   */
  createValidationError(
    message: string,
    code: string = KafkaErrorCode.VALIDATION_ERROR,
    originalError?: Error
  ): KafkaError {
    return this.createError(
      message,
      KafkaErrorType.VALIDATION,
      code,
      originalError
    );
  }
  
  /**
   * Creates a processing error
   * @param message Error message
   * @param code Error code
   * @param originalError Original error
   * @returns Kafka processing error
   */
  createProcessingError(
    message: string,
    code: string = KafkaErrorCode.PROCESSING_ERROR,
    originalError?: Error
  ): KafkaError {
    return this.createError(
      message,
      KafkaErrorType.PROCESSING,
      code,
      originalError
    );
  }
  
  /**
   * Creates a retriable error
   * @param message Error message
   * @param code Error code
   * @param originalError Original error
   * @returns Kafka retriable error
   */
  createRetriableError(
    message: string,
    code: string = KafkaErrorCode.UNKNOWN_ERROR,
    originalError?: Error
  ): KafkaError {
    return this.createError(
      message,
      KafkaErrorType.RETRIABLE,
      code,
      originalError
    );
  }
  
  /**
   * Creates a terminal error
   * @param message Error message
   * @param code Error code
   * @param originalError Original error
   * @returns Kafka terminal error
   */
  createTerminalError(
    message: string,
    code: string = KafkaErrorCode.UNKNOWN_ERROR,
    originalError?: Error
  ): KafkaError {
    return this.createError(
      message,
      KafkaErrorType.TERMINAL,
      code,
      originalError,
      { retriable: false }
    );
  }
  
  /**
   * Extracts correlation ID from message headers or generates a new one
   * @param headers Message headers
   * @returns Correlation ID for tracing
   */
  extractCorrelationId(headers?: KafkaHeaders): string {
    if (headers?.correlationId) {
      return headers.correlationId;
    }
    
    // Generate a new correlation ID if none exists
    return this.generateCorrelationId();
  }
  
  /**
   * Generates a new correlation ID for tracing
   * @returns New correlation ID
   */
  generateCorrelationId(): string {
    return crypto.randomUUID();
  }
  
  /**
   * Formats an error for client response
   * @param error Error to format
   * @returns Client-friendly error response
   */
  formatErrorForClient(error: KafkaError): {
    message: string;
    code: string;
    correlationId: string;
  } {
    return {
      message: error.message,
      code: error.code || KafkaErrorCode.UNKNOWN_ERROR,
      correlationId: (error.metadata?.correlationId as string) || this.generateCorrelationId()
    };
  }
}