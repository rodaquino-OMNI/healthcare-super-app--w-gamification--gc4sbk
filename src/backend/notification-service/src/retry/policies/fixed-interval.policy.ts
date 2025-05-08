import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../shared/src/logging/logger.service';
import { ErrorType, isRetryableErrorType } from '../constants/error-types.constants';
import { RetryPolicyType } from '../constants/policy-types.constants';
import { IFixedDelayOptions } from '../interfaces/retry-options.interface';
import { IRetryPolicy } from '../interfaces/retry-policy.interface';
import { RetryStatus } from '../interfaces/retry-status.enum';
import { DEFAULT_IN_APP_RETRY_OPTIONS } from '../constants/default-config.constants';

/**
 * Implements a retry policy with a constant time interval between retry attempts.
 * 
 * This policy is suitable for operations where a consistent delay between retries is desired,
 * such as in-app notifications or operations with predictable processing times. It supports
 * optional jitter to prevent thundering herd problems when many retries occur simultaneously.
 */
@Injectable()
export class FixedIntervalPolicy implements IRetryPolicy {
  private readonly DEFAULT_OPTIONS: IFixedDelayOptions = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    jitter: true,
    timeout: 3000,      // 3 seconds
  };

  /**
   * Creates an instance of FixedIntervalPolicy.
   * 
   * @param logger - Logger service for policy-related logging
   */
  constructor(private readonly logger: LoggerService) {}
  /**
   * Gets the name of this retry policy.
   * 
   * @returns The policy type identifier
   */
  getName(): string {
    return RetryPolicyType.FIXED;
  }

  /**
   * Calculates the next retry time based on the fixed interval strategy.
   * 
   * @param attemptsMade - Number of retry attempts already made
   * @param options - Retry policy options
   * @returns The delay in milliseconds before the next retry attempt
   */
  calculateNextRetryTime(
    attemptsMade: number,
    options: Partial<IFixedDelayOptions> = {}
  ): number {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // For fixed interval, we always use the same delay (initialDelay)
    let delay = mergedOptions.initialDelay;
    
    // Apply jitter if enabled to prevent thundering herd problem
    if (mergedOptions.jitter) {
      const jitterFactor = 0.2; // 20% jitter
      const jitterRange = delay * jitterFactor;
      // Random value between -jitterRange and +jitterRange
      const jitterAmount = (Math.random() * 2 - 1) * jitterRange;
      delay = Math.max(mergedOptions.initialDelay * 0.5, delay + jitterAmount);
    }
    
    this.logger.debug(
      `Calculated fixed retry delay: ${delay}ms for attempt ${attemptsMade + 1}`,
      'FixedIntervalPolicy'
    );
    
    return Math.round(delay);
  }

  /**
   * Determines if a retry should be attempted based on the error type and attempt count.
   * 
   * @param error - The error that occurred
   * @param attemptsMade - Number of retry attempts already made
   * @param options - Retry policy options
   * @returns True if a retry should be attempted, false otherwise
   */
  shouldRetry(
    error: Error,
    attemptsMade: number,
    options: Partial<IFixedDelayOptions> = {}
  ): boolean {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Check if maximum retry attempts have been reached
    if (attemptsMade >= mergedOptions.maxRetries) {
      this.logger.debug(
        `Maximum retry attempts (${mergedOptions.maxRetries}) reached. Will not retry.`,
        'FixedIntervalPolicy'
      );
      return false;
    }

    // Determine error type for retry decision
    const errorType = this.classifyError(error);
    
    // Only retry for retryable error types
    if (!isRetryableErrorType(errorType)) {
      this.logger.debug(
        `Error type ${errorType} is not retryable. Will not retry.`,
        'FixedIntervalPolicy'
      );
      return false;
    }

    this.logger.debug(
      `Will retry after error: ${error.message} (attempt ${attemptsMade + 1}/${mergedOptions.maxRetries})`,
      'FixedIntervalPolicy'
    );
    
    return true;
  }

  /**
   * Gets the retry status based on the error and attempt count.
   * 
   * @param error - The error that occurred
   * @param attemptsMade - Number of retry attempts already made
   * @param options - Retry policy options
   * @returns The current retry status
   */
  getRetryStatus(
    error: Error,
    attemptsMade: number,
    options: Partial<IFixedDelayOptions> = {}
  ): RetryStatus {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    // If error is not retryable, mark as failed immediately
    const errorType = this.classifyError(error);
    if (!isRetryableErrorType(errorType)) {
      return RetryStatus.FAILED;
    }
    
    // If max retries reached, mark as exhausted
    if (attemptsMade >= mergedOptions.maxRetries) {
      return RetryStatus.EXHAUSTED;
    }
    
    // Otherwise, mark as pending for retry
    return RetryStatus.PENDING;
  }



  /**
   * Classifies an error to determine its type for retry decision making.
   * 
   * @param error - The error to classify
   * @returns The classified error type
   * @private
   */
  private classifyError(error: Error): ErrorType {
    // Check for network-related errors (common transient errors)
    if (
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('EHOSTUNREACH') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.toLowerCase().includes('connection')
    ) {
      return ErrorType.TRANSIENT;
    }

    // Check for rate limiting or service unavailable (also transient)
    if (
      error.message.includes('rate limit') ||
      error.message.includes('too many requests') ||
      error.message.includes('429') ||
      error.message.includes('503') ||
      error.message.includes('service unavailable')
    ) {
      return ErrorType.TRANSIENT;
    }

    // Check for client errors (not retryable)
    if (
      error.message.includes('invalid') ||
      error.message.includes('not found') ||
      error.message.includes('400') ||
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('404')
    ) {
      return ErrorType.CLIENT;
    }

    // Check for external service errors
    if (
      error.message.includes('external') ||
      error.message.includes('third-party') ||
      error.message.includes('provider') ||
      error.message.includes('gateway')
    ) {
      return ErrorType.EXTERNAL;
    }

    // Default to system error if no specific classification matches
    return ErrorType.SYSTEM;
  }
}