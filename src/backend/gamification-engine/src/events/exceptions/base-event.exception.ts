import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base metadata interface for all event exceptions
 */
export interface BaseEventExceptionMetadata {
  /**
   * HTTP status code to return for this error
   * @default HttpStatus.INTERNAL_SERVER_ERROR
   */
  statusCode?: HttpStatus;

  /**
   * Error type classification
   * @default 'SYSTEM'
   */
  errorType?: 'CLIENT' | 'SYSTEM' | 'TRANSIENT' | 'EXTERNAL';

  /**
   * Error code for more specific error identification
   */
  errorCode?: string;

  /**
   * Additional context information for debugging and logging
   */
  [key: string]: any;
}

/**
 * Base exception class for all event-related exceptions in the gamification engine.
 * 
 * This class extends HttpException to provide consistent error handling and response
 * formatting across the application. It includes additional metadata for error
 * classification, logging, and client responses.
 */
export class BaseEventException extends HttpException {
  /**
   * Error type classification
   */
  protected errorType: string;

  /**
   * Error code for more specific error identification
   */
  protected errorCode: string;

  /**
   * Additional metadata for this exception
   */
  protected metadata: Record<string, any>;

  /**
   * Timestamp when the exception was created
   */
  protected timestamp: Date;

  /**
   * Creates a new BaseEventException
   * 
   * @param message Error message
   * @param metadata Additional metadata for the exception
   */
  constructor(message: string, metadata: BaseEventExceptionMetadata = {}) {
    // Extract HTTP status code from metadata or use default
    const statusCode = metadata.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
    
    // Create response object for HttpException
    const response = {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      errorType: metadata.errorType || 'SYSTEM',
      errorCode: metadata.errorCode,
    };

    // Call parent constructor with message and status code
    super(response, statusCode);

    // Set exception properties
    this.errorType = metadata.errorType || 'SYSTEM';
    this.errorCode = metadata.errorCode;
    this.metadata = { ...metadata };
    this.timestamp = new Date();

    // Set name explicitly for better error identification
    this.name = 'BaseEventException';

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, BaseEventException.prototype);
  }

  /**
   * Get the error type classification
   */
  public getErrorType(): string {
    return this.errorType;
  }

  /**
   * Get the error code
   */
  public getErrorCode(): string {
    return this.errorCode;
  }

  /**
   * Get the exception metadata
   */
  public getMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  /**
   * Get the timestamp when the exception was created
   */
  public getTimestamp(): Date {
    return this.timestamp;
  }

  /**
   * Check if this is a client error (4xx)
   */
  public isClientError(): boolean {
    return this.errorType === 'CLIENT';
  }

  /**
   * Check if this is a system error (5xx)
   */
  public isSystemError(): boolean {
    return this.errorType === 'SYSTEM';
  }

  /**
   * Check if this is a transient error that can be retried
   */
  public isTransientError(): boolean {
    return this.errorType === 'TRANSIENT';
  }

  /**
   * Check if this is an external dependency error
   */
  public isExternalError(): boolean {
    return this.errorType === 'EXTERNAL';
  }

  /**
   * Serialize the exception for logging and monitoring
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.getStatus(),
      errorType: this.errorType,
      errorCode: this.errorCode,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata,
    };
  }
}