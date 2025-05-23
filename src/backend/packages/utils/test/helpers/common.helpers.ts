/**
 * Common Test Helpers
 * 
 * Provides shared test helper functions used across all utility categories, including:
 * - Test context management
 * - Test data cleanup
 * - Spy/mock utilities
 * - Shared assertion enhancements
 * 
 * These helpers ensure consistent testing patterns and reduce code duplication
 * across all utility test suites.
 */

import { Mock } from 'jest-mock';

/**
 * Test context for managing test state and cleanup
 */
export interface TestContext {
  /** Cleanup functions to run after the test */
  cleanupFns: Array<() => void | Promise<void>>;
  /** Test-specific data storage */
  data: Record<string, any>;
  /** Mocks created for this test */
  mocks: Record<string, jest.Mock>;
  /** Spies created for this test */
  spies: Record<string, jest.SpyInstance>;
  /** Timers created for this test */
  timers: Array<NodeJS.Timeout>;
}

/**
 * Creates a new test context for managing test state and cleanup
 * 
 * @returns A new test context object
 * 
 * @example
 * ```ts
 * describe('MyUtility', () => {
 *   let context: TestContext;
 *   
 *   beforeEach(() => {
 *     context = createTestContext();
 *   });
 *   
 *   afterEach(async () => {
 *     await cleanupTestContext(context);
 *   });
 *   
 *   it('should do something', () => {
 *     // Use context in your test
 *     context.data.myValue = 'test';
 *     
 *     // Register cleanup functions
 *     context.cleanupFns.push(() => {
 *       // Clean up resources
 *     });
 *   });
 * });
 * ```
 */
export function createTestContext(): TestContext {
  return {
    cleanupFns: [],
    data: {},
    mocks: {},
    spies: {},
    timers: [],
  };
}

/**
 * Cleans up a test context by running all registered cleanup functions
 * 
 * @param context The test context to clean up
 * @returns A promise that resolves when all cleanup is complete
 */
export async function cleanupTestContext(context: TestContext): Promise<void> {
  // Clear all timers
  context.timers.forEach(timer => clearTimeout(timer));
  context.timers = [];
  
  // Run all cleanup functions in reverse order (last registered, first executed)
  for (let i = context.cleanupFns.length - 1; i >= 0; i--) {
    const cleanupFn = context.cleanupFns[i];
    await cleanupFn();
  }
  context.cleanupFns = [];
  
  // Reset all mocks
  Object.values(context.mocks).forEach(mock => mock.mockReset());
  context.mocks = {};
  
  // Restore all spies
  Object.values(context.spies).forEach(spy => spy.mockRestore());
  context.spies = {};
  
  // Clear data
  context.data = {};
}

/**
 * Registers a cleanup function to be run after the test
 * 
 * @param context The test context
 * @param cleanupFn The cleanup function to register
 * @returns The cleanup function for chaining
 * 
 * @example
 * ```ts
 * it('should clean up resources', () => {
 *   const resource = createResource();
 *   registerCleanup(context, () => resource.dispose());
 *   
 *   // Test with resource
 * });
 * ```
 */
export function registerCleanup(
  context: TestContext,
  cleanupFn: () => void | Promise<void>
): () => void | Promise<void> {
  context.cleanupFns.push(cleanupFn);
  return cleanupFn;
}

/**
 * Creates a mock function and registers it in the test context
 * 
 * @param context The test context
 * @param name The name of the mock
 * @param implementation Optional implementation for the mock
 * @returns The created mock function
 * 
 * @example
 * ```ts
 * it('should call the callback', () => {
 *   const callback = createMock(context, 'callback');
 *   
 *   myFunction(callback);
 *   
 *   expect(callback).toHaveBeenCalled();
 * });
 * ```
 */
export function createMock<T extends (...args: any[]) => any>(
  context: TestContext,
  name: string,
  implementation?: (...args: Parameters<T>) => ReturnType<T>
): jest.Mock<ReturnType<T>, Parameters<T>> {
  const mock = implementation ? jest.fn(implementation) : jest.fn();
  context.mocks[name] = mock;
  return mock;
}

/**
 * Creates a spy on an object method and registers it in the test context
 * 
 * @param context The test context
 * @param object The object containing the method
 * @param method The name of the method to spy on
 * @returns The created spy
 * 
 * @example
 * ```ts
 * it('should call the method', () => {
 *   const obj = { method: () => 'result' };
 *   const spy = createSpy(context, obj, 'method');
 *   
 *   myFunction(obj);
 *   
 *   expect(spy).toHaveBeenCalled();
 * });
 * ```
 */
export function createSpy<T extends object, M extends keyof T>(
  context: TestContext,
  object: T,
  method: M & string
): jest.SpyInstance {
  const spy = jest.spyOn(object, method);
  context.spies[method] = spy;
  return spy;
}

/**
 * Creates a timer and registers it in the test context for automatic cleanup
 * 
 * @param context The test context
 * @param callback The callback function to execute
 * @param timeout The timeout in milliseconds
 * @returns The created timer
 * 
 * @example
 * ```ts
 * it('should execute after timeout', () => {
 *   const callback = jest.fn();
 *   createTimer(context, callback, 1000);
 *   
 *   jest.advanceTimersByTime(1000);
 *   
 *   expect(callback).toHaveBeenCalled();
 * });
 * ```
 */
export function createTimer(
  context: TestContext,
  callback: () => void,
  timeout: number
): NodeJS.Timeout {
  const timer = setTimeout(callback, timeout);
  context.timers.push(timer);
  return timer;
}

/**
 * Creates a mock implementation of a class and registers it in the test context
 * 
 * @param context The test context
 * @param name The name of the mock class
 * @param methods The methods to mock on the class
 * @returns The mocked class implementation
 * 
 * @example
 * ```ts
 * it('should use the service', () => {
 *   const mockService = createMockClass(context, 'UserService', {
 *     findById: jest.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
 *     create: jest.fn().mockResolvedValue({ id: '1', name: 'New User' }),
 *   });
 *   
 *   // Use mockService in your test
 * });
 * ```
 */
export function createMockClass<T extends object>(
  context: TestContext,
  name: string,
  methods: Partial<{ [K in keyof T]: T[K] extends (...args: any[]) => any ? jest.Mock : T[K] }>
): T {
  const mockClass = methods as T;
  
  // Register all mock methods in the context
  Object.entries(methods).forEach(([methodName, method]) => {
    if (typeof method === 'function' && 'mockReset' in method) {
      context.mocks[`${name}.${methodName}`] = method as jest.Mock;
    }
  });
  
  return mockClass;
}

/**
 * Assertion helpers for common test patterns
 */
export const assertions = {
  /**
   * Asserts that a function throws an error matching the expected message or regex
   * 
   * @param fn The function to execute
   * @param expected The expected error message or regex
   * 
   * @example
   * ```ts
   * it('should throw an error', () => {
   *   assertions.toThrowWithMessage(
   *     () => validateEmail('invalid'),
   *     'Invalid email format'
   *   );
   * });
   * ```
   */
  toThrowWithMessage(fn: () => any, expected: string | RegExp): void {
    try {
      fn();
      fail('Expected function to throw an error');
    } catch (error) {
      if (expected instanceof RegExp) {
        expect((error as Error).message).toMatch(expected);
      } else {
        expect((error as Error).message).toContain(expected);
      }
    }
  },
  
  /**
   * Asserts that a promise rejects with an error matching the expected message or regex
   * 
   * @param promise The promise to await
   * @param expected The expected error message or regex
   * 
   * @example
   * ```ts
   * it('should reject with an error', async () => {
   *   await assertions.toRejectWithMessage(
   *     validateEmailAsync('invalid'),
   *     'Invalid email format'
   *   );
   * });
   * ```
   */
  async toRejectWithMessage(promise: Promise<any>, expected: string | RegExp): Promise<void> {
    try {
      await promise;
      fail('Expected promise to reject');
    } catch (error) {
      if (expected instanceof RegExp) {
        expect((error as Error).message).toMatch(expected);
      } else {
        expect((error as Error).message).toContain(expected);
      }
    }
  },
  
  /**
   * Asserts that an object has exactly the specified properties
   * 
   * @param obj The object to check
   * @param properties The expected properties
   * 
   * @example
   * ```ts
   * it('should have exactly these properties', () => {
   *   const user = { id: '1', name: 'Test' };
   *   assertions.toHaveExactProperties(user, ['id', 'name']);
   * });
   * ```
   */
  toHaveExactProperties(obj: object, properties: string[]): void {
    const objKeys = Object.keys(obj).sort();
    const expectedKeys = [...properties].sort();
    
    expect(objKeys).toEqual(expectedKeys);
  },
  
  /**
   * Asserts that a function was called with arguments matching the specified predicates
   * 
   * @param mock The mock function to check
   * @param predicates Functions that validate each argument
   * 
   * @example
   * ```ts
   * it('should call with valid arguments', () => {
   *   const mock = jest.fn();
   *   doSomething(mock);
   *   
   *   assertions.toHaveBeenCalledWithMatching(mock, [
   *     (arg) => typeof arg === 'string' && arg.length > 0,
   *     (arg) => typeof arg === 'number' && arg > 0,
   *   ]);
   * });
   * ```
   */
  toHaveBeenCalledWithMatching(
    mock: jest.Mock,
    predicates: Array<(arg: any) => boolean>
  ): void {
    expect(mock).toHaveBeenCalled();
    
    const calls = mock.mock.calls;
    let matchFound = false;
    
    for (const call of calls) {
      if (call.length !== predicates.length) {
        continue;
      }
      
      const allMatch = predicates.every((predicate, index) => predicate(call[index]));
      if (allMatch) {
        matchFound = true;
        break;
      }
    }
    
    if (!matchFound) {
      fail(
        `Expected mock to have been called with arguments matching the predicates.\n` +
        `Received calls: ${JSON.stringify(calls)}`
      );
    }
  },
  
  /**
   * Asserts that a value is within a numeric range
   * 
   * @param value The value to check
   * @param min The minimum value (inclusive)
   * @param max The maximum value (inclusive)
   * 
   * @example
   * ```ts
   * it('should be within range', () => {
   *   const result = calculateScore();
   *   assertions.toBeWithinRange(result, 0, 100);
   * });
   * ```
   */
  toBeWithinRange(value: number, min: number, max: number): void {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  },
};

/**
 * Time-related test utilities
 */
export const timeUtils = {
  /**
   * Waits for the specified number of milliseconds
   * 
   * @param ms The number of milliseconds to wait
   * @returns A promise that resolves after the specified time
   * 
   * @example
   * ```ts
   * it('should wait before continuing', async () => {
   *   // Start an async operation
   *   startOperation();
   *   
   *   // Wait for it to complete
   *   await timeUtils.wait(100);
   *   
   *   // Check the result
   *   expect(getResult()).toBe('done');
   * });
   * ```
   */
  wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Executes a function repeatedly until it returns true or the timeout is reached
   * 
   * @param fn The function to execute
   * @param options Options for the polling
   * @returns A promise that resolves when the function returns true
   * 
   * @example
   * ```ts
   * it('should eventually succeed', async () => {
   *   // Start an async operation
   *   startOperation();
   *   
   *   // Wait for it to complete
   *   await timeUtils.poll(() => isOperationComplete());
   *   
   *   // Check the result
   *   expect(getResult()).toBe('success');
   * });
   * ```
   */
  async poll(
    fn: () => boolean | Promise<boolean>,
    options: { interval?: number; timeout?: number } = {}
  ): Promise<void> {
    const interval = options.interval || 50;
    const timeout = options.timeout || 1000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await fn();
      if (result) {
        return;
      }
      await timeUtils.wait(interval);
    }
    
    throw new Error(`Polling timed out after ${timeout}ms`);
  },
};

/**
 * Object manipulation utilities for testing
 */
export const objectUtils = {
  /**
   * Creates a deep clone of an object
   * 
   * @param obj The object to clone
   * @returns A deep clone of the object
   * 
   * @example
   * ```ts
   * it('should not modify the original', () => {
   *   const original = { nested: { value: 42 } };
   *   const clone = objectUtils.deepClone(original);
   *   
   *   clone.nested.value = 100;
   *   
   *   expect(original.nested.value).toBe(42);
   * });
   * ```
   */
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  },
  
  /**
   * Creates an object with only the specified properties from the source object
   * 
   * @param obj The source object
   * @param properties The properties to pick
   * @returns A new object with only the specified properties
   * 
   * @example
   * ```ts
   * it('should pick only specific properties', () => {
   *   const user = { id: '1', name: 'Test', email: 'test@example.com', role: 'admin' };
   *   const result = objectUtils.pick(user, ['id', 'name']);
   *   
   *   expect(result).toEqual({ id: '1', name: 'Test' });
   * });
   * ```
   */
  pick<T extends object, K extends keyof T>(obj: T, properties: K[]): Pick<T, K> {
    return properties.reduce((result, prop) => {
      if (prop in obj) {
        result[prop] = obj[prop];
      }
      return result;
    }, {} as Pick<T, K>);
  },
  
  /**
   * Creates an object without the specified properties from the source object
   * 
   * @param obj The source object
   * @param properties The properties to omit
   * @returns A new object without the specified properties
   * 
   * @example
   * ```ts
   * it('should omit specific properties', () => {
   *   const user = { id: '1', name: 'Test', email: 'test@example.com', password: 'secret' };
   *   const result = objectUtils.omit(user, ['password']);
   *   
   *   expect(result).toEqual({ id: '1', name: 'Test', email: 'test@example.com' });
   * });
   * ```
   */
  omit<T extends object, K extends keyof T>(obj: T, properties: K[]): Omit<T, K> {
    const result = { ...obj };
    properties.forEach(prop => {
      delete result[prop];
    });
    return result as Omit<T, K>;
  },
};

/**
 * Random data generation utilities for testing
 */
export const randomUtils = {
  /**
   * Generates a random string of the specified length
   * 
   * @param length The length of the string to generate
   * @param charset The characters to use (defaults to alphanumeric)
   * @returns A random string
   * 
   * @example
   * ```ts
   * it('should generate a random string', () => {
   *   const result = randomUtils.string(10);
   *   
   *   expect(result).toHaveLength(10);
   *   expect(typeof result).toBe('string');
   * });
   * ```
   */
  string(length: number, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },
  
  /**
   * Generates a random integer between min and max (inclusive)
   * 
   * @param min The minimum value
   * @param max The maximum value
   * @returns A random integer
   * 
   * @example
   * ```ts
   * it('should generate a random integer', () => {
   *   const result = randomUtils.integer(1, 100);
   *   
   *   expect(result).toBeGreaterThanOrEqual(1);
   *   expect(result).toBeLessThanOrEqual(100);
   *   expect(Number.isInteger(result)).toBe(true);
   * });
   * ```
   */
  integer(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  /**
   * Generates a random boolean value
   * 
   * @returns A random boolean
   * 
   * @example
   * ```ts
   * it('should generate a random boolean', () => {
   *   const result = randomUtils.boolean();
   *   
   *   expect(typeof result).toBe('boolean');
   * });
   * ```
   */
  boolean(): boolean {
    return Math.random() >= 0.5;
  },
  
  /**
   * Picks a random element from an array
   * 
   * @param array The array to pick from
   * @returns A random element from the array
   * 
   * @example
   * ```ts
   * it('should pick a random element', () => {
   *   const options = ['a', 'b', 'c'];
   *   const result = randomUtils.element(options);
   *   
   *   expect(options).toContain(result);
   * });
   * ```
   */
  element<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  },
  
  /**
   * Generates a random date between start and end dates
   * 
   * @param start The start date
   * @param end The end date
   * @returns A random date between start and end
   * 
   * @example
   * ```ts
   * it('should generate a random date', () => {
   *   const start = new Date('2020-01-01');
   *   const end = new Date('2020-12-31');
   *   const result = randomUtils.date(start, end);
   *   
   *   expect(result).toBeInstanceOf(Date);
   *   expect(result.getTime()).toBeGreaterThanOrEqual(start.getTime());
   *   expect(result.getTime()).toBeLessThanOrEqual(end.getTime());
   * });
   * ```
   */
  date(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
  },
  
  /**
   * Generates a random valid CPF (Brazilian individual taxpayer registry number)
   * 
   * @returns A random valid CPF
   * 
   * @example
   * ```ts
   * it('should generate a valid CPF', () => {
   *   const result = randomUtils.cpf();
   *   
   *   expect(result).toMatch(/^\d{11}$/);
   *   expect(result).toBeValidCPF(); // Using custom matcher from setup-tests.ts
   * });
   * ```
   */
  cpf(): string {
    const n1 = randomUtils.integer(0, 9);
    const n2 = randomUtils.integer(0, 9);
    const n3 = randomUtils.integer(0, 9);
    const n4 = randomUtils.integer(0, 9);
    const n5 = randomUtils.integer(0, 9);
    const n6 = randomUtils.integer(0, 9);
    const n7 = randomUtils.integer(0, 9);
    const n8 = randomUtils.integer(0, 9);
    const n9 = randomUtils.integer(0, 9);
    
    // Calculate first verification digit
    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    
    // Calculate second verification digit
    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    
    return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
  },
};

/**
 * Journey-specific test utilities
 */
export const journeyUtils = {
  /**
   * Health journey test utilities
   */
  health: {
    /**
     * Creates a test health metric
     * 
     * @param overrides Properties to override in the default health metric
     * @returns A test health metric object
     */
    createHealthMetric(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: randomUtils.string(10),
        userId: 'test-user-id',
        type: 'HEART_RATE',
        value: randomUtils.integer(60, 100),
        unit: 'bpm',
        timestamp: new Date(),
        source: 'MANUAL',
        notes: 'Test health metric',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
    
    /**
     * Creates a test health goal
     * 
     * @param overrides Properties to override in the default health goal
     * @returns A test health goal object
     */
    createHealthGoal(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: randomUtils.string(10),
        userId: 'test-user-id',
        type: 'STEPS',
        target: 10000,
        unit: 'steps',
        frequency: 'DAILY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        progress: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
  },
  
  /**
   * Care journey test utilities
   */
  care: {
    /**
     * Creates a test appointment
     * 
     * @param overrides Properties to override in the default appointment
     * @returns A test appointment object
     */
    createAppointment(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: randomUtils.string(10),
        userId: 'test-user-id',
        providerId: 'test-provider-id',
        type: 'CONSULTATION',
        status: 'SCHEDULED',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 1 day + 30 minutes from now
        notes: 'Test appointment',
        location: 'VIRTUAL',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
  },
  
  /**
   * Plan journey test utilities
   */
  plan: {
    /**
     * Creates a test insurance claim
     * 
     * @param overrides Properties to override in the default insurance claim
     * @returns A test insurance claim object
     */
    createInsuranceClaim(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: randomUtils.string(10),
        userId: 'test-user-id',
        planId: 'test-plan-id',
        type: 'MEDICAL',
        status: 'SUBMITTED',
        amount: randomUtils.integer(100, 1000),
        serviceDate: new Date(),
        submissionDate: new Date(),
        description: 'Test insurance claim',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
  },
};

/**
 * Event testing utilities for working with the gamification event system
 */
export const eventUtils = {
  /**
   * Creates a test event object for the gamification system
   * 
   * @param type The event type
   * @param payload The event payload
   * @param overrides Additional properties to override
   * @returns A test event object
   * 
   * @example
   * ```ts
   * it('should process health events', () => {
   *   const event = eventUtils.createEvent('HEALTH_METRIC_RECORDED', {
   *     userId: 'test-user',
   *     metricType: 'STEPS',
   *     value: 10000,
   *   });
   *   
   *   // Test event processing
   * });
   * ```
   */
  createEvent<T extends Record<string, any>>(
    type: string,
    payload: T,
    overrides: Record<string, any> = {}
  ): Record<string, any> {
    return {
      id: randomUtils.string(10),
      type,
      timestamp: new Date().toISOString(),
      source: 'test',
      version: '1.0',
      payload,
      metadata: {
        correlationId: randomUtils.string(10),
        userId: payload.userId || 'test-user-id',
      },
      ...overrides,
    };
  },
  
  /**
   * Event types for different journeys
   */
  eventTypes: {
    health: [
      'HEALTH_METRIC_RECORDED',
      'HEALTH_GOAL_CREATED',
      'HEALTH_GOAL_UPDATED',
      'HEALTH_GOAL_COMPLETED',
      'DEVICE_CONNECTED',
      'DEVICE_DISCONNECTED',
      'DEVICE_DATA_SYNCED',
    ],
    care: [
      'APPOINTMENT_SCHEDULED',
      'APPOINTMENT_COMPLETED',
      'APPOINTMENT_CANCELLED',
      'MEDICATION_ADDED',
      'MEDICATION_TAKEN',
      'TELEMEDICINE_SESSION_STARTED',
      'TELEMEDICINE_SESSION_COMPLETED',
    ],
    plan: [
      'PLAN_SELECTED',
      'BENEFIT_USED',
      'CLAIM_SUBMITTED',
      'CLAIM_APPROVED',
      'CLAIM_REJECTED',
      'DOCUMENT_UPLOADED',
    ],
    gamification: [
      'ACHIEVEMENT_UNLOCKED',
      'QUEST_STARTED',
      'QUEST_COMPLETED',
      'REWARD_EARNED',
      'REWARD_REDEEMED',
      'LEVEL_UP',
      'XP_EARNED',
    ],
  },
};

// Export all utilities
export default {
  createTestContext,
  cleanupTestContext,
  registerCleanup,
  createMock,
  createSpy,
  createTimer,
  createMockClass,
  assertions,
  timeUtils,
  objectUtils,
  randomUtils,
  journeyUtils,
  eventUtils,
};