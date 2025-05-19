/**
 * @file timing-helpers.ts
 * @description Provides utilities for testing asynchronous event processing, including functions for
 * waiting on event delivery, simulating delays, and managing test timeouts. This library simplifies
 * testing of event-driven systems by handling the complexities of async timing, event ordering, and
 * race conditions in test environments.
 */

import { EventEmitter } from 'events';

/**
 * Options for the waitForEvent function
 */
export interface WaitForEventOptions {
  /** Maximum time to wait in milliseconds before timing out */
  timeout?: number;
  /** Custom error message for timeout */
  timeoutMessage?: string;
  /** Predicate function to filter events */
  predicate?: (event: any) => boolean;
  /** Whether to reject on timeout (true) or resolve with null (false) */
  rejectOnTimeout?: boolean;
}

/**
 * Options for the waitForEventSequence function
 */
export interface WaitForEventSequenceOptions {
  /** Maximum time to wait in milliseconds before timing out */
  timeout?: number;
  /** Custom error message for timeout */
  timeoutMessage?: string;
  /** Maximum time between events in milliseconds */
  maxTimeBetweenEvents?: number;
  /** Whether to reject on timeout (true) or resolve with false (false) */
  rejectOnTimeout?: boolean;
}

/**
 * Options for the withTimeout function
 */
export interface WithTimeoutOptions {
  /** Custom error message for timeout */
  timeoutMessage?: string;
  /** Whether to reject on timeout (true) or resolve with null (false) */
  rejectOnTimeout?: boolean;
}

/**
 * Options for the debounce function
 */
export interface DebounceOptions {
  /** Whether to execute the function on the leading edge of the timeout */
  leading?: boolean;
  /** Whether to execute the function on the trailing edge of the timeout */
  trailing?: boolean;
}

/**
 * Options for the throttle function
 */
export interface ThrottleOptions {
  /** Whether to execute the function on the leading edge of the timeout */
  leading?: boolean;
  /** Whether to execute the function on the trailing edge of the timeout */
  trailing?: boolean;
}

/**
 * Default timeout for async operations (5 seconds)
 */
const DEFAULT_TIMEOUT = 5000;

/**
 * Default max time between events (1 second)
 */
const DEFAULT_MAX_TIME_BETWEEN_EVENTS = 1000;

/**
 * Waits for an event to be emitted from an EventEmitter
 * 
 * @param emitter The EventEmitter to listen to
 * @param eventName The name of the event to wait for
 * @param options Configuration options
 * @returns Promise that resolves with the event data when the event is emitted
 * 
 * @example
 * // Wait for a 'message' event with a 2 second timeout
 * const event = await waitForEvent(kafkaConsumer, 'message', { timeout: 2000 });
 * 
 * // Wait for a specific message using a predicate
 * const event = await waitForEvent(kafkaConsumer, 'message', {
 *   predicate: (msg) => msg.key === 'user-123'
 * });
 */
export async function waitForEvent<T = any>(
  emitter: EventEmitter,
  eventName: string,
  options: WaitForEventOptions = {}
): Promise<T | null> {
  const {
    timeout = DEFAULT_TIMEOUT,
    timeoutMessage = `Timed out waiting for event '${eventName}' after ${timeout}ms`,
    predicate,
    rejectOnTimeout = true
  } = options;

  return new Promise<T | null>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    const listener = (event: T) => {
      // If predicate is provided, check if the event matches
      if (predicate && !predicate(event)) {
        return; // Continue waiting if predicate doesn't match
      }

      // Clear timeout and remove listener
      clearTimeout(timeoutId);
      emitter.removeListener(eventName, listener);
      resolve(event);
    };

    // Set up timeout
    timeoutId = setTimeout(() => {
      emitter.removeListener(eventName, listener);
      if (rejectOnTimeout) {
        reject(new Error(timeoutMessage));
      } else {
        resolve(null);
      }
    }, timeout);

    // Start listening for the event
    emitter.on(eventName, listener);
  });
}

/**
 * Waits for a sequence of events to be emitted in order
 * 
 * @param emitter The EventEmitter to listen to
 * @param eventSequence Array of event names to wait for in sequence
 * @param options Configuration options
 * @returns Promise that resolves with true when all events are received in order
 * 
 * @example
 * // Wait for a sequence of events with a 5 second timeout
 * const success = await waitForEventSequence(
 *   eventEmitter, 
 *   ['connected', 'data', 'end'],
 *   { timeout: 5000 }
 * );
 */
export async function waitForEventSequence(
  emitter: EventEmitter,
  eventSequence: string[],
  options: WaitForEventSequenceOptions = {}
): Promise<boolean> {
  const {
    timeout = DEFAULT_TIMEOUT,
    timeoutMessage = `Timed out waiting for event sequence after ${timeout}ms`,
    maxTimeBetweenEvents = DEFAULT_MAX_TIME_BETWEEN_EVENTS,
    rejectOnTimeout = true
  } = options;

  if (eventSequence.length === 0) {
    return true; // Empty sequence is always satisfied
  }

  return new Promise<boolean>((resolve, reject) => {
    let currentIndex = 0;
    let globalTimeoutId: NodeJS.Timeout;
    let eventTimeoutId: NodeJS.Timeout;

    // Function to clean up all listeners and timeouts
    const cleanup = () => {
      clearTimeout(globalTimeoutId);
      clearTimeout(eventTimeoutId);
      for (const eventName of eventSequence) {
        emitter.removeListener(eventName, eventListeners[eventName]);
      }
    };

    // Create listeners for each event
    const eventListeners: Record<string, (...args: any[]) => void> = {};

    // Set up listeners for each event in the sequence
    for (let i = 0; i < eventSequence.length; i++) {
      const eventName = eventSequence[i];
      eventListeners[eventName] = (...args: any[]) => {
        // Only process if this is the event we're waiting for
        if (i === currentIndex) {
          // Clear the event timeout
          clearTimeout(eventTimeoutId);

          // Move to the next event in the sequence
          currentIndex++;

          // If we've received all events, resolve
          if (currentIndex >= eventSequence.length) {
            cleanup();
            resolve(true);
            return;
          }

          // Set timeout for the next event
          eventTimeoutId = setTimeout(() => {
            cleanup();
            if (rejectOnTimeout) {
              reject(new Error(`Timed out waiting for event '${eventSequence[currentIndex]}' after ${maxTimeBetweenEvents}ms`));
            } else {
              resolve(false);
            }
          }, maxTimeBetweenEvents);
        }
      };

      // Start listening for the event
      emitter.on(eventName, eventListeners[eventName]);
    }

    // Set up global timeout
    globalTimeoutId = setTimeout(() => {
      cleanup();
      if (rejectOnTimeout) {
        reject(new Error(timeoutMessage));
      } else {
        resolve(false);
      }
    }, timeout);

    // Set up timeout for the first event
    eventTimeoutId = setTimeout(() => {
      cleanup();
      if (rejectOnTimeout) {
        reject(new Error(`Timed out waiting for first event '${eventSequence[0]}' after ${maxTimeBetweenEvents}ms`));
      } else {
        resolve(false);
      }
    }, maxTimeBetweenEvents);
  });
}

/**
 * Waits for multiple events to be emitted in any order
 * 
 * @param emitter The EventEmitter to listen to
 * @param eventNames Array of event names to wait for
 * @param options Configuration options
 * @returns Promise that resolves with a map of event names to event data
 * 
 * @example
 * // Wait for multiple events with a 3 second timeout
 * const events = await waitForMultipleEvents(
 *   eventEmitter, 
 *   ['connected', 'data', 'end'],
 *   { timeout: 3000 }
 * );
 * console.log(events.get('data')); // Access the data event
 */
export async function waitForMultipleEvents<T = any>(
  emitter: EventEmitter,
  eventNames: string[],
  options: WaitForEventOptions = {}
): Promise<Map<string, T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    timeoutMessage = `Timed out waiting for events after ${timeout}ms`,
    predicate,
    rejectOnTimeout = true
  } = options;

  if (eventNames.length === 0) {
    return new Map(); // Empty event list returns empty map
  }

  return new Promise<Map<string, T>>((resolve, reject) => {
    const results = new Map<string, T>();
    const pendingEvents = new Set(eventNames);
    let timeoutId: NodeJS.Timeout;

    // Function to clean up all listeners and timeouts
    const cleanup = () => {
      clearTimeout(timeoutId);
      for (const eventName of eventNames) {
        emitter.removeListener(eventName, eventListeners[eventName]);
      }
    };

    // Create listeners for each event
    const eventListeners: Record<string, (event: T) => void> = {};

    // Set up listeners for each event
    for (const eventName of eventNames) {
      eventListeners[eventName] = (event: T) => {
        // If predicate is provided, check if the event matches
        if (predicate && !predicate(event)) {
          return; // Continue waiting if predicate doesn't match
        }

        // Store the event data
        results.set(eventName, event);
        pendingEvents.delete(eventName);

        // If we've received all events, resolve
        if (pendingEvents.size === 0) {
          cleanup();
          resolve(results);
        }
      };

      // Start listening for the event
      emitter.on(eventName, eventListeners[eventName]);
    }

    // Set up timeout
    timeoutId = setTimeout(() => {
      cleanup();
      if (rejectOnTimeout) {
        reject(new Error(`${timeoutMessage}. Received ${eventNames.length - pendingEvents.size} of ${eventNames.length} events.`));
      } else {
        resolve(results);
      }
    }, timeout);
  });
}

/**
 * Wraps a promise with a timeout
 * 
 * @param promise The promise to wrap
 * @param timeout Timeout in milliseconds
 * @param options Configuration options
 * @returns Promise that resolves with the result of the original promise or rejects with a timeout error
 * 
 * @example
 * // Add a 2 second timeout to a promise
 * try {
 *   const result = await withTimeout(slowOperation(), 2000);
 *   console.log('Operation completed:', result);
 * } catch (error) {
 *   console.error('Operation timed out');
 * }
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  options: WithTimeoutOptions = {}
): Promise<T | null> {
  const {
    timeoutMessage = `Operation timed out after ${timeout}ms`,
    rejectOnTimeout = true
  } = options;

  return new Promise<T | null>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let completed = false;

    // Set up timeout
    timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        if (rejectOnTimeout) {
          reject(new Error(timeoutMessage));
        } else {
          resolve(null);
        }
      }
    }, timeout);

    // Handle the promise
    promise
      .then((result) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      })
      .catch((error) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
  });
}

/**
 * Creates a promise that resolves after a specified delay
 * 
 * @param ms Delay in milliseconds
 * @returns Promise that resolves after the delay
 * 
 * @example
 * // Wait for 1 second
 * await delay(1000);
 * console.log('1 second has passed');
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a promise that resolves after a random delay within a range
 * 
 * @param minMs Minimum delay in milliseconds
 * @param maxMs Maximum delay in milliseconds
 * @returns Promise that resolves after a random delay
 * 
 * @example
 * // Wait for a random time between 500ms and 1500ms
 * await randomDelay(500, 1500);
 * console.log('Random delay completed');
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time it was invoked
 * 
 * @param func The function to debounce
 * @param wait Wait time in milliseconds
 * @param options Configuration options
 * @returns Debounced function
 * 
 * @example
 * // Create a debounced function that logs after 300ms of inactivity
 * const debouncedLog = debounce(console.log, 300);
 * 
 * // These will only log 'three' after 300ms of inactivity
 * debouncedLog('one');
 * debouncedLog('two');
 * debouncedLog('three');
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true } = options;
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;
  let isInvoked = false;

  function invokeFunc() {
    isInvoked = true;
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }
    return result;
  }

  function debounced(this: any, ...args: Parameters<T>): void {
    lastArgs = args;
    lastThis = this;
    isInvoked = false;

    if (timeout === null && leading) {
      invokeFunc();
    }

    clearTimeout(timeout!);

    timeout = setTimeout(() => {
      if (trailing && !isInvoked) {
        invokeFunc();
      }
      timeout = null;
    }, wait);
  }

  return debounced;
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every `wait` milliseconds
 * 
 * @param func The function to throttle
 * @param wait Wait time in milliseconds
 * @param options Configuration options
 * @returns Throttled function
 * 
 * @example
 * // Create a throttled function that logs at most once every 500ms
 * const throttledLog = throttle(console.log, 500);
 * 
 * // Even if called multiple times, this will log at most twice per second
 * setInterval(() => throttledLog('throttled'), 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options;
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;
  let lastCallTime = 0;

  function invokeFunc() {
    const time = Date.now();
    lastCallTime = time;
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = lastThis = null;
    }
    return result;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    return lastCallTime === 0 || timeSinceLastCall >= wait;
  }

  function trailingEdge() {
    timeout = null;
    if (trailing && lastArgs) {
      invokeFunc();
    }
    lastArgs = lastThis = null;
  }

  function throttled(this: any, ...args: Parameters<T>): void {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;

    if (isInvoking) {
      if (timeout === null) {
        lastCallTime = time;
        if (leading) {
          invokeFunc();
        }
      }
    } else if (timeout === null && trailing) {
      timeout = setTimeout(trailingEdge, wait - (time - lastCallTime));
    }
  }

  return throttled;
}

/**
 * Creates a function that executes the provided function at most once
 * 
 * @param func The function to restrict
 * @returns Function that executes at most once
 * 
 * @example
 * // Create a function that can only be called once
 * const initialize = once(() => {
 *   console.log('Initialization code runs only once');
 * });
 * 
 * // This will only log once no matter how many times it's called
 * initialize();
 * initialize();
 * initialize();
 */
export function once<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T> {
  let called = false;
  let result: ReturnType<T>;

  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true;
      result = func.apply(this, args);
    }
    return result;
  };
}

/**
 * Creates a function that executes the provided function only after being called a specified number of times
 * 
 * @param func The function to restrict
 * @param n The number of calls before the function is executed
 * @returns Function that executes after n calls
 * 
 * @example
 * // Create a function that only executes after being called 3 times
 * const afterThreeCalls = after(3, () => {
 *   console.log('Called after 3 invocations');
 * });
 * 
 * afterThreeCalls(); // Nothing happens
 * afterThreeCalls(); // Nothing happens
 * afterThreeCalls(); // Logs: Called after 3 invocations
 */
export function after<T extends (...args: any[]) => any>(
  n: number,
  func: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let count = 0;
  let result: ReturnType<T>;

  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    count += 1;
    if (count >= n) {
      result = func.apply(this, args);
      return result;
    }
    return undefined;
  };
}

/**
 * Creates a function that executes the provided function only before being called a specified number of times
 * 
 * @param func The function to restrict
 * @param n The number of calls before the function stops executing
 * @returns Function that executes before n calls
 * 
 * @example
 * // Create a function that only executes for the first 3 calls
 * const beforeFourCalls = before(4, (count) => {
 *   console.log(`Called ${count} times`);
 * });
 * 
 * beforeFourCalls(1); // Logs: Called 1 times
 * beforeFourCalls(2); // Logs: Called 2 times
 * beforeFourCalls(3); // Logs: Called 3 times
 * beforeFourCalls(4); // Nothing happens
 */
export function before<T extends (...args: any[]) => any>(
  n: number,
  func: T
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let count = 0;
  let result: ReturnType<T>;

  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    count += 1;
    if (count < n) {
      result = func.apply(this, args);
      return result;
    }
    return undefined;
  };
}

/**
 * Creates a function that executes the provided function only when it's called with different arguments
 * 
 * @param func The function to restrict
 * @param resolver Optional function to resolve the cache key
 * @returns Function that only executes when called with new arguments
 * 
 * @example
 * // Create a function that only executes when called with new arguments
 * let callCount = 0;
 * const onlyUnique = onlyWhen((a, b) => {
 *   callCount++;
 *   return a + b;
 * });
 * 
 * onlyUnique(1, 2); // callCount: 1, returns: 3
 * onlyUnique(1, 2); // callCount: 1, returns: 3 (cached)
 * onlyUnique(2, 3); // callCount: 2, returns: 5
 */
export function onlyWhen<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => any
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Creates a function that executes the provided function only when a condition is met
 * 
 * @param func The function to restrict
 * @param condition The condition function that determines when to execute
 * @returns Function that only executes when condition is met
 * 
 * @example
 * // Create a function that only executes when the condition is true
 * const logIfPositive = executeWhen(
 *   (x) => console.log(`Processing ${x}`),
 *   (x) => x > 0
 * );
 * 
 * logIfPositive(-5); // Nothing happens
 * logIfPositive(10); // Logs: Processing 10
 */
export function executeWhen<T extends (...args: any[]) => any>(
  func: T,
  condition: (...args: Parameters<T>) => boolean
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    if (condition.apply(this, args)) {
      return func.apply(this, args);
    }
    return undefined;
  };
}

/**
 * Creates a function that retries the provided function until it succeeds or reaches the maximum retries
 * 
 * @param func The function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay between retries in milliseconds
 * @param backoffFactor Factor to increase delay by after each retry (for exponential backoff)
 * @returns Function that retries until success or max retries
 * 
 * @example
 * // Create a function that retries up to 3 times with exponential backoff
 * const reliableOperation = withRetry(
 *   async () => {
 *     // Some operation that might fail
 *     if (Math.random() < 0.7) throw new Error('Failed');
 *     return 'Success';
 *   },
 *   3,
 *   100,
 *   2
 * );
 * 
 * try {
 *   const result = await reliableOperation();
 *   console.log(result); // 'Success' if it eventually succeeded
 * } catch (error) {
 *   console.error('All retries failed');
 * }
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  func: T,
  maxRetries: number = 3,
  delayMs: number = 100,
  backoffFactor: number = 1
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    let lastError: any;
    let currentDelay = delayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await func.apply(this, args);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await delay(currentDelay);
          currentDelay *= backoffFactor;
        }
      }
    }

    throw lastError;
  };
}

/**
 * Creates a function that executes the provided function with a timeout
 * 
 * @param func The function to execute
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Custom error message for timeout
 * @returns Function that executes with a timeout
 * 
 * @example
 * // Create a function that times out after 1 second
 * const timedOperation = withFunctionTimeout(
 *   async () => {
 *     await delay(2000); // This will cause a timeout
 *     return 'Done';
 *   },
 *   1000,
 *   'Operation took too long'
 * );
 * 
 * try {
 *   await timedOperation();
 * } catch (error) {
 *   console.error(error.message); // 'Operation took too long'
 * }
 */
export function withFunctionTimeout<T extends (...args: any[]) => Promise<any>>(
  func: T,
  timeoutMs: number,
  timeoutMessage: string = `Operation timed out after ${timeoutMs}ms`
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return withTimeout(func.apply(this, args), timeoutMs, {
      timeoutMessage,
      rejectOnTimeout: true
    }) as Promise<ReturnType<T>>;
  };
}