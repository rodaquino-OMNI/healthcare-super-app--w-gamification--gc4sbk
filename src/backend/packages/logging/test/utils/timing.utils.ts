/**
 * Timing utilities for testing asynchronous logging operations.
 * 
 * This module provides utilities for handling timing-related aspects of testing
 * the logging package, including waiting for asynchronous operations to complete,
 * implementing retry mechanisms with exponential backoff, and simulating timing
 * conditions for throttling tests.
 * 
 * These utilities are essential for testing time-sensitive logging features and ensuring
 * test stability with asynchronous logging operations. They help with:
 * - Testing throttling behavior for high-volume logging
 * - Ensuring test stability with async operations
 * - Implementing retry mechanisms with exponential backoff
 * - Creating controlled environments for timing-dependent tests
 */

/**
 * Options for retry operations
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Backoff factor for exponential delay calculation */
  backoffFactor?: number;
  /** Optional predicate to determine if retry should continue */
  retryIf?: (error: Error) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 3000,
  backoffFactor: 2,
  retryIf: () => true,
};

/**
 * Waits for a specified amount of time
 * @param ms Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Waits for logs to be processed before continuing test execution
 * @param timeout Maximum time to wait in milliseconds
 * @param checkFn Optional function that returns true when logs are processed
 * @returns Promise that resolves when logs are processed or timeout is reached
 */
export const waitForLogsToProcess = async (
  timeout = 1000,
  checkFn?: () => boolean
): Promise<void> => {
  if (checkFn) {
    const startTime = Date.now();
    const checkInterval = 50; // ms between checks
    
    while (Date.now() - startTime < timeout) {
      if (checkFn()) {
        return;
      }
      await wait(checkInterval);
    }
    
    throw new Error('Timeout waiting for logs to be processed');
  } else {
    // Simple timeout-based wait when no check function is provided
    // This simulates waiting for logs to be flushed to their destination
    await wait(timeout);
  }
};

/**
 * Waits until a specific number of logs have been processed
 * @param count Expected number of logs
 * @param timeout Maximum time to wait in milliseconds
 * @param checkInterval Interval between checks in milliseconds
 * @param getCurrentCount Function that returns the current log count
 * @returns Promise that resolves when the expected count is reached or timeout is reached
 */
export const waitForLogCount = async (
  count: number,
  timeout = 5000,
  checkInterval = 100,
  getCurrentCount: () => number
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (getCurrentCount() >= count) {
      return;
    }
    await wait(checkInterval);
  }
  
  throw new Error(`Timeout waiting for log count to reach ${count}`);
};

/**
 * Retries an operation with exponential backoff
 * @param operation Function to retry
 * @param options Retry configuration options
 * @returns Promise that resolves with the operation result or rejects after all retries fail
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> => {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  let delay = config.initialDelay!;

  for (let attempt = 0; attempt <= config.maxRetries!; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxRetries! || !config.retryIf!(lastError)) {
        break;
      }
      
      await wait(delay);
      delay = Math.min(delay * config.backoffFactor!, config.maxDelay!);
    }
  }
  
  throw lastError!;
};

/**
 * Simulates high-volume logging with throttling for testing throttling behavior
 * @param logCount Number of logs to simulate
 * @param interval Interval between logs in milliseconds
 * @param logFn Function that performs the logging operation
 * @returns Promise that resolves when all logs have been processed
 */
export const simulateThrottledLogging = async (
  logCount: number,
  interval: number,
  logFn: (index: number) => void
): Promise<void> => {
  for (let i = 0; i < logCount; i++) {
    logFn(i);
    await wait(interval);
  }
};

/**
 * Simulates burst logging for testing rate limiting and buffer handling
 * @param logCount Number of logs to simulate
 * @param logFn Function that performs the logging operation
 * @returns Promise that resolves when all logs have been sent (not necessarily processed)
 */
export const simulateBurstLogging = async (
  logCount: number,
  logFn: (index: number) => void
): Promise<void> => {
  // Send all logs without waiting between them to test buffer handling
  for (let i = 0; i < logCount; i++) {
    logFn(i);
  }
  
  // Return a resolved promise, but note that logs may still be processing
  return Promise.resolve();
};

/**
 * Executes a test function with a controlled clock for timing-dependent tests
 * This uses Jest's fake timers if available, otherwise falls back to real timers
 * @param fn Test function to execute
 * @param runTimersImmediately Whether to run all timers immediately (true) or manually (false)
 * @returns Promise that resolves when the test function completes
 */
export const withControlledClock = async (
  fn: () => Promise<void>,
  runTimersImmediately = true
): Promise<void> => {
  // Check if Jest's fake timers are available
  const hasJestTimers = typeof jest !== 'undefined' && typeof jest.useFakeTimers === 'function';
  
  if (hasJestTimers) {
    jest.useFakeTimers();
    try {
      const promise = fn();
      if (runTimersImmediately) {
        jest.runAllTimers();
      }
      return await promise;
    } finally {
      jest.useRealTimers();
    }
  } else {
    // Fallback to real timers if Jest is not available
    return await fn();
  }
};

/**
 * Advances the timer by a specified number of milliseconds
 * Only works when using Jest's fake timers
 * @param ms Number of milliseconds to advance
 */
export const advanceTime = (ms: number): void => {
  if (typeof jest !== 'undefined' && typeof jest.advanceTimersByTime === 'function') {
    jest.advanceTimersByTime(ms);
  } else {
    throw new Error('advanceTime requires Jest\'s fake timers to be enabled');
  }
};

/**
 * Options for log capture
 */
export interface LogCaptureOptions {
  /** Whether to also call the original console methods */
  passThrough?: boolean;
  /** Whether to include timestamps in the captured logs */
  includeTimestamps?: boolean;
  /** Whether to capture debug level logs */
  captureDebug?: boolean;
  /** Whether to capture verbose level logs */
  captureVerbose?: boolean;
}

/**
 * Captures logs during the execution of a test function
 * @param fn Test function to execute
 * @param options Configuration options for log capture
 * @returns Promise that resolves with an array of captured log messages
 */
export const withLogCapture = async (
  fn: () => Promise<void>,
  options: LogCaptureOptions = {}
): Promise<string[]> => {
  const {
    passThrough = false,
    includeTimestamps = false,
    captureDebug = true,
    captureVerbose = true
  } = options;
  
  const logs: string[] = [];
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleDebug = console.debug;
  
  const createLogCapture = (originalFn: typeof console.log, level: string) => {
    return (...args: any[]) => {
      const timestamp = includeTimestamps ? `[${new Date().toISOString()}] ` : '';
      const logMessage = `${timestamp}${level}: ${args.map(arg => String(arg)).join(' ')}`;
      logs.push(logMessage);
      
      if (passThrough) {
        originalFn.apply(console, args);
      }
    };
  };
  
  // Override console methods to capture logs
  console.log = createLogCapture(originalConsoleLog, 'LOG');
  console.info = createLogCapture(originalConsoleInfo, 'INFO');
  console.warn = createLogCapture(originalConsoleWarn, 'WARN');
  console.error = createLogCapture(originalConsoleError, 'ERROR');
  
  if (captureDebug) {
    console.debug = createLogCapture(originalConsoleDebug, 'DEBUG');
  }
  
  try {
    await fn();
    return logs;
  } finally {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
  }
};

/**
 * Creates a mock logger that tracks calls for testing
 * @returns Object with mock logger and methods to access call history
 */
export const createMockLogger = () => {
  const calls: { level: string; message: string; context?: any; trace?: any; timestamp: number }[] = [];
  
  return {
    logger: {
      log: (message: string, context?: any) => {
        calls.push({ level: 'log', message, context, timestamp: Date.now() });
      },
      error: (message: string, trace?: any, context?: any) => {
        calls.push({ level: 'error', message, trace, context, timestamp: Date.now() });
      },
      warn: (message: string, context?: any) => {
        calls.push({ level: 'warn', message, context, timestamp: Date.now() });
      },
      debug: (message: string, context?: any) => {
        calls.push({ level: 'debug', message, context, timestamp: Date.now() });
      },
      verbose: (message: string, context?: any) => {
        calls.push({ level: 'verbose', message, context, timestamp: Date.now() });
      }
    },
    getCalls: () => [...calls],
    getCallCount: () => calls.length,
    clearCalls: () => {
      calls.length = 0;
    },
    getCallsByLevel: (level: string) => {
      return calls.filter(call => call.level === level);
    },
    getCallsInTimeRange: (startTime: number, endTime: number) => {
      return calls.filter(call => call.timestamp >= startTime && call.timestamp <= endTime);
    },
    getCallRate: (timeWindowMs: number = 1000) => {
      const now = Date.now();
      const callsInWindow = calls.filter(call => call.timestamp >= now - timeWindowMs);
      return callsInWindow.length / (timeWindowMs / 1000);
    }
  };
};