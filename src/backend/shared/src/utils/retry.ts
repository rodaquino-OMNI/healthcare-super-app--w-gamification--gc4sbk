/**
 * Options for the retry function.
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts.
   */
  retries: number;
  
  /**
   * Minimum timeout between retries in milliseconds.
   */
  minTimeout: number;
  
  /**
   * Maximum timeout between retries in milliseconds.
   */
  maxTimeout: number;
  
  /**
   * Factor to increase timeout by between retries.
   */
  factor: number;
  
  /**
   * Function to call on each retry attempt.
   */
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Default retry options.
 */
const defaultOptions: RetryOptions = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 10000,
  factor: 2
};

/**
 * Executes a function with exponential backoff retry logic.
 * 
 * @param fn Function to execute and potentially retry
 * @param options Retry configuration options
 * @returns Promise resolving to the function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...defaultOptions, ...options };
  let attempt = 0;
  
  async function attempt_retry(): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      
      if (attempt >= opts.retries) {
        throw error;
      }
      
      if (opts.onRetry) {
        opts.onRetry(error as Error, attempt);
      }
      
      const timeout = Math.min(
        opts.maxTimeout,
        opts.minTimeout * Math.pow(opts.factor, attempt - 1)
      );
      
      // Add some jitter to prevent all retries happening simultaneously
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      const delay = Math.floor(timeout * jitter);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return attempt_retry();
    }
  }
  
  return attempt_retry();
}