/**
 * Common test helper functions used across all utility categories.
 * Provides test context management, test data cleanup, spy/mock utilities,
 * and shared assertion enhancements to ensure consistent testing patterns
 * and reduce code duplication across all utility test suites.
 */

import { afterEach, beforeEach, jest } from '@jest/globals';

/**
 * Test context interface for managing test state and cleanup
 */
export interface TestContext<T = any> {
  /** Test-specific data that needs to be tracked */
  data: T;
  /** Array of cleanup functions to run after each test */
  cleanupFns: Array<() => void | Promise<void>>;
  /** Add a cleanup function to be executed after the test */
  addCleanup: (fn: () => void | Promise<void>) => void;
  /** Reset the context data */
  reset: () => void;
}

/**
 * Creates a test context for managing test state and cleanup
 * @param initialData - Optional initial data for the context
 * @returns A TestContext object with data management and cleanup capabilities
 * 
 * @example
 * ```typescript
 * // In your test file:
 * const testContext = createTestContext<{ userId: string }>();
 * 
 * beforeEach(() => {
 *   testContext.data.userId = 'test-123';
 * });
 * 
 * afterEach(() => {
 *   testContext.reset();
 * });
 * 
 * test('should do something with context', () => {
 *   // Use testContext.data.userId
 *   // Add cleanup if needed: testContext.addCleanup(() => { ... });
 * });
 * ```
 */
export function createTestContext<T extends object = Record<string, any>>(
  initialData: T = {} as T
): TestContext<T> {
  const context: TestContext<T> = {
    data: { ...initialData },
    cleanupFns: [],
    addCleanup: (fn) => {
      context.cleanupFns.push(fn);
    },
    reset: () => {
      context.data = { ...initialData };
      context.cleanupFns = [];
    },
  };

  // Register the afterEach hook to run all cleanup functions
  afterEach(async () => {
    for (const cleanup of context.cleanupFns) {
      await cleanup();
    }
    context.cleanupFns = [];
  });

  return context;
}

/**
 * Creates a temporary value that will be reset after each test
 * @param initialValue - The initial value
 * @returns An object with get/set methods and automatic cleanup
 * 
 * @example
 * ```typescript
 * // In your test file:
 * const tempApiKey = createTempValue('default-key');
 * 
 * test('should use custom API key', () => {
 *   tempApiKey.set('custom-key');
 *   // Test with custom key
 *   expect(tempApiKey.get()).toBe('custom-key');
 * });
 * 
 * test('should use default API key again', () => {
 *   // Value is reset between tests
 *   expect(tempApiKey.get()).toBe('default-key');
 * });
 * ```
 */
export function createTempValue<T>(initialValue: T) {
  let value = initialValue;
  const originalValue = initialValue;

  beforeEach(() => {
    value = originalValue;
  });

  return {
    get: () => value,
    set: (newValue: T) => {
      value = newValue;
    },
  };
}

/**
 * Type for a mock function with implementation
 */
export type MockFn<T extends (...args: any[]) => any> = jest.MockedFunction<T> & {
  mockImplementation: (fn: T) => MockFn<T>;
};

/**
 * Creates a typed mock function with optional implementation
 * @param implementation - Optional function implementation
 * @returns A typed mock function
 * 
 * @example
 * ```typescript
 * // In your test file:
 * interface User { id: string; name: string; }
 * 
 * const mockGetUser = createMockFn<(id: string) => Promise<User>>();
 * mockGetUser.mockImplementation(async (id) => ({ id, name: 'Test User' }));
 * 
 * test('should fetch user', async () => {
 *   const user = await mockGetUser('123');
 *   expect(user.name).toBe('Test User');
 *   expect(mockGetUser).toHaveBeenCalledWith('123');
 * });
 * ```
 */
export function createMockFn<T extends (...args: any[]) => any>(
  implementation?: T
): MockFn<T> {
  if (implementation) {
    return jest.fn(implementation) as MockFn<T>;
  }
  return jest.fn() as MockFn<T>;
}

/**
 * Creates a spy on an object method with automatic restoration
 * @param obj - The object containing the method
 * @param method - The method name to spy on
 * @returns The Jest spy function
 * 
 * @example
 * ```typescript
 * // In your test file:
 * const service = { getData: () => 'original' };
 * 
 * test('should spy on getData', () => {
 *   const spy = createSpy(service, 'getData');
 *   spy.mockReturnValue('mocked');
 *   
 *   expect(service.getData()).toBe('mocked');
 *   expect(spy).toHaveBeenCalled();
 * });
 * 
 * test('should restore original implementation', () => {
 *   // Method is restored between tests
 *   expect(service.getData()).toBe('original');
 * });
 * ```
 */
export function createSpy<T extends object, K extends keyof T>(
  obj: T,
  method: K
): jest.SpyInstance {
  const spy = jest.spyOn(obj, method);
  
  afterEach(() => {
    spy.mockRestore();
  });
  
  return spy;
}

/**
 * Mocks a module with automatic restoration after tests
 * @param modulePath - The path to the module to mock
 * @param factory - Factory function that returns the mock implementation
 * 
 * @example
 * ```typescript
 * // In your test file:
 * mockModule('../path/to/module', () => ({
 *   someFunction: jest.fn().mockReturnValue('mocked'),
 *   someValue: 'test'
 * }));
 * 
 * test('should use mocked module', () => {
 *   const module = require('../path/to/module');
 *   expect(module.someFunction()).toBe('mocked');
 * });
 * ```
 */
export function mockModule<T extends object>(
  modulePath: string,
  factory: () => T
): void {
  const mockImplementation = factory();
  
  jest.mock(modulePath, () => mockImplementation, { virtual: true });
  
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });
}

/**
 * Suppresses console methods during test execution with automatic restoration
 * @param methods - Array of console methods to suppress
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should not log errors to console', () => {
 *   suppressConsole(['error', 'warn']);
 *   
 *   // These won't appear in the test output
 *   console.error('Test error');
 *   console.warn('Test warning');
 * });
 * ```
 */
export function suppressConsole(
  methods: Array<'log' | 'error' | 'warn' | 'info' | 'debug'> = ['log', 'error', 'warn', 'info', 'debug']
): void {
  const originalMethods: Record<string, any> = {};
  
  beforeEach(() => {
    methods.forEach(method => {
      originalMethods[method] = console[method];
      console[method] = jest.fn();
    });
  });
  
  afterEach(() => {
    methods.forEach(method => {
      console[method] = originalMethods[method];
    });
  });
}

/**
 * Runs a function with a timeout, rejecting if it takes too long
 * @param fn - The function to run (can be async)
 * @param timeoutMs - Timeout in milliseconds
 * @param timeoutMessage - Optional custom timeout message
 * @returns Promise that resolves with the function result or rejects on timeout
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should complete within timeout', async () => {
 *   const result = await withTimeout(
 *     () => someAsyncOperation(),
 *     1000,
 *     'Operation timed out'
 *   );
 *   expect(result).toBeDefined();
 * });
 * ```
 */
export async function withTimeout<T>(
  fn: () => T | Promise<T>,
  timeoutMs: number,
  timeoutMessage = `Operation timed out after ${timeoutMs}ms`
): Promise<T> {
  return new Promise<T>(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
    
    try {
      const result = await fn();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

/**
 * Creates a deferred promise that can be resolved or rejected externally
 * @returns A deferred promise object with resolve and reject methods
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should resolve deferred promise', async () => {
 *   const deferred = createDeferred<string>();
 *   
 *   // Resolve after a delay
 *   setTimeout(() => deferred.resolve('success'), 100);
 *   
 *   const result = await deferred.promise;
 *   expect(result).toBe('success');
 * });
 * ```
 */
export function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Waits for a specified condition to be true
 * @param condition - Function that returns true when the condition is met
 * @param options - Wait options including timeout, interval, and message
 * @returns Promise that resolves when condition is true or rejects on timeout
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should wait for condition', async () => {
 *   let value = 0;
 *   setTimeout(() => { value = 42; }, 100);
 *   
 *   await waitForCondition(() => value === 42);
 *   expect(value).toBe(42);
 * });
 * ```
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    message?: string;
  } = {}
): Promise<void> {
  const {
    timeoutMs = 5000,
    intervalMs = 50,
    message = `Condition not met within ${timeoutMs}ms`,
  } = options;
  
  return withTimeout(
    async () => {
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        if (await condition()) {
          return;
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
      throw new Error(message);
    },
    timeoutMs + 100, // Add a small buffer to the timeout
    message
  );
}

/**
 * Measures the execution time of a function
 * @param fn - The function to measure (can be async)
 * @returns Promise that resolves with the result and execution time
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should measure execution time', async () => {
 *   const { result, executionTime } = await measureExecutionTime(
 *     () => someOperation()
 *   );
 *   
 *   expect(result).toBeDefined();
 *   expect(executionTime).toBeGreaterThan(0);
 * });
 * ```
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const startTime = Date.now();
  const result = await fn();
  const executionTime = Date.now() - startTime;
  
  return { result, executionTime };
}

/**
 * Creates a function that counts the number of times it's been called
 * @param implementation - Optional function implementation
 * @returns A function with a getCallCount method
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should count function calls', () => {
 *   const counter = createCallCounter((x: number) => x * 2);
 *   
 *   expect(counter(5)).toBe(10);
 *   expect(counter(3)).toBe(6);
 *   expect(counter.getCallCount()).toBe(2);
 *   
 *   counter.resetCallCount();
 *   expect(counter.getCallCount()).toBe(0);
 * });
 * ```
 */
export function createCallCounter<T extends (...args: any[]) => any>(
  implementation?: T
): T & { getCallCount: () => number; resetCallCount: () => void } {
  let callCount = 0;
  
  const fn = ((...args: any[]) => {
    callCount++;
    return implementation?.(...args);
  }) as T;
  
  return Object.assign(fn, {
    getCallCount: () => callCount,
    resetCallCount: () => {
      callCount = 0;
    },
  });
}

/**
 * Creates a function that records its call history
 * @param implementation - Optional function implementation
 * @returns A function with methods to access call history
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should record call history', () => {
 *   const recorder = createCallRecorder((x: number, y: string) => x + y);
 *   
 *   recorder(1, 'a');
 *   recorder(2, 'b');
 *   
 *   expect(recorder.getCalls()).toEqual([
 *     { args: [1, 'a'], result: '1a' },
 *     { args: [2, 'b'], result: '2b' }
 *   ]);
 *   
 *   expect(recorder.getLastCall()).toEqual({ args: [2, 'b'], result: '2b' });
 * });
 * ```
 */
export function createCallRecorder<T extends (...args: any[]) => any>(
  implementation?: T
): T & {
  getCalls: () => Array<{ args: Parameters<T>; result: ReturnType<T> }>;
  getLastCall: () => { args: Parameters<T>; result: ReturnType<T> } | undefined;
  clearCalls: () => void;
} {
  const calls: Array<{ args: Parameters<T>; result: ReturnType<T> }> = [];
  
  const fn = ((...args: any[]) => {
    const result = implementation?.(...args);
    calls.push({ args: args as Parameters<T>, result: result as ReturnType<T> });
    return result;
  }) as T;
  
  return Object.assign(fn, {
    getCalls: () => [...calls],
    getLastCall: () => calls.length > 0 ? calls[calls.length - 1] : undefined,
    clearCalls: () => {
      calls.length = 0;
    },
  });
}

/**
 * Creates a mock timer that can be advanced manually
 * @returns A mock timer object with methods to control time
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should use mock timer', () => {
 *   const timer = createMockTimer();
 *   
 *   let value = 0;
 *   setTimeout(() => { value = 42; }, 1000);
 *   
 *   // Advance time by 1000ms
 *   timer.advanceTime(1000);
 *   expect(value).toBe(42);
 *   
 *   // Clean up
 *   timer.restore();
 * });
 * ```
 */
export function createMockTimer() {
  jest.useFakeTimers();
  
  const timer = {
    advanceTime: (ms: number) => {
      jest.advanceTimersByTime(ms);
    },
    runAllTimers: () => {
      jest.runAllTimers();
    },
    runOnlyPendingTimers: () => {
      jest.runOnlyPendingTimers();
    },
    restore: () => {
      jest.useRealTimers();
    },
  };
  
  afterEach(() => {
    timer.restore();
  });
  
  return timer;
}

/**
 * Creates a mock date that can be set to specific values
 * @param initialDate - Optional initial date
 * @returns A mock date object with methods to control the current date
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should use mock date', () => {
 *   const mockDate = createMockDate(new Date('2023-01-01'));
 *   
 *   expect(new Date().toISOString().substring(0, 10)).toBe('2023-01-01');
 *   
 *   // Change the date
 *   mockDate.setDate(new Date('2023-06-15'));
 *   expect(new Date().toISOString().substring(0, 10)).toBe('2023-06-15');
 *   
 *   // Clean up is automatic after each test
 * });
 * ```
 */
export function createMockDate(initialDate?: Date) {
  const RealDate = global.Date;
  const currentDate = initialDate || new Date();
  
  class MockDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(currentDate);
      } else {
        super(...args);
      }
    }
    
    static now() {
      return new MockDate().getTime();
    }
  }
  
  global.Date = MockDate as DateConstructor;
  
  const mockDateControl = {
    setDate: (date: Date) => {
      currentDate.setTime(date.getTime());
    },
    advanceTime: (ms: number) => {
      currentDate.setTime(currentDate.getTime() + ms);
    },
    restore: () => {
      global.Date = RealDate;
    },
  };
  
  afterEach(() => {
    mockDateControl.restore();
  });
  
  return mockDateControl;
}

/**
 * Creates a retry mechanism for flaky tests
 * @param options - Retry options including attempts and delay
 * @returns A function that will retry the test function until it succeeds or max attempts are reached
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should retry flaky test', async () => {
 *   let attempts = 0;
 *   
 *   await createRetry({ maxAttempts: 3 })(
 *     () => {
 *       attempts++;
 *       if (attempts < 3) {
 *         throw new Error('Flaky test failed');
 *       }
 *       return 'success';
 *     }
 *   );
 *   
 *   expect(attempts).toBe(3);
 * });
 * ```
 */
export function createRetry(options: {
  maxAttempts?: number;
  delayMs?: number;
} = {}) {
  const { maxAttempts = 3, delayMs = 100 } = options;
  
  return async <T>(fn: () => T | Promise<T>): Promise<T> => {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    throw lastError || new Error(`Failed after ${maxAttempts} attempts`);
  };
}

/**
 * Creates a test environment with controlled process.env variables
 * @param initialEnv - Initial environment variables
 * @returns An environment object with methods to control env variables
 * 
 * @example
 * ```typescript
 * // In your test file:
 * test('should use mock environment', () => {
 *   const env = createTestEnvironment({ API_KEY: 'test-key' });
 *   
 *   expect(process.env.API_KEY).toBe('test-key');
 *   
 *   env.set('DEBUG', 'true');
 *   expect(process.env.DEBUG).toBe('true');
 *   
 *   env.unset('API_KEY');
 *   expect(process.env.API_KEY).toBeUndefined();
 *   
 *   // Clean up is automatic after each test
 * });
 * ```
 */
export function createTestEnvironment(initialEnv: Record<string, string> = {}) {
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Reset to original env first
    process.env = { ...originalEnv };
    
    // Apply initial env
    Object.entries(initialEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });
  
  afterEach(() => {
    process.env = { ...originalEnv };
  });
  
  return {
    get: (key: string) => process.env[key],
    set: (key: string, value: string) => {
      process.env[key] = value;
    },
    unset: (key: string) => {
      delete process.env[key];
    },
    reset: () => {
      process.env = { ...originalEnv };
    },
  };
}

/**
 * Creates a test database with automatic cleanup
 * @param setupFn - Function to set up the test database
 * @param teardownFn - Function to tear down the test database
 * @returns A database object with setup and teardown methods
 * 
 * @example
 * ```typescript
 * // In your test file:
 * const testDb = createTestDatabase(
 *   async () => {
 *     // Set up test database
 *     return { client: new DbClient(), id: 'test-db' };
 *   },
 *   async (db) => {
 *     // Clean up test database
 *     await db.client.close();
 *   }
 * );
 * 
 * beforeAll(async () => {
 *   await testDb.setup();
 * });
 * 
 * afterAll(async () => {
 *   await testDb.teardown();
 * });
 * 
 * test('should use test database', async () => {
 *   const result = await testDb.db?.client.query('SELECT * FROM users');
 *   expect(result).toBeDefined();
 * });
 * ```
 */
export function createTestDatabase<T>(
  setupFn: () => Promise<T>,
  teardownFn: (db: T) => Promise<void>
) {
  let db: T | null = null;
  
  return {
    get db() {
      return db;
    },
    setup: async () => {
      db = await setupFn();
      return db;
    },
    teardown: async () => {
      if (db) {
        await teardownFn(db);
        db = null;
      }
    },
  };
}