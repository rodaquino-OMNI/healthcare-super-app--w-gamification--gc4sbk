/**
 * @file base-event.exception.ts
 * @description Provides a foundational abstract exception class that all other event-specific exceptions extend.
 * It establishes a consistent error structure with standardized properties like error code, message, timestamp,
 * and metadata. This class enables uniform error handling, logging, and serialization across the event processing pipeline.
 *
 * This file implements the following requirements from the technical specification:
 * - Enhanced error handling with centralized retry policies, fallback strategies, and circuit breakers
 * - Error classification into client errors, system errors, transient errors, and external dependency errors
 * - Standardized error responses with codes and messages
 * - Structured logging with correlation IDs
 */

import { HttpStatus } from '@nestjs/common';
import { IEvent } from '../interfaces/event.interface';

/**
 * Error classification types for event exceptions
 */
export enum EventErrorType {
  /** Client errors (4xx): Invalid input, authentication issues */
  CLIENT = 'CLIENT',
  /** System errors (5xx): Internal failures, database errors */
  SYSTEM = 'SYSTEM',
  /** Transient errors: Network timeouts, temporary unavailability */
  TRANSIENT = 'TRANSIENT',
  /** External dependency errors: Third-party system failures */
  EXTERNAL_DEPENDENCY = 'EXTERNAL_DEPENDENCY'
}

/**
 * Error source categories for more specific error classification
 */
export enum EventErrorSource {
  /** Validation errors in event data */
  VALIDATION = 'validation',
  /** Errors during event processing */
  PROCESSING = 'processing',
  /** Database-related errors */
  DATABASE = 'database',
  /** Errors from external services */
  EXTERNAL = 'external',
  /** Unknown error source */
  UNKNOWN = 'unknown'
}

/**
 * Interface for error metadata to provide additional context
 */
export interface BaseEventExceptionMetadata {
  /**
   * HTTP status code for the error
   */
  statusCode?: HttpStatus;

  /**
   * Error type classification
   */
  errorType?: string;

  /**
   * Unique error code for identification
   */
  errorCode?: string;

  /**
   * The event that caused the error, if available
   */
  event?: IEvent;

  /**
   * Correlation ID for tracking the error across services
   */
  correlationId?: string;

  /**
   * User ID associated with the error
   */
  userId?: string;

  /**
   * Journey associated with the error
   */
  journey?: string;

  /**
   * Source of the error
   */
  source?: EventErrorSource;

  /**
   * Whether the error is retryable
   */
  retryable?: boolean;

  /**
   * Number of retry attempts made
   */
  retryAttempt?: number;

  /**
   * Additional context-specific data
   */
  [key: string]: any;
}

/**
 * Interface for error metadata to provide additional context
 * @deprecated Use BaseEventExceptionMetadata instead
 */
export interface IEventErrorMetadata {
  /** The event that caused the error, if available */
  event?: IEvent;
  /** Correlation ID for tracking the error across services */
  correlationId?: string;
  /** User ID associated with the error */
  userId?: string;
  /** Journey associated with the error */
  journey?: string;
  /** Source of the error */
  source?: EventErrorSource;
  /** Whether the error is retryable */
  retryable?: boolean;
  /** Number of retry attempts made */
  retryAttempt?: number;
  /** Additional context-specific data */
  [key: string]: any;
}

/**
 * Abstract base class for all event-related exceptions.
 * Provides a consistent structure for error handling across the event processing pipeline.
 */
export abstract class BaseEventException extends Error {
  /** Unique error code for identification */
  public readonly errorCode: string;
  
  /** Timestamp when the error occurred */
  public readonly timestamp: Date;
  
  /** Classification of the error type */
  public readonly errorType: EventErrorType;
  
  /** HTTP status code associated with this error */
  public readonly statusCode: HttpStatus;
  
  /** Additional metadata for context and troubleshooting */
  public readonly metadata: BaseEventExceptionMetadata;

  /**
   * Creates a new BaseEventException instance
   * 
   * @param message Human-readable error message
   * @param metadata Additional metadata for context and troubleshooting
   */
  constructor(
    message: string,
    metadata: BaseEventExceptionMetadata = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = metadata.errorCode || 'UNKNOWN_ERROR';
    this.timestamp = new Date();
    this.errorType = metadata.errorType ? 
      (typeof metadata.errorType === 'string' ? EventErrorType[metadata.errorType as keyof typeof EventErrorType] : metadata.errorType) : 
      EventErrorType.SYSTEM;
    this.statusCode = metadata.statusCode || BaseEventException.mapErrorTypeToStatusCode(this.errorType);
    this.metadata = metadata;

    // Capture stack trace (Node.js specific)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Determines if the error is retryable based on its type and metadata
   * @returns True if the error is retryable
   */
  public isRetryable(): boolean {
    // If explicitly set in metadata, use that value
    if (typeof this.metadata.retryable === 'boolean') {
      return this.metadata.retryable;
    }

    // Default retryability based on error type
    return this.errorType === EventErrorType.TRANSIENT;
  }

  /**
   * Gets the retry attempt count from metadata
   * @returns The retry attempt count, or 0 if not set
   */
  public getRetryAttempt(): number {
    return this.metadata.retryAttempt || 0;
  }

  /**
   * Increments the retry attempt count in metadata
   * @returns A new exception instance with incremented retry count
   */
  public incrementRetryAttempt(): BaseEventException {
    const newMetadata = {
      ...this.metadata,
      retryAttempt: this.getRetryAttempt() + 1
    };

    return this.cloneWithMetadata(newMetadata);
  }

  /**
   * Creates a new instance of this exception with updated metadata
   * @param metadata The new metadata to merge with existing metadata
   * @returns A new exception instance with updated metadata
   */
  public abstract cloneWithMetadata(metadata: Partial<BaseEventExceptionMetadata>): BaseEventException;

  /**
   * Calculates the exponential backoff delay for retries
   * @param baseDelayMs Base delay in milliseconds
   * @param maxDelayMs Maximum delay in milliseconds
   * @returns Delay in milliseconds with jitter
   */
  public calculateRetryDelay(baseDelayMs = 1000, maxDelayMs = 60000): number {
    const attempt = this.getRetryAttempt();
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
    // Add jitter (±10%) to prevent thundering herd problem
    const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
    
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Serializes the exception for logging
   * @returns A structured object representation of the exception
   */
  public toLog(): Record<string, any> {
    return {
      name: this.name,
      errorCode: this.errorCode,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      errorType: this.errorType,
      statusCode: this.statusCode,
      stack: this.stack,
      metadata: this.sanitizeMetadataForLogging(this.metadata)
    };
  }

  /**
   * Serializes the exception for JSON.stringify()
   * @returns A structured object representation of the exception
   */
  public toJSON(): Record<string, any> {
    return this.toLog();
  }

  /**
   * Serializes the exception for API responses
   * @returns A client-friendly representation of the exception
   */
  public toResponse(): Record<string, any> {
    return {
      errorCode: this.errorCode,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      statusCode: this.statusCode,
      // Only include safe metadata fields in responses
      context: this.sanitizeMetadataForResponse(this.metadata)
    };
  }

  /**
   * Sanitizes metadata for logging, removing sensitive information
   * @param metadata The metadata to sanitize
   * @returns Sanitized metadata safe for logging
   */
  protected sanitizeMetadataForLogging(metadata: BaseEventExceptionMetadata): Record<string, any> {
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(metadata));

    // Sanitize event data if present to avoid logging sensitive information
    if (sanitized.event) {
      // Keep only essential event information for debugging
      sanitized.event = {
        id: sanitized.event.id,
        type: sanitized.event.type,
        journey: sanitized.event.journey,
        timestamp: sanitized.event.timestamp,
        // Omit potentially sensitive user data
      };
    }

    return sanitized;
  }

  /**
   * Sanitizes metadata for API responses, removing internal details
   * @param metadata The metadata to sanitize
   * @returns Sanitized metadata safe for client responses
   */
  protected sanitizeMetadataForResponse(metadata: BaseEventExceptionMetadata): Record<string, any> {
    // For API responses, only include a minimal set of fields
    const safeFields: Record<string, any> = {};
    
    // Include only specific fields that are safe for clients
    if (metadata.correlationId) {
      safeFields.correlationId = metadata.correlationId;
    }
    
    if (metadata.journey) {
      safeFields.journey = metadata.journey;
    }
    
    if (metadata.source) {
      safeFields.source = metadata.source;
    }
    
    // Include retryable status if applicable
    if (this.isRetryable()) {
      safeFields.retryable = true;
      safeFields.retryAfterMs = this.calculateRetryDelay();
    }
    
    return safeFields;
  }

  /**
   * Maps an error type to an HTTP status code
   * @param errorType The error type to map
   * @returns The corresponding HTTP status code
   */
  public static mapErrorTypeToStatusCode(errorType: EventErrorType): HttpStatus {
    switch (errorType) {
      case EventErrorType.CLIENT:
        return HttpStatus.BAD_REQUEST;
      case EventErrorType.SYSTEM:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case EventErrorType.TRANSIENT:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case EventErrorType.EXTERNAL_DEPENDENCY:
        return HttpStatus.BAD_GATEWAY;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}