import { TransientException } from './transient.exception';

/**
 * Configuration for retry operations
 */
interface RetryConfig {
  maxRetries: number;         // Maximum number of retry attempts
  baseDelayMs: number;        // Base delay in milliseconds
  maxDelayMs: number;         // Maximum delay in milliseconds
  jitterFactor: number;       // Random factor to add jitter (0-1)
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,  // 1 second
  maxDelayMs: 30000,  // 30 seconds
  jitterFactor: 0.2,  // 20% jitter
};

/**
 * Retry configurations for different operation types
 */
const RETRY_CONFIGS: Record<string, RetryConfig> = {
  // Database operations
  'database': {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    jitterFactor: 0.1,
  },
  
  // Kafka operations
  'kafka': {
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 60000,
    jitterFactor: 0.3,
  },
  
  // HTTP requests
  'http': {
    maxRetries: 3,
    baseDelayMs: 2000,
    maxDelayMs: 10000,
    jitterFactor: 0.2,
  },
  
  // Event processing
  'event': {
    maxRetries: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    jitterFactor: 0.2,
  },
};

/**
 * Utility functions for implementing retry logic with exponential backoff.
 * 
 * Provides configurable retry strategies, backoff calculations, and integration
 * with the transient exception system to handle temporary failures gracefully.
 */
export class RetryUtils {
  /**
   * Determines if a transient exception should be retried
   * 
   * @param exception The transient exception
   * @returns True if the exception should be retried
   */
  static shouldRetry(exception: TransientException): boolean {
    const retryCount = exception.retryCount || 0;
    const operationType = exception.operationType || 'default';
    const config = this.getRetryConfig(operationType);
    
    return retryCount < config.maxRetries;
  }

  /**
   * Calculates the backoff time for a retry attempt using exponential backoff with jitter
   * 
   * @param exception The transient exception
   * @returns Backoff time in milliseconds
   */
  static calculateBackoff(exception: TransientException): number {
    const retryCount = exception.retryCount || 0;
    const operationType = exception.operationType || 'default';
    const config = this.getRetryConfig(operationType);
    
    // Calculate exponential backoff: baseDelay * 2^retryCount
    const exponentialDelay = config.baseDelayMs * Math.pow(2, retryCount);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
    
    // Add jitter to prevent thundering herd problem
    const jitter = cappedDelay * config.jitterFactor * Math.random();
    
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Gets the retry configuration for an operation type
   * 
   * @param operationType Type of operation (database, kafka, http, event)
   * @returns Retry configuration
   */
  static getRetryConfig(operationType: string): RetryConfig {
    return RETRY_CONFIGS[operationType] || DEFAULT_RETRY_CONFIG;
  }

  /**
   * Executes a function with retry logic
   * 
   * @param fn Function to execute
   * @param operationType Type of operation for retry configuration
   * @returns Promise resolving to the function result
   * @throws The last error if all retries fail
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    operationType: string = 'default',
  ): Promise<T> {
    const config = this.getRetryConfig(operationType);
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Only retry if it's a transient exception or explicitly marked as retryable
        const isRetryable = error instanceof TransientException || 
          (error instanceof Error && (error as any).isRetryable);
        
        if (!isRetryable || attempt >= config.maxRetries) {
          throw error;
        }
        
        // Calculate backoff time
        const backoffMs = this.calculateBackoffForAttempt(attempt, operationType);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
    
    // This should never happen due to the throw in the loop,
    // but TypeScript needs it for type safety
    throw lastError;
  }

  /**
   * Calculates the backoff time for a specific retry attempt
   * 
   * @param attempt Retry attempt number (0-based)
   * @param operationType Type of operation for retry configuration
   * @returns Backoff time in milliseconds
   */
  static calculateBackoffForAttempt(attempt: number, operationType: string = 'default'): number {
    const config = this.getRetryConfig(operationType);
    
    // Calculate exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
    
    // Apply maximum delay cap
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
    
    // Add jitter to prevent thundering herd problem
    const jitter = cappedDelay * config.jitterFactor * Math.random();
    
    return Math.floor(cappedDelay + jitter);
  }
}

// Export the RetryUtils as the default export
export default RetryUtils;