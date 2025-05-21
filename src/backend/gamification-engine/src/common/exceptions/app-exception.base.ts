import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Error classification types for the application
 * Defines the categories of errors that can occur in the application
 */
export enum ErrorType {
  // Client errors (4xx)
  VALIDATION = 'VALIDATION',       // Input validation errors
  BUSINESS_RULE = 'BUSINESS_RULE', // Business rule violations
  NOT_FOUND = 'NOT_FOUND',         // Resource not found
  UNAUTHORIZED = 'UNAUTHORIZED',    // Authentication issues
  FORBIDDEN = 'FORBIDDEN',          // Authorization issues
  
  // System errors (5xx)
  INTERNAL = 'INTERNAL',           // Internal server errors
  DATABASE = 'DATABASE',           // Database operation failures
  CONFIGURATION = 'CONFIGURATION', // Configuration issues
  
  // Transient errors (can be retried)
  TRANSIENT = 'TRANSIENT',         // Temporary failures that can be retried
  TIMEOUT = 'TIMEOUT',             // Operation timeouts
  THROTTLING = 'THROTTLING',       // Rate limiting issues
  
  // External dependency errors
  EXTERNAL = 'EXTERNAL',           // External service failures
  INTEGRATION = 'INTEGRATION',     // Integration issues
}

/**
 * Error context interface for capturing additional error information
 * This provides context about where and when the error occurred
 */
export interface IErrorContext {
  requestId?: string;      // Correlation ID for request tracing
  userId?: string;         // User ID for user-specific errors
  journey?: string;        // Journey context (health, care, plan)
  timestamp?: Date;        // Error occurrence timestamp
  path?: string;           // Request path where error occurred
  method?: string;         // HTTP method of the request
  retryable?: boolean;     // Whether the operation can be retried
  retryCount?: number;     // Number of retry attempts made
  retryDelay?: number;     // Delay between retry attempts (ms)
  [key: string]: any;      // Additional context properties
}

/**
 * Error metadata interface for structured error information
 * This provides details about the error itself
 */
export interface IErrorMetadata {
  code: string;            // Error code (e.g., 'GAMIFICATION_EVENT_001')
  type: ErrorType;         // Error classification type
  details?: any;           // Additional error details
  source?: string;         // Error source (component, module, etc.)
  target?: string;         // Target of the operation that failed
  [key: string]: any;      // Additional metadata properties
}

/**
 * Base exception class for the application
 * All exceptions in the application should extend this class
 */
export abstract class AppExceptionBase extends HttpException {
  /**
   * Error code for the exception
   * Should follow the format: DOMAIN_CATEGORY_NUMBER
   * e.g., GAMIFICATION_EVENT_001
   */
  public readonly code: string;

  /**
   * Error type classification
   */
  public readonly type: ErrorType;

  /**
   * Error context with additional information
   */
  public readonly context: IErrorContext;

  /**
   * Error metadata with structured information
   */
  public readonly metadata: IErrorMetadata;

  /**
   * Timestamp when the error occurred
   */
  public readonly timestamp: Date;

  /**
   * Creates a new AppExceptionBase instance
   * 
   * @param message Error message
   * @param status HTTP status code
   * @param metadata Error metadata
   * @param context Error context
   */
  constructor(
    message: string,
    status: HttpStatus,
    metadata: IErrorMetadata,
    context: IErrorContext = {}
  ) {
    // Call parent HttpException constructor
    super(
      {
        message,
        code: metadata.code,
        type: metadata.type,
        timestamp: new Date().toISOString(),
        ...metadata
      },
      status
    );

    this.code = metadata.code;
    this.type = metadata.type;
    this.metadata = metadata;
    this.timestamp = new Date();
    this.context = {
      ...context,
      timestamp: context.timestamp || this.timestamp,
    };

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Determines if the exception represents a client error (4xx)
   */
  public isClientError(): boolean {
    return [
      ErrorType.VALIDATION,
      ErrorType.BUSINESS_RULE,
      ErrorType.NOT_FOUND,
      ErrorType.UNAUTHORIZED,
      ErrorType.FORBIDDEN
    ].includes(this.type);
  }

  /**
   * Determines if the exception represents a system error (5xx)
   */
  public isSystemError(): boolean {
    return [
      ErrorType.INTERNAL,
      ErrorType.DATABASE,
      ErrorType.CONFIGURATION
    ].includes(this.type);
  }

  /**
   * Determines if the exception represents a transient error that can be retried
   */
  public isTransientError(): boolean {
    return [
      ErrorType.TRANSIENT,
      ErrorType.TIMEOUT,
      ErrorType.THROTTLING
    ].includes(this.type) || !!this.context.retryable;
  }

  /**
   * Determines if the exception represents an external dependency error
   */
  public isExternalError(): boolean {
    return [
      ErrorType.EXTERNAL,
      ErrorType.INTEGRATION
    ].includes(this.type);
  }

  /**
   * Determines if the operation that caused this exception can be retried
   */
  public isRetryable(): boolean {
    return this.isTransientError() || (this.context.retryable === true);
  }

  /**
   * Gets the retry count for this exception
   */
  public getRetryCount(): number {
    return this.context.retryCount || 0;
  }

  /**
   * Increments the retry count for this exception
   */
  public incrementRetryCount(): void {
    this.context.retryCount = this.getRetryCount() + 1;
  }

  /**
   * Gets the retry delay for this exception in milliseconds
   * Uses exponential backoff with jitter
   */
  public getRetryDelay(): number {
    if (!this.isRetryable()) {
      return 0;
    }

    const baseDelay = this.context.retryDelay || 1000; // Default 1 second
    const retryCount = this.getRetryCount();
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.2 * exponentialDelay; // 20% jitter

    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  /**
   * Serializes the exception for logging
   */
  public toLog(): Record<string, any> {
    return {
      message: this.message,
      code: this.code,
      type: this.type,
      status: this.getStatus(),
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Serializes the exception for API responses
   * Excludes sensitive information and stack traces
   */
  public toResponse(): Record<string, any> {
    return {
      message: this.message,
      code: this.code,
      type: this.type,
      status: this.getStatus(),
      timestamp: this.timestamp.toISOString(),
      details: this.metadata.details,
    };
  }

  /**
   * Creates a new instance of this exception with updated context
   * 
   * @param context Additional context to merge with existing context
   */
  public withContext(context: Partial<IErrorContext>): this {
    const ExceptionClass = this.constructor as new (
      message: string,
      status: HttpStatus,
      metadata: IErrorMetadata,
      context: IErrorContext
    ) => this;

    return new ExceptionClass(
      this.message,
      this.getStatus(),
      this.metadata,
      { ...this.context, ...context }
    );
  }

  /**
   * Creates a new instance of this exception with updated metadata
   * 
   * @param metadata Additional metadata to merge with existing metadata
   */
  public withMetadata(metadata: Partial<IErrorMetadata>): this {
    const ExceptionClass = this.constructor as new (
      message: string,
      status: HttpStatus,
      metadata: IErrorMetadata,
      context: IErrorContext
    ) => this;

    return new ExceptionClass(
      this.message,
      this.getStatus(),
      { ...this.metadata, ...metadata },
      this.context
    );
  }
}