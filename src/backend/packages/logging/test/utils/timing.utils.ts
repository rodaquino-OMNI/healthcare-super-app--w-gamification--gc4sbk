/**
 * Timing utilities for testing asynchronous logging operations.
 * 
 * This module provides utilities for handling timing-related aspects of logging tests,
 * including waiting for asynchronous operations, simulating delays, and implementing
 * retry mechanisms with exponential backoff.
 */

/**
 * Configuration options for wait operations.
 */
export interface WaitOptions {
  /** Maximum time to wait in milliseconds */
  timeout?: number;
  /** Interval between checks in milliseconds */
  interval?: number;
  /** Optional error message if timeout is reached */
  timeoutMessage?: string;
}

/**
 * Default wait options.
 */
const DEFAULT_WAIT_OPTIONS: WaitOptions = {
  timeout: 5000,
  interval: 100,
  timeoutMessage: 'Operation timed out',
};

/**
 * Configuration options for retry operations.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Factor by which to increase delay on each retry */
  backoffFactor?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Optional error message if all retries fail */
  retryFailedMessage?: string;
};

/**
 * Default retry options.
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 100,
  backoffFactor: 2,
  maxDelay: 5000,
  retryFailedMessage: 'All retry attempts failed',
};

/**
 * Waits for logs to be written/processed before continuing test execution.
 * 
 * @param checkFn Function that returns true when logs are processed
 * @param options Wait configuration options
 * @returns Promise that resolves when logs are processed or rejects on timeout
 */
export async function waitForLogsToBeWritten(
  checkFn: () => boolean | Promise<boolean>,
  options: WaitOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
  const startTime = Date.now();

  while (true) {
    const result = await Promise.resolve(checkFn());
    if (result) {
      return;
    }

    if (Date.now() - startTime > opts.timeout) {
      throw new Error(opts.timeoutMessage);
    }

    await new Promise(resolve => setTimeout(resolve, opts.interval));
  }
}

/**
 * Waits for a specified condition to be true with exponential backoff.
 * 
 * @param conditionFn Function that returns true when the condition is met
 * @param options Retry configuration options
 * @returns Promise that resolves when condition is met or rejects after max retries
 */
export async function waitWithBackoff(
  conditionFn: () => boolean | Promise<boolean>,
  options: RetryOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let retryCount = 0;
  let delay = opts.initialDelay;

  while (retryCount <= opts.maxRetries) {
    const result = await Promise.resolve(conditionFn());
    if (result) {
      return;
    }

    if (retryCount === opts.maxRetries) {
      throw new Error(opts.retryFailedMessage);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    retryCount++;
  }
}

/**
 * Simulates a delay in test execution.
 * 
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Advances time in tests by executing all pending timers.
 * Useful for testing throttling behavior without waiting for real time to pass.
 * 
 * Note: This function requires jest.useFakeTimers() to be called in the test setup.
 * 
 * @param ms Milliseconds to advance
 */
export function advanceTime(ms: number): void {
  // This implementation assumes Jest as the test runner
  jest.advanceTimersByTime(ms);
}

/**
 * Generates a specified number of log events for testing high-volume logging and throttling.
 * 
 * @param count Number of log events to generate
 * @param logFn Function that creates a log entry
 * @returns Promise that resolves when all logs are generated
 */
export async function generateHighVolumeLogEvents(
  count: number,
  logFn: (index: number) => void | Promise<void>
): Promise<void> {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(Promise.resolve(logFn(i)));
  }
  await Promise.all(promises);
}

/**
 * Measures the time it takes to process logs.
 * 
 * @param fn Function to execute and measure
 * @returns Promise that resolves with the execution time in milliseconds
 */
export async function measureLogProcessingTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const startTime = Date.now();
  const result = await fn();
  const executionTime = Date.now() - startTime;
  return { result, executionTime };
}

/**
 * Retries an operation until a condition is met or max retries is reached.
 * 
 * @param operation Function to retry
 * @param condition Function that returns true when the operation is successful
 * @param options Retry configuration options
 * @returns Promise that resolves with the operation result or rejects after max retries
 */
export async function retryUntilCondition<T>(
  operation: () => Promise<T>,
  condition: (result: T) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let retryCount = 0;
  let delay = opts.initialDelay;

  while (retryCount <= opts.maxRetries) {
    const result = await operation();
    if (condition(result)) {
      return result;
    }

    if (retryCount === opts.maxRetries) {
      throw new Error(opts.retryFailedMessage);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    retryCount++;
  }

  // This should never be reached due to the throw above, but TypeScript requires it
  throw new Error(opts.retryFailedMessage);
}

/**
 * Wraps a function with retry logic using exponential backoff.
 * 
 * @param fn Function to wrap with retry logic
 * @param options Retry configuration options
 * @returns Promise that resolves with the function result or rejects after max retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let retryCount = 0;
  let delay = opts.initialDelay;
  let lastError: Error;

  while (retryCount <= opts.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (retryCount === opts.maxRetries) {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
      retryCount++;
    }
  }

  throw new Error(`${opts.retryFailedMessage}: ${lastError.message}`);
}

/**
 * Creates a mock clock that can be used to control time in tests.
 * 
 * @returns Object with methods to control time
 */
export function createMockClock() {
  // This implementation assumes Jest as the test runner
  jest.useFakeTimers();
  
  return {
    /**
     * Advances time by the specified number of milliseconds.
     * 
     * @param ms Milliseconds to advance
     */
    advanceTime: (ms: number) => jest.advanceTimersByTime(ms),
    
    /**
     * Runs all pending timers until they are exhausted.
     */
    runAllTimers: () => jest.runAllTimers(),
    
    /**
     * Runs only pending timers that are scheduled to run within the specified time.
     * 
     * @param ms Maximum time to advance
     */
    runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
    
    /**
     * Restores the original timer implementation.
     */
    restore: () => jest.useRealTimers(),
  };
}

/**
 * Utility to test throttled logging by simulating rapid log generation.
 * 
 * @param logFn Function that creates a log entry
 * @param count Number of log events to generate
 * @param intervalMs Interval between log batches in milliseconds
 * @param batchSize Size of each log batch
 * @returns Promise that resolves when all logs are generated
 */
export async function testThrottledLogging(
  logFn: (message: string) => void | Promise<void>,
  count: number,
  intervalMs: number,
  batchSize: number
): Promise<void> {
  const batches = Math.ceil(count / batchSize);
  const mockClock = createMockClock();
  
  try {
    for (let batch = 0; batch < batches; batch++) {
      const start = batch * batchSize;
      const end = Math.min(start + batchSize, count);
      
      for (let i = start; i < end; i++) {
        await Promise.resolve(logFn(`Test log message ${i}`));
      }
      
      if (batch < batches - 1) {
        mockClock.advanceTime(intervalMs);
      }
    }
  } finally {
    mockClock.restore();
  }
}