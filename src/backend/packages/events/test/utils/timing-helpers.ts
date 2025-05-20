/**
 * @file timing-helpers.ts
 * @description Provides utilities for testing asynchronous event processing, including functions for
 * waiting on event delivery, simulating delays, and managing test timeouts. This library simplifies
 * testing of event-driven systems by handling the complexities of async timing, event ordering,
 * and race conditions in test environments.
 *
 * Features:
 * - waitForEvent function to wait for specific events to occur
 * - Event sequence validation for ordered event testing
 * - Timeout management utilities for testing event processing time constraints
 * - Delay functions with controllable timing for simulating network latency
 * - Debounce and throttle test helpers for rate-limited event testing
 *
 * Example usage:
 * ```typescript
 * // Wait for an event to occur
 * await waitForEvent(() => events.length > 0, 'Event was not received');
 * 
 * // Wait for a specific event with a custom timeout
 * await waitForEvent(
 *   () => events.find(e => e.type === 'ACHIEVEMENT_UNLOCKED'),
 *   'Achievement event not received',
 *   5000
 * );
 * 
 * // Validate event sequence
 * await validateEventSequence(
 *   events,
 *   ['METRIC_RECORDED', 'GOAL_PROGRESS_UPDATED', 'ACHIEVEMENT_UNLOCKED'],
 *   e => e.type
 * );
 * ```
 */

import { KafkaTestClient } from './kafka-test-client';

/**
 * Options for the waitForEvent function.
 */
export interface WaitForEventOptions {
  /**
   * Timeout in milliseconds before failing the wait.
   * @default 5000
   */
  timeout?: number;

  /**
   * Interval in milliseconds between condition checks.
   * @default 10
   */
  checkInterval?: number;

  /**
   * Whether to throw an error if the timeout is reached.
   * @default true
   */
  throwOnTimeout?: boolean;

  /**
   * Optional callback to execute on each check interval.
   */
  onCheck?: () => void;

  /**
   * Optional callback to execute when the condition is met.
   */
  onSuccess?: () => void;

  /**
   * Optional callback to execute when the timeout is reached.
   */
  onTimeout?: () => void;
}

/**
 * Default options for the waitForEvent function.
 */
const DEFAULT_WAIT_OPTIONS: Required<WaitForEventOptions> = {
  timeout: 5000,
  checkInterval: 10,
  throwOnTimeout: true,
  onCheck: () => {},
  onSuccess: () => {},
  onTimeout: () => {},
};

/**
 * Waits for a condition to be met, typically used to wait for an event to occur.
 * 
 * @param condition Function that returns true when the condition is met
 * @param timeoutMessage Message to use in the error if the timeout is reached
 * @param options Additional options for the wait operation
 * @returns A promise that resolves when the condition is met or rejects on timeout
 * 
 * @example
 * // Wait for an event to be received
 * await waitForEvent(() => events.length > 0, 'No events received');
 * 
 * // Wait with custom timeout and callbacks
 * await waitForEvent(
 *   () => events.find(e => e.type === 'GOAL_ACHIEVED'),
 *   'Goal achievement event not received',
 *   {
 *     timeout: 10000,
 *     onSuccess: () => console.log('Goal achieved event received!'),
 *     onTimeout: () => console.error('Timed out waiting for goal achievement')
 *   }
 * );
 */
export async function waitForEvent(
  condition: () => boolean,
  timeoutMessage: string,
  optionsOrTimeout?: WaitForEventOptions | number
): Promise<boolean> {
  // Handle the case where the third parameter is a number (timeout)
  const options: Required<WaitForEventOptions> = typeof optionsOrTimeout === 'number'
    ? { ...DEFAULT_WAIT_OPTIONS, timeout: optionsOrTimeout }
    : { ...DEFAULT_WAIT_OPTIONS, ...(optionsOrTimeout || {}) };

  const { timeout, checkInterval, throwOnTimeout, onCheck, onSuccess, onTimeout } = options;
  const startTime = Date.now();

  while (!condition()) {
    // Check if we've exceeded the timeout
    if (Date.now() - startTime > timeout) {
      onTimeout();
      if (throwOnTimeout) {
        throw new Error(timeoutMessage);
      }
      return false;
    }

    // Execute the check callback
    onCheck();

    // Wait before checking again
    await delay(checkInterval);
  }

  // Condition was met
  onSuccess();
  return true;
}

/**
 * Waits for a specific number of events to be processed by a Kafka test client.
 * 
 * @param client The KafkaTestClient instance
 * @param topic The topic to wait for events on
 * @param count The number of processed events to wait for
 * @param options Additional options for the wait operation
 * @returns A promise that resolves when the condition is met or rejects on timeout
 * 
 * @example
 * // Wait for 3 events to be processed on the 'health.metrics' topic
 * await waitForProcessedEvents(kafkaClient, 'health.metrics', 3);
 */
export async function waitForProcessedEvents(
  client: KafkaTestClient,
  topic: string,
  count: number,
  options?: WaitForEventOptions
): Promise<boolean> {
  return waitForEvent(
    () => client.getProcessedMessages(topic).length >= count,
    `Timed out waiting for ${count} processed events on topic ${topic}`,
    options
  );
}

/**
 * Waits for a specific number of events to be sent to the dead letter queue.
 * 
 * @param client The KafkaTestClient instance
 * @param count The number of DLQ events to wait for
 * @param options Additional options for the wait operation
 * @returns A promise that resolves when the condition is met or rejects on timeout
 * 
 * @example
 * // Wait for 2 events to be sent to the DLQ
 * await waitForDLQEvents(kafkaClient, 2);
 */
export async function waitForDLQEvents(
  client: KafkaTestClient,
  count: number,
  options?: WaitForEventOptions
): Promise<boolean> {
  return waitForEvent(
    () => client.getDLQMessages().length >= count,
    `Timed out waiting for ${count} events in the dead letter queue`,
    options
  );
}

/**
 * Options for the validateEventSequence function.
 */
export interface EventSequenceOptions {
  /**
   * Whether to require exact sequence matching (no additional events between expected events).
   * @default false
   */
  exactSequence?: boolean;

  /**
   * Whether to require all expected events to be present.
   * @default true
   */
  requireAllEvents?: boolean;

  /**
   * Timeout in milliseconds to wait for the sequence to be completed.
   * @default 5000
   */
  timeout?: number;
}

/**
 * Validates that events occurred in the expected sequence.
 * 
 * @param events Array of events to validate
 * @param expectedSequence Array of expected event identifiers in order
 * @param eventIdentifier Function to extract the identifier from an event
 * @param options Additional options for sequence validation
 * @returns A promise that resolves when the sequence is validated or rejects if invalid
 * 
 * @example
 * // Validate that events occurred in the expected sequence
 * await validateEventSequence(
 *   events,
 *   ['METRIC_RECORDED', 'GOAL_PROGRESS_UPDATED', 'ACHIEVEMENT_UNLOCKED'],
 *   event => event.type
 * );
 * 
 * // Validate with custom options
 * await validateEventSequence(
 *   events,
 *   ['LOGIN', 'VIEW_PROFILE', 'LOGOUT'],
 *   event => event.action,
 *   { exactSequence: true }
 * );
 */
export async function validateEventSequence<T, K>(
  events: T[],
  expectedSequence: K[],
  eventIdentifier: (event: T) => K,
  options: EventSequenceOptions = {}
): Promise<boolean> {
  const {
    exactSequence = false,
    requireAllEvents = true,
    timeout = 5000
  } = options;

  // If we need to wait for events, set up a promise
  if (requireAllEvents && events.length < expectedSequence.length) {
    await waitForEvent(
      () => events.length >= expectedSequence.length,
      `Timed out waiting for ${expectedSequence.length} events (received ${events.length})`,
      { timeout }
    );
  }

  // Map events to their identifiers
  const eventIds = events.map(eventIdentifier);

  if (exactSequence) {
    // For exact sequence, we need the same number of events and they must match exactly
    if (requireAllEvents && eventIds.length !== expectedSequence.length) {
      throw new Error(
        `Expected exactly ${expectedSequence.length} events, but got ${eventIds.length}`
      );
    }

    // Check if the sequences match (up to the expected sequence length)
    const sequenceToCheck = requireAllEvents ? eventIds : eventIds.slice(0, expectedSequence.length);
    const sequenceMatches = sequenceToCheck.every(
      (id, index) => id === expectedSequence[index]
    );

    if (!sequenceMatches) {
      throw new Error(
        `Event sequence does not match expected sequence. ` +
        `Expected: ${JSON.stringify(expectedSequence)}, ` +
        `Actual: ${JSON.stringify(sequenceToCheck)}`
      );
    }

    return true;
  } else {
    // For non-exact sequence, we check that the expected events occur in order,
    // but allow other events in between
    let expectedIndex = 0;
    let lastFoundIndex = -1;

    for (const expected of expectedSequence) {
      // Find the next occurrence of the expected event after the last found index
      const foundIndex = eventIds.findIndex(
        (id, index) => index > lastFoundIndex && id === expected
      );

      if (foundIndex === -1) {
        if (requireAllEvents) {
          throw new Error(
            `Expected event ${JSON.stringify(expected)} not found in sequence after ` +
            `index ${lastFoundIndex}. Events: ${JSON.stringify(eventIds)}`
          );
        }
        return false;
      }

      lastFoundIndex = foundIndex;
      expectedIndex++;
    }

    return true;
  }
}

/**
 * Creates a promise that resolves after the specified delay.
 * 
 * @param ms Delay in milliseconds
 * @returns A promise that resolves after the delay
 * 
 * @example
 * // Wait for 100ms
 * await delay(100);
 * 
 * // Use in a test to simulate network latency
 * test('handles delayed response', async () => {
 *   // Arrange
 *   const service = new MyService();
 *   
 *   // Act
 *   const promise = service.fetchData();
 *   await delay(50); // Simulate network delay
 *   
 *   // Assert
 *   expect(service.isLoading).toBe(true);
 *   await promise;
 *   expect(service.isLoading).toBe(false);
 * });
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a controllable delay that can be accelerated for testing.
 * 
 * @param defaultDelay Default delay in milliseconds
 * @returns An object with delay function and control methods
 * 
 * @example
 * // Create a controllable delay
 * const { wait, accelerate, reset } = createControllableDelay(1000);
 * 
 * // Normal usage (waits 1000ms)
 * await wait();
 * 
 * // Accelerate time for testing (will wait only 10ms)
 * accelerate(100); // 100x faster
 * await wait();
 * 
 * // Reset to default
 * reset();
 * await wait(); // Back to 1000ms
 */
export function createControllableDelay(defaultDelay: number) {
  let timeScale = 1;
  let currentDelay = defaultDelay;

  return {
    /**
     * Waits for the configured delay.
     * @param overrideMs Optional override for this specific delay
     * @returns A promise that resolves after the delay
     */
    wait: (overrideMs?: number): Promise<void> => {
      const delayMs = overrideMs !== undefined ? overrideMs : currentDelay;
      return delay(delayMs / timeScale);
    },

    /**
     * Accelerates time by the specified factor.
     * @param factor The factor to accelerate time by (e.g., 10 = 10x faster)
     */
    accelerate: (factor: number): void => {
      if (factor <= 0) {
        throw new Error('Acceleration factor must be greater than 0');
      }
      timeScale = factor;
      currentDelay = defaultDelay;
    },

    /**
     * Sets a specific delay, ignoring the time scale.
     * @param ms The delay in milliseconds
     */
    setDelay: (ms: number): void => {
      if (ms < 0) {
        throw new Error('Delay must be non-negative');
      }
      currentDelay = ms;
    },

    /**
     * Resets to the default delay and time scale.
     */
    reset: (): void => {
      timeScale = 1;
      currentDelay = defaultDelay;
    },

    /**
     * Returns the current effective delay in milliseconds.
     */
    getCurrentDelay: (): number => currentDelay / timeScale
  };
}

/**
 * Options for the createThrottleHelper function.
 */
export interface ThrottleOptions {
  /**
   * The time window in milliseconds.
   */
  window: number;

  /**
   * Whether to execute the function on the leading edge of the timeout.
   * @default true
   */
  leading?: boolean;

  /**
   * Whether to execute the function on the trailing edge of the timeout.
   * @default true
   */
  trailing?: boolean;
}

/**
 * Creates a throttle testing helper that limits the rate at which a function can fire.
 * 
 * @param options Throttle configuration options
 * @returns An object with throttle function and control methods
 * 
 * @example
 * // Create a throttle helper with a 100ms window
 * const { throttle, getCalls, reset } = createThrottleHelper({ window: 100 });
 * 
 * // Create a throttled function
 * const fn = jest.fn();
 * const throttledFn = throttle(fn);
 * 
 * // Call it multiple times in quick succession
 * throttledFn(1);
 * throttledFn(2);
 * throttledFn(3);
 * 
 * // Wait for all calls to complete
 * await delay(200);
 * 
 * // Check how many times the function was called
 * expect(getCalls()).toEqual([1, 3]); // Only first and last calls executed
 */
export function createThrottleHelper(options: ThrottleOptions) {
  const { window, leading = true, trailing = true } = options;
  const calls: any[][] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: any[] | null = null;

  return {
    /**
     * Creates a throttled version of the provided function.
     * @param fn The function to throttle
     * @returns A throttled function
     */
    throttle: <T extends (...args: any[]) => any>(fn: T): ((...args: Parameters<T>) => void) => {
      return (...args: Parameters<T>): void => {
        const now = Date.now();
        const remaining = window - (now - lastCallTime);

        // Store the latest arguments
        lastArgs = args;

        // If we haven't called recently or this is the first call with leading=true
        if (remaining <= 0 || remaining > window) {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          if (leading) {
            lastCallTime = now;
            const result = fn(...args);
            calls.push(args);
            lastArgs = null;
            return result;
          }
        } else if (!timeoutId && trailing && lastArgs) {
          // Schedule a trailing call
          timeoutId = setTimeout(() => {
            lastCallTime = Date.now();
            timeoutId = null;
            if (lastArgs) {
              const result = fn(...lastArgs);
              calls.push(lastArgs);
              lastArgs = null;
              return result;
            }
          }, remaining);
        }
      };
    },

    /**
     * Gets the arguments of all calls that were actually executed.
     * @returns Array of call arguments
     */
    getCalls: (): any[][] => [...calls],

    /**
     * Gets the number of calls that were actually executed.
     * @returns Number of calls
     */
    getCallCount: (): number => calls.length,

    /**
     * Resets the throttle helper state.
     */
    reset: (): void => {
      calls.length = 0;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = 0;
      lastArgs = null;
    },

    /**
     * Waits for any pending trailing calls to complete.
     * @returns A promise that resolves when all pending calls are complete
     */
    flush: async (): Promise<void> => {
      if (timeoutId) {
        await delay(window);
      }
    }
  };
}

/**
 * Options for the createDebounceHelper function.
 */
export interface DebounceOptions {
  /**
   * The wait time in milliseconds.
   */
  wait: number;

  /**
   * Whether to invoke the function on the leading edge of the timeout.
   * @default false
   */
  leading?: boolean;

  /**
   * Maximum time the function is allowed to be delayed.
   */
  maxWait?: number;
}

/**
 * Creates a debounce testing helper that groups multiple sequential calls into a single execution.
 * 
 * @param options Debounce configuration options
 * @returns An object with debounce function and control methods
 * 
 * @example
 * // Create a debounce helper with a 100ms wait
 * const { debounce, getCalls, reset } = createDebounceHelper({ wait: 100 });
 * 
 * // Create a debounced function
 * const fn = jest.fn();
 * const debouncedFn = debounce(fn);
 * 
 * // Call it multiple times in quick succession
 * debouncedFn(1);
 * debouncedFn(2);
 * debouncedFn(3);
 * 
 * // Wait for the debounced call to execute
 * await delay(150);
 * 
 * // Check how many times the function was called
 * expect(getCalls()).toEqual([[3]]); // Only called once with the last value
 */
export function createDebounceHelper(options: DebounceOptions) {
  const { wait, leading = false, maxWait } = options;
  const calls: any[][] = [];
  let timeoutId: NodeJS.Timeout | null = null;
  let maxTimeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: any[] | null = null;
  let result: any;

  return {
    /**
     * Creates a debounced version of the provided function.
     * @param fn The function to debounce
     * @returns A debounced function
     */
    debounce: <T extends (...args: any[]) => any>(fn: T): ((...args: Parameters<T>) => any) => {
      const invokeFunc = (time: number) => {
        const args = lastArgs!;
        lastArgs = null;
        lastCallTime = time;
        result = fn(...args);
        calls.push(args);
        return result;
      };

      const startTimer = (pendingFunc: () => any, wait: number) => {
        return setTimeout(pendingFunc, wait);
      };

      const cancelTimers = () => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        if (maxTimeoutId !== null) {
          clearTimeout(maxTimeoutId);
        }
        timeoutId = maxTimeoutId = null;
      };

      return function(this: any, ...args: Parameters<T>): any {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastCallTime = time;

        if (isInvoking) {
          if (timeoutId === null && leading) {
            return invokeFunc(lastCallTime);
          }
          if (maxWait !== undefined) {
            maxTimeoutId = startTimer(() => {
              invokeFunc(Date.now());
            }, maxWait);
          }
        }
        if (timeoutId === null) {
          timeoutId = startTimer(() => {
            invokeFunc(Date.now());
          }, wait);
        }
        return result;
      };

      function shouldInvoke(time: number): boolean {
        return (
          lastCallTime === 0 || // First call
          (maxWait !== undefined && time - lastCallTime >= maxWait) // Exceeded maxWait
        );
      }
    },

    /**
     * Gets the arguments of all calls that were actually executed.
     * @returns Array of call arguments
     */
    getCalls: (): any[][] => [...calls],

    /**
     * Gets the number of calls that were actually executed.
     * @returns Number of calls
     */
    getCallCount: (): number => calls.length,

    /**
     * Resets the debounce helper state.
     */
    reset: (): void => {
      calls.length = 0;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (maxTimeoutId !== null) {
        clearTimeout(maxTimeoutId);
      }
      timeoutId = maxTimeoutId = null;
      lastCallTime = 0;
      lastArgs = null;
    },

    /**
     * Immediately executes any pending debounced calls.
     * @returns The result of the function call, if any
     */
    flush: (): any => {
      if (timeoutId !== null) {
        const result = lastArgs ? invokeFunc(Date.now()) : undefined;
        timeoutId = maxTimeoutId = null;
        return result;
      }
      return result;
    }
  };

  function invokeFunc(time: number): any {
    const args = lastArgs!;
    lastArgs = null;
    lastCallTime = time;
    result = fn(...args);
    calls.push(args);
    return result;
  }
}

/**
 * Creates a timeout that can be used to test timeout handling.
 * 
 * @param ms Timeout in milliseconds
 * @param message Optional error message
 * @returns An object with timeout control methods
 * 
 * @example
 * // Create a timeout for 1000ms
 * const { promise, cancel, trigger, extend } = createTimeout(1000, 'Operation timed out');
 * 
 * // Use in a test
 * test('handles timeout', async () => {
 *   // Arrange
 *   const operation = new SlowOperation();
 *   
 *   // Act & Assert
 *   const operationPromise = operation.execute();
 *   await expect(Promise.race([operationPromise, promise])).rejects.toThrow('Operation timed out');
 * });
 * 
 * // Or manually trigger the timeout
 * test('handles manual timeout', async () => {
 *   // Arrange
 *   const operation = new SlowOperation();
 *   
 *   // Act
 *   const operationPromise = operation.execute();
 *   trigger(); // Manually trigger timeout
 *   
 *   // Assert
 *   await expect(Promise.race([operationPromise, promise])).rejects.toThrow('Operation timed out');
 * });
 */
export function createTimeout(ms: number, message = 'Timeout') {
  let timeoutId: NodeJS.Timeout | null = null;
  let resolve: (() => void) | null = null;
  let reject: ((error: Error) => void) | null = null;

  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
    timeoutId = setTimeout(() => {
      if (reject) {
        reject(new Error(message));
      }
    }, ms);
  });

  return {
    /**
     * The timeout promise that rejects when the timeout is reached.
     */
    promise,

    /**
     * Cancels the timeout.
     */
    cancel: (): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (resolve) {
        resolve();
        resolve = null;
        reject = null;
      }
    },

    /**
     * Manually triggers the timeout.
     */
    trigger: (): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (reject) {
        reject(new Error(message));
        resolve = null;
        reject = null;
      }
    },

    /**
     * Extends the timeout by the specified number of milliseconds.
     * @param additionalMs Additional milliseconds to extend the timeout by
     */
    extend: (additionalMs: number): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (reject) {
            reject(new Error(message));
          }
        }, additionalMs);
      }
    },

    /**
     * Resets the timeout to the original duration.
     */
    reset: (): void => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        if (reject) {
          reject(new Error(message));
        }
      }, ms);
    },

    /**
     * Checks if the timeout is still active.
     * @returns True if the timeout is still active, false otherwise
     */
    isActive: (): boolean => timeoutId !== null
  };
}