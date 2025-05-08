/**
 * @file base-reward.exception.ts
 * @description Defines an abstract base exception class for all reward-related errors.
 * Extends the application's AppException framework with reward-specific context.
 * Provides standardized error handling patterns with consistent error codes,
 * message formatting, and metadata capture for debugging and error reporting.
 *
 * This file implements the following requirements from the technical specification:
 * - Error classification into client errors, system errors, transient errors, and external dependency errors
 * - Standardized error responses with codes and messages
 * - Error aggregation and trend analysis
 * - Comprehensive error handling with consistent HTTP status code mapping
 */

import { AppException, ErrorType } from '@app/shared/exceptions/exceptions.types';
import { RewardErrorType, RewardErrorMetadata } from './reward-exception.types';

/**
 * Interface for reward-specific error context
 * Provides additional metadata for reward-related errors
 */
export interface RewardErrorContext {
  /** Optional reward ID related to the error */
  rewardId?: string;
  /** Optional user ID related to the error */
  userId?: string;
  /** Optional journey type related to the error */
  journey?: string;
  /** Optional correlation ID for distributed tracing */
  correlationId?: string;
  /** Optional operation type that caused the error */
  operation?: string;
  /** Optional retry information for retryable errors */
  retry?: {
    /** Current retry attempt number */
    attempt: number;
    /** Maximum number of retry attempts allowed */
    maxAttempts: number;
    /** Next retry timestamp */
    nextRetryAt?: Date;
  };
  /** Any additional context-specific data */
  [key: string]: any;
}

/**
 * Base exception class for all reward-related errors.
 * Extends the application's core exception framework with reward-specific context.
 * All reward exceptions should extend this class to ensure consistent error handling.
 */
export abstract class BaseRewardException extends AppException {
  /**
   * Creates a new BaseRewardException instance.
   * 
   * @param message - Human-readable error message
   * @param type - Type of error from ErrorType enum
   * @param code - Error code for more specific categorization (e.g., "REWARD_001")
   * @param context - Reward-specific error context
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    public readonly context: RewardErrorContext = {},
    cause?: Error
  ) {
    super(message, type, code, context, cause);
    this.name = this.constructor.name;
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, BaseRewardException.prototype);
  }

  /**
   * Returns a JSON representation of the exception with reward-specific context.
   * Used for consistent error responses across the application.
   * 
   * @returns JSON object with standardized error structure and reward context
   */
  override toJSON(): Record<string, any> {
    const baseJson = super.toJSON();
    
    // Add reward-specific context to the error details
    return {
      ...baseJson,
      error: {
        ...baseJson.error,
        context: {
          reward: this.context.rewardId ? { id: this.context.rewardId } : undefined,
          user: this.context.userId ? { id: this.context.userId } : undefined,
          journey: this.context.journey,
          operation: this.context.operation,
          correlationId: this.context.correlationId,
          retry: this.context.retry
        }
      }
    };
  }

  /**
   * Creates a log-friendly representation of the exception.
   * Includes reward-specific context for better error tracking and analysis.
   * 
   * @returns Object suitable for structured logging
   */
  toLog(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      stack: this.stack,
      context: this.context,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  /**
   * Enriches the exception with additional context information.
   * Useful for adding request-specific data like correlation IDs.
   * 
   * @param additionalContext - Additional context to add to the exception
   * @returns This exception instance for method chaining
   */
  withContext(additionalContext: Partial<RewardErrorContext>): this {
    this.context = {
      ...this.context,
      ...additionalContext
    };
    return this;
  }

  /**
   * Adds correlation ID to the exception context for distributed tracing.
   * 
   * @param correlationId - Correlation ID for tracing this error across services
   * @returns This exception instance for method chaining
   */
  withCorrelationId(correlationId: string): this {
    this.context.correlationId = correlationId;
    return this;
  }

  /**
   * Adds user ID to the exception context.
   * 
   * @param userId - ID of the user related to this error
   * @returns This exception instance for method chaining
   */
  withUserId(userId: string): this {
    this.context.userId = userId;
    return this;
  }

  /**
   * Adds reward ID to the exception context.
   * 
   * @param rewardId - ID of the reward related to this error
   * @returns This exception instance for method chaining
   */
  withRewardId(rewardId: string): this {
    this.context.rewardId = rewardId;
    return this;
  }

  /**
   * Adds journey type to the exception context.
   * 
   * @param journey - Journey type ('health', 'care', 'plan')
   * @returns This exception instance for method chaining
   */
  withJourney(journey: string): this {
    this.context.journey = journey;
    return this;
  }

  /**
   * Adds operation information to the exception context.
   * 
   * @param operation - Operation being performed when the error occurred
   * @returns This exception instance for method chaining
   */
  withOperation(operation: string): this {
    this.context.operation = operation;
    return this;
  }

  /**
   * Adds retry information to the exception context for retryable errors.
   * 
   * @param attempt - Current retry attempt number
   * @param maxAttempts - Maximum number of retry attempts allowed
   * @param nextRetryAt - Optional timestamp for the next retry attempt
   * @returns This exception instance for method chaining
   */
  withRetry(attempt: number, maxAttempts: number, nextRetryAt?: Date): this {
    this.context.retry = {
      attempt,
      maxAttempts,
      nextRetryAt
    };
    return this;
  }

  /**
   * Determines if this error is retryable based on its type and context.
   * 
   * @returns True if the error is retryable, false otherwise
   */
  isRetryable(): boolean {
    // If retry information is explicitly set in context, use that
    if (this.context.retry) {
      return this.context.retry.attempt < this.context.retry.maxAttempts;
    }
    
    // Default behavior based on error type
    return [
      ErrorType.TRANSIENT,
      ErrorType.EXTERNAL_DEPENDENCY
    ].includes(this.type);
  }

  /**
   * Calculates the exponential backoff delay for retries.
   * 
   * @param baseDelayMs - Base delay in milliseconds (default: 1000)
   * @param maxDelayMs - Maximum delay in milliseconds (default: 60000)
   * @returns Delay in milliseconds with jitter
   */
  calculateRetryDelay(baseDelayMs = 1000, maxDelayMs = 60000): number {
    const attempt = this.context.retry?.attempt || 0;
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
    // Add jitter (±10%) to prevent thundering herd problem
    const jitter = cappedDelay * 0.1 * (Math.random() * 2 - 1);
    
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Creates a new instance of this exception with incremented retry attempt.
   * Used for tracking retry attempts in retryable errors.
   * 
   * @returns A new exception instance with incremented retry count
   */
  incrementRetryAttempt(): BaseRewardException {
    const currentRetry = this.context.retry || { attempt: 0, maxAttempts: 3 };
    const nextRetryAt = new Date(Date.now() + this.calculateRetryDelay());
    
    // Create a new instance with updated retry information
    return this.withRetry(
      currentRetry.attempt + 1,
      currentRetry.maxAttempts,
      nextRetryAt
    ) as BaseRewardException;
  }

  /**
   * Formats the error message by replacing placeholders with context values.
   * 
   * @param template - Message template with {{placeholder}} syntax
   * @param context - Context object with values to replace placeholders
   * @returns Formatted message with placeholders replaced by actual values
   */
  protected static formatMessage(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] !== undefined ? String(context[key]) : match;
    });
  }
}