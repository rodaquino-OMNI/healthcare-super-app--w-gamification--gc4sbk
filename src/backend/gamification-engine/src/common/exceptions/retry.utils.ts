import { Logger } from '@nestjs/common';
import { TransientException } from './transient.exception';
import { DatabaseException } from './database.exception';

/**
 * Configuration options for retry operations
 */
export interface RetryOptions {
  maxAttempts?: number;        // Maximum number of retry attempts
  baseDelayMs?: number;        // Base delay in milliseconds
  maxDelayMs?: number;         // Maximum delay in milliseconds
  timeoutMs?: number;          // Overall timeout for all attempts
  jitterFactor?: number;       // Random factor to add to delay (0-1)
  retryableErrors?: Function[]; // Error classes that should be retried
  onRetry?: (error: Error, attempt: number, delay: number) => void; // Callback on retry
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 100,
  maxDelayMs: 30000,
  timeoutMs: 60000,
  jitterFactor: 0.5,
  retryableErrors: [TransientException],
  onRetry: () => {}, // No-op by default
};

/**
 * Utility class for implementing retry logic with exponential backoff.
 * Provides configurable retry strategies, backoff calculations, and integration
 * with the transient exception system to handle temporary failures gracefully.
 */
export class RetryUtils {
  private static readonly logger = new Logger(RetryUtils.name);
  
  /**
   * Executes a function with retry logic
   * 
   * @param fn Function to execute
   * @param options Retry configuration options
   * @returns Promise resolving to the function result
   * @throws Last error encountered after all retries are exhausted
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    // Merge provided options with defaults
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    
    let lastError: Error;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Execute the function
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry this error
        if (!this.isRetryableError(lastError, config.retryableErrors)) {
          this.logger.debug(
            `Error not retryable, failing immediately: ${lastError.message}`,
            { attempt, error: lastError },
          );
          throw lastError;
        }
        
        // Check if we've exceeded the overall timeout
        if (config.timeoutMs > 0 && Date.now() - startTime >= config.timeoutMs) {
          this.logger.warn(
            `Retry timeout exceeded after ${attempt} attempts: ${lastError.message}`,
            { attempt, error: lastError, elapsed: Date.now() - startTime },
          );
          throw lastError;
        }
        
        // Check if we've reached the maximum attempts
        if (attempt >= config.maxAttempts) {
          this.logger.warn(
            `Maximum retry attempts (${config.maxAttempts}) reached: ${lastError.message}`,
            { attempt, error: lastError },
          );
          throw lastError;
        }
        
        // Calculate delay for next attempt
        let delay: number;
        
        if (lastError instanceof DatabaseException && lastError.shouldRetry()) {
          // Use the database exception's recommended delay
          delay = lastError.getRetryDelay();
        } else {
          // Calculate exponential backoff with jitter
          delay = this.calculateBackoff(attempt, config);
        }
        
        // Log retry attempt
        this.logger.debug(
          `Retrying after error (attempt ${attempt}/${config.maxAttempts}): ${lastError.message}`,
          { attempt, delay, error: lastError },
        );
        
        // Execute onRetry callback
        config.onRetry(lastError, attempt, delay);
        
        // Wait before next attempt
        await this.sleep(delay);
      }
    }
    
    // This should never be reached due to the throw in the loop,
    // but TypeScript requires a return statement
    throw lastError!;
  }
  
  /**
   * Calculates backoff delay using exponential backoff with jitter
   * 
   * @param attempt Current attempt number (1-based)
   * @param config Retry configuration
   * @returns Delay in milliseconds
   */
  private static calculateBackoff(
    attempt: number,
    config: Required<RetryOptions>,
  ): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
    
    // Add jitter: random factor between (1-jitterFactor) and (1+jitterFactor)
    const jitter = 1 + (Math.random() * 2 - 1) * config.jitterFactor;
    
    // Calculate final delay with jitter
    const delay = exponentialDelay * jitter;
    
    // Cap at maximum delay
    return Math.min(delay, config.maxDelayMs);
  }
  
  /**
   * Checks if an error should be retried
   * 
   * @param error The error to check
   * @param retryableErrors Array of error classes that should be retried
   * @returns True if the error should be retried
   */
  private static isRetryableError(
    error: Error,
    retryableErrors: Function[],
  ): boolean {
    // Check if error is an instance of any retryable error class
    if (retryableErrors.some(errorClass => error instanceof errorClass)) {
      return true;
    }
    
    // Special handling for DatabaseException
    if (error instanceof DatabaseException) {
      return error.shouldRetry();
    }
    
    // Check for transient error indicators in standard errors
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes('timeout') ||
      errorMessage.includes('temporary') ||
      errorMessage.includes('transient') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network')
    );
  }
  
  /**
   * Promisified setTimeout for async/await usage
   * 
   * @param ms Milliseconds to sleep
   * @returns Promise that resolves after the specified time
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}