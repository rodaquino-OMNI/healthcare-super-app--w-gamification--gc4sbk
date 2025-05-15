import { ErrorType, AppException } from '../../../shared/src/exceptions/exceptions.types';

/**
 * Configuration options for retry operations.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Initial delay in milliseconds before the first retry.
   * @default 100
   */
  initialDelay?: number;

  /**
   * Factor by which the delay increases with each retry attempt.
   * @default 2
   */
  backoffFactor?: number;

  /**
   * Maximum delay in milliseconds between retries.
   * @default 10000 (10 seconds)
   */
  maxDelay?: number;

  /**
   * Maximum total time in milliseconds for all retry attempts.
   * If exceeded, the operation will fail with the last error.
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Random factor to apply to the delay to prevent thundering herd problem.
   * The actual delay will be between delay * (1 - jitter) and delay * (1 + jitter).
   * @default 0.1 (10% variation)
   */
  jitter?: number;

  /**
   * Function to determine if a particular error should trigger a retry.
   * @param error - The error that occurred
   * @param attempt - The current retry attempt (1-based)
   * @returns True if the operation should be retried, false otherwise
   * @default Retries on network errors and 5xx responses
   */
  retryCondition?: (error: any, attempt: number) => boolean;

  /**
   * Function called before each retry attempt.
   * @param error - The error that occurred
   * @param attempt - The current retry attempt (1-based)
   * @param delay - The delay before the next retry in milliseconds
   */
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

/**
 * Default retry options.
 */
export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 100,
  backoffFactor: 2,
  maxDelay: 10000,
  timeout: 30000,
  jitter: 0.1,
  retryCondition: (error: any) => {
    // Retry on network errors
    if (error.code && [
      'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ENETUNREACH'
    ].includes(error.code)) {
      return true;
    }

    // Retry on 5xx responses (server errors)
    if (error.response && error.response.status >= 500 && error.response.status < 600) {
      return true;
    }

    // Retry on AppException with EXTERNAL error type (external system errors)
    if (error instanceof AppException && error.type === ErrorType.EXTERNAL) {
      return true;
    }

    return false;
  },
  onRetry: () => {}
};

/**
 * Journey-specific retry configurations.
 */
export const JOURNEY_RETRY_CONFIGS = {
  health: {
    // Health journey has more aggressive retry for wearable device connections
    maxRetries: 5,
    initialDelay: 200,
    backoffFactor: 1.5
  },
  care: {
    // Care journey has longer timeouts for telemedicine services
    maxRetries: 3,
    initialDelay: 300,
    timeout: 45000
  },
  plan: {
    // Plan journey has more conservative retry for insurance provider APIs
    maxRetries: 2,
    initialDelay: 500,
    backoffFactor: 3
  }
};

/**
 * Calculates the delay for the next retry attempt with exponential backoff and jitter.
 * 
 * @param attempt - The current retry attempt (0-based)
 * @param options - Retry configuration options
 * @returns The delay in milliseconds before the next retry
 */
export function calculateBackoffDelay(attempt: number, options: Required<RetryOptions>): number {
  // Calculate exponential backoff: initialDelay * backoffFactor^attempt
  const exponentialDelay = options.initialDelay * Math.pow(options.backoffFactor, attempt);
  
  // Apply maximum delay cap
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  // Apply jitter to prevent thundering herd problem
  // Formula: delay * (1 ± random * jitter)
  const jitterMultiplier = 1 + (Math.random() * 2 - 1) * options.jitter;
  
  // Ensure delay is always positive
  return Math.max(1, Math.floor(cappedDelay * jitterMultiplier));
}

/**
 * Executes a function with retry capability using exponential backoff.
 * 
 * @param fn - The function to execute with retry capability
 * @param options - Retry configuration options
 * @returns A promise that resolves with the result of the function or rejects with the last error
 * 
 * @example
 * // Basic usage
 * const result = await retry(() => fetchData());
 * 
 * // With custom options
 * const result = await retry(
 *   () => externalApiCall(),
 *   { maxRetries: 5, initialDelay: 200 }
 * );
 * 
 * // With custom retry condition
 * const result = await retry(
 *   () => databaseQuery(),
 *   { retryCondition: (err) => err.code === 'CONNECTION_LOST' }
 * );
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Merge provided options with defaults
  const mergedOptions: Required<RetryOptions> = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options
  };

  // Track start time for timeout enforcement
  const startTime = Date.now();
  let lastError: any;

  // Try the operation up to maxRetries + 1 times (initial attempt + retries)
  for (let attempt = 0; attempt <= mergedOptions.maxRetries; attempt++) {
    try {
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we've reached the maximum number of retries
      const isLastAttempt = attempt >= mergedOptions.maxRetries;
      if (isLastAttempt) {
        break;
      }

      // Check if we should retry based on the error and retry condition
      const shouldRetry = mergedOptions.retryCondition(error, attempt + 1);
      if (!shouldRetry) {
        break;
      }

      // Check if we've exceeded the timeout
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime >= mergedOptions.timeout) {
        const timeoutError = new Error(
          `Retry operation timed out after ${elapsedTime}ms. Original error: ${error.message}`
        );
        timeoutError.cause = error;
        throw timeoutError;
      }

      // Calculate delay for next retry
      const delay = calculateBackoffDelay(attempt, mergedOptions);
      
      // Notify before retry if callback is provided
      mergedOptions.onRetry(error, attempt + 1, delay);
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

/**
 * Decorator for retrying class methods with exponential backoff.
 * 
 * @param options - Retry configuration options
 * @returns A method decorator that adds retry capability to the decorated method
 * 
 * @example
 * class ExternalApiService {
 *   @Retryable()
 *   async fetchData() {
 *     // This method will be retried on failure
 *     return this.apiClient.get('/data');
 *   }
 * 
 *   @Retryable({
 *     maxRetries: 5,
 *     retryCondition: (err) => err.response?.status === 503
 *   })
 *   async sendPayment(data: PaymentData) {
 *     return this.paymentGateway.process(data);
 *   }
 * }
 */
export function Retryable(options: RetryOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store the original method
    const originalMethod = descriptor.value;

    // Replace the original method with a retryable version
    descriptor.value = function(...args: any[]) {
      return retry(() => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Creates a retry configuration for a specific journey.
 * 
 * @param journeyType - The type of journey ('health', 'care', or 'plan')
 * @param customOptions - Additional custom options to override journey defaults
 * @returns Combined retry options for the specified journey
 * 
 * @example
 * // Get health journey retry config
 * const healthRetryOptions = getJourneyRetryConfig('health');
 * 
 * // Get care journey config with custom timeout
 * const careRetryOptions = getJourneyRetryConfig('care', { timeout: 60000 });
 * 
 * // Use with retry function
 * await retry(fetchHealthData, getJourneyRetryConfig('health'));
 */
export function getJourneyRetryConfig(
  journeyType: 'health' | 'care' | 'plan',
  customOptions: RetryOptions = {}
): RetryOptions {
  // Get journey-specific defaults
  const journeyDefaults = JOURNEY_RETRY_CONFIGS[journeyType] || {};
  
  // Combine defaults, journey-specific config, and custom options
  return {
    ...DEFAULT_RETRY_OPTIONS,
    ...journeyDefaults,
    ...customOptions
  };
}

/**
 * Creates a retry function with pre-configured options.
 * 
 * @param options - Default retry options for the created function
 * @returns A retry function with the specified default options
 * 
 * @example
 * // Create a retry function for external API calls
 * const apiRetry = createRetryFunction({
 *   maxRetries: 5,
 *   initialDelay: 200,
 *   onRetry: (err, attempt) => console.log(`API retry ${attempt}: ${err.message}`)
 * });
 * 
 * // Use the pre-configured retry function
 * const data = await apiRetry(() => fetchFromApi());
 * 
 * // Override specific options for a particular call
 * const result = await apiRetry(() => specialApiCall(), { timeout: 60000 });
 */
export function createRetryFunction(defaultOptions: RetryOptions = {}) {
  return function<T>(fn: () => Promise<T>, overrideOptions: RetryOptions = {}): Promise<T> {
    // Combine default options with call-specific overrides
    const combinedOptions: RetryOptions = {
      ...defaultOptions,
      ...overrideOptions
    };
    
    return retry(fn, combinedOptions);
  };
}