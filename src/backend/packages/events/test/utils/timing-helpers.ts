/**
 * Timing utilities for testing asynchronous event processing.
 * 
 * This module provides functions for managing timing aspects of event testing,
 * including waiting for events, simulating delays, and validating event sequences.
 * 
 * @module timing-helpers
 */

/**
 * Options for the waitForEvent function.
 */
export interface WaitForEventOptions {
  /** Maximum time to wait in milliseconds before timing out */
  timeout?: number;
  /** Custom error message for timeout */
  timeoutMessage?: string;
  /** Interval in milliseconds between checks */
  interval?: number;
}

/**
 * Default options for waitForEvent.
 */
const DEFAULT_WAIT_OPTIONS: WaitForEventOptions = {
  timeout: 5000,
  timeoutMessage: 'Timed out waiting for event',
  interval: 50,
};

/**
 * Waits for a condition to be true, with timeout.
 * 
 * @param condition - Function that returns true when the condition is met
 * @param options - Configuration options
 * @returns Promise that resolves when the condition is met or rejects on timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: WaitForEventOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
  const startTime = Date.now();

  return new Promise<void>(async (resolve, reject) => {
    // Check immediately first
    if (await Promise.resolve(condition())) {
      return resolve();
    }

    const intervalId = setInterval(async () => {
      try {
        if (await Promise.resolve(condition())) {
          clearInterval(intervalId);
          return resolve();
        }

        if (Date.now() - startTime >= opts.timeout) {
          clearInterval(intervalId);
          reject(new Error(opts.timeoutMessage));
        }
      } catch (error) {
        clearInterval(intervalId);
        reject(error);
      }
    }, opts.interval);
  });
}

/**
 * Waits for a specific event to occur.
 * 
 * @param eventEmitter - Event emitter object (e.g., EventEmitter, Kafka consumer)
 * @param eventName - Name of the event to wait for
 * @param predicate - Optional function to test if the event data matches expectations
 * @param options - Configuration options
 * @returns Promise that resolves with the event data when the event occurs
 */
export function waitForEvent<T>(
  eventEmitter: any,
  eventName: string,
  predicate?: (eventData: T) => boolean,
  options: WaitForEventOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options };
  let timeoutId: NodeJS.Timeout;
  let listener: (data: T) => void;

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutId);
      eventEmitter.removeListener(eventName, listener);
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(opts.timeoutMessage));
    }, opts.timeout);

    listener = (data: T) => {
      if (!predicate || predicate(data)) {
        cleanup();
        resolve(data);
      }
    };

    eventEmitter.on(eventName, listener);
  });
}

/**
 * Options for the waitForEventSequence function.
 */
export interface WaitForEventSequenceOptions extends WaitForEventOptions {
  /** Whether to allow extra events between the expected events */
  allowExtraEvents?: boolean;
}

/**
 * Waits for a sequence of events to occur in order.
 * 
 * @param eventEmitter - Event emitter object
 * @param eventSequence - Array of event names and optional predicates
 * @param options - Configuration options
 * @returns Promise that resolves with an array of event data when all events occur
 */
export function waitForEventSequence<T>(
  eventEmitter: any,
  eventSequence: Array<{ name: string; predicate?: (data: T) => boolean }>,
  options: WaitForEventSequenceOptions = {}
): Promise<T[]> {
  const opts = { ...DEFAULT_WAIT_OPTIONS, ...options, allowExtraEvents: options.allowExtraEvents ?? true };
  let timeoutId: NodeJS.Timeout;
  const eventResults: T[] = [];
  let currentIndex = 0;
  const listeners: Record<string, (data: T) => void> = {};

  return new Promise<T[]>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeoutId);
      Object.entries(listeners).forEach(([event, listener]) => {
        eventEmitter.removeListener(event, listener);
      });
    };

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`${opts.timeoutMessage}: Received ${currentIndex} of ${eventSequence.length} expected events`));
    }, opts.timeout);

    // Create a listener for each event in the sequence
    eventSequence.forEach(({ name }, index) => {
      if (!listeners[name]) {
        listeners[name] = (data: T) => {
          const currentEvent = eventSequence[currentIndex];
          
          // If this is the event we're waiting for
          if (name === currentEvent.name) {
            // Check predicate if provided
            if (!currentEvent.predicate || currentEvent.predicate(data)) {
              eventResults.push(data);
              currentIndex++;
              
              // If we've received all events, resolve
              if (currentIndex >= eventSequence.length) {
                cleanup();
                resolve(eventResults);
              }
            }
          } else if (!opts.allowExtraEvents) {
            // If we don't allow extra events and received an unexpected one, reject
            cleanup();
            reject(new Error(`Expected event ${currentEvent.name} but received ${name}`));
          }
        };
        eventEmitter.on(name, listeners[name]);
      }
    });
  });
}

/**
 * Creates a delay function that waits for the specified time.
 * 
 * @param ms - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a controllable delay that can be adjusted for testing.
 * 
 * @param defaultMs - Default time to wait in milliseconds
 * @returns Object with delay function and control methods
 */
export function createControllableDelay(defaultMs: number = 100) {
  let currentDelay = defaultMs;
  let shouldFail = false;
  let failureError: Error | null = null;

  return {
    /**
     * Delays execution for the current delay time.
     * @returns Promise that resolves after the delay or rejects if failure is configured
     */
    delay: async (): Promise<void> => {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (shouldFail) {
            reject(failureError || new Error('Controlled delay failure'));
          } else {
            resolve();
          }
        }, currentDelay);
      });
    },

    /**
     * Sets the current delay time.
     * @param ms - New delay time in milliseconds
     */
    setDelay: (ms: number): void => {
      currentDelay = ms;
    },

    /**
     * Configures the delay to fail on next call.
     * @param error - Optional custom error to throw
     */
    setFailure: (error?: Error): void => {
      shouldFail = true;
      failureError = error || null;
    },

    /**
     * Resets the delay to normal operation.
     */
    reset: (): void => {
      shouldFail = false;
      failureError = null;
      currentDelay = defaultMs;
    },

    /**
     * Gets the current delay time.
     * @returns Current delay in milliseconds
     */
    getCurrentDelay: (): number => currentDelay,
  };
}

/**
 * Options for debounce and throttle functions.
 */
export interface RateLimitOptions {
  /** Time window in milliseconds */
  wait: number;
  /** Whether to call the function at the beginning of the time window (throttle only) */
  leading?: boolean;
  /** Whether to call the function at the end of the time window */
  trailing?: boolean;
}

/**
 * Creates a debounced version of a function for testing event handlers that debounce.
 * 
 * @param func - Function to debounce
 * @param options - Debounce configuration
 * @returns Debounced function
 */
export function createTestDebounce<T extends (...args: any[]) => any>(
  func: T,
  options: RateLimitOptions
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { wait, leading = false, trailing = true } = options;
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let result: ReturnType<T>;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  let pendingResolve: ((value: ReturnType<T>) => void) | null = null;

  const invokeFunc = (time: number, args: Parameters<T>): ReturnType<T> => {
    lastCallTime = time;
    result = func(...args) as ReturnType<T>;
    if (pendingResolve) {
      pendingResolve(result);
      pendingPromise = null;
      pendingResolve = null;
    }
    return result;
  };

  const debounced = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const time = Date.now();
    lastArgs = args;

    // Create a new promise if there isn't one pending
    if (!pendingPromise) {
      pendingPromise = new Promise<ReturnType<T>>(resolve => {
        pendingResolve = resolve;
      });
    }

    const isInvoking = lastCallTime === null && leading;

    if (isInvoking) {
      return Promise.resolve(invokeFunc(time, args));
    }

    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (trailing && lastArgs) {
        invokeFunc(Date.now(), lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }, wait);

    return pendingPromise;
  };

  debounced.cancel = (): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastCallTime = null;
    lastArgs = null;
    pendingPromise = null;
    pendingResolve = null;
  };

  return debounced;
}

/**
 * Creates a throttled version of a function for testing event handlers that throttle.
 * 
 * @param func - Function to throttle
 * @param options - Throttle configuration
 * @returns Throttled function
 */
export function createTestThrottle<T extends (...args: any[]) => any>(
  func: T,
  options: RateLimitOptions
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { wait, leading = true, trailing = true } = options;
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  let result: ReturnType<T>;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  let pendingResolve: ((value: ReturnType<T>) => void) | null = null;

  const invokeFunc = (time: number, args: Parameters<T>): ReturnType<T> => {
    lastCallTime = time;
    result = func(...args) as ReturnType<T>;
    if (pendingResolve) {
      pendingResolve(result);
      pendingPromise = null;
      pendingResolve = null;
    }
    return result;
  };

  const throttled = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const time = Date.now();
    lastArgs = args;

    // Create a new promise if there isn't one pending
    if (!pendingPromise) {
      pendingPromise = new Promise<ReturnType<T>>(resolve => {
        pendingResolve = resolve;
      });
    }

    if (lastCallTime === null) {
      if (leading) {
        return Promise.resolve(invokeFunc(time, args));
      }
      lastCallTime = time;
    }

    const timeSinceLastCall = time - lastCallTime;
    const timeUntilNextCall = wait - timeSinceLastCall;

    if (timeUntilNextCall <= 0) {
      return Promise.resolve(invokeFunc(time, args));
    }

    if (trailing && timeout === null) {
      timeout = setTimeout(() => {
        const now = Date.now();
        const callTime = lastCallTime ? lastCallTime + wait : now;
        if (callTime <= now && lastArgs) {
          invokeFunc(now, lastArgs);
        }
        timeout = null;
      }, timeUntilNextCall);
    }

    return pendingPromise;
  };

  throttled.cancel = (): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastCallTime = null;
    lastArgs = null;
    pendingPromise = null;
    pendingResolve = null;
  };

  return throttled;
}

/**
 * Creates a timeout that rejects after the specified time.
 * Useful for testing that operations complete within a time limit.
 * 
 * @param ms - Time in milliseconds before the timeout rejects
 * @param message - Optional error message
 * @returns Promise that rejects after the timeout
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message || `Operation timed out after ${ms}ms`));
    }, ms);
  });
}

/**
 * Runs a function with a timeout, rejecting if the function takes too long.
 * 
 * @param fn - Function to run
 * @param ms - Timeout in milliseconds
 * @param message - Optional timeout error message
 * @returns Promise that resolves with the function result or rejects on timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number,
  message?: string
): Promise<T> {
  const timeoutError = createTimeout(ms, message);
  return Promise.race([fn(), timeoutError]);
}

/**
 * Measures the execution time of a function.
 * 
 * @param fn - Function to measure
 * @returns Promise that resolves with the result and execution time
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const startTime = Date.now();
  const result = await fn();
  const executionTime = Date.now() - startTime;
  return { result, executionTime };
}

/**
 * Creates a function that simulates exponential backoff for testing retry mechanisms.
 * 
 * @param baseDelay - Base delay in milliseconds
 * @param maxRetries - Maximum number of retries
 * @param maxDelay - Maximum delay in milliseconds
 * @returns Function that calculates delay based on retry count
 */
export function createExponentialBackoff(
  baseDelay: number = 100,
  maxRetries: number = 5,
  maxDelay: number = 30000
): (retryCount: number) => number {
  return (retryCount: number): number => {
    if (retryCount > maxRetries) {
      return -1; // Signal to stop retrying
    }
    
    // Calculate exponential backoff with jitter
    const exponentialDelay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, retryCount) * (0.5 + Math.random() * 0.5)
    );
    
    return Math.floor(exponentialDelay);
  };
}